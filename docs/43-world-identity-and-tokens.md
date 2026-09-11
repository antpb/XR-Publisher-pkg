# World Identity, API Base and Editor Tokens

> **Advanced.** This page is for building **editor and publishing tooling on top of the runtime** — save panels, backup buttons, collaborative-edit invites, asset uploaders. Ordinary world plugins (decorations, effects, multiplayer) never need any of it. Everything here talks to the world's publishing API, and every write requires an editing credential.

The runtime ships a complete client for the world API's *delegated editing* model: **world editor tokens** (`we_…`) — opaque, scoped, revocable, expiring bearer strings a world owner can mint and hand to collaborators. The engine's own in-world edit mode is built on exactly this surface.

---

## World identity

| Method | Type | Description |
|---|---|---|
| `getWorldIdentity()` | `() => { author, slug }` | The world's registry identity. On a published page it derives from the URL (`/{author}/{slug}/{slug}.html` or `/directory/{author}/{slug}`); in the desktop editor it is injected explicitly. Empty strings when neither source exists. |

Identity is what the world-write endpoints target — `saveWorldHtml` and friends throw if no identity can be resolved. Note the server does **not** trust the request body for authorization: the write target is derived from the validated credential, so a token can never write outside its owner's namespace.

---

## API base resolution

| Method | Type | Description |
|---|---|---|
| `getApiBase()` | `() => string` | The publishing-API origin currently in effect. |
| `setApiBase(url)` | `(string \| null) => void` | Set it explicitly (highest priority). Pass `null`/`''` to clear back to the chain. |

The package ships with **no baked-in host**. Resolution order:

1. **Explicit configuration** — `new XRPublisher({ apiBase })` or `XRPublisher.setApiBase(url)`.
2. **`window.XRP_API_BASE`** — for script-tag consumers; a serve template or dev harness injects its deployment's origin before the bundle loads.
3. **localStorage `xr_publisher_edge_api_url`** — the desktop editor's stored-settings convention.
4. **Same origin** — published worlds are served *by* the API worker, so the page origin *is* the API origin. This is why published worlds need no configuration at all.

Trailing slashes are stripped, so `${getApiBase()}/api/...` concatenation is always safe. Every API consumer in the runtime (world state, NPC endpoints, asset browsing, and the token client) resolves through this chain.

One nuance for the **world-write endpoints specifically**: the token client prefers the localStorage editor override first, then same-origin when the page URL matches a published-world path, then the shared chain — so a published page always writes back to the deployment that serves it.

---

## Credentials

| Method | Type | Description |
|---|---|---|
| `getEditCredential()` | `() => string \| null` | The credential world writes will use: the desktop editor's primary API key if one is present, otherwise the stored `we_` world token. |
| `hasEditCredential()` | `() => boolean` | Optimistic gate for showing edit UI. The **server** is the source of truth — a revoked/expired token still stored locally will 401 on first use. |
| `setWorldToken(token)` | `(string) => void` | Store a `we_` world editor token for this origin (localStorage). |
| `clearWorldToken()` | `() => void` | Remove the stored token. |

**Credential precedence**: a primary API key (present only inside the desktop editor) wins over a stored world token. The runtime never *writes* a primary key — it only reads one the editor injected.

**Auth-loss handling**: when a request authenticated with a stored world token gets a 401, the token is cleared from storage and a `xrp:edit-auth-lost` event fires on `window` — listen for it to drop edit affordances and re-prompt:

```js
window.addEventListener('xrp:edit-auth-lost', () => hideEditUi());
```

**Security notes** — read before building on this:

- A `we_` token in localStorage is readable by any script on the origin. That is a deliberate trade: these tokens exist *instead of* the primary key precisely because they are **scoped, revocable, and (ideally) expiring**. Always default grant UIs to a finite `expiresIn`.
- The token secret is returned **once** at grant time and is never retrievable again.
- Never put a primary API key anywhere a published page can read it.

---

## World writes

All write methods return Promises and **throw** on non-2xx responses (an Error with a `.status` and the server's message). They require an identity and a credential.

| Method | Type | Description |
|---|---|---|
| `saveWorldHtml(args)` | `({ html, preview? }) => Promise<{ success, message?, htmlUrl?, previewUrl? }>` | Replace the world's published HTML. `preview` is optional: a base64 `data:image/…` string uploads to storage; an `http(s)` URL is stored as a reference. |
| `saveWorldMetadata(metadata)` | `(Record<string, unknown>) => Promise<{ success }>` | Update the world's `metadata.json`. |
| `uploadWorldAsset(args)` | `({ fileName, fileData, assetType }) => Promise<{ success, assetUrl? }>` | Upload a base64-encoded asset into the world's folder. `fileData` is **raw base64, no `data:` prefix**. Uploads made with a *world-scoped* (guest) credential are quarantined server-side (`quarantined: true` in the response) and wait in a review queue until the owner promotes them. |
| `backupWorld(version)` | `(string) => Promise<{ success, message? }>` | Snapshot the currently-live html/metadata/preview under a version label. **Call before a destructive `saveWorldHtml`.** |

The safe save pattern:

```js
if (XRPublisher.hasEditCredential()) {
  await XRPublisher.backupWorld(`${Date.now()}`);   // snapshot first
  await XRPublisher.saveWorldHtml({ html: serialized });
}
```

---

## Token management

| Method | Type | Description |
|---|---|---|
| `grantWorldToken(args)` | `({ scope, slug?, label, expiresIn? }) => Promise<GrantTokenResult>` | Mint a delegated editor token. `scope: 'author'` covers all the owner's worlds; `scope: 'world'` (+ `slug`) authorizes exactly one world. `expiresIn` is in **seconds** — grant finite lifetimes. The result's `token` field is the bearer secret, **shown once**. |
| `listWorldTokens()` | `() => Promise<WorldTokenInfo[]>` | With a primary key: all your tokens. With an editor token: only its own delegation subtree (including itself). Also the cheap "is this credential still valid?" probe. |
| `revokeWorldToken(args)` | `({ tokenId?, label? }) => Promise<{ success, revoked }>` | Revoke by id or label. **Cascades** to every token delegated from the revoked one; `revoked` is the count. |

### `WorldTokenInfo`

| Field | Type | Description |
|---|---|---|
| `token_id` | `string` | Stable identifier (not the secret). |
| `owner_username` | `string` | The namespace the token writes into. |
| `scope` | `'author' \| 'world'` | Author-wide or single-world. |
| `slug` | `string \| null` | The world slug for `world`-scoped tokens. |
| `label` | `string` | Human label given at grant time. |
| `parent_token_id` | `string \| null` | The token this one was delegated from. |
| `created_at` / `expires_at` / `last_used` | `number \| null` | Timestamps; `expires_at: null` = non-expiring. |
| `revoked` | `number` | Non-zero when revoked. |

Delegation rules are **server-enforced**: a primary key can grant any scope for its own worlds; an author token can grant same-owner tokens; a world token can only grant for its own slug. A child token's expiry is capped at its parent's.

### Example: mint and share a scoped collaborator pass

```js
// Owner session (has a credential) — mint a 7-day, single-world token:
const grant = await XRPublisher.grantWorldToken({
  scope: 'world',
  slug: XRPublisher.getWorldIdentity().slug,
  label: 'weekend-build-jam',
  expiresIn: 7 * 86400,
});
// grant.token is shown ONCE — hand it to the collaborator out-of-band.

// Collaborator's browser, on the world page:
XRPublisher.setWorldToken(pastedToken);
console.log(XRPublisher.hasEditCredential());   // true — edit UI can enable

// Later, from any owner session:
await XRPublisher.revokeWorldToken({ label: 'weekend-build-jam' });
```

[SCREENSHOT: an in-world edit menu showing "Editing as guest" with a token-derived credential]

---

## Next steps

- [Installation and setup](02-installation-and-setup.md) — `XRPublisherOptions`, including `apiBase`
- [Persisted world state](41-world-state.md) — the *unauthenticated* per-world storage plugins use
- [Plugin development overview](18-plugin-development-overview.md) — where ordinary plugins should start instead

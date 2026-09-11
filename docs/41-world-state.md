# Persisted World State

Deterministic [decorations](19-decorations-overview.md) always spawn in the same places — which means the world can meaningfully persist **state** for them: a farm plot that was harvested, a campfire someone lit, a cairn visitors stack higher. World state is a store of small JSON records keyed `(world, plugin, key)` that survive reloads and are **shared across visitors** — tended by whoever passes by.

The design targets stateful decorations end-to-end:

- **`spawn.seed` is the natural key** — stable per spot, per world, forever.
- **Reads are synchronous** from an in-memory snapshot — safe inside a decoration `create()`.
- **Writes are optimistic** — applied locally at once, broadcast to room peers, and POSTed to the world API; all three paths converge on the same merge rule.
- **Everything degrades gracefully** — no API means session-only state; no networking means HTTP-only; both absent means the pure deterministic world.

[SCREENSHOT: a lit campfire in one browser window flipping to lit in a second window a moment later]

---

## API reference

All on `XRPublisher` (static, and `window.XRPublisher` for script-tag plugins).

| Method | Type | Description |
|---|---|---|
| `configureWorldState(opts)` | `({ apiBase?, worldKey?, defaultTtlSeconds? }) => void` | Optional configuration (see below). Reconfiguring clears the fetch freshness cache and any failure backoff. |
| `fetchWorldState(plugin, query)` | `(string, { prefix?, keys?, maxAgeMs? }) => Promise<Record<string, WorldStateRecord>>` | Pull records into the snapshot over HTTP — by key `prefix` (the roam-time form) or explicit `keys`. Resolves the records the query covers. Already-newer local records are not overwritten. |
| `getWorldState(plugin, key)` | `(string, string) => WorldStateRecord \| undefined` | **Synchronous** snapshot read — safe inside decoration `create()`. |
| `getAllWorldState(plugin)` | `(string) => ReadonlyMap<string, WorldStateRecord>` | All cached records for a plugin (read-only view of the live map). |
| `setWorldState(plugin, key, value, opts)` | `(string, string, unknown, { pos, ttlSeconds? }) => Promise<boolean>` | Write one record: optimistic local apply + peer broadcast + HTTP POST. Resolves `false` when the HTTP write failed (the state still holds for this session). |
| `subscribeWorldState(cb)` | `((plugin, key, rec) => void) => () => void` | Notified on **every** applied change — fetches, peer broadcasts, and your own local sets. Returns an unsubscribe function. |
| `getWorldStateKey()` | `() => string` | The key this world's state is stored under (configured override, URL-derived `author/slug`, or a stable hash fallback). |

### `WorldStateRecord`

| Field | Type | Description |
|---|---|---|
| `value` | `unknown` | Your JSON payload. Keep it small. |
| `updatedAt` | `number` | Write timestamp (ms) — the merge tiebreaker. |
| `pos` | `[x, z] \| null` | The record's world position (render frame), as stored. |

### `configureWorldState(opts)`

| Field | Type | Default | Description |
|---|---|---|---|
| `apiBase` | `string \| null` | resolved chain | API origin. `''` = same origin; `null` disables HTTP entirely (session-only state). Defaults to the shared [API-base chain](43-world-identity-and-tokens.md#api-base-resolution) — published worlds need no configuration. |
| `worldKey` | `string` | derived | Override the derived world key (e.g. `'author/slug'`). |
| `defaultTtlSeconds` | `number` | `86400` (24h) | Default TTL for `setWorldState` records. Clamped to 60s..30 days (see [TTL](#ttl-untended-state-resets)). |

### `setWorldState` options

| Field | Type | Description |
|---|---|---|
| `pos` | `[number, number]` | **Required.** The record's world XZ in the **render frame** — use `spawn.renderPosition` (see below). The server anchors its writer-distance rule to this point. |
| `ttlSeconds` | `number` | Per-record TTL override. Clamped to 60s..30 days — see [TTL](#ttl-untended-state-resets). |

The engine automatically attaches your current player position to the write for the server's distance check — you never pass it yourself. If there is **no** player yet (a headless or pre-spawn write), nothing is attached rather than the record's own position: a write can't self-certify as standing on the record it's writing, so the server decides on its own terms. Write from a player-present moment (an interaction) and this never comes up.

`setWorldState` resolves a **boolean** — `false` when the HTTP write did not land (rejected by the distance rule or rate limit, no API configured, network failure). The optimistic local apply and the peer broadcast still happened, so the world *looks* right for this session and then silently reverts on the next load. **Check the result** whenever the write matters:

```js
const ok = await XRPublisher.setWorldState(PLUGIN_ID, key, value, { pos });
if (!ok) hud.note('saved locally only');
```

---

## The core loop, end to end

From the `campfires` plugin ([full example](60-example-campfires.md)); `farm-plots` ([61](61-example-farm-plots.md)) and `rocky-clearings` ([64](64-example-rocky-clearings.md)) follow the same shape.

```js
const PLUGIN_ID = 'campfires';
const STATE_FRESH_MS = 30_000;
const STATE_TTL_S = 6 * 3600;

XRPublisher.registerDecoration({
  name: 'campfire',
  // 1. READ state synchronously in create() — snapshot only, never awaits.
  create(spawn) {
    const rec = XRPublisher.getWorldState(PLUGIN_ID, spawn.seed);
    const lit = !!(rec && rec.value && rec.value.lit);
    const fire = buildFire(spawn, lit);

    // 2. WARM the snapshot — one mount-gated fetch per chunk.
    //    spawn.chunkPrefix already matches every spawn of this decoration in
    //    this chunk; never slice spawn.seed by hand (see below).
    if (spawn.chunkPrefix) {
      XRPublisher.fetchWorldState(PLUGIN_ID, {
        prefix: spawn.chunkPrefix,
        maxAgeMs: STATE_FRESH_MS,
      }).catch(() => {});
    }
    return fire;
  },

  // 3. WRITE on interaction — optimistic, room-synced, persisted.
  interactable: true,
  interactionRadius: 5,
  onInteract(ctx) {
    const rp = ctx.spawn.renderPosition;
    XRPublisher.setWorldState(PLUGIN_ID, ctx.spawn.seed,
      { lit: true, t: Date.now() },
      { pos: [rp[0], rp[2]], ttlSeconds: STATE_TTL_S });
  },
});

// 4. REACT to changes — fetches, peers, and your own optimistic writes all
//    land here. Mutate the live object; NEVER re-scatter on state arrival.
XRPublisher.subscribeWorldState((plugin, key, rec) => {
  if (plugin !== PLUGIN_ID) return;
  const fire = liveFires.get(key);
  if (fire) applyState(fire, rec.value);
});
```

---

## The contracts that make it cheap and correct

### Fetch only where stateful objects exist (mount-gated)

Call `fetchWorldState` from decoration `create()` — it only runs for chunks that actually contain your spawns, so a player roaming empty terrain generates **zero** state traffic.

`maxAgeMs` makes repeat calls free: a query that succeeded within the window resolves synchronously from the snapshot with **no HTTP**, and concurrent identical queries share **one in-flight request**. Net effect: N spawns in one chunk cost one fetch, and remounts inside the window cost none — with no plugin-side bookkeeping.

On network failure the failing **query** backs off for 60s — that one prefix/key set only. Other chunks, other plugins, and other queries keep fetching normally, so one bad request can't silence state across the world; during the backoff the query resolves from whatever the snapshot already holds.

### The chunk prefix: use `spawn.chunkPrefix`, never slice the seed

The per-chunk coalescing above only works if every spawn in a chunk issues the **same** query. A terrain-grid `spawn.seed` looks like this:

```
{worldSeed}-decoration-{name}-{chunkX}-{chunkZ}-{gx}-{gz}
```

Note the **two** trailing coordinates: `chunkX`/`chunkZ` identify the chunk, and `gx`/`gz` identify the candidate grid cell *within* it. Negative chunk coordinates also produce double dashes (`…-decoration-campfire--3--2-16-8`), so the string is not safely parsable by counting separators.

`spawn.chunkPrefix` is the prefix that matches every spawn of this decoration in this chunk — the seed minus the two grid coords:

```js
prefix: spawn.chunkPrefix   // → "{worldSeed}-decoration-campfire-3-4-"
```

> **Don't hand-slice `spawn.seed`.** Trimming to the last dash strips only `gz`, leaving a *per-grid-column* prefix. Every spawn in the chunk then issues a **different** query, so the coalescing and the freshness cache both silently stop working: N spawns become N HTTP requests, and each one only ever sees its own column's records.

`chunkPrefix` is present on **terrain-anchored** spawns only. Tree and mountain anchor seeds carry no chunk coordinates, so `chunkPrefix` is `undefined` there — fetch those by explicit `keys` (guard with `if (spawn.chunkPrefix)` as in the example above).

### Guard the seed → live-object map by identity

Most stateful plugins keep a `Map` from `spawn.seed` to the live object so `subscribeWorldState` can mutate it. Deleting from that map inside `dispose()` needs care: the engine **defers `dispose()` by one animation frame** (freeing GPU buffers mid-frame throws under WebGPU), while React runs an effect's cleanup *before* the next effect body. On a chunk re-scatter the observed order for the same seed is therefore `create(new)` → `dispose(old)`, and a naive `map.delete(seed)` in the late dispose removes the object that was just created — leaving a live campfire that never responds to state again.

Delete by **object identity**, not by seed:

```js
const live = new Map();                       // seed → Object3D

create(spawn) {
  const fire = buildFire(spawn, lit);
  fire.userData.seed = spawn.seed;            // so dispose() can find it
  live.set(spawn.seed, fire);
  return fire;
},
dispose(object) {
  const seed = object.userData.seed;
  if (live.get(seed) === object) live.delete(seed);   // only if still mine
  object.traverse((o) => o.geometry && o.geometry.dispose());
},
```

The same rule applies to any per-seed registry a plugin keeps (timers, HUD rows, interactable bookkeeping).

### Newest-`updatedAt` wins, everywhere

Records merge by `updatedAt` on every path — server fetch, peer broadcast, and your own optimistic apply. That makes all three idempotent and ordering-safe: it doesn't matter whether the peer broadcast or the HTTP fetch lands first, the newest write wins. Under the hood peer sync rides a reserved `__xrp:worldState` channel ([`broadcast()` refuses the `__xrp:*` prefix](39-networking-plugins.md#reserved-channels) so plugins can't collide with it).

### Positions are render-frame — use `spawn.renderPosition`

The server enforces a **~32u writer-distance rule**: a visitor can only write a record near where they're standing (an honor-system guard against cross-map griefing, plus rate limits). That check compares the record's `pos` against the player's position in the **render frame** — the frame `getPlayerState()` and `getPeers()` use.

Always take `pos` from **`spawn.renderPosition`** (`[rp[0], rp[2]]`). The older `spawn.worldPosition` is in the terrain worker's frame for terrain/tree anchors — half a chunk off on both axes — and using it puts your records outside the write radius. `renderPosition` is correct across all anchor types. Keep your `interactionRadius` comfortably under 32 so interacting players are always inside the write radius.

#### Large structures: anchor `pos` to the player, not the origin

The rule compares the record's `pos` to where the **writer is standing**. That's fine for a campfire, where the object and the interaction are the same point — but a big build (a race course, a golf hole, a multi-chunk fort) has a spawn origin that can be hundreds of units from where the player actually triggers the write. Using the structure's origin as `pos` there puts the write outside the radius, the server rejects it, and the state degrades to session-only — invisibly, unless you check the resolved boolean.

Write with a `pos` near the player instead, and key the record by seed as usual:

```js
// A hole-out on a golf course whose spawn origin is 200u back at the tee.
const me = XRPublisher.getPlayerState();
const pos = me ? [me.x, me.z] : [rp[0], rp[2]];   // player-anchored when possible
const ok = await XRPublisher.setWorldState(PLUGIN_ID, `${spawn.seed}:hole`, score, { pos });
```

`pos` is only the distance anchor and a coarse position hint — the **key** is what identifies the record, so anchoring `pos` to the player costs nothing. Sub-records of one structure can each carry the position of their own interaction point.

### TTL: untended state resets

Records expire server-side (default 24h). This is a feature: a world nobody tends drifts back to its deterministic default. Pick a TTL that matches the fiction — a campfire burning out in hours, a stacked cairn lasting a week.

**TTL is clamped to 60s..30 days.** Anything outside that range is clamped client-side before the write, with a one-time console warning per plugin. Asking for a 90-day TTL does not get you 90 days — it gets you 30, so a plugin designed around a long-lived record must accept the world resetting at the 30-day mark (or be re-written by visitors, which is the design intent).

### Derive time-based stages, don't tick them

Model growth/decay by storing **timestamps in the value** and deriving the current stage at read time:

```js
// write once at planting…
XRPublisher.setWorldState(PLUGIN_ID, seed, { st: 'planted', t: Date.now() }, { pos });
// …derive forever after
function deriveStage(seed) {
  const rec = XRPublisher.getWorldState(PLUGIN_ID, seed);
  if (!rec) return 'fallow';
  const age = Date.now() - rec.value.t;
  return age > GROW_MS ? 'ripe' : 'growing';
}
```

No server ticks, no write traffic while things grow, and every client derives the same stage from the same record. If you need a live re-render as stages pass, run one plugin-owned timer that starts with the first live object and self-clears when the last unmounts (see `farm-plots`).

### Flushing on unload works

The write POST is sent with `keepalive: true`, so it survives page unload. That makes the natural pattern for a plugin that batches writes — hold the working state in memory, flush once on the way out — actually land:

```js
window.addEventListener('beforeunload', () => {
  if (!dirty) return;
  XRPublisher.setWorldState(PLUGIN_ID, key, value, { pos });   // keepalive — survives unload
});
```

(Browsers cancel ordinary in-flight fetches during unload, which is what used to make this silently do nothing.) Don't `await` in an unload handler — fire and forget. This is a safety net for a *last* write, not a substitute for writing at the moment something happens: nothing guarantees `beforeunload` fires (a crashed tab, a killed mobile app).

### Keying player-owned records

State is world-scoped, so "this plot belongs to me" needs a player identity in the key. Use **`XRPublisher.getPlayerId()`** — a stable per-visitor id persisted in localStorage, so a player still owns their build after a reload:

```js
const KEY = `plot-${spawn.seed}-${XRPublisher.getPlayerId()}`;
```

Do **not** key ownership off `getClientId()`: that's the networking *session* id, regenerated on every page load and `null` in a world with no networking block — so ownership written against it is lost on reload, and every solo visitor collapses onto whatever constant the plugin falls back to. Neither id is an account or an authorization check; both are forgeable, honor-system identity, the same trust level as the rest of world state. See [Networking for plugins](39-networking-plugins.md#player-identity-getplayerid-vs-getclientid).

---

## Graceful degradation

| Environment | Behavior |
|---|---|
| API + networking | Full: persisted, room-synced, optimistic |
| API only (solo player) | Persisted + optimistic; no peer broadcast |
| Networking only (no API) | Room-synced + optimistic for this session; `setWorldState` resolves `false` |
| Neither | Session-only optimistic state; the world is purely deterministic |

Feature-detect before wiring stateful behavior, as the demo plugins do:

```js
const HAS_STATE = typeof XRPublisher.setWorldState === 'function'
  && typeof XRPublisher.getWorldState === 'function'
  && typeof XRPublisher.subscribeWorldState === 'function';
```

---

## Next steps

- [Decoration spawn context](21-decoration-spawn-context.md) — `spawn.seed`, `spawn.renderPosition`, and friends
- [Interactables](33-interactables.md) — the "E to interact" trigger most stateful decorations use
- [Networking for plugins](39-networking-plugins.md) — the broadcast layer world state syncs over
- [Example: campfires](60-example-campfires.md) — the minimal lit/unlit state loop
- [Example: farm plots](61-example-farm-plots.md) — derived growth stages, inventory, soil tint
- [Example: rocky clearings](64-example-rocky-clearings.md) — visitor-stacked cairns

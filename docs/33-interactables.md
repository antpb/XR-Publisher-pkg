# Interactables ("Press E")

Interactables make world objects respond to the player: walk within range and the engine shows a centred **"Press E — …"** prompt; pressing E fires your callback. On mobile there is no keyboard — the on-screen joystick's "E" button dispatches the same key event, so the flow works untouched on phones. In VR the same objects can pair with [in-world dialogs](35-in-world-dialogs.md) for controller-friendly follow-ups.

There are two ways to register an interactable:

1. **Decoration specs** — add `interactable: true` + `onInteract(ctx)` to a [decoration](19-decorations-overview.md) and every spawn of it becomes individually interactable (the collectible-apples pattern).
2. **The direct API** — `XRPublisher.registerInteractable(entry)` for objects you mount yourself (injected models, front-plugin meshes, a sub-object of a larger decoration).

[SCREENSHOT: the "Press E — collect apple" banner centred over an apple hanging from a tree canopy]

---

## Interactable decorations

```js
XRPublisher.registerDecoration({
  name: 'tree-apple',
  anchor: 'tree',
  density: 0.8,

  interactable: true,              // "E to interact" — forces per-object mounting
  interactionRadius: 3,            // world units (default 4)
  // A FUNCTION prompt is re-resolved ~10Hz while the player is near, so
  // contextual text is free — keep it a cheap lookup, never real work.
  interactionPrompt: (spawn) =>
    goldenBySeed.get(spawn.seed) ? 'collect GOLDEN apple' : 'collect apple',

  onInteract({ spawn, remove }) {
    harvested.add(spawn.seed);     // so create() can skip it on chunk reload
    basket += 1;
    remove();                      // hide this spawn + unregister its prompt
  },

  create(spawn) {
    if (harvested.has(spawn.seed)) return null;   // collected this session
    // ...build and return the apple Object3D...
  },
});
```

### Spec fields

| Field | Type | Default | Description |
|---|---|---|---|
| `interactable` | `boolean` | `false` | Make each spawn "Press E"-able. Requires `onInteract`. |
| `interactionPrompt` | `string \| (spawn) => string` | the spec `name` | Text shown in the prompt banner. A function receives that spawn's data and is re-resolved at the ~10Hz proximity cadence — stateful prompts ("Water crops" → "Harvest") update automatically without re-registering. Keep it cheap (a `Map` lookup); if it throws, the prompt falls back to the entry id. |
| `interactionRadius` | `number` | `4` | Interact range in world units, measured from the player avatar to the object's world position. |
| `onInteract` | `(ctx) => void` | *(required with `interactable`)* | Fired when the player presses E with this spawn as the active interactable. Throws are contained — one failing plugin can't break the E key. |

### The `onInteract` context

| Field | Type | Description |
|---|---|---|
| `ctx.object` | `Object3D` | The interacted spawn's object, as returned by your `create()`. |
| `ctx.spawn` | `DecorationSpawn` | That spawn's data — `position`, `seed`, `rng`, and the rest of the [spawn context](21-decoration-spawn-context.md). |
| `ctx.remove()` | `() => void` | Despawn this object: hides it and unregisters its interactable. The collectible primitive. |

### Collectibles and persistence

Decoration spawns are **deterministic** — a removed object reappears when its chunk reloads unless you track what was collected. The standard pattern is a `Set` of collected `spawn.seed`s consulted in `create()`:

```js
const harvested = new Set();
// in onInteract: harvested.add(spawn.seed); remove();
// in create:     if (harvested.has(spawn.seed)) return null;
```

That makes collection stick for the session. For persistence across sessions, store the collected seeds in `localStorage` (per-world key — see the floating-orbs example) or, for state shared between players, in [persisted world state](41-world-state.md) keyed by `spawn.seed`.

### Interactable specs mount per-object

An interactable spec is **forced onto the per-object mount path**, because every spawn must be individually targetable and removable. That makes it incompatible with `instanced` — if you set both, the engine logs a warning and falls back to per-object mounting. Budget accordingly: interactables suit dozens of spawns per chunk, not thousands.

---

## Direct API: `registerInteractable`

For objects the decoration system didn't place — or to make one *sub-object* of a larger decoration interactable instead of the whole thing (a loot chest inside a hut, a control pad on a stage):

```js
// Adapted from the settler-huts plugin: the loot barrel inside a hut is its
// own interactable, so the prompt appears at the barrel, not the building.
const lootId = `settler-loot-${spawn.seed}`;
XRPublisher.registerInteractable({
  id: lootId,
  object: barrelMesh,              // any mounted Object3D
  radius: 2.5,
  // Function prompts work here too — flips the moment the loot is taken.
  prompt: () => looted.has(spawn.seed) ? 'Empty barrel' : 'Search barrel',
  onInteract: () => {
    looted.add(spawn.seed);
    XRPublisher.openDialog({ title: 'Rain barrel', content: '…', buttons: [{ label: 'Take it', variant: 'primary' }] });
  },
});
// when the object unmounts (e.g. chunk unload / your dispose()):
XRPublisher.unregisterInteractable(lootId);
```

### `InteractableEntry`

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Unique id. Registering the same id again replaces the entry. Pass it to `unregisterInteractable`. |
| `object` | `Object3D` | The world object — its **world position** is sampled for proximity, so it can live anywhere in the scene graph. |
| `radius` | `number` | Interact range in world units. Optional — defaults to `4`, the same default decoration specs get. |
| `prompt` | `string \| () => string` | Banner text. Function form re-resolves ~10Hz (same contract as `interactionPrompt`). Optional — defaults to the entry `id`. |
| `onInteract` | `() => void` | Fired on E while this entry is active. |

**Both spellings work.** `radius`/`prompt` are the canonical names here, but the decoration-spec spellings `interactionRadius`/`interactionPrompt` are accepted as aliases — so the same field names carry over from a decoration spec to a direct registration without a silent no-op. (Where both are present, `radius`/`prompt` win.)

`registerInteractable` / `unregisterInteractable` are available as static and instance methods, and on `window.XRPublisher` for script-tag plugins.

**You own the lifecycle.** Decoration-spec interactables are registered and unregistered by the engine with the chunk; direct entries must be unregistered by you when the object goes away, or the prompt will point at a ghost.

---

## How detection works

- A proximity loop runs at ~10Hz, measuring from the player avatar (falling back to the camera) to each registered entry's world position. The **nearest in-range** entry becomes the active interactable; only one prompt shows at a time.
- **NPCs and vehicles win the E key.** If the world cursor is hovering an NPC or a rideable, no interactable activates — your prompt yields rather than competing.
- **The prompt is suppressed while a [dialog](35-in-world-dialogs.md) is open**, so E can't re-fire the object behind the modal, and while an NPC chat is open (E belongs to the chat).

---

## Next steps

- [In-world dialogs](35-in-world-dialogs.md) — the natural follow-up to an interaction, clickable in VR.
- [HUD overlays](34-hud-overlays.md) — show a counter for what the player collected.
- [World state](41-world-state.md) — persist collected/looted seeds across sessions and players.
- Worked examples: [apple trees](55-example-apple-trees.md), [floating orbs](58-example-floating-orbs.md), [settler huts](59-example-settler-huts.md).

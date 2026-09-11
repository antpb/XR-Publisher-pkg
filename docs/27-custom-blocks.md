# Custom Blocks

Custom blocks are **editor-placeable** object types registered by a plugin. Where a [decoration](19-decorations-overview.md) is scattered by the terrain and an [injected model](28-injected-models-and-solids.md) is placed from code, a custom block is authored by a person: it appears in the in-world editor's **Add** menu, gets a generated inspector panel from your typed `fields`, moves with the transform gizmo, and saves into the world markup as a `<three-{plugin}-{name}-block>` element that round-trips through publish and re-edit.

One `XRPublisher.registerBlockType(spec)` call wires all of those seams at once — menu, inspector, gizmo/undo, save format, and normal page rendering.

```js
XRPublisher.registerBlockType({
  plugin: 'block-lab',        // must match your build filename slug
  name: 'beacon',
  title: 'Beacon',
  fields: [
    { key: 'height', type: 'number', label: 'Height', default: 2, min: 0.5, max: 10, step: 0.5 },
    { key: 'color',  type: 'color',  label: 'Color',  default: '#5cc8f2' },
    { key: 'mode',   type: 'select', label: 'Mode',   default: 'pulse', options: [
      { value: 'pulse', label: 'Pulse' }, { value: 'steady', label: 'Steady' },
    ]},
    { key: 'active', type: 'boolean', label: 'Active', default: true },
  ],
  create({ props, THREE }) {
    return new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.3, props.height),
      new THREE.MeshStandardMaterial({ color: props.color, emissive: props.color }),
    );
  },
  update(obj, props, prevProps) {
    if (props.mode !== prevProps.mode) return false;   // recreate on mode change
    obj.scale.y = props.height / prevProps.height;
    obj.material.color.set(props.color);
    return true;                                       // handled in place
  },
  tick(obj, delta, elapsed) {
    obj.material.emissiveIntensity = 1 + Math.sin(elapsed * 3) * 0.5;
  },
});
```

`registerBlockType` returns the generated tag on success, or `null` on an invalid spec (it warns and never throws — a bad plugin must not take down the world). Re-registering an existing tag **replaces it in place**, which makes hot-reload workflows painless. `XRPublisher.unregisterBlockType(tag)` removes a registration. Both are available as static methods, instance methods, and on `window.XRPublisher` for script-tag plugins.

[SCREENSHOT: the in-world editor Add menu showing a "Plugins" category with Beacon, plus the generated inspector panel for a selected beacon]

---

## Tag and naming convention

The element tag is generated for you:

```
three-{plugin}-{name}-block
```

- `plugin` and `name` are lowercased and must match `/^[a-z0-9]+(-[a-z0-9]+)*$/` (lowercase words separated by single dashes). Invalid slugs are refused with a console warning.
- **`plugin` must equal your plugin build's filename slug** — the file you deploy as `{plugin}-xr-publisher-plugin.umd.js`. On every world save, the publishing API derives the set of allowed tag prefixes from the world's *active* plugin list and **strips** (never rejects the save for) any saved custom block whose plugin isn't active. If your `plugin` value doesn't match your filename slug, your blocks are silently removed from saves.

---

## Spec reference

| Field | Type | Default | Description |
|---|---|---|---|
| `plugin` | `string` | *(required)* | Plugin slug — must equal the build filename slug (see above). |
| `name` | `string` | *(required)* | Block name within the plugin. Tag = `three-{plugin}-{name}-block`. |
| `title` | `string` | title-cased `name` | Label in the Add menu and outliner. |
| `description` | `string` | generated | Shown in the editor UI. |
| `category` | `string` | `'Plugins'` | Add-menu / outliner grouping. |
| `fields` | `CustomFieldDef[]` | *(required)* | Typed attributes — drives the generated inspector. See below. |
| `create` | `(ctx) => Object3D \| null` | *(required)* | Build the object at **local origin**. Return `null` to render nothing. |
| `update` | `(object, props, prevProps, ctx) => boolean \| void` | none | Apply a prop change in place. Return `false` to force dispose + recreate. When `update` is absent, *every* prop change recreates. |
| `tick` | `(object, delta, elapsed) => void` | none | Per-frame hook. A throwing `tick` is disarmed (not retried at 60Hz). |
| `dispose` | `(object) => void` | deep dispose | Custom cleanup, called **instead of** the default deep geometry/material dispose. |

---

## Field types

Each entry in `fields` becomes an element attribute and an inspector control:

| `type` | Inspector control | Extra options | Runtime prop type |
|---|---|---|---|
| `number` | numeric input / slider | `min`, `max`, `step` | `number` (invalid → default → `0`) |
| `string` | single-line text | — | `string` |
| `longtext` | textarea | — | `string` |
| `url` | URL input — an **asset-drawer drop target** in the editor | — | `string` |
| `select` | dropdown | `options`: strings or `{ value, label }` pairs (required — an empty list drops the field) | `string` |
| `color` | color picker | — | `string` (e.g. `'#5cc8f2'`) |
| `boolean` | checkbox | — | `boolean` (stored as `'1'` / `'0'` in markup) |

Field rules (violations warn and drop the field, they don't fail registration):

- Keys are lowercased on registration and must then match `/^[a-z][a-z0-9]*$/` — **no dashes or underscores** (mirrors built-in attrs like `positionx`).
- Keys that collide with the nine engine transform attributes are dropped — transform is engine-owned.
- Duplicate keys are dropped.
- Every field may carry `label` (defaults to the title-cased key) and `description`.

Array/vector field types are not currently supported.

---

## Transform is engine-owned

Every custom block automatically carries the standard nine transform attributes — `positionx/y/z`, `rotationx/y/z`, `scalex/y/z` — applied by the engine's wrapper group, along with gizmo dragging, the pivot wrapper, and undo. Rotation attributes are **radians** at runtime.

Consequences for your code:

- **Build at local origin.** `create()` should return an object centered on its own origin; the engine positions it.
- Transform attributes are *not* included in `ctx.props` — you never read or write them yourself.
- Don't add fields named after transform attrs (they're dropped).

---

## Lifecycle and `ctx`

`create`, and `update`, receive a context object:

| `ctx` property | Description |
|---|---|
| `props` | Typed props parsed from the element's attributes per your field defs (absent/empty attrs fall back to field defaults). |
| `el` | The live block element — the attribute source of truth. |
| `THREE` | The bundled three namespace (never ship your own copy of three). |
| `isWebGPU` | `true` on the WebGPU renderer. Branch on this before touching `XRPublisher.tsl` / node materials — they're unavailable on WebGL. |
| `rng` | Deterministic per-instance PRNG (alea, seeded from tag + instance index) — same sequence every load. Use it, never `Math.random()`, for generative variation that must be stable per visit. |
| `seed` | The seed string behind `rng` (`{tag}#{index}`). |

Lifecycle flow:

1. **`create(ctx)`** — called when the block mounts (and again after any forced recreate). May return `null` to render nothing. May populate children asynchronously (e.g. via `XRPublisher.loadModel`). **Must be re-runnable**: React StrictMode double-invokes effects in dev (create → dispose → create), so share heavy resources at module level and pair them with a custom `dispose`.
2. **`update(object, props, prevProps, ctx)`** — called when any field attribute changes (inspector edits, undo). Return `true`/`undefined` if handled in place; return `false` — or throw, or omit `update` entirely — and the engine disposes and recreates the object.
3. **`tick(object, delta, elapsed)`** — one `useFrame` subscription per block instance. A throw disarms the tick for that spec.
4. **`dispose(object)`** — on unmount/recreate. The **default** cleanup deep-disposes every geometry and material under the object. If your objects share module-level or `loadModel`-cached resources, provide your own `dispose` (even a no-op) so shared geometry isn't freed out from under other instances.

---

## Late registration and placeholders

Shipped plugins load after the runtime has already scanned and rendered the world — that's the normal path, not an edge case. The scanner captures **all** non-built-in `three-*-block` elements unconditionally; saved blocks simply pop in the moment their type registers, including mid-session.

If a block's plugin never loads (or was deactivated):

- **Published world (play mode):** the element renders nothing.
- **In-world editor:** it shows a **selectable wireframe placeholder** — still movable and deletable, never silently removed from the save.

Server-side, the publishing API strips custom blocks whose plugin isn't in the world's active plugin list at save time (the save response reports which tags were stripped).

---

## Reference plugin

`examples/plugins/block-lab-xr-publisher-plugin.umd.js` is the reference and stress test — it exercises every field type and every lifecycle path:

- **Beacon** — all seven field types; `update()` patches some props in place and returns `false` for others (both paths).
- **Spinner** — pure in-place `update()` + `tick()` rotation + a logging `dispose()`.
- **Statue** — the async-model pattern: `create()` returns an empty `Group` immediately, fills it when a `loadModel()` promise resolves, and provides a custom `dispose()` that frees only per-instance resources (the cached shared model is untouched).

See it running in [Example: Block Lab](70-example-block-lab.md).

---

## Next steps

- [Plugin development overview](18-plugin-development-overview.md) — the plugin file format and load timing
- [Decorations overview](19-decorations-overview.md) — terrain-scattered objects (the other placement model)
- [Injected models and solids](28-injected-models-and-solids.md) — placing objects from code instead of the editor
- [Interactables](33-interactables.md) — "Press E" objects
- [Example: Block Lab](70-example-block-lab.md)

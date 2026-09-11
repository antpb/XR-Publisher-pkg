# Example: Block Lab

The reference (and torture test) for **editor-placeable custom blocks**: four block types that together cover every inspector field type and every lifecycle path of `XRPublisher.registerBlockType` — in-place updates, forced recreates, per-frame ticks, custom disposal for shared assets, and the minimal no-code spec.

Source: `examples/plugins/block-lab-xr-publisher-plugin.umd.js`

[SCREENSHOT: the four lab blocks in the editor — beacon, spinner, statue, crystal — with the beacon's inspector open]

## What it demonstrates

- **[Custom blocks](27-custom-blocks.md)** — `registerBlockType(spec)`: blocks appear in the in-world editor's Add menu, get a generated inspector from typed `fields`, move with the gizmo (transform is engine-owned; `create()` builds at local origin), and round-trip through save as `<three-block-lab-{name}-block>` elements
- Every inspector field type in one block: `number` (min/max/step), `string`, `longtext`, `url` (asset-drawer drop target), `select` with labeled options, `color`, `boolean`
- The full lifecycle: `create(ctx)` → `update(obj, props, prevProps)` (return `false` to force dispose+recreate) → `tick(obj, dt, elapsed)` → `dispose(obj)`
- **Shared-asset-safe disposal** — the statue block loads a glTF via `XRPublisher.loadModel` (cached per URL) and shows exactly what a custom `dispose()` must and must not free
- `ctx.rng` — a per-instance seeded PRNG for generative variation that's stable across visits and renderers; `ctx.isWebGPU` for renderer branching

The four blocks, by design:

| Block | Teaches |
|-------|---------|
| **Beacon** | every field type; in-place update for color/height/label/active; `return false` recreate for mode/emblem; `tick` pulse/strobe; `ctx.isWebGPU` emissive branching |
| **Spinner** | pure in-place `update()` (never recreates) + `tick` rotation + a logging `dispose()` |
| **Statue** | async `loadModel` population; per-instance material clones; custom dispose that frees only the clones |
| **Nocode** | the minimal spec — `create` only; every edit recreates via the default path |

## How it works

### The generated inspector: typed fields

Field definitions are all the editor needs to build a property panel:

```js
fields: [
  { key: 'height', type: 'number', label: 'Height', default: 2, min: 0.5, max: 10, step: 0.5 },
  { key: 'label', type: 'string', label: 'Label', default: 'Beacon' },
  { key: 'notes', type: 'longtext', label: 'Notes', default: '' },
  { key: 'emblemurl', type: 'url', label: 'Emblem Image', default: '' },
  { key: 'mode', type: 'select', label: 'Mode', default: 'pulse', options: [
    { value: 'pulse', label: 'Pulse' },
    { value: 'steady', label: 'Steady' },
    { value: 'strobe', label: 'Strobe' },
  ] },
  { key: 'color', type: 'color', label: 'Color', default: '#5cc8f2' },
  { key: 'active', type: 'boolean', label: 'Active', default: true },
],
```

Field keys are lowercase `/^[a-z][a-z0-9]*$/` (no dashes — they become HTML attributes); booleans are stored `'1'/'0'`.

### update(): patch in place, or return false to rebuild

The beacon's `update` splits its fields into two classes. Cheap visual fields patch the live object; structural fields return `false`, which makes the engine dispose and re-run `create()` — both paths deliberately exercised:

```js
update(object, props, prevProps) {
  // Structural fields force the recreate path (also validates it).
  if (props.mode !== prevProps.mode || props.emblemurl !== prevProps.emblemurl) return false;
  const { orb, plate } = object.userData.parts;
  if (props.color !== prevProps.color) {
    orb.material.color.set(props.color);
    orb.material.emissive.set(props.color);
  }
  if (props.label !== prevProps.label) {
    const old = plate.material.map;
    plate.material.map = paintLabel(props.label);
    plate.material.needsUpdate = true;
    if (old) old.dispose();
  }
  if (props.height !== prevProps.height) applyBeaconLayout(object, Number(props.height) || 2);
  object.userData.state.active = !!props.active;
  return true;
}
```

The statue takes the other valid position — *always* rebuild: a new URL must reload, and tint is a destructive multiply on cloned materials, so recreating re-clones from the pristine cached scene. "Returning false ALWAYS is a valid spec choice when in-place patching isn't worth the bookkeeping."

### Async models + shared-cache-safe dispose

`create()` must return synchronously, so the statue returns an empty `Group` immediately and populates it when `loadModel` resolves. The loaded scene is **shared** via the loadModel cache — tint through per-instance material clones, never mutate the originals:

```js
XRPublisher.loadModel(String(props.modelurl)).then((scene) => {
  if (group.userData.disposed) return; // block was deleted mid-load
  const clone = scene.clone(true);
  clone.traverse((n) => {
    if (n.isMesh && n.material) {
      n.material = n.material.clone();
      if (n.material.color) n.material.color.multiply(new T.Color(props.tint));
      group.userData.tintedMats.push(n.material);
    }
  });
  group.add(clone);
});
...
dispose(object) {
  // Geometry is SHARED with the loadModel cache — free ONLY the
  // per-instance cloned materials (+ the placeholder's own bits).
  object.userData.disposed = true;
  for (const m of object.userData.tintedMats || []) m.dispose();
  ...
}
```

Note the `disposed` flag closing the delete-while-loading race, and that the engine's *default* deep dispose (used when you omit `dispose`) would wrongly free the cached geometry — any block using shared or module-level resources needs its own `dispose`.

### tick(): one animation hook

`tick(object, dt, elapsed)` runs in one engine `useFrame`; a throwing tick is disarmed, not retried per frame. The spinner reads its speed from `userData` that `update()` keeps current:

```js
tick(object, dt) {
  object.rotation.y += object.userData.spin.speed * object.userData.spin.dir * dt;
},
```

## Key techniques / contracts to copy

- **`plugin:` must equal your build filename slug** (`{slug}-xr-publisher-plugin.umd.js`) — the server strips saved blocks belonging to inactive plugins, comments included.
- **Use `ctx.rng`, never `Math.random`,** for generative variation that must be stable across visits and renderers (the beacon's per-instance yaw, the crystal's seeded hue).
- **`create()` must be re-runnable** — React StrictMode double-invokes it in dev, and every `return false` update re-runs it too.
- **Transform is engine-owned.** Build at local origin; the gizmo and the standard transform attributes handle position/rotation/scale. Don't bake world placement into your meshes.
- **`ctx.isWebGPU` for renderer branching** — the beacon's orb uses `emissiveIntensity: isWebGPU ? 2.0 : 1.0` so it's bloom-ready on WebGPU worlds with post-FX while keeping sane un-bloomed brightness on WebGL.
- **Per-instance resources keep disposal simple.** The beacon paints one canvas label texture per instance, so the engine's default deep dispose is exactly right and the block needs no `dispose()` at all. The spinner's logging dispose exists so you can watch it fire in the console on delete *and* on recreate.
- **Late registration is the mainline path.** Plugins init after the runtime scanned the DOM; saved `<three-block-lab-*-block>` elements pop in when their type registers. An element whose plugin never loads renders a selectable wireframe proxy in edit mode — still movable and deletable.

## Try it

Copy into the api `plugins/` dir and `npm run upload-build <build-file>` (see `examples/plugins/README.md`). Open the in-world editor's Add menu — the four blocks appear under their category. Place a beacon, edit every field in the inspector, then save and reload to verify the round-trip. For the statue, drag a GLB from the asset drawer onto the Model URL field.

Suggested modifications:

1. **Add a field type you haven't used.** Give the spinner a `color` field and patch it in place in `update()` — then flip your patch to `return false` and watch the console dispose log to feel the difference.
2. **Make a fifth block.** Copy the nocode crystal, give it two `number` fields (arms, twist) and generate a seeded `TorusKnotGeometry` from them — the whole spec fits in ~20 lines.

## Next steps

- [Custom blocks API](27-custom-blocks.md) — the full spec reference (tag/slug rules, server sanitation, deferred features)
- [Minimal mushrooms](50-example-minimal-mushrooms.md) — the equivalent read-first example for *decorations* (scattered, not authored)
- [Injected models & solids](28-injected-models-and-solids.md) — programmatic placement, the third way to put objects in a world
- [Plugin development overview](18-plugin-development-overview.md)

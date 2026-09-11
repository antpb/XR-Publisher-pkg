# `<three-model-block>`

Places a 3D model (GLB, GLTF, or VRM) in the world, with full transform control, optional physics collision, GPU instancing for repeated copies, and proximity-gated loading for heavy assets.

---

## Usage

```html
<three-model-block
    threeobjecturl="path/to/model.glb"
    positionx="0" positiony="0" positionz="-8"
    rotationx="0" rotationy="45" rotationz="0"
    scalex="1" scaley="1" scalez="1"
    animations="idle,sway"
    collidable="1"
    alt="A decorative fountain">
</three-model-block>
```

---

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `threeobjecturl` | string | **required** | Model URL (GLB/GLTF/VRM). The block renders nothing without a valid URL. |
| `positionx/y/z` | number | `0` | World position. |
| `rotationx/y/z` | number | `0` | Rotation in **degrees** (this block converts degrees → radians internally). |
| `scalex/y/z` | number | `1` | Scale per axis. |
| `animations` | string | — | Comma-separated animation clip names to play. |
| `alt` | string | — | Accessibility description. Also fed to NPCs with `objectawareness="1"` so they can talk about nearby objects. |
| `collidable` | `"0"` \| `"1"` | `"0"` | `"1"` cooks a fixed trimesh collider from the model so the player collides with (and can stand on) it. |
| `instanced` | `"true"` \| `"false"` | `"false"` | Render the model as a `THREE.InstancedMesh` using the `instances` data. |
| `instances` | string (JSON) | — | Array of per-instance transforms (see below). |
| `proximityload` | `"0"` \| `"1"` | `"0"` | `"1"` defers loading the model until the player enters the trigger zone. |
| `triggerlocationx/y/z` | number | `0` | Trigger zone size (width/height/depth). All three must be > 0 for the zone to exist. |
| `triggerlocationposx/y/z` | number | `0` | Trigger zone offset from the model position. |

> **Rotation unit:** unlike most blocks, model block rotations are authored in **degrees** — `rotationy="90"` is a quarter turn.

---

## Instanced rendering

For many copies of the same model (trees, fence posts, pillars), instancing renders them all as one draw call. Set `instanced="true"` and supply an `instances` JSON array — each entry is a full transform, in world coordinates:

```html
<three-model-block
    threeobjecturl="tree.glb"
    instanced="true"
    instances='[
        {"positionX":0,"positionY":0,"positionZ":0,"rotationX":0,"rotationY":0,"rotationZ":0,"scaleX":1,"scaleY":1,"scaleZ":1},
        {"positionX":5,"positionY":0,"positionZ":5,"rotationY":0.5,"scaleX":1.2,"scaleY":1.2,"scaleZ":1.2},
        {"positionX":-4,"positionY":0,"positionZ":8,"collidable":"1"}
    ]'>
</three-model-block>
```

- Instance keys are camelCase inside the JSON: `positionX/Y/Z`, `rotationX/Y/Z`, `scaleX/Y/Z`. Missing scale components default to `1`, missing position/rotation to `0`.
- An individual instance can carry `"collidable": "1"` (or `true`) — collidable instances each get their own fixed trimesh body.
- Use single quotes around the attribute so the JSON's double quotes parse.

---

## Proximity loading

Heavy models can defer their download until the player is nearby. Set `proximityload="1"` and define a trigger box:

```html
<three-model-block
    threeobjecturl="cathedral-interior.glb"
    positionx="40" positionz="40"
    proximityload="1"
    triggerlocationx="20" triggerlocationy="10" triggerlocationz="20"
    triggerlocationposy="2">
</three-model-block>
```

The trigger zone is a sensor box of size `triggerlocationx/y/z`, centered at the model position plus `triggerlocationposx/y/z`. The model loads the first time the player's capsule enters it.

---

## Notable behaviors

- **VRM support**: `.vrm` avatars load with the VRM loader plugin (MToon materials handled on both renderers).
- **Collision is static**: `collidable="1"` creates a *fixed* body — it won't move. Trimesh cooking happens on the main thread at mount, so prefer instancing + a few collidable instances over dozens of separate collidable blocks.
- **Non-collidable models can be grabbable** in supported interaction modes; marking a model `collidable="1"` disables grabbing.
- **Invalid or empty URLs** log a warning and render nothing rather than erroring the world.

---

## Next steps

- Repeated decoration at terrain scale: [Decorations Overview](19-decorations-overview.md)
- Injecting models from plugin code: [Injected Models and Solids](28-injected-models-and-solids.md)
- Talking characters instead of static models: [NPC Block](10-npc-block.md)

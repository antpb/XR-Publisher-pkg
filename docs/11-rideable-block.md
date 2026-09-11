# `<three-rideable-block>`

A rideable vehicle. The player walks up and presses **E** to mount (the same proximity prompt NPCs use), drives or rides it, and presses **E** again to dismount. Driving is networked: peers see the vehicle move and the driver (and passengers) seated in it.

One block covers eight locomotion styles via `vehicletype` — ground vehicles with real suspension physics, free flight, hovering, boats, and on-rails trains/coasters.

[SCREENSHOT: A player avatar seated in a car model on procedural terrain, with the "Press E to Ride" banner visible on a second vehicle nearby]

---

## Usage

```html
<!-- A driveable car -->
<three-rideable-block
    threeobjecturl="car.glb"
    vehicletype="car"
    name="Roadster"
    positionx="0" positiony="0" positionz="5"
    seatoffsety="0.4"
    speed="1">
</three-rideable-block>

<!-- An on-rails roller coaster following an authored path -->
<three-rideable-block
    threeobjecturl="coaster-car.glb"
    vehicletype="coaster"
    name="Cyclone"
    waypoints='[[0,0,0],[20,4,10],[40,0,0],[20,8,-20],[0,0,0]]'
    speed="1.5">
</three-rideable-block>

<!-- A three-seat boat: driver + two passengers -->
<three-rideable-block
    threeobjecturl="boat.glb"
    vehicletype="boat"
    name="Skiff"
    seats='[[0,0.2,0.6],[0.5,0.2,-0.4],[-0.5,0.2,-0.4]]'
    positionx="30" positionz="-40">
</three-rideable-block>
```

---

## Vehicle types

| `vehicletype` | Behavior |
|---------------|----------|
| `car` | Four-wheel ground vehicle on a raycast physics controller — suspension, rear engine force, front steering. W/S accelerate, A/D steer. |
| `bike` | Two-wheeler on bike physics — leans into turns, steers its front wheel. Capacity caps at driver + 1 passenger. |
| `animal` | Ground mount — car-style ground driving with gentler tuning. |
| `flying` | Free flight along the third-person camera look direction (W throttles where you look). |
| `hovering` | Floats above the terrain with planar steering and a gentle bob. |
| `boat` | Floats on the water surface; steers like a car; beaches when terrain rises above the waterline. |
| `train` | On-rails along `waypoints`; the driver advances/reverses with W/S. |
| `coaster` | On-rails along `waypoints`; auto-advances at `speed` — a guided ride. |

---

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `threeobjecturl` | string | **required** | Vehicle model URL (GLB/GLTF). The block renders nothing without it. |
| `vehicletype` | string | `"car"` | One of the eight types above. |
| `name` | string | `"Vehicle"` | Banner label **and** the vehicle's stable networking id. Set it explicitly and keep it stable. |
| `waypoints` | string (JSON) | — | `[[x,y,z], ...]` world points defining the rail path for `train`/`coaster`. Interpolated into a smooth curve. Ignored by other types. |
| `speed` | number | `1` | Designer speed multiplier on the type's base speed. |
| `seatoffsetx/y/z` | number | `0` | Seat nudge in vehicle-local space, applied on top of the auto-derived seat (see seating). |
| `seats` | string (JSON) | — | Multi-seat layout: array of `[x,y,z]` vehicle-local seat offsets. Index 0 is the driver. |
| `positionx/y/z` | number | `0` | Spawn position. |
| `rotationy` | number | `0` | Initial heading in **degrees**. (`rotationx`/`rotationz` are not used.) |
| `scalex/y/z` | number | `1` | Scale per axis. |

> **Tip:** if you omit `name`, the id falls back to the block's position in the document (`rideable-0`, `rideable-1`, …) — reordering blocks then breaks multiplayer identity. Always name vehicles in published worlds.

---

## Named wheels: `xrp_wheel_01..04`

Ground vehicles (`car`, `bike`, `animal`) drive on a raycast physics controller. To get physically placed, spinning, steering wheels, name the wheel objects in your GLB:

| Object name | Wheel (4-wheeler) | Wheel (bike) |
|-------------|-------------------|--------------|
| `xrp_wheel_01` | front-left | front (steers) |
| `xrp_wheel_02` | front-right | rear |
| `xrp_wheel_03` | rear-left | — |
| `xrp_wheel_04` | rear-right | — |

Left/right/left/right, fronts first; the names travel in the GLB on export from Blender (name matching is case-insensitive). The engine reads each wheel object's position to place the physics wheel exactly there, sizes it from the object's bounds, and drives the actual mesh with the simulation — front wheels steer, all wheels roll and ride the suspension. Model wheels with their **axle along the vehicle's left-right (X) axis**.

Models without named wheels still drive — wheel positions are derived from the bounding box; they just won't visibly rotate.

## Propellers: `xrp_propeller_NN`

Any node named `xrp_propeller_01`, `xrp_propeller_02`, … (any count, any numbering) spins around the vehicle's forward axis while the vehicle is occupied — for boats and planes. Model the propeller with its shaft along the vehicle's length, blades perpendicular, like a boat screw.

---

## Seating

The default seat is auto-derived from the model's bounding-box center, plus a small built-in lift (0.22 units) so the rider sits *in* the seat rather than sunk into it. `seatoffsetx/y/z` nudge from there.

For multiple riders, author `seats` — a JSON array of `[x,y,z]` offsets in the same vehicle-local frame. Index 0 is the **driver**; remaining seats fill in boarding order (players pressing E take the next open seat and ride along). Capacity equals the array length for every type **except** `bike`, which always caps at driver + 1 passenger. The driver hosts the motion; every occupant rides in lockstep on all clients.

---

## Notable behaviors

- **Networked driving**: the driver simulates and broadcasts the chassis transform; remote clients (and passengers) interpolate it. Remote wheels animate from the synced motion.
- **Idle vehicles** rest at their authored spawn, seated on the terrain (or water surface for boats).
- **Flying** steers with the camera — aim where you want to go and throttle with W; Space/Shift adjust altitude.
- **Analog input**: joystick steering is proportional; keyboard is full-lock.

---

## Next steps

- The terrain vehicles drive on: [Terrain Block](15-terrain-block.md)
- Multiplayer setup: [Networking Block](16-networking-block.md)
- Custom interactive objects: [Interactables](33-interactables.md)

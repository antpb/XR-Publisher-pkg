# XR Publisher

XR Publisher is a powerful JavaScript library for creating immersive 3D virtual worlds with support for VR, networking, and AI-powered NPCs. Built on top of React and Three.js, it provides a declarative way to build interactive 3D environments.

> Development happens on the `develop` branch; releases are tagged from `main`.

## Features

- **Virtual Reality Support**: Built-in VR/AR compatibility with WebXR
- **Multiplayer Networking**: P2P multi-user environments with voice chat
- **AI-Powered NPCs**: Interactive characters with conversation capabilities
- **Physics Engine**: Rapier physics for realistic interactions
- **Procedural Terrain**: Infinite terrain generation with customizable noise
- **Component-Based**: Modular design using custom HTML elements
- **Asset Support**: GLB/GLTF models, VRM avatars, spatial audio, video
- **WebGPU Rendering**: Modern rendering with WebGPU (WebGL fallback for XR)
- **Plugin System**: register custom editor-placeable block types, deterministic scatter decorations, in-world dialogs/HUD, and post-processing from a single script — see [Plugin & Extension APIs](#plugin--extension-apis)

## Installation

```bash
npm install @antpb/xr-publisher
# or
pnpm add @antpb/xr-publisher
```

`react`, `react-dom` (>= 18), and `three` (>= 0.170) are peer dependencies.

## Quick Start

The library auto-initializes on `window.load`: it scans the DOM for `<three-environment-block>` elements and renders each one. For most published worlds you only need the script on the page and the block markup in the body — no JavaScript of your own.

To construct it manually (custom hosting, deferred init):

```javascript
import { XRPublisher } from '@antpb/xr-publisher';

const publisher = new XRPublisher({
    threeObjectPlugin: '/assets/',            // base URL for runtime assets
    defaultAvatarAnimation: '',
    defaultAvatar: '/assets/default-avatar.vrm',
    multiplayerWorker: '/assets/multiplayer-worker.js',
    userData: {},                             // per-visitor data passed through to components
    // optional:
    // apiBase: 'https://your-worker.example.com', // publishing-API origin (see below)
    // postSlug: 'my-world',                  // world identifier for networking rooms
    // hmdIcon: '/assets/vr-icon.png',        // custom Enter-VR icon
    // containedMode: false,                  // render inside a container element instead of fullscreen
});

publisher.init();
```

The UMD build (`dist/xr-publisher.umd.js`, also served by unpkg) exposes the same API as `window.XRPublisher` for script-tag use.

### Configuring the API endpoint

Server-backed features — NPC/character chat, the in-world editor and its tokens, the asset library, persisted world state — talk to a publishing-API worker (see the companion World and Character Management System project). The package ships with **no baked-in host**; the origin resolves in this order:

1. `apiBase` constructor option, or `XRPublisher.setApiBase(url)` at any time
2. `window.XRP_API_BASE` — set it in a `<script>` before the bundle loads (the natural spot for serve templates and script-tag embeds)
3. localStorage `xr_publisher_edge_api_url` (the desktop editor's stored-settings convention)
4. **Same origin** — a published world is served *by* the API worker, so this is the zero-config case that covers normal deployments

Purely client-side features (rendering, terrain, physics, portals, media blocks) never touch the network API. P2P multiplayer signaling is configured separately via the `signalingUrl` attribute on `<three-networking-block>`.

### Default assets

The package is self-contained: the default avatar (VRM), player/NPC animation clips (FBX), default grid environment (GLB), UI font, and textures ship in `dist/assets/defaults/`. At runtime the engine references them by the fixed path **`/assets/defaults/…`**, so serve that folder at your web root:

```
cp -R node_modules/@antpb/xr-publisher/dist/assets/defaults public/assets/defaults
```

To host runtime assets elsewhere, set the `threeObjectPlugin` option to your asset root (it must end with `/`; the engine appends e.g. `avatars/walking.fbx`). Individual defaults are also directly overridable (`defaultAvatar`, `userData.playerVRM`, `hmdIcon`). No external CDN is referenced by default.

## Block Reference

Worlds are constructed using custom HTML web components. Each block type has specific attributes that control its behavior. See the `schemas/` folder for complete JSON schema definitions.

### Block Categories

| Category | Blocks | Description |
|----------|--------|-------------|
| **Core** | `environment-block` | Main world container |
| **Objects** | `model-block`, `text-block` | 3D content |
| **Media** | `audio-block`, `video-block`, `image-block` | Multimedia |
| **Interactive** | `npc-block`, `portal-block`, `rideable-block` | Player interaction |
| **Environment** | `light-block`, `sky-block`, `terrain-block` | World atmosphere |
| **System** | `networking-block`, `spawn-point-block` | Configuration |

---

## Core Blocks

### `<three-environment-block>`

The main container for your 3D world. All other blocks must be nested within this element.

```html
<three-environment-block 
    devicetarget="vr" 
    threeobjecturl="path/to/world.glb"
    scale="1" 
    positiony="-1" 
    rotationy="0" 
    camcollisions="1"
    backgroundcolor="#1a1a2e"
    hdr="path/to/environment.hdr">
    <!-- Child blocks go here -->
</three-environment-block>
```

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `threeobjecturl` | string | - | URL to main world model (GLB/GLTF) |
| `devicetarget` | `"vr"` \| `"ar"` \| `"2d"` | `"vr"` | Target platform |
| `scale` | number | `1` | Uniform scale factor |
| `positionx/y/z` | number | `0` | World position offset |
| `rotationy` | number | `0` | Y-axis rotation (radians) |
| `camcollisions` | `"0"` \| `"1"` | `"1"` | Camera collision detection |
| `backgroundcolor` | string | - | Background color (hex) |
| `previewimage` | string | - | Loading screen image URL |
| `hdr` | string | - | HDR environment map URL |
| `animations` | string | - | Comma-separated animation names |

---

## Object Blocks

### `<three-model-block>`

Add 3D models with full transform controls, physics, and instancing support.

```html
<three-model-block 
    threeobjecturl="path/to/model.glb"
    positionx="0" positiony="0" positionz="0"
    rotationx="0" rotationy="0" rotationz="0"
    scalex="1" scaley="1" scalez="1"
    animations="idle,walk" 
    collidable="1"
    alt="A decorative tree">
</three-model-block>
```

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `threeobjecturl` | string | **required** | Model URL (GLB/GLTF/VRM) |
| `positionx/y/z` | number | `0` | World position |
| `rotationx/y/z` | number | `0` | Rotation (radians) |
| `scalex/y/z` | number | `1` | Scale per axis |
| `animations` | string | - | Comma-separated animation names |
| `alt` | string | - | Accessibility description |
| `collidable` | `"0"` \| `"1"` | `"0"` | Enable physics collisions |
| `instanced` | `"true"` \| `"false"` | `"false"` | Enable GPU instancing |
| `instances` | string (JSON) | - | Instance transform data |
| `proximityload` | `"0"` \| `"1"` | `"0"` | Load only when player is near |
| `triggerlocationx/y/z` | number | `0` | Proximity trigger zone size |
| `triggerlocationposx/y/z` | number | `0` | Trigger zone offset |

**Instanced Rendering Example:**
```html
<three-model-block 
    threeobjecturl="tree.glb"
    instanced="true"
    instances='[
        {"positionX":0,"positionY":0,"positionZ":0,"rotationX":0,"rotationY":0,"rotationZ":0,"scaleX":1,"scaleY":1,"scaleZ":1},
        {"positionX":5,"positionY":0,"positionZ":5,"rotationX":0,"rotationY":0.5,"rotationZ":0,"scaleX":1.2,"scaleY":1.2,"scaleZ":1.2}
    ]'>
</three-model-block>
```

### `<three-text-block>`

Add 3D text elements to the environment.

```html
<three-text-block
    textcontent="Welcome!"
    textcolor="#ffffff"
    positionx="0" positiony="2" positionz="-5"
    scalex="1" scaley="1" scalez="1">
</three-text-block>
```

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `textcontent` | string | **required** | Text to display |
| `textcolor` | string | `"#ffffff"` | Text color (hex) |
| `positionx/y/z` | number | `0` | World position |
| `rotationx/y/z` | number | `0` | Rotation (radians) |
| `scalex/y/z` | number | `1` | Scale per axis |

---

## Media Blocks

### `<three-audio-block>`

Add spatial or ambient audio with proximity triggers.

```html
<three-audio-block
    audiourl="path/to/audio.mp3"
    positional="1"
    loop="1"
    volume="0.8"
    autoplay="0"
    refdistance="1"
    maxdistance="50"
    rollofffactor="1"
    distancemodel="inverse"
    positionx="0" positiony="1" positionz="0"
    triggerlocationx="4" triggerlocationy="4" triggerlocationz="4"
    triggerlocationposx="0" triggerlocationposy="1" triggerlocationposz="0">
</three-audio-block>
```

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `audiourl` | string | **required** | Audio file URL (WAV/MP3/OGG) |
| `positional` | `"0"` \| `"1"` | `"1"` | Spatial (1) or ambient (0) |
| `loop` | `"0"` \| `"1"` | `"0"` | Loop playback |
| `volume` | number | `1` | Volume (0.0 - 1.0) |
| `autoplay` | `"0"` \| `"1"` | `"0"` | Auto-play on load |
| `refdistance` | number | `1` | Reference distance for falloff |
| `maxdistance` | number | `10000` | Maximum audible distance |
| `rollofffactor` | number | `1` | Volume rolloff rate |
| `distancemodel` | string | `"inverse"` | `"linear"`, `"inverse"`, `"exponential"` |
| `coneinnerangle` | number | `360` | Inner cone angle (degrees) |
| `coneouterangle` | number | `0` | Outer cone angle (degrees) |
| `coneoutergain` | number | `0` | Volume outside cone |
| `positionx/y/z` | number | `0` | Audio source position |
| `rotationx/y/z` | number | `0` | Audio source rotation |
| `triggerlocationx/y/z` | number | `0` | Trigger zone size (0 = disabled) |
| `triggerlocationposx/y/z` | number | `0` | Trigger zone offset |

**Proximity Trigger Behavior:**
- `autoPlay="1"`: Audio plays only on first trigger entry
- `autoPlay="0"`: Audio restarts on each entry
- On exit: Loop disabled, audio plays to completion then stops
- On re-entry: Original loop setting restored

### `<three-video-block>`

Add video planes or video-textured models.

```html
<three-video-block
    videourl="path/to/video.mp4"
    aspectwidth="16" aspectheight="9"
    autoplay="0"
    videocontrolsenabled="1"
    positionx="0" positiony="2" positionz="-5"
    scalex="3" scaley="3" scalez="1">
</three-video-block>
```

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `videourl` | string | **required** | Video file URL (MP4/WebM) |
| `aspectwidth` | number | `16` | Aspect ratio width |
| `aspectheight` | number | `9` | Aspect ratio height |
| `autoplay` | `"0"` \| `"1"` | `"0"` | Auto-play on load |
| `custommodel` | string | - | Custom model URL for video texture |
| `modelurl` | string | - | Alternative model URL |
| `videocontrolsenabled` | `"0"` \| `"1"` | `"0"` | Show playback controls |
| `positionx/y/z` | number | `0` | World position |
| `rotationx/y/z` | number | `0` | Rotation (radians) |
| `scalex/y/z` | number | `1` | Scale per axis |

### `<three-image-block>`

Add 2D image planes to the 3D environment.

```html
<three-image-block
    imageurl="path/to/image.png"
    aspectwidth="4" aspectheight="3"
    transparent="true"
    positionx="0" positiony="2" positionz="-3"
    scalex="2" scaley="2" scalez="1">
</three-image-block>
```

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `imageurl` | string | **required** | Image URL (PNG/JPG/WebP) |
| `aspectwidth` | number | `1` | Aspect ratio width |
| `aspectheight` | number | `1` | Aspect ratio height |
| `transparent` | `"true"` \| `"false"` | `"false"` | Enable alpha transparency |
| `positionx/y/z` | number | `0` | World position |
| `rotationx/y/z` | number | `0` | Rotation (radians) |
| `scalex/y/z` | number | `1` | Scale per axis |

---

## Interactive Blocks

### `<three-npc-block>`

Add AI-powered interactive characters.

```html
<three-npc-block
    threeobjecturl="path/to/avatar.vrm"
    name="Guide"
    defaultmessage="Hello, traveler! How can I help you?"
    personality="A friendly and knowledgeable guide who loves helping visitors explore the world."
    objectawareness="1"
    positionx="0" positiony="0" positionz="-3">
</three-npc-block>
```

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `threeobjecturl` | string | **required** | Avatar model URL (VRM) |
| `name` | string | **required** | NPC display name |
| `defaultmessage` | string | - | Initial greeting message |
| `personality` | string | - | AI personality description |
| `objectawareness` | `"0"` \| `"1"` | `"0"` | Awareness of environment objects |
| `positionx/y/z` | number | `0` | World position |
| `rotationx/y/z` | number | `0` | Rotation (radians) |
| `scalex/y/z` | number | `1` | Scale per axis |

### `<three-rideable-block>`

Add a rideable vehicle. The player walks up and presses **E** to mount (the same proximity prompt NPCs use for chat), then drives it; pressing **E** again dismounts. Driving is networked — other players see the vehicle move and see you seated in it.

One block covers eight locomotion styles via `vehicletype`:

| `vehicletype` | Behavior |
|---------------|----------|
| `car` | Four-wheel ground vehicle — steer with A/D, accelerate with W/S, follows terrain height |
| `bike` | Two-wheel — like `car` with a tighter turn radius |
| `animal` | Ground mount — like `car`, gentler speed |
| `flying` | Free flight — steers along the third-person camera look direction (W throttles where you look; Space/Shift fine up/down) |
| `hovering` | Floats at a fixed height above the terrain, planar steering |
| `boat` | Floats on the water surface; steers like a car. Beaches onto terrain that rises above the water |
| `train` | On-rails — follows `waypoints`; W/S advance/reverse along the track |
| `coaster` | On-rails — auto-advances along `waypoints` at `speed` (a guided ride) |

```html
<!-- A driveable car -->
<three-rideable-block
    threeobjecturl="car.glb"
    vehicletype="car"
    name="Roadster"
    positionx="0" positiony="0" positionz="5"
    seatoffsety="1.1"
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
```

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `threeobjecturl` | string | **required** | Vehicle model URL (GLB/GLTF) |
| `vehicletype` | string | `"car"` | `car`, `bike`, `flying`, `hovering`, `animal`, `boat`, `train`, `coaster` |
| `name` | string | - | Banner label **and** stable networking id — keep it stable per vehicle |
| `waypoints` | string (JSON) | - | `[[x,y,z],...]` rail path for `train`/`coaster` |
| `speed` | number | `1` | Speed multiplier on the type's base speed |
| `seatoffsetx/y/z` | number | `0,0,0` | Rider seat offset in vehicle-local space (the engine adds a fixed 0.22 seat lift on top of Y) |
| `positionx/y/z` | number | `0` | Spawn position |
| `rotationy` | number | `0` | Initial heading (degrees) |
| `scalex/y/z` | number | `1` | Scale per axis |

> **Tip:** `name` doubles as the cross-client id. If you reorder rideable blocks in published HTML, set an explicit `name` on each so multiplayer keeps them in sync.

**Real wheel physics (car/bike/animal):** ground vehicles drive on Rapier's raycast vehicle controller — a dynamic chassis with suspension wheels, rear engine force, and front steering. To get **physically-placed, spinning, steering wheels**, name the four wheel objects in your GLB:

| Object name | Wheel |
|-------------|-------|
| `xrp_wheel_01` | front-left |
| `xrp_wheel_02` | front-right |
| `xrp_wheel_03` | rear-left |
| `xrp_wheel_04` | rear-right |

(left / right / left / right, fronts first). On export from Blender these names travel in the GLB. The engine reads each wheel object's position to place the physics wheel exactly there, sizes the wheel from the object's bounds, and then spins/steers the actual mesh with the simulation (front wheels steer, all wheels roll and ride the suspension). Wheels should be modeled with their **axle along the vehicle's left-right (X) axis**. Models without these names still drive — the engine derives wheel positions from the bounding box (5% end inset, one tire-width in from the sides), they just won't visibly rotate.

### `<three-portal-block>`

Create teleportation points for navigation.

```html
<three-portal-block
    threeobjecturl="path/to/portal.glb"
    destinationurl="https://example.com/world"
    label="Enter Gallery"
    labeltextcolor="#00ff88"
    positionx="5" positiony="0" positionz="0"
    scalex="1" scaley="2" scalez="1">
</three-portal-block>
```

**For in-world teleportation:**
```html
<three-portal-block
    label="Go to Rooftop"
    useteleportdestination="true"
    teleportdestinationx="0"
    teleportdestinationy="20"
    teleportdestinationz="0"
    positionx="5" positiony="0" positionz="0">
</three-portal-block>
```

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `threeobjecturl` | string | - | Custom portal model URL |
| `destinationurl` | string | **required*** | URL to navigate to |
| `label` | string | - | Label text above portal |
| `labeloffsetx/y/z` | number | `0` | Label position offset |
| `labeltextcolor` | string | `"#ffffff"` | Label color (hex) |
| `useteleportdestination` | `"true"` \| `"false"` | `"false"` | Use in-world teleport |
| `teleportdestinationx/y/z` | number | - | Teleport coordinates |
| `animations` | string | - | Animation names |
| `positionx/y/z` | number | `0` | World position |
| `rotationx/y/z` | number | `0` | Rotation (radians) |
| `scalex/y/z` | number | `1` | Scale per axis |

*Required unless `useteleportdestination="true"`

---

## Environment Blocks

### `<three-light-block>`

Add light sources to illuminate the environment.

```html
<!-- Directional light (sun-like) -->
<three-light-block
    type="directional"
    color="#ffffff"
    intensity="1.5"
    positionx="30" positiony="40" positionz="20"
    castshadow="true"
    shadowmapsize="2048">
</three-light-block>

<!-- Point light -->
<three-light-block
    type="point"
    color="#ff6600"
    intensity="2"
    distance="10"
    decay="2"
    positionx="0" positiony="3" positionz="0">
</three-light-block>

<!-- Spotlight -->
<three-light-block
    type="spot"
    color="#ffffff"
    intensity="2"
    angle="0.5"
    penumbra="0.5"
    positionx="0" positiony="5" positionz="0"
    rotationx="-90">
</three-light-block>
<!-- NOTE: light-block rotations are in DEGREES (converted to radians at
     runtime). Most other blocks take radians directly. -->
```

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `type` | string | **required** | `"ambient"`, `"directional"`, `"point"`, `"spot"` |
| `color` | string | `"#ffffff"` | Light color (hex) |
| `intensity` | number | `1` | Light brightness |
| `distance` | number | `0` | Range (point/spot, 0 = infinite) |
| `decay` | number | `2` | Falloff rate (point/spot) |
| `angle` | number | `0.52` | Cone angle in radians (spot) |
| `penumbra` | number | `0` | Edge softness 0-1 (spot) |
| `castshadow` | `"true"` \| `"false"` | `"false"` | Cast shadows |
| `shadowmapsize` | number | `1024` | Shadow resolution |
| `shadowradius` | number | `1` | Shadow blur |
| `shadowbias` | number | `-0.0005` | Shadow bias |
| `positionx/y/z` | number | `0` | Light position |
| `rotationx/y/z` | number | `0` | Light rotation |

### `<three-sky-block>`

Configure skybox and atmospheric effects.

```html
<three-sky-block 
    distance="170000" 
    rayleigh="1" 
    turbidity="10"
    sunpositionx="0" sunpositiony="1" sunpositionz="-10000">
</three-sky-block>
```

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `distance` | number | `170000` | Sky sphere distance |
| `rayleigh` | number | `1` | Atmospheric scattering |
| `turbidity` | number | `10` | Atmospheric haziness |
| `miecoefficient` | number | `0.005` | Mie scattering |
| `miedirectionalg` | number | `0.7` | Mie directionality |
| `sunpositionx/y/z` | number | - | Sun direction vector |

### `<three-terrain-block>`

Generate procedural infinite terrain with atmosphere.

```html
<three-terrain-block
    width="100" height="100" segments="100"
    scale="0.5" heightscale="50"
    positiony="-10"
    color="#4a7c59"
    roughness="0.8" metalness="0.2"
    seed="my-world-seed"
    noiseoctaves="6" noisepersistence="0.5" noiselacunarity="2"
    skycolor="#87CEEB" horizoncolor="#E0F7FF"
    cloudcolor="#ffffff" clouddensity="0.5" cloudscale="1"
    cloudspeed="0.1" cloudheight="100" cloudlayers="3"
    timeofday="12" timecycleduration="0">
</three-terrain-block>
```

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `width` | number | `100` | Chunk width |
| `height` | number | `100` | Chunk depth |
| `segments` | number | `100` | Geometry detail |
| `scale` | number | `0.5` | Noise scale |
| `heightscale` | number | `50` | Height multiplier |
| `seed` | string | random | Generation seed |
| `positiony` | number | `-10` | Base height |
| `color` | string | `"#4a7c59"` | Terrain color |
| `roughness` | number | `0.8` | Material roughness |
| `metalness` | number | `0.2` | Material metalness |
| `noiseoctaves` | number | `6` | Noise detail layers |
| `noisepersistence` | number | `0.5` | Amplitude per octave |
| `noiselacunarity` | number | `2` | Frequency per octave |
| `skycolor` | string | `"#87CEEB"` | Zenith sky color |
| `horizoncolor` | string | `"#E0F7FF"` | Horizon sky color |
| `cloudcolor` | string | `"#ffffff"` | Cloud color |
| `clouddensity` | number | `0.5` | Cloud coverage (0-1) |
| `cloudscale` | number | `1` | Cloud pattern size |
| `cloudspeed` | number | `0.1` | Cloud movement |
| `cloudheight` | number | `100` | Cloud layer height |
| `cloudlayers` | number | `3` | Number of layers |
| `timeofday` | number | `12` | Time (0-24) |
| `timecycleduration` | number | `0` | Day/night cycle seconds (0 = off) |
| `renderdistance` | number | `3` | Chunk render distance |

---

## System Blocks

### `<three-networking-block>`

Enable multiplayer functionality.

```html
<three-networking-block 
    participantlimit="10" 
    customavatars="1"
    voicechatenabled="1">
</three-networking-block>
```

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `participantlimit` | number | `10` | Maximum concurrent users |
| `customavatars` | `"0"` \| `"1"` | `"0"` | Allow custom avatar URLs |
| `voicechatenabled` | `"0"` \| `"1"` | `"0"` | Enable voice chat |

### `<three-spawn-point-block>`

Define player spawn location.

```html
<three-spawn-point-block positionx="0" positiony="1" positionz="5">
</three-spawn-point-block>
```

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `positionx/y/z` | number | `0` | Spawn position |

---

## Complete World Example

```html
<three-environment-block 
    devicetarget="vr" 
    threeobjecturl="world.glb"
    scale="1" 
    positiony="0" 
    camcollisions="1"
    hdr="sky.hdr">
    
    <!-- Networking -->
    <three-networking-block participantlimit="8" customavatars="1">
    </three-networking-block>
    
    <!-- Spawn Point -->
    <three-spawn-point-block positionx="0" positiony="1" positionz="5">
    </three-spawn-point-block>
    
    <!-- Lighting -->
    <three-light-block type="ambient" intensity="0.4" color="#ffffff">
    </three-light-block>
    <three-light-block 
        type="directional" 
        intensity="1.2" 
        positionx="30" positiony="50" positionz="20"
        castshadow="true">
    </three-light-block>
    
    <!-- Interactive NPC -->
    <three-npc-block
        threeobjecturl="guide.vrm"
        name="Guide"
        defaultmessage="Welcome! Ask me anything."
        personality="Friendly and helpful"
        positionx="0" positiony="0" positionz="-5">
    </three-npc-block>
    
    <!-- Decorative Models -->
    <three-model-block 
        threeobjecturl="fountain.glb"
        positionx="10" positiony="0" positionz="10"
        collidable="1">
    </three-model-block>
    
    <!-- Background Music -->
    <three-audio-block
        audiourl="ambient.mp3"
        positional="0"
        loop="1"
        volume="0.3"
        autoplay="1">
    </three-audio-block>
    
    <!-- Portal to Another World -->
    <three-portal-block
        destinationurl="https://example.com/gallery"
        label="Visit Gallery"
        positionx="-10" positiony="0" positionz="0">
    </three-portal-block>
    
</three-environment-block>
```

---

## Schema Files

JSON Schema definitions for all blocks are available in the `schemas/` folder:

```
schemas/
├── index.json                    # Schema index
├── environment-block.schema.json
├── model-block.schema.json
├── npc-block.schema.json
├── portal-block.schema.json
├── audio-block.schema.json
├── video-block.schema.json
├── image-block.schema.json
├── light-block.schema.json
├── text-block.schema.json
├── sky-block.schema.json
├── terrain-block.schema.json
├── networking-block.schema.json
└── spawn-point-block.schema.json
```

These schemas can be used for validation, editor autocomplete, and documentation generation.

---

## Plugin & Extension APIs

Beyond declarative `<three-*-block>` HTML, XR Publisher exposes a JavaScript API for building world content and editor/runtime extensions from a plugin script. A plugin is a self-contained UMD build loaded via a `<script>` tag; every method below is available as `XRPublisher.<method>` (static, instance, and `window.XRPublisher`).

### Plugin bootstrap pattern

A plugin's `<script>` tag can load before or after the runtime finishes its initial DOM scan, so shipped plugins wait for the runtime and register late — the registries below are all designed around late registration (blocks/decorations pop in the moment they're registered, even mid-session).

```js
(function () {
  function waitForRuntime(cb) {
    if (window.XRPublisher && typeof window.XRPublisher.registerDecoration === 'function') return cb();
    setTimeout(() => waitForRuntime(cb), 100);
  }
  function init() { waitForRuntime(() => { /* register here */ }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else setTimeout(init, 300);
})();
```

Full reference plugins live in `examples/plugins/` and `examples/decorations/` — `block-lab-xr-publisher-plugin.umd.js` is the stress test for every custom-block field type and lifecycle hook described below.

### Custom Blocks — `XRPublisher.registerBlockType(spec)`

Register an editor-placeable block type. One call wires the block into every seam: the in-world editor's **Add** menu, a generated inspector panel, gizmo/undo, save round-trip (as `<three-{plugin}-{name}-block>`), and normal page rendering.

```js
XRPublisher.registerBlockType({
  plugin: 'block-lab',       // must match your build filename slug
  name: 'beacon',
  title: 'Beacon',
  category: 'Plugins',
  fields: [
    { key: 'height', type: 'number', label: 'Height', default: 2, min: 0.5, max: 10, step: 0.1 },
    { key: 'color', type: 'color', default: '#5cc8f2' },
    { key: 'label', type: 'string', default: 'Beacon' },
    { key: 'mode', type: 'select', default: 'pulse', options: [
      { value: 'pulse', label: 'Pulse' }, { value: 'steady', label: 'Steady' }, { value: 'strobe', label: 'Strobe' },
    ]},
    { key: 'active', type: 'boolean', default: true },
  ],
  create(ctx) {
    const { props, THREE } = ctx;
    return new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.3, props.height),
      new THREE.MeshStandardMaterial({ color: props.color, emissive: props.color })
    );
  },
  update(obj, props, prevProps) {
    if (props.mode !== prevProps.mode) return false; // recreate on mode change
    obj.scale.y = props.height / prevProps.height;
    obj.material.color.set(props.color);
    return true; // handled in place
  },
  tick(obj, delta, elapsed) {
    obj.material.emissiveIntensity = 1 + Math.sin(elapsed * 3) * 0.5;
  },
});
```

- **Tag**: `three-{plugin}-{name}-block`. `plugin`/`name` must be lowercase, `/^[a-z0-9]+(-[a-z0-9]+)*$/`. `plugin` must equal your build's filename slug (`{plugin}-xr-publisher-plugin.umd.js`) — the API server allowlists saved blocks by that prefix on every world save, stripping blocks whose plugin isn't currently active rather than rejecting the save.
- **Field types**: `number` (`min`/`max`/`step`), `string`, `longtext` (textarea), `url` (asset-drawer drop target in the editor), `select` (`options` as strings or `{value,label}` pairs), `color`, `boolean`. Field keys are lowercased, no dashes.
- **Transform is engine-owned** — every custom block gets the standard 9 transform attributes and gizmo handling for free; `create()` builds at local origin.
- **Lifecycle**: `create(ctx) → Object3D|null` (required). `ctx = { props, el, THREE, isWebGPU, rng, seed }` — `rng` is a seeded PRNG (stable per block instance; use it instead of `Math.random()` for deterministic variation). `update(obj, props, prevProps, ctx)` is optional — return `false` (or omit `update` entirely) to have the block disposed and recreated instead of patched in place. `tick(obj, delta, elapsed)` runs every frame if present. `dispose(obj)` replaces the default deep geometry/material dispose — provide one if the block shares resources (e.g. a cached loaded model).
- A block whose plugin hasn't loaded yet (or was removed) renders nothing in a published world and shows a selectable wireframe placeholder in the in-world editor — it's never silently deleted from the save.
- `XRPublisher.unregisterBlockType(tag)` removes a registration.

### Decorations — `XRPublisher.registerDecoration(spec)`

Register a scatter object that the procedural terrain places deterministically (same world seed → same spots, every visit, every renderer). This is the right tool for ambient world dressing — trees, props, creatures — that shouldn't be individually hand-placed in the editor.

```js
XRPublisher.registerDecoration({
  name: 'campfire',
  density: 0.02,
  surface: 'grass',
  maxSlope: 0.3,
  groundPatch: { radius: 3, clearGrass: true },
  create(spawn) {
    const group = new THREE.Group();
    // build with spawn.rng for seed-stable variation
    return group;
  },
});
```

Placement filters (`minHeight`/`maxHeight`, `maxSlope`, `minWaterDistance`/`maxWaterDistance`, `surface`, `biomes`, `minSpacing`) cover common cases; `spawn` also carries `slope`, `waterDistance`, `surface`, `biome`, and terrain-grid spawns get `groundHeightAt(dx, dz)` for seating multi-point structures on real terrain. Other capabilities:

- **`anchor`**: `'terrain'` (default), `'tree'` (hangs off real canopy geometry), `'tree-base'` (trunk/ground contact ring), or `'mountain'` (near the summit).
- **`instanced`**: render every spawn as one `InstancedMesh` — cheap for dense repeated models (incompatible with `update`).
- **`groundPatch`**: paint a dirt circle and clear engine grass around each spawn (campfire/plaza clearings).
- **`collision`**: `true`/`'cuboid'`, `'hull'`, or `'trimesh'` for a solid decoration; or set `object.userData.xrColliders` on the `create()` result for hand-authored box colliders (the efficient path for walk-in structures).
- **`waterPlacement`**: `'floor'` | `'submerged'` | `'surface'` for decorations spawned in water.
- **`interactable: true` + `onInteract(ctx)`**: makes a spawn collectable/usable with a "Press E" prompt (see Interactables below).
- **`update(object, delta, elapsed)`**: present ⇒ the decoration ticks every frame (absent ⇒ static, matrices frozen for performance).

Demo plugins in `examples/plugins/` and `examples/decorations/` cover most of the above (campfires, farm-plots, lake-fish, town-center, at-tree-base, on-mountains, biome-surfaces, instanced-models).

### Programmatic world building

For content that doesn't fit the scatter model — one-off structures, procedural surfaces, teleport logic — inject directly:

- **`XRPublisher.addModel(spec) → id`** / **`removeModel(id)`**: inject a glTF/GLB rendered through the engine's own model pipeline (instancing, trimesh collision, WebGPU conversion included). Persists across chunk streaming, unlike decoration spawns.
- **`XRPublisher.addTerrainRegion({ center, radius, surface, scale?, mortar?, tint?, clearGrass? }) → id`** / **`removeTerrainRegion(id)`**: replace the terrain surface inside a world-space circle with a registered procedural surface (e.g. a cobblestone plaza).
- **`XRPublisher.registerTerrainSurface({ id, tsl, fallbackColor })`**: register a custom procedural terrain surface authored in TSL (`XRPublisher.tsl`), composited into the shared terrain material. `'cobblestone'` ships built in.
- **`XRPublisher.getGroundHeight(x, z) → number|null`**: sample terrain surface height via the physics raycast (returns `null` until a nearby collider has loaded — poll/retry).
- **`XRPublisher.teleportPlayer(x, y?, z)`**: teleport the local player, snapping to ground on arrival.
- **`XRPublisher.loadModel(url) → Promise<Object3D>`**: cached glTF/GLB loader — one fetch/parse no matter how many callers request the same URL; clone the resolved scene per use (`.clone(true)`), and if used inside a decoration/block, provide a no-op-ish `dispose()` since the default cleanup would otherwise free the shared geometry.

### Interactables — "Press E to interact"

Add `interactable: true` and `onInteract(ctx)` to a decoration spec (or call `XRPublisher.registerInteractable(entry)` / `unregisterInteractable(id)` directly for objects mounted outside the decoration system) to make an object collectable or usable. The engine runs proximity detection, shows a "Press E" prompt, and calls your handler on interact. `ctx.remove()` hides the object and unregisters it. `interactionPrompt` may be a function, re-evaluated at each proximity check, for contextual prompts ("Water crops" → "Harvest").

### UI extension points

- **`XRPublisher.registerHud(id, domElement, anchor?)`** / **`unregisterHud(id)`**: mount a plugin-owned DOM element into a fixed corner-anchored overlay. Flatscreen only — not visible in VR.
- **`XRPublisher.openDialog({ title, content, buttons, width?, dismissDistance?, onClose? })`** / **`closeDialog()`**: open an in-world 3D modal panel, clickable by mouse and VR controller alike. Buttons can chain into further `openDialog()` calls for branching flows (quizzes, dialogue trees).
- **`XRPublisher.registerMenuItem({ id, label, icon?, onSelect, order? })`** / **`unregisterMenuItem(id)`**: add a row to the hamburger "More" menu in the top-left HUD cluster.

### Post-processing — `XRPublisher.setPostProcessing(config)` / `clearPostProcessing()`

WebGPU-only **threshold** bloom pipeline: anything whose rendered color exceeds the luminance threshold blooms. In practice you drive it with `emissive`/`emissiveIntensity` pushed past the threshold; ordinary lit surfaces (terrain, grass, buildings) stay below it and are untouched. It is not a per-material selection mask — a sufficiently bright non-emissive surface will also bloom.

```js
XRPublisher.setPostProcessing({
  bloom: { strength: 1.2, radius: 0.4, threshold: 0.8 },
  anamorphic: true,
  chromaticAberration: 0.002,
  audioReactive: true,
});
```

Costs nothing until called, and nothing at all on `?renderer=webgl`, which always uses plain rendering.

### Time of day — `XRPublisher.setTimeOfDay(hour, pauseCycle?)` / `setDayCyclePaused(paused)` / `getTimeOfDay()`

World time is one shared, room-synced timeline — the first participant to join becomes the time authority and heartbeats state to late joiners. Never gate a time change on player proximity; that produces a different time-of-day per client, which reads as a bug rather than a feature.

### Networking helpers for plugins

Available once a world has networking enabled: `XRPublisher.broadcast(channel, data)` / `onMessage(channel, handler)` (channels prefixed `__xrp:` are reserved for engine use), `getClientId()`, `getPeers() → [{id,x,y,z}]` (remote player positions, for proximity effects), `getPlayerState()` (local player). See `examples/plugins/resonance-stage-xr-publisher-plugin.umd.js` for a full multi-peer synced example (leader-elected shared-epoch audio transport).

### Persisted world state — `XRPublisher.{configureWorldState, fetchWorldState, getWorldState, setWorldState, subscribeWorldState}`

Small JSON records that persist server-side per `(world, plugin, key)`, for deterministic decorations that need to remember state across visits (a watered crop, a harvested node). Reads are synchronous from an in-memory snapshot inside `create()` — call `fetchWorldState` there to warm it, and `subscribeWorldState` to react when fresher state arrives from the server or a peer broadcast. Newest-`updatedAt` wins across optimistic local writes, peer broadcasts, and the server round-trip. Backed by the `GET /api/world-state` / `POST /api/world-state/set` endpoints on the publishing API (see that project's README). Reference implementation: `examples/plugins/farm-plots-xr-publisher-plugin.umd.js` (growth/harvest/wither/regrow cycle).

### Utilities

- **`XRPublisher.utils = { alea, createNoise2D, createNoise3D }`**: the same seeded PRNG/noise primitives the engine's own terrain/decoration builders use — use these (never `Math.random()`) for anything that should be stable per visit.
- **`XRPublisher.tsl`** (three/tsl nodes) and **`XRPublisher.webgpu`** (node material classes): author custom WebGPU shaders/materials using the engine's own Three.js instance, so node identity isn't broken by a duplicate Three copy. Gate on `!XRPublisher.webgpu` to detect `?renderer=webgl` and fall back to stock materials.
- **`window.THREE`**: the bundled Three.js namespace, so plugin code can build `Object3D`s without shipping a second copy of Three.

---

## Physics System

The library uses Rapier for physics simulation:

1. Set `collidable="1"` on model blocks for physics bodies
2. Enable `camcollisions="1"` on the environment for player collision
3. Physics initializes automatically when the world loads
4. Supports trimesh, cuboid, and hull colliders via GLTF extensions (OMI_collider)

---

## Avatar System

Players use VRM avatars with full animation support:

- Default avatar configurable in XRPublisher settings
- Custom avatar URLs supported when `customavatars="1"`
- Mixamo animation retargeting built-in
- First-person and third-person camera modes

---

## Browser Support

- **WebGPU**: Modern browsers (Chrome 113+, Edge 113+)
- **WebGL**: Fallback for VR/XR sessions
- **WebXR**: VR headset support (Quest, Vive, etc.)
- **Mobile**: Touch controls with virtual joystick

---

## Building From Source

```bash
npm install            # package uses legacy-peer-deps (see .npmrc)
npm run build:wasm     # one-time: generates src/workers/wasm/ (requires rustup + wasm32-unknown-unknown target)
npm run build          # ES + CJS + UMD bundles + TypeScript declarations → dist/
```

`npm run build:wasm` only needs re-running when the Rust sources under `crates/` change. Installing the published npm package requires no Rust toolchain — the WASM is inlined in the bundles.

---

## License

GPL-3.0-only — see [LICENSE](./LICENSE).

## Support

For questions and support, [file an issue on GitHub](https://github.com/antpb/XR-Publisher-pkg/issues).

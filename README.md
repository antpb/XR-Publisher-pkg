# XR Publisher

XR Publisher is a powerful JavaScript library for creating immersive 3D virtual worlds with support for VR, networking, and AI-powered NPCs. Built on top of React and Three.js, it provides a declarative way to build interactive 3D environments.

STILL IN DEVELOPMENT USE AT YOUR OWN RISK OF FREQENT CHANGES - DEVELOPMENT IS ON THE BRANCH "development" wait until there is a release before using in production

## Features

- **Virtual Reality Support**: Built-in VR compatibility with device targeting
- **Multiplayer Networking**: Support for multi-user environments with voice chat capabilities
- **AI-Powered NPCs**: Integration with AI characters that can interact with users
- **Physics Engine**: Integrated physics system for realistic object interactions
- **Component-Based Architecture**: Modular design using custom HTML elements
- **Asset Management**: Support for various 3D models, textures, and audio
- **Environment Controls**: Camera collisions, teleportation, and player movement
- **Customizable Avatars**: VRM model support for player avatars

## Installation


## Quick Start

1. Import the library:

```javascript
import { XRPublisher } from 'xr-publisher';
```

2. Initialize with your configuration:

```javascript
const publisher = new XRPublisher({
    threeObjectPlugin: 'path/to/plugin',
    defaultAvatarAnimation: '',
    defaultAvatar: 'path/to/default/avatar.vrm',
    multiplayerAccess: 'loggedIn',
    camCollisions: true,
    enableAI: true,
    enableNetworking: false,
    enableVoiceChat: false
});

publisher.init();
```

## Building a World

Worlds are constructed using custom HTML web componentsgit. Here's a basic example:

```html
<three-environment-block 
    devicetarget="vr" 
    threeobjecturl="path/to/world.glb"
    scale="1" 
    positiony="-1" 
    rotationy="0" 
    animations="" 
    camcollisions="1">
    
    <!-- Networking configuration -->
    <three-networking-block 
        participantlimit="5" 
        customavatars="1">
    </three-networking-block>
    
    <!-- 3D Models -->
    <three-model-block 
        threeobjecturl="path/to/model.glb"
        scalex="1" 
        scaley="1" 
        scalez="1" 
        positionx="0" 
        positiony="0" 
        positionz="0"
        animations="" 
        collidable="1">
    </three-model-block>
    
    <!-- Sky configuration -->
    <three-sky-block 
        distance="170000" 
        rayleigh="1" 
        sunpositionx="0" 
        sunpositiony="1" 
        sunpositionz="-10000">
    </three-sky-block>
</three-environment-block>
```

## Available Components

### Environment Block
The main container for your 3D world:
```html
<three-environment-block>
    <!-- World contents go here -->
</three-environment-block>
```

Attributes:
- `devicetarget`: Set to "vr" for VR support
- `threeobjecturl`: URL to the main world model (GLB format)
- `scale`: World scale factor
- `positiony`: Vertical position
- `rotationy`: Rotation around Y axis
- `camcollisions`: Enable/disable camera collisions

### Networking Block
Enables multiplayer functionality:
```html
<three-networking-block>
</three-networking-block>
```

Attributes:
- `participantlimit`: Maximum number of concurrent users
- `customavatars`: Enable custom avatar uploads

### Model Block
Add 3D models to your world:
```html
<three-model-block>
</three-model-block>
```

Attributes:
- `threeobjecturl`: URL to the model file
- `scalex/y/z`: Scale in each dimension
- `positionx/y/z`: Position in 3D space
- `rotationx/y/z`: Rotation around each axis
- `animations`: Animation names to play
- `collidable`: Enable physics collisions

### NPC Block
Add interactive AI characters:
```html
<three-npc-block
    threeobjecturl="path/to/avatar.vrm"
    name="NPCName"
    defaultmessage="Hello!"
    personality="..."
    objectawareness="1">
</three-npc-block>
```

### Additional Components
- `<three-sky-block>`: Configure skybox and lighting
- `<three-audio-block>`: Add spatial audio
- `<three-video-block>`: Add video elements
- `<three-image-block>`: Add image planes
- `<three-text-block>`: Add 3D text
- `<three-portal-block>`: Create teleport points

## Physics and Collisions

The library includes a physics system based on Rapier. To make objects collidable:

1. Set the `collidable` attribute on model blocks
2. Enable camera collisions with `camcollisions="1"`
3. Physics will automatically initialize when the world loads

## Avatar System

Players can customize their appearance using VRM models:
- Default avatar can be specified in configuration
- Custom avatar URLs can be provided if enabled
- Avatars support animations and physics interactions

## Advanced Features

### AI NPCs
NPCs can be configured with personality traits and conversation topics:
## @todo HIGH RISK TO CHANGE SOON: update to offer the ability to point to the new Character API to create NPCs

```javascript
const npcConfig = {
    name: "Character",
    topics: ["topic1", "topic2"],
    personality: {
        adjectives: ["friendly", "helpful"],
        style: {
            chat: ["Be enthusiastic", "Use emojis"]
        }
    }
};
```

### Networking
For multiplayer environments:
1. Enable networking in configuration
2. Set participant limits
3. Configure voice chat settings
4. Handle player synchronization automatically
(TODO: need to write up the p2pcf setup or offer the public one)

## Browser Support

- Modern browsers with WebGL support
- WebXR-compatible browsers for VR features
- Mobile support with touch controls


## License
GPL-3.0

## Support

For questions and support:
- File an issue on GitHub


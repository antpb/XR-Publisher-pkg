# `<three-npc-block>`

Places an AI-powered non-player character in the world. NPCs are animated VRM avatars the player can walk up to and chat with — a "Press E to Interact" banner appears in range, and conversations run against the publishing API's character endpoint using the NPC's authored `personality`.

[SCREENSHOT: An NPC avatar standing on terrain with the "Press E to Interact" banner floating above it]

---

## Usage

```html
<three-npc-block
    threeobjecturl="path/to/guide.vrm"
    name="Guide"
    defaultmessage="Hello, traveler! How can I help you?"
    personality="A friendly and knowledgeable guide who loves helping visitors explore the world."
    objectawareness="1"
    positionx="0" positiony="0" positionz="-3"
    rotationy="0">
</three-npc-block>
```

---

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `threeobjecturl` | string | **required** | Avatar model URL. VRM format recommended (humanoid rig required for animation). |
| `name` | string | **required** | Display name — shown in the chat UI and used to identify the character. |
| `defaultmessage` | string | — | Greeting shown when the player first engages the NPC. |
| `personality` | string | — | Personality/character description sent as context to the AI conversation backend. |
| `objectawareness` | `"0"` \| `"1"` | `"0"` | `"1"` gives the NPC awareness of world objects — the `alt` descriptions of model blocks are shared with its conversation context. |
| `positionx/y/z` | number | `0` | World position. |
| `rotationx/y/z` | number | `0` | Rotation (radians). |
| `scalex/y/z` | number | `1` | Scale per axis. A missing or `0` value falls back to `1` (a 0 scale would collapse the avatar entirely). |

---

## Notable behaviors

- **Interaction**: approaching the NPC shows a "Press E to Interact" banner; pressing **E** opens the chat box. NPC interaction takes precedence over nearby world interactables while hovered.
- **AI backend**: conversations create a character session against the configured publishing API (`personality` seeds the character; see [World Identity and Tokens](43-world-identity-and-tokens.md) for how the API base and world identity are resolved). Without an API configured, the NPC still renders and animates but can't hold a conversation.
- **Animation**: NPCs use the engine's retargeted Mixamo animation set (idle/walk/run) on the VRM rig.
- **Scale** applies to the whole NPC group — avatar and its floating name label together. Keep it uniform (`scalex`/`scaley`/`scalez` equal); non-uniform scale distorts the rig.
- **Wandering**: on procedural terrain, NPCs pathfind and wander on a generated navmesh that excludes water, and they avoid idling inside trees, boulders, and other decorations. NPCs only wander while the player is in the same terrain cell; they hold position (still animated) otherwise.
- **Placement**: NPCs never spawn in water — the navmesh is built above the world water level.

---

## Next steps

- Player-triggered object interactions: [Interactables](33-interactables.md)
- Scripted dialog panels: [In-World Dialogs](35-in-world-dialogs.md)
- API configuration for conversations: [World Identity and Tokens](43-world-identity-and-tokens.md)

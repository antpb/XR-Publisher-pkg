# `<three-networking-block>`

Turns the world multiplayer. With this block present, the page gets a join/leave control cluster, and connected players see each other as animated avatars, hear each other over proximity voice chat (if enabled), and share world state — vehicles, world time, and plugin messages all sync per room.

Connections are peer-to-peer WebRTC, coordinated by a lightweight signaling server (P2PCF). No world traffic flows through a game server.

[SCREENSHOT: Two avatars in the same world with the networking control cluster (join/leave, mic, participants) visible in the top-left corner]

---

## Usage

```html
<three-networking-block
    participantlimit="10"
    customavatars="1"
    voicechatenabled="1">
</three-networking-block>
```

With a custom signaling server and a fixed room name:

```html
<three-networking-block
    participantlimit="16"
    voicechatenabled="1"
    signalingurl="https://signaling.example.com"
    roomslug="main-hall">
</three-networking-block>
```

---

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `participantlimit` | number | `10` | Maximum concurrent users in the room. When a room is full, additional visitors are held out (the client retries). |
| `customavatars` | `"0"` \| `"1"` | `"0"` | Allow users to bring their own VRM avatar URL. |
| `voicechatenabled` | `"0"` \| `"1"` | `"0"` | Enable microphone voice chat. |
| `signalingurl` | string | `"https://p2pcf.sxp.digital"` | P2PCF signaling server used to broker peer connections. Point it at your own deployment to self-host. |
| `roomslug` | string | — | Explicit room name. When set, the room id becomes `{hostname}-xr-publisher-{roomslug}`; otherwise it derives from the hostname and the page's post slug — every visitor to the same published page lands in the same room. |

---

## Voice chat

With `voicechatenabled="1"`, a mic toggle appears in the control cluster. Voice is **proximity-attenuated** by default:

- Peers sound full-volume nearby and fade with distance (ranges auto-derive from the terrain chunk size, so voice segments the world gracefully).
- Beyond audible range the sender stops encoding audio for that peer entirely — mic upload scales with *nearby* players, not room size.
- Plugins can reshape this (global announcer voice, per-peer gain, speaking indicators) — see [Proximity Voice](40-proximity-voice.md).

---

## Notable behaviors

- **Rooms are per-page by default**: the room id is derived from the page's hostname and slug, so publishing the same world at two URLs creates two rooms. Use `roomslug` to pin a specific room name.
- **Avatars and names**: players appear as VRM avatars with display names; profile info re-announces to late joiners automatically. With `customavatars="1"` users can paste a VRM URL in the controls.
- **Attribute casing**: like all blocks, camelCase spellings (`participantLimit`) and lowercase (`participantlimit`) both work; lowercase is canonical.
- **World time is room-synced**: any client setting the time of day broadcasts it; the first participant acts as the time authority for late joiners. See [Time of Day](38-time-of-day.md).
- **Vehicles sync through the same channel** — see [Rideable Block](11-rideable-block.md).
- **The control cluster renders even without this block** (it hosts the "More" menu and VR entry); the networking-specific controls appear only when the block exists.

---

## Next steps

- Peer messaging, presence, and events from plugin code: [Networking Plugins](39-networking-plugins.md)
- Voice configuration and overrides: [Proximity Voice](40-proximity-voice.md)
- Persistent shared world state: [World State](41-world-state.md)
- Player identity and tokens: [World Identity and Tokens](43-world-identity-and-tokens.md)

# Networking for Plugins

XR Publisher worlds with a `<three-networking-block>` are multiplayer: players in the same room see each other's avatars, hear each other's voices, and share one world. On top of that the engine exposes a small **plugin networking surface** — named broadcast channels, peer positions, and join/leave events — so plugins can coordinate their own state across the room: synced audio transport, shared game state, pings, toasts, leader election.

The rule of thumb: these channels are for **low-rate, small JSON state only**. Never send audio or asset bytes over them — every peer loads assets from their own URLs and syncs only the tiny state needed to agree (e.g. "playing since epoch T", not the song itself).

[SCREENSHOT: two browser windows in the same room, one firing a ping flare the other window can see]

---

## API reference

All methods live on `XRPublisher` (static, and on `window.XRPublisher` for script-tag plugins).

| Method | Type | Description |
|---|---|---|
| `broadcast(channel, data)` | `(string, any) => void` | Send a small JSON-serializable message to **all** connected peers on a named channel. Does not echo back to the sender. Refuses reserved `__xrp:*` channels (warns and returns). Silently no-ops when not connected. |
| `onMessage(channel, cb)` | `(string, (peerId, data) => void) => () => void` | Subscribe to a channel. `cb` receives the sender's client id and the parsed data. Returns an **unsubscribe function** — call it on teardown. |
| `getClientId()` | `() => string \| null` | This player's **session** client id — the same id peers see in `onMessage`/`getPeers()`. Regenerated every page load; `null` before (or without) a room connection. |
| `isConnected()` | `() => boolean` | `true` once networking has connected and handed out a client id. **The correct gate for multiplayer features.** |
| `getPlayerId()` | `() => string` | A **stable per-visitor** id persisted in localStorage — survives reloads, exists with or without networking. The right key for player-owned persisted records. Not an account, not authorization. |
| `getPeers()` | `() => [{ id, x, y, z }]` | Last-known world positions of every **remote** participant. Empty array when solo. The local player is not included — use [`getPlayerState()`](42-player-scene-audio.md). |
| `onPeerJoin(cb)` | `((peerId) => void) => () => void` | Fires when a remote peer connects. Returns an unsubscribe function. |
| `onPeerLeave(cb)` | `((peerId) => void) => () => void` | Fires when a remote peer disconnects. Returns an unsubscribe function. |

All peer ids are **client ids** — `getPeers()`, `onMessage`, `onPeerJoin`/`onPeerLeave`, and the voice APIs ([Proximity voice](40-proximity-voice.md)) all use the same id space, so you can correlate freely across them.

### Player identity: `getPlayerId()` vs `getClientId()`

Two different ids, for two different jobs — mixing them up is the single most common networking bug in third-party plugins:

| | `getClientId()` | `getPlayerId()` |
|---|---|---|
| Scope | one page load, one room session | one browser, across reloads |
| Without networking | `null` | still returns an id |
| Use for | addressing peers, leader election, per-session bookkeeping | **persisted ownership** — a claimed plot, a personal best, an inventory |

Key anything that must survive a reload off `getPlayerId()`:

```js
const KEY = `plot-${spawn.seed}-${XRPublisher.getPlayerId()}`;
```

Keying it off `getClientId()` instead means the player loses their own build the moment they refresh — and because it's `null` in a world with no networking block, every solo visitor falls back to whatever constant the plugin picked (`'local'`) and they all write to the *same* record, overwriting strangers' state.

Neither id is an account and neither authorizes anything. `getPlayerId()` lives in localStorage: anyone can clear or forge it. Treat it as "whose stuff is this, probably" — the same honor-system trust level as the rest of [world state](41-world-state.md).

### About `getPeers()` positions

Positions update as state packets arrive. The engine sends position state **per peer at distance-tiered rates** — near peers refresh on effectively every packet, far peers at a few Hz. That's ideal for effects (auras, indicators, beacons) and coarse proximity logic; it is not a physics-grade feed for a distant peer.

### Reserved channels

Every channel starting with `__xrp:` is reserved for the engine (world-state sync, room time sync, and future internals). `broadcast()` refuses them with a console warning — use the matching public API instead ([`setWorldState`](41-world-state.md), [`setTimeOfDay`](38-time-of-day.md)). Pick plain, plugin-prefixed channel names like `'mpdemo-ping'`.

---

## Availability and graceful degradation

The plugin networking surface only carries traffic when the world has a `<three-networking-block>` **and** the player has joined the room. Before/without that:

- `isConnected()` returns `false`
- `getClientId()` returns `null`
- `getPeers()` returns `[]`
- `broadcast()` is a silent no-op
- `onMessage`/`onPeerJoin`/`onPeerLeave` register fine but never fire

Design plugins so the solo experience still works — treat multiplayer as an enhancement, and gate it on **`isConnected()`**:

```js
const XRP = window.XRPublisher;
if (XRP.isConnected()) {
  XRP.broadcast('mpdemo-ping', {});     // only meaningful in a room
}
// Solo player: everything local still runs.
```

> **`typeof XRP.broadcast === 'function'` is not a connection check.** The method always exists — in every world, networking block or not — so that test is always `true`. The same goes for `onPeerJoin`, `onMessage`, and the rest: they're presence tests for the *API*, useful only for engine-version detection, never for "am I in a room". Use `isConnected()` for that.

Also note the player can join a room **after** your plugin initializes. Don't cache `getClientId()` (or an `isConnected()` result) once at startup and assume it stays that way — re-read it when you need it (or on the first `onPeerJoin`).

---

## Pattern: join/leave toasts and speaking rings

From the `multiplayer-demo` plugin ([full example](66-example-multiplayer-demo.md)) — the engine fires join/leave for you, so no more hand-rolled "last heard from" liveness windows:

```js
XRP.onPeerJoin((id) => toast(`👋 ${id.slice(0, 6)} joined`));
XRP.onPeerLeave((id) => {
  toast(`💨 ${id.slice(0, 6)} left`);
  dropRing(id);                    // per-peer cleanup goes here
});

// Per frame: a speaking ring above whoever is talking.
for (const p of XRP.getPeers()) {
  const level = XRP.getPeerAudioLevel(p.id);   // pre-falloff RMS, 0..1
  ring(p.id).visible = level > 0.05;
  if (level > 0.05) ring(p.id).position.set(p.x, p.y + 2.25, p.z);
}
```

---

## Pattern: ping flares (derive positions, don't send them)

Broadcast messages should carry only what the receiver *can't* derive. The receiver already knows every peer's position via `getPeers()` — so a "ping my location" message is empty; the receiver looks the **sender** up by its `peerId`:

```js
const CH_PING = 'mpdemo-ping';

XRP.onMessage(CH_PING, (peerId) => {
  const peer = XRP.getPeers().find((p) => p.id === peerId);
  if (peer) spawnFlare(peer.x, peer.y, peer.z);
});

// Sender side — broadcast excludes self, so echo the flare locally:
XRP.broadcast(CH_PING, {});
const me = XRP.getPlayerState();
if (me) spawnFlare(me.x, me.y, me.z);
```

---

## Pattern: leader election + shared-epoch sync

For anything the room must agree on continuously (a synced music transport, a shared game clock), the `resonance-stage` plugin ([full example](67-example-resonance-stage.md)) uses a robust three-part pattern:

1. **Liveness by heartbeat** — every client broadcasts a tiny `{ t: 'hb', id }` once per second and remembers when it last heard each peer. Peers silent for ~4s are dropped from the "alive" set. (`onPeerJoin`/`onPeerLeave` cover connect/disconnect; the heartbeat additionally covers peers whose plugin isn't running.)
2. **Leader = lowest client id** among alive peers (including yourself). Deterministic, no negotiation, self-heals when the leader leaves:

```js
const peers = new Map();                    // id -> last heartbeat time
const aliveIds = () => {
  const cutoff = Date.now() - 4000, ids = [];
  for (const [id, t] of peers) { if (t >= cutoff) ids.push(id); else peers.delete(id); }
  if (clientId) ids.push(clientId);
  return ids;
};
const isLeader = () => {
  if (!clientId) return true;               // solo: you're the leader
  let min = clientId;
  for (const id of aliveIds()) if (id < min) min = id;
  return min === clientId;
};
```

3. **Shared epoch, keyframed** — the synced thing is expressed as one wall-clock number (`epoch` = the ms timestamp of the 0:00 downbeat in the leader's frame). Everyone derives their position from it: `pos = (now + clockOffset - epoch) % duration`. The leader re-broadcasts the full state every ~2.5s so **late joiners and drift self-heal within one keyframe** — the same principle the engine's own networking uses. Non-leaders estimate `clockOffset` with occasional ping/pong round-trips (offset ≈ `t1 + rtt/2 - t2`, keeping the lowest-RTT sample).

State messages are **last-write-wins**: any client can press play/stop and broadcast; the leader adopts what it hears and re-heartbeats it, so the room converges even after races.

---

## Next steps

- [Proximity voice](40-proximity-voice.md) — distance-attenuated voice, overrides, and the megaphone pattern
- [Persisted world state](41-world-state.md) — state that survives reloads and is shared across visitors
- [Player, scene and audio access](42-player-scene-audio.md) — `getPlayerState()`, audio analysis, scene access
- [Example: multiplayer demo](66-example-multiplayer-demo.md) — the full API tour plugin
- [Example: resonance stage](67-example-resonance-stage.md) — leader-elected synced concert

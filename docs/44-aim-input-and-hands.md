# Third-Person Aim, Continuous Input & Avatar Attachment

The engine's default view is **third person**: the camera orbits behind the
avatar, mouse-look steers the camera, and the avatar body only turns to follow
the camera **while moving**. Any mechanic where the player aims at the world —
spraying, throwing, painting, placing, shooting — must be built against that
reality. This page covers the three building blocks: the world cursor (aim),
DIY continuous input (hold-to-act), and attaching objects to the avatar
(view-models, held tools).

The reference implementation for all three working together is the
[Power Washing example](71-example-power-washing.md).

## Aim: the world cursor

The engine maintains a **world cursor** — the reticle you see in third person.
It raycasts from the camera (with a shoulder offset) along camera-forward at
~30Hz against NPCs, rideables, and plain scene meshes. Plugins read it with:

```js
const cs = XRPublisher.getCursorState();
// → { position: [x,y,z], normal: [x,y,z], visible: boolean } | null
```

- `position` is the current **aim point in world space**: the surface hit when
  the ray hits something in range, otherwise a free point at the cursor's
  default distance (~8u). This is the point the player *means*.
- `normal` is the hit face normal (world up when free).
- `visible` is `false` while the player is moving — the cursor **visual**
  hides, but position/normal keep updating. Aim-driven mechanics should use
  `position` regardless of `visible`.
- Returns `null` before the cursor mounts — guard and retry.

Your plugin's meshes are automatically part of the cursor's raycast targets as
long as they are plain non-skinned `Mesh`es whose names don't contain
`NPC/Avatar/Player/Character/VRM`, and don't set
`userData.camExcludeCollision`.

**The aim recipe.** Don't re-derive a camera ray — combine the cursor point
with the avatar's hand and run your own short raycast for the surface detail
you need (UV, exact face):

```js
// hand → cursor jet: the water/projectile physically travels this segment
DIR.copy(cursorPoint).sub(handPos);
const dist = DIR.length();
DIR.multiplyScalar(1 / dist);
raycaster.set(handPos, DIR);
raycaster.far = dist + 0.75;      // capped just past the cursor —
                                   // can't affect surfaces the stream never reaches
const hits = raycaster.intersectObjects(myTargets, false);
// hits[0].uv → exact texel for localized surface effects
```

## Posing the avatar toward the aim (GTA-style)

By default the avatar body only turns while moving, and the arms play the
idle animation — a character can spray sideways without looking at the
target. `setAimTarget` fixes that:

```js
// every frame while the tool is in use:
XRPublisher.setAimTarget([tx, ty, tz]);   // usually getCursorState().position
// on release:
XRPublisher.setAimTarget(null);
```

While the target is refreshed every frame (it ages out after 0.5s, so a
crashed plugin can't wedge the pose), the engine poses the **local** avatar
after the animation mixer runs: the idle body yaw eases toward the target,
the right arm raises to point at it (left arm takes a partial correction —
reads as bracing the tool), and the arm direction is **clamped into a cone
around body forward** with pitch limits, so arms can never bend backward —
off-cone targets track to the cone edge while the body turn closes the rest.
Release eases back to the animation smoothly. The pose is suppressed while
riding, flying, or swimming.

Movement changes with it: while a target is active, **A/D strafe and S
backpedals** — the body stays locked on the target instead of rotating to
face the movement direction (the character controller already translates
camera-relative, so only the body-facing rule changes). This is what makes
firing-while-moving mechanics read correctly: the character keeps pointing
the tool at the target while sidestepping.

**Camera access (fallback only).** The camera is **not in the scene graph**
and there is no `getCamera()`. The camera-mounted `AudioListener`
(`getAudioListener()`) tracks the camera pose — `getWorldPosition()` +
`getWorldDirection().negate()` reconstructs a first-person aim ray. Use it
only as a fallback when `getCursorState()` is unavailable; in third person a
raw camera ray aims *past the avatar's shoulder*, which is why the cursor
exists. Never parent objects to the camera or the listener — they won't
render.

**VR** has its own first-class input path (WebGL/XR render branch only):

- `isPresenting()` — true while a WebXR session is live.
- `getControllerState('left'|'right')` — world-space controller pose
  (`position`, `quaternion`, `direction` = the -Z aim ray) plus `trigger` and
  `squeeze` values (0..1). Hand-tracking sources set `hand:true` and report
  pinch as `trigger`. Aim VR tools down `direction` with your own Raycaster
  instead of the cursor (which follows head gaze in VR).
- **Squeeze (grip) is the VR "E"**: the engine fires the active proximity
  interactable on squeeze and shows an in-world billboard prompt above it
  (the DOM banner is invisible in a headset). Bind your tool's continuous
  action to `trigger` and never double-bind squeeze.
- DOM HUDs don't exist in VR — put live meters on the tool itself (an
  emissive bar mesh) or use dialogs (ray-clickable).

## Continuous input (hold-to-act)

There is no engine input API. Discrete actions get the **E key** for free via
[interactables](33-interactables.md); anything continuous (hold to spray,
charge, drag) is DIY DOM listeners:

```js
const onDown = (ev) => { if (ev.button === 0) active = true; };
const onUp   = (ev) => { if (ev.button === 0) active = false; };
const isTyping = (ev) => {
  const t = ev.target;
  return !!t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
};
const onKeyDown = (ev) => { if (ev.code === 'KeyG' && !isTyping(ev)) active = true; };
const onKeyUp   = (ev) => { if (ev.code === 'KeyG') active = false; };
```

- Pointer lock is engine-managed; button events still fire while locked (aim
  is the reticle, not the pointer coordinates).
- Always guard key handlers with the `isTyping` check — chat exists.
- Always pair a key binding with a mouse button so both input styles work.

## Keys the engine owns

The engine binds these on `window`, and its handlers only bail out inside an
`INPUT` or `TEXTAREA`. **Nothing stops a plugin from binding the same key** —
both handlers simply run, so a plugin binding a reserved key fires the engine
action too, on every single use.

| Key | Engine action |
|---|---|
| `W` `A` `S` `D` | Movement |
| `Space` | Jump (debounced ~100ms) |
| `Shift` | Run |
| `F` | **Toggle fly mode** |
| `R` | Respawn (ignored with Ctrl/Cmd, so browser reload still works) |
| `E` | Interact — [interactables](33-interactables.md), NPC chat, mounting a [rideable](11-rideable-block.md) |
| `Escape` | Close dialogs / menus (and release pointer lock, per the browser) |

**`F` is the one that has actually broken plugins.** A plugin using `F` as its
action key launches the player into fly mode on every press — and flying
disables terrain colliders (the engine skips collider cooking at altitude), so
[`getGroundHeight`](31-terrain-queries.md#getgroundheightx-z--number--null)
starts returning `null` and anything seated against the ground quietly stops
placing.

**Safe alternatives**: `Q`, `G`, `C`, `V`, `B`, `T`, `Z`, `X`, and the number
row are all unbound. `R` is also worth avoiding even though it's "just"
respawn — teleporting the player mid-action is not a small side effect.

Two more rules:

- Guard every handler with the `isTyping` check above. The engine's own guard
  doesn't cover `contentEditable`, and yours should.
- **VR: squeeze (grip) is reserved** — it fires the active proximity
  interactable, the headset equivalent of `E`. Bind continuous VR actions to
  `trigger` instead (see the VR bullets above) and never double-bind squeeze.

**The equip-mode loop.** Tie continuous mechanics to an explicit mode entered
via an interactable ("Equip pressure washer" / "Put away"), and run ONE
plugin-owned `requestAnimationFrame` loop that exists only while the mode is
active:

```js
const frame = (now) => {
  rafId = requestAnimationFrame(frame);
  if (now - last < 14) return;          // ~60Hz cap (120Hz displays double-run)
  last = now;
  if (document.hidden) return;
  // 1Hz leash: auto-exit the mode if the player walked away
  // aim + act + effects here — allocation-free, module scratch vectors
};
// equip(): add listeners, start the loop.  unequip(): remove, cancel, hide.
```

Never stack per-feature rAFs, and never leave the loop running with the mode
off. Register the listeners on equip and remove them on unequip so the plugin
is inert when unused.

## Attaching objects to the avatar (hands, held tools)

The avatar is `getPlayer()` (the `playerOne` Object3D — body position + yaw).
**Do not parent tools into its skeleton**: avatars hot-swap, and rigs differ.
The shipped pattern (music-visualizer, power-washing) is **chase the bone's
world position each frame** from your rAF/update loop:

```js
let rig = null, rigTries = 0;
const resolveHand = () => {
  if (rig && !rig.right.parent) rig = null;      // avatar swapped — re-resolve
  if (rig) return;
  const player = XRPublisher.getPlayer();
  if (!player || rigTries++ % 30 !== 0) return;  // retry cheaply until it loads
  let vrm = player.userData?.vrm;
  if (!vrm) player.traverse((o) => { if (!vrm && o.userData?.vrm) vrm = o.userData.vrm; });
  const r = vrm?.humanoid?.getNormalizedBoneNode?.('rightHand');
  if (r) { rig = { right: r }; return; }
  // name-scan fallback for non-VRM rigs — exclude finger bones:
  player.traverse((o) => {
    const n = (o.name || '').toLowerCase();
    if (!n.includes('hand') || /thumb|index|middle|ring|pinky|finger|proximal|intermediate|distal|metacarpal/.test(n)) return;
    if (!rig && n.includes('right')) rig = { right: o };
  });
};
// per frame: rig ? rig.right.getWorldPosition(TIP) : bodyRelativeFallback(TIP)
```

The held tool itself is added to `getScene()` once, positioned at the hand's
world position each frame, and oriented with `lookAt(aimPoint)` — so the tool
points where the player aims even when the idle avatar body faces elsewhere
(the engine only turns the body toward the camera while moving).

Body-relative fallback (no bones yet): `getPlayerState()` position + the
player's world quaternion, offset ±0.35u sideways at +1.0u height.

## Putting it together

A complete aim-driven mechanic is: **interactable to enter the mode → one rAF
→ cursor point as the target → hand as the source → your own raycast between
them → localized effect at the hit → HUD meter → per-object
[world-state](41-world-state.md) record.** Every piece is demonstrated, with
the full file, in [71 — Power Washing](71-example-power-washing.md); particle
and render-order recipes for the visible effect are in
[45 — Effect Particles & Render Ordering](45-effects-and-render-order.md).

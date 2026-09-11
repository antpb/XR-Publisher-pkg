# Menu Items (the "More" menu)

`XRPublisher.registerMenuItem` adds a row to the hamburger **"More" menu** in the top-left control cluster — the sanctioned home for global plugin actions: teleport shortcuts, toggles, "start the show". Putting actions behind the menu keeps the HUD from growing an unbounded row of buttons, and gives VR users one overlay to target.

```js
XRPublisher.registerMenuItem({
  id: 'reset-world',
  label: 'Reset',
  icon: '↻',                        // emoji/text glyph, or an http(s) image URL
  onSelect: () => location.reload(),
});
// later:
XRPublisher.unregisterMenuItem('reset-world');
```

[SCREENSHOT: the open hamburger menu showing plugin rows above the built-in Enter VR item]

---

## API

### `registerMenuItem(item)`

| Field | Type | Default | Description |
|---|---|---|---|
| `id` | `string` | *(required)* | Stable unique id. Registering the same id again **replaces** the row — the standard way to update a label live. |
| `label` | `string` | *(required)* | Row text. |
| `icon` | `string` | none | A short emoji/text glyph (`'🌙'`, `'↻'`) **or** an `http(s)` image URL, rendered as a small image. |
| `order` | `number` | `0` | Sort key, ascending; ties break by registration order. The engine's built-in Enter VR item sits at order `100`, so plugin items default to sorting above it. |
| `onSelect` | `() => void` | *(required)* | Fired when the row is clicked. The menu closes first. Throws are caught per-item. |

### `unregisterMenuItem(id)`

Removes the row. No-op for unknown ids.

Both are available as static and instance methods, and on `window.XRPublisher` for script-tag plugins.

---

## Behavior

- **Live registration.** Safe to call before or after world init — the menu re-renders immediately. Late registration is the normal path for script-tag plugins.
- **Replace-to-update.** Re-registering the same `id` swaps the row in place. A toggle updates its own label by re-registering itself from `onSelect`:

```js
// Adapted from examples/decorations/custom-menu-item.
let torchesOn = false;
function registerTorchToggle() {
  XRPublisher.registerMenuItem({
    id: 'toggle-torches',
    label: torchesOn ? 'Torches: on' : 'Torches: off',
    icon: torchesOn ? '🔥' : '🕯️',
    order: 10,
    onSelect: () => {
      torchesOn = !torchesOn;
      registerTorchToggle();       // replace the row with the new label
      // ...apply the actual toggle...
    },
  });
}
registerTorchToggle();
```

- **The menu exists in every world** — with or without a networking block. If there is neither networking nor any menu item, the whole left overlay hides itself.
- **Reserved id: `'enter-vr'`.** The engine registers its built-in "Enter VR" item under this id (order `100`) and renders it with the VR glasses icon. Don't reuse the id.

---

## Room-wide actions

Menu items are a natural trigger for **room-synced** effects. The resonance-stage concert plugin registers a "Night show" row that jumps the shared world clock for everyone in the room:

```js
// Adapted from the resonance-stage plugin.
XRPublisher.registerMenuItem({
  id: 'night-show',
  label: 'Night show (whole room)',
  icon: '🌙',
  order: 6,
  onSelect: () => {
    const { time } = XRPublisher.getTimeOfDay();
    const isNight = time >= 20 || time < 5.5;
    // setTimeOfDay(hour, false) = jump the SHARED clock, keep it running —
    // broadcasts to every participant. See Time of day.
    XRPublisher.setTimeOfDay(isNight ? 12 : 21.5, false);
  },
});
```

Anyone can press it; gate on `XRPublisher.isTimeAuthority()` inside `onSelect` if you want the action admin-only.

---

## Next steps

- [Time of day](38-time-of-day.md) — the room-synced clock the example above drives.
- [HUD overlays](34-hud-overlays.md) — persistent 2D readouts (the menu is for actions, the HUD for state).
- [In-world dialogs](35-in-world-dialogs.md) — confirmations and flows a menu action can open.
- Worked examples: [resonance stage](67-example-resonance-stage.md) ("Night show" + teleport rows).

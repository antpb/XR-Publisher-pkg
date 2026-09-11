# HUD Overlays

`XRPublisher.registerHud` mounts a plugin-built DOM element into a fixed overlay above the 3D canvas — the sanctioned way to draw 2D flat-screen UI over the world: a collection counter, a discovery log, a status readout.

The contract is deliberately minimal: **you build the DOM node, you own it, you update it imperatively** (`el.textContent = …`). No React, no store, no re-render coupling — the engine just parents the node into a corner slot and removes it when you unregister.

```js
const el = document.createElement('div');
el.textContent = '0 apples';
XRPublisher.registerHud('apple-counter', el, 'top-right');

// later, whenever the count changes:
el.textContent = `${count} apples`;

// on teardown:
XRPublisher.unregisterHud('apple-counter');
```

[SCREENSHOT: a basket counter panel in the top-right corner over a live world]

---

## API

### `registerHud(id, el, anchor?)`

| Parameter | Type | Default | Description |
|---|---|---|---|
| `id` | `string` | *(required)* | Unique id. Registering the same id again **replaces** the previous node. Pass it to `unregisterHud`. |
| `el` | `HTMLElement` | *(required)* | Your DOM node. You style it and update it; the engine only positions it. |
| `anchor` | `HudAnchor` | `'top-right'` | Which screen slot to mount into. |

### `unregisterHud(id)`

Removes the node from the overlay. No-op if the id isn't registered.

Both are available as static and instance methods on `XRPublisher`, and on `window.XRPublisher` for script-tag plugins.

### Anchors

`HudAnchor` is one of six slots:

| Anchor | Placement |
|---|---|
| `'top-left'` | 16px from the top-left corner |
| `'top-center'` | 16px from the top, horizontally centred |
| `'top-right'` | 16px from the top-right corner |
| `'bottom-left'` | 16px from the bottom-left corner |
| `'bottom-center'` | 110px from the bottom, horizontally centred — raised to clear the mobile touch controls |
| `'bottom-right'` | 16px from the bottom-right corner |

Multiple HUD nodes in the same slot stack vertically with an 8px gap, in registration order.

---

## Behavior and layering

- **Z-order**: the overlay sits *above* the 3D canvas and *below* the engine's own controls and modal UI (the top-left control cluster, dialogs, chat). Your HUD never covers engine chrome.
- **Pointer events**: the overlay never intercepts input by default, so the world stays clickable through it. If your node needs clicks, opt in explicitly: `el.style.pointerEvents = 'auto'`.
- **Updates are yours**: mutate the node directly whenever your state changes (from `onInteract`, a timer, a network message). There is no render loop to hook into and none is needed.

```js
// A styled panel, apple-trees style — the engine adds no styling of its own.
const hud = document.createElement('div');
Object.assign(hud.style, {
  padding: '8px 14px',
  background: 'rgba(15,15,20,0.82)',
  color: '#f5f5f7',
  border: '1px solid rgba(255,255,255,0.18)',
  borderRadius: '10px',
  font: '600 15px system-ui, sans-serif',
});
const render = () => { hud.textContent = `🧺 ${basket.red} 🍎  ${basket.golden} ✨`; };
render();
XRPublisher.registerHud('my-plugin-basket', hud, 'top-right');
```

---

## Flatscreen only — VR users can't see it

A DOM overlay does not exist inside a VR headset. If your plugin has VR-facing UI — instructions, choices, results — use the [in-world dialog](35-in-world-dialogs.md) (a 3D panel clickable by controller ray) or build a 3D object. The common split, used by the apple-trees and summit-totems examples:

- **HUD** for the ambient, glanceable state (counters, logs) on desktop/mobile.
- **Dialog** for anything the player must read or answer, which works everywhere.

---

## Next steps

- [In-world dialogs](35-in-world-dialogs.md) — the VR-visible counterpart for modal UI.
- [Menu items](36-menu-items.md) — add actions to the hamburger "More" menu instead of floating buttons.
- [Interactables](33-interactables.md) — the "Press E" channel that usually feeds a HUD counter.
- Worked examples: [apple trees](55-example-apple-trees.md) (basket panel), [summit totems](56-example-summit-totems.md) (discovery log).

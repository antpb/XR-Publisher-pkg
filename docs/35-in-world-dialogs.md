# In-World Dialogs

`XRPublisher.openDialog` opens a modal panel **inside the world** — a rounded 3D panel with a title, body text, and action buttons, floated in front of the player. Because it's a real world object rather than a DOM overlay, it works everywhere: buttons are clickable by mouse, by the centre-screen reticle (look at a button and click), and by VR controller ray. This is the engine's building block for narrative beats, quizzes, shops, confirmations, and loot reveals.

```js
XRPublisher.openDialog({
  title: 'A glowing orb',
  content: 'It hums with a soft light. Touch it?',
  buttons: [
    { label: 'Touch', variant: 'primary', onSelect: () => score++ },
    { label: 'Leave' },                    // no onSelect → just closes
  ],
});
```

[SCREENSHOT: a dialog panel floating at head height in front of the avatar, with two buttons]

---

## API

### `openDialog(spec)`

One dialog exists at a time — opening a new one **replaces** the current dialog (its `onClose` fires with reason `'replaced'`).

| Field | Type | Default | Description |
|---|---|---|---|
| `title` | `string` | none | Heading text. |
| `content` | `string` | none | Body text. Wraps to the panel width; very long content is capped (see sizing below). |
| `buttons` | `DialogButton[]` | none | Action row along the bottom. A dialog with no buttons closes via Escape, `closeDialog()`, or walking away. |
| `width` | `number` | `1.9` | Panel width in world metres. Height is computed from content. |
| `dismissDistance` | `number` | `7` | Auto-close once the player is this far (world metres) from where the dialog opened. Fires `onClose` with `'dismissed'`. |
| `onClose` | `(reason) => void` | none | Called whenever the dialog closes, with **why** (see close reasons). |

### `DialogButton`

| Field | Type | Default | Description |
|---|---|---|---|
| `label` | `string` | *(required)* | Button text. |
| `onSelect` | `() => void` | none | Fired on click. Omit for a plain "close" button. |
| `keepOpen` | `boolean` | `false` | Keep the dialog open after this button. Use for quiz "wrong — try again" retries and multi-step flows. |
| `variant` | `'primary' \| 'default'` | `'default'` | `'primary'` gets the accent fill. |

### `closeDialog()`

Closes the current dialog (no-op if none is open). Fires `onClose` with reason `'manual'`.

Both are available as static and instance methods, and on `window.XRPublisher` for script-tag plugins.

---

## Close reasons and the removed event

Every close fires the spec's `onClose(reason)` **and** a `window` event so code far from the spec can react:

```js
window.addEventListener('xrpublisher:dialogremoved', (e) => {
  if (e.detail.reason === 'dismissed') resetQuiz();  // walked away mid-quiz
});
```

| Reason | Meaning |
|---|---|
| `'button'` | A button without `keepOpen` was clicked. |
| `'escape'` | The player pressed Escape. |
| `'dismissed'` | The player walked past `dismissDistance` from where the dialog opened. |
| `'replaced'` | A new `openDialog` replaced this one. |
| `'manual'` | `closeDialog()` was called. |

Use `'dismissed'`/`'escape'` to reset quiz or narrative state that a completed flow would have cleared.

---

## Chaining dialogs — branching conversations

Opening a dialog **from a button's `onSelect`** replaces the current panel with the next one — that's how you build multi-layer conversations and quizzes. The floating-orbs example builds its whole personality system this way:

```js
// Adapted from the floating-orbs plugin.
function talkTo(orb) {
  XRPublisher.openDialog({
    title: `${orb.name} flares`,
    content: '"Someone must remember warmth after the fires go out. So I burn. Quietly. On."',
    buttons: [
      {
        label: '"And when the last fire dies?"',
        onSelect: () => XRPublisher.openDialog({        // ← chain: next layer
          title: `${orb.name} bends low`,
          content: '"Then I will be the last fire. Unless someone shields it when the wind comes."',
          buttons: [
            { label: 'Cup your hands around the flame', variant: 'primary', onSelect: () => befriend(orb) },
            { label: 'Let it gutter' },
          ],
        }),
      },
      { label: 'Step back from the heat' },
    ],
  });
}
```

For a **retry loop** (quizzes), mark the wrong answers `keepOpen: true` — the same panel stays up and the player simply picks again; only the right answer chains onward:

```js
XRPublisher.openDialog({
  title: 'The riddle',
  content: '"I follow you all day, and drown at dusk. What am I?"',
  buttons: [
    { label: 'A river',  keepOpen: true, onSelect: () => flashWrong() },
    { label: 'A shadow', variant: 'primary', onSelect: () => reward() },
    { label: 'Give up' },
  ],
});
```

---

## Placement and input

- **Avatar-anchored, set once.** The panel is placed 2 m in front of the avatar at roughly head height (1.4 m), yawed to face the avatar — then **held**. It does not billboard or follow; it behaves like an object in the world. Walking beyond `dismissDistance` auto-closes it.
- **Desktop**: the centre-screen reticle stays live while the dialog is open — aim it at a button and click. Pointer lock is left engaged so aiming keeps working. Escape closes.
- **VR**: buttons are ordinary meshes hit by the controller ray — point and trigger.
- **The "Press E" prompt is suppressed** while a dialog is open, so E can't re-fire the interactable behind the modal.
- The panel renders with normal depth as an opaque object at head height — it layers correctly with the world (it can be occluded by geometry between you and it, like anything else).

---

## Content-aware sizing

Panel height grows with the estimated wrapped-line count of the title and content, clamped between **0.62 m and 2.6 m**. Text wraps to the panel's inner width, so long content grows the panel rather than spilling — but past the maximum height, very long content clips. Treat the cap as a signal: split long text across chained dialogs instead of one wall of prose.

---

## Next steps

- [Interactables](33-interactables.md) — "Press E" is the usual trigger for a dialog.
- [HUD overlays](34-hud-overlays.md) — flatscreen counters/logs to pair with dialog flows.
- [Menu items](36-menu-items.md) — global actions that don't need proximity.
- Worked examples: [floating orbs](58-example-floating-orbs.md) (branching conversations, riddle retry loops), [summit totems](56-example-summit-totems.md), [ancient ruins](63-example-ancient-ruins.md).

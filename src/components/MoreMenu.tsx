import React, { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { FC, ReactElement } from 'react';
import { ChevronLeft, Glasses, Menu, Settings } from 'lucide-react';
import {
  subscribeMenu,
  getMenuItems,
  VR_MENU_ITEM_ID,
  type MenuItemSpec,
} from '../decorations/pluginMenu';
import { SHOW_CONTROLS_HINT_EVENT } from './ControlsHint';

/**
 * MoreMenu — the HUD hamburger. A single toggle button that reveals a
 * dropdown of engine + plugin actions (registered via the `pluginMenu`
 * registry, e.g. `XRPublisher.registerMenuItem`).
 *
 * It lives inside the left control cluster (rendered by NetworkingControls)
 * so users target it with the same overlay they use for voice/participants,
 * and so accident-prone actions like "Enter VR" sit behind a deliberate
 * toggle instead of a bare, always-clickable button. Renders nothing when
 * no items are registered.
 */

/* Visual tokens — kept in sync with NetworkingControls' overlay look. */
const OVERLAY_BG = 'rgba(15, 15, 20, 0.82)';
const BORDER_COLOR = 'rgba(255, 255, 255, 0.18)';
const TEXT = '#f5f5f7';

const iconButtonStyle: React.CSSProperties = {
  pointerEvents: 'auto',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: 10,
  borderRadius: 10,
  background: OVERLAY_BG,
  border: `1px solid ${BORDER_COLOR}`,
  color: TEXT,
  font: 'inherit',
  fontSize: 13,
  fontWeight: 500,
  cursor: 'pointer',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  transition: 'background 120ms ease, transform 120ms ease',
};

const dropdownStyle: React.CSSProperties = {
  pointerEvents: 'auto',
  position: 'absolute',
  top: 48,
  left: 0,
  minWidth: 200,
  maxHeight: 360,
  overflowY: 'auto',
  padding: 6,
  borderRadius: 10,
  background: OVERLAY_BG,
  border: `1px solid ${BORDER_COLOR}`,
  color: TEXT,
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  fontSize: 13,
  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
  zIndex: 1,
};

const rowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  width: '100%',
  padding: '8px 10px',
  borderRadius: 6,
  background: 'transparent',
  border: 'none',
  color: TEXT,
  font: 'inherit',
  fontSize: 13,
  fontWeight: 500,
  textAlign: 'left',
  cursor: 'pointer',
};

/* ── Settings view ─────────────────────────────────────────────────────
 * Surfaces the engine's boot-time query params (?renderer, ?fps, ?shadows)
 * as a UI. They're read once at startup, so applying a choice rewrites the
 * URL params and reloads — the room hash and all other params survive. */

type SettingDef = {
  key: string;
  label: string;
  options: { value: string | null; label: string }[];
};

const SETTINGS: SettingDef[] = [
  {
    key: 'renderer',
    label: 'Renderer',
    options: [
      { value: null, label: 'Auto' },
      { value: 'webgpu', label: 'WebGPU' },
      { value: 'webgl', label: 'WebGL' },
    ],
  },
  {
    key: 'fps',
    label: 'Frame cap',
    options: [
      { value: '30', label: '30' },
      { value: null, label: '60' },
      { value: 'native', label: 'Uncapped' },
    ],
  },
  {
    key: 'shadows',
    label: 'Shadows',
    options: [
      { value: null, label: 'Standard' },
      { value: 'vsm', label: 'Soft (VSM)' },
    ],
  },
];

function currentParam(key: string): string | null {
  return new URLSearchParams(window.location.search).get(key);
}

function applyParam(key: string, value: string | null): void {
  const url = new URL(window.location.href);
  if (value === null) url.searchParams.delete(key);
  else url.searchParams.set(key, value);
  window.location.href = url.toString();
}

const segmentGroupStyle: React.CSSProperties = {
  display: 'flex',
  gap: 4,
  padding: 2,
  borderRadius: 8,
  background: 'rgba(255, 255, 255, 0.06)',
};

const segmentStyle = (active: boolean): React.CSSProperties => ({
  flex: 1,
  padding: '5px 8px',
  borderRadius: 6,
  border: 'none',
  background: active ? 'rgba(255, 255, 255, 0.18)' : 'transparent',
  color: TEXT,
  font: 'inherit',
  fontSize: 12,
  fontWeight: active ? 600 : 500,
  cursor: active ? 'default' : 'pointer',
  whiteSpace: 'nowrap',
});

const SettingsView: FC<{ onBack: () => void; onShowControls: () => void }> = ({
  onBack,
  onShowControls,
}) => (
  <>
    <button type="button" onClick={onBack} style={{ ...rowStyle, opacity: 0.85 }}>
      <ChevronLeft size={16} strokeWidth={2} />
      <span>Back</span>
    </button>
    {SETTINGS.map((setting) => {
      const current = currentParam(setting.key);
      return (
        <div key={setting.key} style={{ padding: '6px 10px' }}>
          <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 5 }}>{setting.label}</div>
          <div style={segmentGroupStyle}>
            {setting.options.map((opt) => {
              const active = current === opt.value || (opt.value === null && current === null);
              return (
                <button
                  key={String(opt.value)}
                  type="button"
                  disabled={active}
                  onClick={() => applyParam(setting.key, opt.value)}
                  style={segmentStyle(active)}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      );
    })}
    <div style={{ padding: '2px 10px 6px', fontSize: 10.5, opacity: 0.55 }}>
      Changing a setting reloads the world.
    </div>
    <button type="button" onClick={onShowControls} style={rowStyle}>
      <span style={{ fontSize: 15, width: 18, textAlign: 'center' }}>⌨</span>
      <span>Show controls</span>
    </button>
  </>
);

function renderIcon(item: MenuItemSpec): ReactElement | null {
  // The engine's reserved VR item gets the lucide glasses glyph; plugin
  // items provide a string icon (emoji/text, or an http(s) image URL).
  if (item.id === VR_MENU_ITEM_ID) {
    return <Glasses size={18} strokeWidth={2} />;
  }
  if (!item.icon) return null;
  if (/^https?:\/\//.test(item.icon)) {
    return (
      <img
        src={item.icon}
        alt=""
        width={18}
        height={18}
        style={{ objectFit: 'contain', display: 'block' }}
      />
    );
  }
  return <span style={{ fontSize: 16, lineHeight: 1, width: 18, textAlign: 'center' }}>{item.icon}</span>;
}

export const MoreMenu: FC = (): ReactElement | null => {
  const items = useSyncExternalStore(subscribeMenu, getMenuItems, getMenuItems);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<'menu' | 'settings'>('menu');
  const wrapRef = useRef<HTMLDivElement>(null);

  // Reopening always starts at the item list, not a stale settings view.
  useEffect(() => {
    if (!open) setView('menu');
  }, [open]);

  // Escape + outside-click close the menu (only wired while open).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const onPointer = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('mousedown', onPointer);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('mousedown', onPointer);
    };
  }, [open]);

  // If the menu drains to empty while open (e.g. VR item unregistered), close.
  useEffect(() => {
    if (items.length === 0 && open) setOpen(false);
  }, [items.length, open]);

  const handleSelect = useCallback((item: MenuItemSpec) => {
    setOpen(false);
    try {
      item.onSelect();
    } catch (err) {
      console.error('[XRPublisher] menu item onSelect threw:', item.id, err);
    }
  }, []);

  if (items.length === 0) return null;

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={iconButtonStyle}
        title="More options"
        aria-label="More options"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Menu size={18} strokeWidth={2} />
      </button>

      {open && (
        <div role="menu" style={dropdownStyle}>
          {view === 'settings' ? (
            <SettingsView
              onBack={() => setView('menu')}
              onShowControls={() => {
                setOpen(false);
                window.dispatchEvent(new Event(SHOW_CONTROLS_HINT_EVENT));
              }}
            />
          ) : (
            <>
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="menuitem"
                  onClick={() => handleSelect(item)}
                  style={rowStyle}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255, 255, 255, 0.08)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                  }}
                >
                  {renderIcon(item)}
                  <span>{item.label}</span>
                </button>
              ))}
              <button
                type="button"
                role="menuitem"
                onClick={() => setView('settings')}
                style={{ ...rowStyle, borderTop: `1px solid ${BORDER_COLOR}`, borderRadius: 0, marginTop: 2, paddingTop: 10 }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255, 255, 255, 0.08)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                }}
              >
                <Settings size={18} strokeWidth={2} />
                <span>Settings</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

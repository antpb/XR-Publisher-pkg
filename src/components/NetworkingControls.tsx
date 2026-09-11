import React, { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import type { FC, ReactElement } from 'react';
import { Globe, Mic, MicOff, Search, Settings2, Users, X } from 'lucide-react';
import { MoreMenu } from './MoreMenu';
import { subscribeMenu, getMenuItems } from '../decorations/pluginMenu';

/**
 * NetworkingControls — full top-of-canvas overlay for VR entry, voice
 * chat, participants, and room info.
 *
 * This component owns every piece of UI that used to be injected
 * imperatively into `#networking` by `Networking.tsx`. The previous
 * architecture created <button> elements in JS, set their
 * `background-image` to PNG URLs that 404 on the live worker, and bound
 * DOM click handlers — all of which produced invisible, unclickable,
 * un-discoverable controls.
 *
 * Ownership split with Networking.tsx:
 *  - NetworkingControls owns the visual surface + the local voice state
 *    (`window.localStream`), device picker, mute toggle, device switch,
 *    participants dropdown, room dropdown.
 *  - Networking.tsx still owns p2pcf lifecycle (creation, room-full
 *    refresh, peer track → audio element binding, peerclose cleanup)
 *    and reads `window.localStream` to attach voice to peers that
 *    connect after you joined voice.
 */

interface NetworkingControlsProps {
  networkingBlock: HTMLElement[];
  postSlug?: string;
  userData: {
    inWorldName: string;
    playerVRM: string;
    profileImage: string;
    [key: string]: any;
  };
  /** Retained for backwards-compat — ignored; VR entry now lives in the
   *  "More" menu (registered by EnvironmentFront via the pluginMenu registry). */
  hmdIcon?: string;
}

/* ── Visual tokens ──────────────────────────────────────────────────── */

const OVERLAY_BG = 'rgba(15, 15, 20, 0.82)';
const BORDER_COLOR = 'rgba(255, 255, 255, 0.18)';
const ACCENT = '#8b5cf6';
const DANGER = 'rgba(239, 68, 68, 0.7)';
const DANGER_BORDER = 'rgba(239, 68, 68, 0.8)';
const TEXT = '#f5f5f7';
const TEXT_MUTED = 'rgba(245, 245, 247, 0.72)';

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 16,
  left: 16,
  zIndex: 100,
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'flex-start',
  gap: 8,
  fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  pointerEvents: 'none',
};

const buttonBaseStyle: React.CSSProperties = {
  pointerEvents: 'auto',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '10px 14px',
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

const iconOnlyButtonStyle: React.CSSProperties = {
  ...buttonBaseStyle,
  padding: 10,
};

const dividerStyle: React.CSSProperties = {
  width: 1,
  alignSelf: 'stretch',
  background: 'rgba(255, 255, 255, 0.12)',
  margin: '2px 2px',
};

const dropdownStyle: React.CSSProperties = {
  pointerEvents: 'auto',
  position: 'absolute',
  top: 48,
  left: 0,
  minWidth: 260,
  maxHeight: 360,
  overflowY: 'auto',
  padding: 12,
  borderRadius: 10,
  background: OVERLAY_BG,
  border: `1px solid ${BORDER_COLOR}`,
  color: TEXT,
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  fontSize: 13,
  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
};

const dropdownHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};

const selectStyle: React.CSSProperties = {
  width: '100%',
  padding: '6px 8px',
  borderRadius: 6,
  background: 'rgba(255, 255, 255, 0.08)',
  color: TEXT,
  border: '1px solid rgba(255, 255, 255, 0.2)',
  font: 'inherit',
  fontSize: 13,
};

const actionRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: 8,
  justifyContent: 'flex-end',
};

const primaryActionStyle: React.CSSProperties = {
  padding: '6px 12px',
  borderRadius: 6,
  background: ACCENT,
  color: '#fff',
  border: 'none',
  cursor: 'pointer',
  font: 'inherit',
  fontSize: 13,
  fontWeight: 600,
};

const secondaryActionStyle: React.CSSProperties = {
  padding: '6px 12px',
  borderRadius: 6,
  background: 'transparent',
  color: TEXT_MUTED,
  border: '1px solid rgba(255, 255, 255, 0.2)',
  cursor: 'pointer',
  font: 'inherit',
  fontSize: 13,
};

const closeButtonStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: TEXT_MUTED,
  cursor: 'pointer',
  padding: 4,
  display: 'inline-flex',
};

const listItemStyle: React.CSSProperties = {
  padding: '6px 8px',
  borderRadius: 6,
  background: 'rgba(255, 255, 255, 0.04)',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
};

const roomIdStyle: React.CSSProperties = {
  padding: '6px 8px',
  borderRadius: 6,
  background: 'rgba(255, 255, 255, 0.06)',
  fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
  fontSize: 12,
  color: TEXT_MUTED,
  wordBreak: 'break-all',
};

/* ── Dropdown kinds — mutually exclusive ────────────────────────────── */
type DropdownKind = null | 'joinDevices' | 'switchDevices' | 'peers' | 'room';

/* ── Helpers ────────────────────────────────────────────────────────── */

async function requestPermissionAndEnumerate(): Promise<MediaDeviceInfo[]> {
  // Quick permissions-prompt getUserMedia so enumerateDevices returns
  // labeled devices. Immediately stopped — we re-acquire on confirm.
  const permStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  permStream.getTracks().forEach((t) => t.stop());
  const all = await navigator.mediaDevices.enumerateDevices();
  return all.filter((d) => d.kind === 'audioinput');
}

/* ── Component ──────────────────────────────────────────────────────── */

export const NetworkingControls: FC<NetworkingControlsProps> = ({
  networkingBlock,
  userData,
}): ReactElement | null => {
  const hasNetworking = Boolean(networkingBlock?.length);

  // Items in the HUD "More" menu (engine VR entry + plugin actions). Drives
  // whether the overlay renders at all for non-networked, VR/plugin worlds.
  const menuItems = useSyncExternalStore(subscribeMenu, getMenuItems, getMenuItems);

  /* ── Host-page byline absorption ────────────────────────────────────
   *
   * The host page (e.g. xrpublisher.com) renders a header flex with:
   *   <span>by:</span>
   *   <a href="/author/…">{author}</a>
   *   <h1>{world title}</h1>
   *   <a href="/"><img alt="Logo" …></a>
   *   <form action="/directory/search">…</form>
   *
   * The logo should remain visible on the page. Everything else overlaps
   * our top-left overlay. We scrape the byline/title/search on mount,
   * hide the originals, and surface them inside the Room dropdown. On
   * unmount we restore the original `display` so we don't leave the host
   * page broken. */
  interface RoomMeta {
    authorName: string;
    authorHref: string;
    title: string;
    searchAction: string;
    searchParam: string;
  }
  const [roomMeta, setRoomMeta] = useState<RoomMeta | null>(null);

  useEffect(() => {
    // Absorption surfaces host metadata inside the Room dropdown, which only
    // exists with networking. Without it (VR/plugin-only worlds where the
    // overlay still mounts for the More menu), leave the host page untouched.
    if (!hasNetworking) return;
    const authorLink = document.querySelector('a[href^="/author/"]') as HTMLAnchorElement | null;
    const byLabel = (authorLink?.previousElementSibling || null) as HTMLElement | null;
    // Prefer an H1 that shares a parent with the author link; otherwise
    // fall back to any sibling H1 inside the byline container.
    const titleEl =
      (authorLink?.parentElement?.querySelector('h1') as HTMLElement | null) ||
      (document.querySelector('h1') as HTMLElement | null);
    const searchForm = document.querySelector(
      'form[action*="/directory/search"], form[action*="/search"]',
    ) as HTMLFormElement | null;
    const searchInput = searchForm?.querySelector('input[type="search"], input[name]') as
      | HTMLInputElement
      | null;

    // Bail if nothing to absorb.
    if (!authorLink && !titleEl && !searchForm) return;

    setRoomMeta({
      authorName: authorLink?.textContent?.trim() || '',
      authorHref: authorLink?.getAttribute('href') || '',
      title: titleEl?.textContent?.trim() || '',
      searchAction: searchForm?.getAttribute('action') || '/directory/search',
      searchParam: searchInput?.getAttribute('name') || 'q',
    });

    const hidden: Array<{ el: HTMLElement; prev: string }> = [];
    const hide = (el: HTMLElement | null) => {
      if (!el) return;
      hidden.push({ el, prev: el.style.display });
      el.style.display = 'none';
    };
    hide(byLabel);
    hide(authorLink);
    hide(titleEl);
    hide(searchForm);

    return () => {
      for (const { el, prev } of hidden) {
        el.style.display = prev;
      }
    };
  }, [hasNetworking]);

  /* ── Voice state ────────────────────────────────────────────────── */
  const [voiceJoined, setVoiceJoined] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const localStreamRef = useRef<MediaStream | null>(null);

  /* ── Device picker state (shared between Join + Switch flows) ───── */
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('');

  /* ── Dropdown orchestration ─────────────────────────────────────── */
  const [activeDropdown, setActiveDropdown] = useState<DropdownKind>(null);

  /* ── Peer list live-update tick. peers come from window.p2pcf, but
   *    we need to re-render when connect/disconnect fires. Rather than
   *    mirror the entire peer map into React state (wasted work when
   *    the dropdown is closed), we bump a counter on every change. ── */
  const [peerTick, setPeerTick] = useState(0);

  /* ── Escape closes any dropdown; outside click closes too ───────── */
  useEffect(() => {
    if (activeDropdown === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveDropdown(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeDropdown]);

  /* ── Subscribe to p2pcf peer lifecycle to trigger re-renders ────── */
  useEffect(() => {
    if (!hasNetworking) return;

    let detach: (() => void) | null = null;
    const attach = () => {
      const p2pcf: any = (window as any).p2pcf;
      if (!p2pcf || typeof p2pcf.on !== 'function') return false;

      const bump = () => setPeerTick((n) => n + 1);
      p2pcf.on('peerconnect', bump);
      p2pcf.on('peerclose', bump);
      detach = () => {
        if (typeof p2pcf.removeListener === 'function') {
          p2pcf.removeListener('peerconnect', bump);
          p2pcf.removeListener('peerclose', bump);
        }
      };
      return true;
    };

    if (!attach()) {
      // p2pcf may not exist yet on mount — Networking.tsx dispatches
      // 'p2pcf-ready' once the instance is live.
      const onReady = () => {
        if (attach()) {
          window.removeEventListener('p2pcf-ready', onReady);
        }
      };
      window.addEventListener('p2pcf-ready', onReady);
      return () => {
        window.removeEventListener('p2pcf-ready', onReady);
        if (detach) detach();
      };
    }

    return () => {
      if (detach) detach();
    };
  }, [hasNetworking]);

  /* ── Voice join / confirm / switch / mute / cleanup ─────────────── */

  const openJoinDevices = useCallback(async () => {
    try {
      const inputs = await requestPermissionAndEnumerate();
      setDevices(inputs);
      if (inputs.length > 0) {
        setSelectedDevice((prev) => prev || inputs[0].deviceId);
      }
      setActiveDropdown('joinDevices');
    } catch (err) {
      console.error('[NetworkingControls] Microphone permission denied:', err);
    }
  }, []);

  const openSwitchDevices = useCallback(async () => {
    try {
      const inputs = await requestPermissionAndEnumerate();
      setDevices(inputs);
      if (inputs.length > 0 && !selectedDevice) {
        setSelectedDevice(inputs[0].deviceId);
      }
      setActiveDropdown('switchDevices');
    } catch (err) {
      console.error('[NetworkingControls] Microphone enumeration failed:', err);
    }
  }, [selectedDevice]);

  const confirmJoinVoice = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: selectedDevice ? { deviceId: { exact: selectedDevice } } : true,
      });
      localStreamRef.current = stream;
      (window as any).localStream = stream;

      const p2pcf: any = (window as any).p2pcf;
      if (p2pcf?.peers) {
        for (const peer of p2pcf.peers.values()) {
          try { peer.addStream(stream); } catch (e) { console.warn('[NetworkingControls] peer.addStream failed', e); }
        }
      }

      setVoiceJoined(true);
      setIsMuted(false);
      setActiveDropdown(null);
    } catch (err) {
      console.error('[NetworkingControls] getUserMedia failed:', err);
    }
  }, [selectedDevice]);

  const confirmSwitchDevice = useCallback(async () => {
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        audio: selectedDevice ? { deviceId: { exact: selectedDevice } } : true,
      });

      const oldStream = localStreamRef.current;

      const p2pcf: any = (window as any).p2pcf;
      if (p2pcf?.peers) {
        for (const peer of p2pcf.peers.values()) {
          try {
            if (oldStream) peer.removeStream(oldStream);
            peer.addStream(newStream);
          } catch (e) {
            console.warn('[NetworkingControls] peer stream swap failed', e);
          }
        }
      }

      // Stop old tracks to release the previous device.
      if (oldStream) oldStream.getTracks().forEach((t) => t.stop());

      localStreamRef.current = newStream;
      (window as any).localStream = newStream;

      // Respect current mute state on the new stream.
      newStream.getAudioTracks().forEach((t) => { t.enabled = !isMuted; });

      setActiveDropdown(null);
    } catch (err) {
      console.error('[NetworkingControls] device switch failed:', err);
    }
  }, [selectedDevice, isMuted]);

  const toggleMute = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const next = !isMuted;
    stream.getAudioTracks().forEach((t) => { t.enabled = !next; });
    setIsMuted(next);
  }, [isMuted]);

  const closeDropdown = useCallback(() => setActiveDropdown(null), []);

  const togglePeers = useCallback(() => {
    setActiveDropdown((prev) => (prev === 'peers' ? null : 'peers'));
  }, []);

  const toggleRoom = useCallback(() => {
    setActiveDropdown((prev) => (prev === 'room' ? null : 'room'));
  }, []);

  /* ── Cleanup on unmount: release mic ────────────────────────────── */
  useEffect(() => {
    return () => {
      const stream = localStreamRef.current;
      if (stream) stream.getTracks().forEach((t) => t.stop());
      if ((window as any).localStream === localStreamRef.current) {
        (window as any).localStream = null;
      }
    };
  }, []);

  /* ── Derived data for Peers / Room dropdowns ────────────────────── */

  // Keyed on peerTick so re-renders pick up peer map changes.
  const peerList = useMemo(() => {
    void peerTick; // intentionally depend on tick
    const p2pcf: any = (window as any).p2pcf;
    const participants: Record<string, string> = (window as any).participants || {};
    const result: Array<{ id: string; name: string; self: boolean }> = [];

    // Self first.
    if (p2pcf?.sessionId) {
      const selfName = userData?.inWorldName || `User-${p2pcf.sessionId.slice(0, 5)}`;
      // Make sure the global map carries our name so other dropdowns see it.
      participants[p2pcf.sessionId] = selfName;
      result.push({ id: p2pcf.sessionId, name: selfName, self: true });
    }

    if (p2pcf?.peers) {
      for (const peer of p2pcf.peers.values()) {
        result.push({
          id: peer.id,
          name: participants[peer.id] || peer.client_id || 'Unknown Peer',
          self: false,
        });
      }
    }

    return result;
  }, [peerTick, userData?.inWorldName]);

  const roomId = useMemo(() => {
    void peerTick;
    const p2pcf: any = (window as any).p2pcf;
    return p2pcf?.roomId || '';
  }, [peerTick]);

  /* ── Render ──────────────────────────────────────────────────────── */

  if (!hasNetworking && menuItems.length === 0) return null;

  const deviceDropdownVisible =
    activeDropdown === 'joinDevices' || activeDropdown === 'switchDevices';

  return (
    <div
      id="networking"
      className="xr-publisher-networking-controls"
      style={overlayStyle}
    >
      <div id="messages" style={{ display: 'none' }} />

      {/* Button row + floating dropdowns anchored to it */}
      <div
        id="network-ui-container"
        style={{ display: 'flex', gap: 8, position: 'relative', alignItems: 'center' }}
      >
        {/* Hamburger "More" menu — engine VR entry + plugin actions. Leftmost
            so it reads as the cluster's overflow control. Renders nothing
            when no items are registered. */}
        <MoreMenu />

        {hasNetworking && !voiceJoined && (
          <button
            type="button"
            id="audio-button"
            onClick={openJoinDevices}
            style={buttonBaseStyle}
            title="Select microphone and join voice chat"
          >
            <Mic size={18} strokeWidth={2} />
            <span>Join</span>
          </button>
        )}

        {hasNetworking && voiceJoined && (
          <>
            <button
              type="button"
              id="mute-icon"
              onClick={toggleMute}
              style={{
                ...buttonBaseStyle,
                background: isMuted ? DANGER : OVERLAY_BG,
                border: `1px solid ${isMuted ? DANGER_BORDER : BORDER_COLOR}`,
              }}
              title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
              aria-pressed={isMuted}
            >
              {isMuted ? <MicOff size={18} strokeWidth={2} /> : <Mic size={18} strokeWidth={2} />}
              <span>{isMuted ? 'Unmute' : 'Mute'}</span>
            </button>

            <button
              type="button"
              onClick={openSwitchDevices}
              style={iconOnlyButtonStyle}
              title="Change microphone"
              aria-label="Change microphone"
            >
              <Settings2 size={18} strokeWidth={2} />
            </button>
          </>
        )}

        {hasNetworking && voiceJoined && <div style={dividerStyle} />}

        {hasNetworking && (
          <button
            type="button"
            onClick={togglePeers}
            style={buttonBaseStyle}
            title="Show participants"
            aria-pressed={activeDropdown === 'peers'}
          >
            <Users size={18} strokeWidth={2} />
          </button>
        )}

        {hasNetworking && (
          <button
            type="button"
            onClick={toggleRoom}
            style={iconOnlyButtonStyle}
            title="Room info"
            aria-label="Room info"
            aria-pressed={activeDropdown === 'room'}
          >
            <Globe size={18} strokeWidth={2} />
          </button>
        )}

        {/* ── Device picker dropdown (Join + Switch share this) ───── */}
        {deviceDropdownVisible && (
          <div style={dropdownStyle} role="dialog" aria-label="Select microphone">
            <div style={dropdownHeaderStyle}>
              <strong style={{ fontSize: 14 }}>
                {activeDropdown === 'switchDevices' ? 'Switch microphone' : 'Select microphone'}
              </strong>
              <button type="button" onClick={closeDropdown} aria-label="Close" style={closeButtonStyle}>
                <X size={16} />
              </button>
            </div>

            {devices.length === 0 ? (
              <div style={{ color: TEXT_MUTED, fontSize: 12 }}>
                No input devices detected. Grant microphone permission and try again.
              </div>
            ) : (
              <select
                value={selectedDevice}
                onChange={(e) => setSelectedDevice(e.target.value)}
                style={selectStyle}
                id="audio-select"
              >
                {devices.map((d, i) => (
                  <option key={d.deviceId || i} value={d.deviceId}>
                    {d.label || `Microphone ${i + 1}`}
                  </option>
                ))}
              </select>
            )}

            <div style={actionRowStyle}>
              <button type="button" onClick={closeDropdown} style={secondaryActionStyle}>
                Cancel
              </button>
              <button
                type="button"
                onClick={activeDropdown === 'switchDevices' ? confirmSwitchDevice : confirmJoinVoice}
                style={primaryActionStyle}
                disabled={devices.length === 0}
              >
                {activeDropdown === 'switchDevices' ? 'Switch' : 'Join'}
              </button>
            </div>
          </div>
        )}

        {/* ── Peers dropdown ───────────────────────────────────────── */}
        {activeDropdown === 'peers' && (
          <div style={dropdownStyle} role="dialog" aria-label="Participants">
            <div style={dropdownHeaderStyle}>
              <strong style={{ fontSize: 14 }}>
                Participants ({peerList.length})
              </strong>
              <button type="button" onClick={closeDropdown} aria-label="Close" style={closeButtonStyle}>
                <X size={16} />
              </button>
            </div>

            {peerList.length === 0 ? (
              <div style={{ color: TEXT_MUTED, fontSize: 12 }}>
                Nobody here yet. Share the room link to invite people.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {peerList.map((p, i) => (
                  <div key={p.id} style={listItemStyle}>
                    <span style={{ color: TEXT_MUTED, minWidth: 18, fontSize: 12 }}>
                      {i + 1}.
                    </span>
                    <span style={{ flex: 1 }}>{p.name}</span>
                    {p.self && (
                      <span
                        style={{
                          fontSize: 11,
                          color: TEXT_MUTED,
                          padding: '2px 6px',
                          borderRadius: 4,
                          background: 'rgba(255, 255, 255, 0.08)',
                        }}
                      >
                        you
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Room dropdown ────────────────────────────────────────── */}
        {activeDropdown === 'room' && (
          <div style={dropdownStyle} role="dialog" aria-label="Room info">
            <div style={dropdownHeaderStyle}>
              <strong style={{ fontSize: 14 }}>
                {roomMeta?.title || 'Room'}
              </strong>
              <button type="button" onClick={closeDropdown} aria-label="Close" style={closeButtonStyle}>
                <X size={16} />
              </button>
            </div>

            {roomMeta?.authorName && (
              <div style={{ color: TEXT_MUTED, fontSize: 12 }}>
                by{' '}
                <a
                  href={roomMeta.authorHref}
                  style={{ color: TEXT, textDecoration: 'underline' }}
                >
                  {roomMeta.authorName}
                </a>
              </div>
            )}

            {roomMeta && (
              <form
                action={roomMeta.searchAction}
                method="GET"
                role="search"
                style={{ display: 'flex', gap: 6 }}
              >
                <input
                  type="search"
                  name={roomMeta.searchParam}
                  placeholder="Search worlds…"
                  style={{
                    ...selectStyle,
                    flex: 1,
                  }}
                  aria-label="Search worlds"
                />
                <button type="submit" style={primaryActionStyle} title="Search">
                  <Search size={14} strokeWidth={2.25} />
                </button>
              </form>
            )}

            <div style={{ color: TEXT_MUTED, fontSize: 12, marginTop: 4 }}>Room ID</div>
            <div style={roomIdStyle}>{roomId || '(not connected)'}</div>

            <div style={actionRowStyle}>
              <button
                type="button"
                onClick={async () => {
                  if (!roomId) return;
                  try {
                    await navigator.clipboard.writeText(roomId);
                  } catch {
                    /* clipboard API unavailable — no-op */
                  }
                }}
                style={secondaryActionStyle}
                disabled={!roomId}
              >
                Copy
              </button>
            </div>
          </div>
        )}
      </div>

      {/*
        Empty anchors kept for any stragglers that still query these IDs
        (e.g. peer.on("track") appends <audio> elements to #videos).
      */}
      <div id="room-dropdown" style={{ display: 'none' }} />
      <div id="videos" style={{ display: 'none' }} />
    </div>
  );
};

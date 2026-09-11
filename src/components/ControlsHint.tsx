import React, { useEffect, useState } from 'react';
import type { FC, ReactElement } from 'react';

/**
 * ControlsHint — first-run "how do I move" card.
 *
 * Shows once per browser (localStorage flag) after the loading overlay
 * clears (`loaderIsGone` window event), and on demand via the
 * `xrp:show-controls-hint` window event (fired by the More-menu Settings
 * view's "Show controls" row). Desktop and touch get different keys.
 *
 * DOM overlay — flatscreen-only by design, same as the other banners; VR
 * users get in-world UI instead.
 */

export const SHOW_CONTROLS_HINT_EVENT = 'xrp:show-controls-hint';
const SEEN_KEY = 'xr_publisher_controls_hint_seen';
const AUTO_DISMISS_MS = 15000;

export const isTouch = (): boolean =>
	typeof window !== 'undefined' &&
	(window.matchMedia?.('(pointer: coarse)').matches || navigator.maxTouchPoints > 0);

const cardStyle: React.CSSProperties = {
	position: 'fixed',
	left: '50%',
	bottom: 24,
	transform: 'translateX(-50%)',
	zIndex: 95,
	pointerEvents: 'auto',
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
	gap: 10,
	padding: '14px 18px',
	borderRadius: 12,
	background: 'rgba(15, 15, 20, 0.82)',
	border: '1px solid rgba(255, 255, 255, 0.18)',
	color: '#f5f5f7',
	fontSize: 13,
	fontFamily: 'system-ui, sans-serif',
	backdropFilter: 'blur(8px)',
	WebkitBackdropFilter: 'blur(8px)',
	boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
	maxWidth: 'min(92vw, 460px)',
	textAlign: 'center',
};

const keyStyle: React.CSSProperties = {
	display: 'inline-block',
	minWidth: 22,
	padding: '2px 6px',
	margin: '0 2px',
	borderRadius: 5,
	border: '1px solid rgba(255, 255, 255, 0.35)',
	background: 'rgba(255, 255, 255, 0.06)',
	fontWeight: 600,
	fontSize: 12,
};

const rowStyle: React.CSSProperties = {
	display: 'flex',
	flexWrap: 'wrap',
	justifyContent: 'center',
	gap: '6px 18px',
	lineHeight: '24px',
};

const Key: FC<{ children: React.ReactNode }> = ({ children }) => (
	<span style={keyStyle}>{children}</span>
);

export const ControlsHint: FC = (): ReactElement | null => {
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		let autoDismiss: ReturnType<typeof setTimeout> | undefined;

		const show = () => {
			setVisible(true);
			clearTimeout(autoDismiss);
			autoDismiss = setTimeout(() => setVisible(false), AUTO_DISMISS_MS);
		};
		const showFirstRun = () => {
			try {
				if (localStorage.getItem(SEEN_KEY)) return;
			} catch {
				/* storage blocked — still show, just not persist */
			}
			show();
		};

		window.addEventListener('loaderIsGone', showFirstRun);
		window.addEventListener(SHOW_CONTROLS_HINT_EVENT, show);
		return () => {
			clearTimeout(autoDismiss);
			window.removeEventListener('loaderIsGone', showFirstRun);
			window.removeEventListener(SHOW_CONTROLS_HINT_EVENT, show);
		};
	}, []);

	useEffect(() => {
		if (!visible) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') dismiss();
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [visible]);

	const dismiss = () => {
		setVisible(false);
		try {
			localStorage.setItem(SEEN_KEY, '1');
		} catch {
			/* ignore */
		}
	};

	if (!visible) return null;

	return (
		<div style={cardStyle}>
			{isTouch() ? (
				<div style={rowStyle}>
					<span>Left stick — move</span>
					<span>Drag — look</span>
					<span>Buttons — jump / fly / interact</span>
				</div>
			) : (
				<>
					<div style={rowStyle}>
						<span><Key>W</Key><Key>A</Key><Key>S</Key><Key>D</Key> move</span>
						<span>Mouse — look <span style={{ opacity: 0.65 }}>(click world to capture)</span></span>
					</div>
					<div style={rowStyle}>
						<span><Key>Space</Key> jump</span>
						<span><Key>Shift</Key> run</span>
						<span><Key>E</Key> interact</span>
						<span><Key>Esc</Key> release mouse</span>
					</div>
				</>
			)}
			<button
				type="button"
				onClick={dismiss}
				style={{
					pointerEvents: 'auto',
					padding: '6px 16px',
					borderRadius: 8,
					border: '1px solid rgba(255, 255, 255, 0.25)',
					background: 'rgba(255, 255, 255, 0.1)',
					color: '#f5f5f7',
					font: 'inherit',
					fontWeight: 600,
					cursor: 'pointer',
				}}
			>
				Got it
			</button>
		</div>
	);
};

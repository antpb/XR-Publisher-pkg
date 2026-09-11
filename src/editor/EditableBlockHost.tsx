/**
 * EditableBlockHost — mounts one placeable block through the shared parsers
 * inside a PIVOT-ANCHORED wrapper group:
 *
 *   <group position={pivot}>            ← the wrapper gizmos/selection act on
 *     <group position={-pivot}>         ← cancels the pivot so the component's
 *       <ModelObject … />                  own authored transform is unchanged
 *     </group>
 *   </group>
 *
 * The wrapper's own position/rotation/scale are therefore the block's live
 * transform ABOUT ITS OWN PIVOT — exactly what TransformControls needs to
 * attach to, with rotate/scale naturally centred on the object.
 *
 * Subscription contract: the host re-renders ONLY when its entry's version
 * bumps (inspector edits, undo/redo) — re-parsing attributes from the shadow
 * element and resetting the wrapper. Gizmo drags mutate the wrapper directly
 * and commit attrs WITHOUT a bump, so dragging never remounts the component
 * (no GLTF reload, no collider recook). Outside a session the host renders
 * the original scanned element and is zero-cost.
 */

import React, { useEffect, useLayoutEffect, useRef } from 'react';
import { useSyncExternalStore } from 'react';
import type { Group } from 'three';
import {
	subscribeEditSession,
	entryRenderVersion,
	renderElFor,
	linkHostGroup,
	linkAdditionGroup,
	hostKeyFor,
	getPivot,
	isEditActive,
	isHostHidden,
	syncEntryBase,
	getActiveAdditions,
	getPersistedAdditions,
	getEntries,
	getEditVersion,
	KIND_TO_TAG,
	kindForTag,
	type EditableKind,
} from './editSession';
import { getCustomBlockType } from '../blocks/customBlockRegistry';
import { renderBlockComponent, type BlockRenderCtx } from './blockParsers';

/** Clickable stand-in for blocks with no (reliable) render geometry. */
function EditProxy({ kind, el }: { kind: EditableKind; el: Element }): React.JSX.Element {
	const pivot = getPivot(el);
	const color = kind === 'light' ? (el.getAttribute('color') || '#ffdd88') : '#66c2ff';
	return (
		<mesh position={pivot} renderOrder={1}>
			{kind === 'light'
				? <sphereGeometry args={[0.3, 12, 8]} />
				: <octahedronGeometry args={[0.35]} />}
			{/* Stock material: works on both renderer paths via extend.ts. */}
			<meshBasicMaterial color={color} wireframe />
		</mesh>
	);
}

export function EditableBlockHost({
	kind,
	el,
	index,
	ctx,
	tag: tagProp,
}: {
	kind: EditableKind;
	el: Element;
	index: number;
	ctx: BlockRenderCtx;
	/** Required for kind 'custom' (one kind ↔ many tags); ignored otherwise. */
	tag?: string;
}): React.JSX.Element | null {
	const tag = kind === 'custom'
		? (tagProp ?? el.tagName.toLowerCase())
		: KIND_TO_TAG[kind];
	const version = useSyncExternalStore(subscribeEditSession, () => entryRenderVersion(tag, index));
	const groupRef = useRef<Group>(null);

	const renderEl = renderElFor(tag, index, el);
	const pivot = getPivot(renderEl);
	const active = isEditActive();

	// `active` MUST be a dep: the host mounts long before a session exists
	// (no entry to link yet — the call no-ops), so the link has to re-run
	// when a session starts. Without it every entry.group stays null → no
	// viewport selection, no gizmo (shipped once; the outliner masked it).
	useEffect(() => {
		linkHostGroup(tag, index, el, groupRef.current);
		return () => linkHostGroup(tag, index, el, null);
	}, [tag, index, el, active]);

	// Every host render is a fresh parse → the wrapper must be reset to the
	// (possibly new) pivot with identity rotation/scale, and the entry's
	// transform base re-synced to the element (commit math depends on it).
	useLayoutEffect(() => {
		const g = groupRef.current;
		if (g) {
			g.position.set(pivot[0], pivot[1], pivot[2]);
			g.quaternion.identity();
			g.scale.setScalar(1);
		}
		syncEntryBase(hostKeyFor(tag, index));
	});

	// A deletion that was SAVED keeps the block hidden after the session ends
	// (the server no longer has it; a reload would drop it entirely).
	if (!active && isHostHidden(hostKeyFor(tag, index))) return null;

	// Custom blocks whose plugin isn't loaded render nothing — give them a
	// selectable proxy in edit mode so they can still be moved/deleted.
	const showProxy = active && (kind === 'light' || kind === 'audio'
		|| (kind === 'custom' && !getCustomBlockType(tag)));
	const content = renderBlockComponent(kind, renderEl, index, ctx);
	// Vehicles (dynamic rapier body) and NPCs (self-positioning pathfinding)
	// don't follow prop updates reliably — a version bump must REMOUNT them
	// so they respawn at the edited attrs. Keying a wrapper by version
	// guarantees it; other kinds keep cheap prop updates.
	const forceRemount = kind === 'rideable' || kind === 'npc';

	return (
		<group ref={groupRef} position={pivot}>
			<group position={[-pivot[0], -pivot[1], -pivot[2]]}>
				{forceRemount ? <group key={`v${version}`}>{content}</group> : content}
				{showProxy && <EditProxy kind={kind} el={renderEl} />}
			</group>
		</group>
	);
}

function AddedBlockHost({
	entryKey,
	el,
	tag,
	ctx,
}: {
	entryKey: string;
	el: Element;
	tag: string;
	ctx: BlockRenderCtx;
}): React.JSX.Element | null {
	const groupRef = useRef<Group>(null);
	const kind = kindForTag(tag);
	const pivot = getPivot(el);

	useEffect(() => {
		linkAdditionGroup(entryKey, groupRef.current);
		return () => linkAdditionGroup(entryKey, null);
	}, [entryKey]);

	useLayoutEffect(() => {
		const g = groupRef.current;
		if (g) {
			g.position.set(pivot[0], pivot[1], pivot[2]);
			g.quaternion.identity();
			g.scale.setScalar(1);
		}
		syncEntryBase(entryKey);
	});

	if (!kind) return null;
	const showProxy = isEditActive() && (kind === 'light' || kind === 'audio');
	return (
		<group ref={groupRef} position={pivot}>
			<group position={[-pivot[0], -pivot[1], -pivot[2]]}>
				{renderBlockComponent(kind, el, -1, ctx)}
				{showProxy && <EditProxy kind={kind} el={el} />}
			</group>
		</group>
	);
}

/**
 * Ghost marker for a spawn point — spawn blocks have no runtime rendering,
 * so in edit mode they appear as a translucent player-sized capsule the
 * editor can select and MOVE with the translate gizmo (spawn schema is
 * position-only; rotate/scale commits are schema-filtered to no-ops).
 */
function SpawnGhost({ entryKey, el }: { entryKey: string; el: Element }): React.JSX.Element {
	const groupRef = useRef<Group>(null);
	const pivot = getPivot(el);

	useEffect(() => {
		linkAdditionGroup(entryKey, groupRef.current);
		return () => linkAdditionGroup(entryKey, null);
	}, [entryKey]);

	useLayoutEffect(() => {
		const g = groupRef.current;
		if (g) {
			g.position.set(pivot[0], pivot[1], pivot[2]);
			g.quaternion.identity();
			g.scale.setScalar(1);
		}
		syncEntryBase(entryKey);
	});

	return (
		<group ref={groupRef} position={pivot}>
			{/* Pivot-anchored like every host; ghost geometry sits AT the pivot
			    (spawn Y is the avatar's spawn height, roughly mid-body). */}
			<mesh renderOrder={2}>
				<capsuleGeometry args={[0.35, 0.9, 4, 12]} />
				<meshBasicMaterial color="#5cf28e" transparent opacity={0.35} depthWrite={false} />
			</mesh>
			<mesh renderOrder={2}>
				<capsuleGeometry args={[0.35, 0.9, 2, 8]} />
				<meshBasicMaterial color="#5cf28e" wireframe transparent opacity={0.7} />
			</mesh>
			{/* Facing arrow (-Z, the direction the player looks on spawn). */}
			<mesh position={[0, 0, -0.55]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={2}>
				<coneGeometry args={[0.14, 0.35, 8]} />
				<meshBasicMaterial color="#5cf28e" transparent opacity={0.8} />
			</mesh>
		</group>
	);
}

/**
 * Edit-mode ghosts for blocks with NO runtime rendering (spawn points).
 * Mounted once per renderer branch; renders nothing outside a session.
 */
export function EditGhostsHost(): React.JSX.Element | null {
	useSyncExternalStore(subscribeEditSession, getEditVersion);
	if (!isEditActive()) return null;
	const ghosts: React.JSX.Element[] = [];
	for (const e of getEntries().values()) {
		if (e.tag === 'three-spawn-point-block' && !e.deleted) {
			ghosts.push(<SpawnGhost key={`${e.key}:${e.version}`} entryKey={e.key} el={e.el} />);
		}
	}
	return <>{ghosts}</>;
}

/**
 * Renders session-added blocks live (and keeps rendering the ones that were
 * SAVED after the session ends, so the world matches the server without a
 * reload). Mounted once per renderer branch, inside <Physics>.
 */
export function EditAdditionsHost({ ctx }: { ctx: BlockRenderCtx }): React.JSX.Element {
	useSyncExternalStore(subscribeEditSession, getEditVersion);
	const activeAdds = getActiveAdditions();
	const persisted = getPersistedAdditions();
	return (
		<>
			{activeAdds.map((e) => {
				// Kinds without runtime rendering (spawn points) are handled by
				// EditGhostsHost — linking here too would clobber the ghost's
				// group registration with a null.
				if (!kindForTag(e.tag)) return null;
				// An addition's version bump re-renders via the key change below.
				return (
					<AddedBlockHost key={`${e.key}:${e.version}`} entryKey={e.key} el={e.el} tag={e.tag} ctx={ctx} />
				);
			})}
			{persisted.map((el, i) => {
				const kind = kindForTag(el.tagName.toLowerCase());
				if (!kind) return null;
				// Session over: additions render as plain authored-like content.
				return activeAdds.some((e) => e.el === el)
					? null
					: <group key={`persisted-${i}`}>{renderBlockComponent(kind, el, -1 - i, ctx)}</group>;
			})}
		</>
	);
}

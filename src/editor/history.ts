/**
 * Edit history — the same Command pattern the native desktop editor uses
 * (src/editors/Command.js + History.js), sized for the in-world editor:
 * every mutation goes through execute() as a {do, undo} pair, giving
 * unlimited* undo/redo with zero coupling to what the command touches.
 * (*capped to keep memory bounded on long sessions.)
 */

export interface EditCommand {
	label: string;
	do: () => void;
	undo: () => void;
}

const MAX_HISTORY = 200;

let stack: EditCommand[] = [];
let cursor = 0; // number of applied commands
const listeners = new Set<() => void>();

function notify(): void {
	listeners.forEach((l) => {
		try { l(); } catch { /* ignore */ }
	});
}

export function subscribeHistory(cb: () => void): () => void {
	listeners.add(cb);
	return () => { listeners.delete(cb); };
}

export function execute(cmd: EditCommand): void {
	cmd.do();
	stack = stack.slice(0, cursor);
	stack.push(cmd);
	if (stack.length > MAX_HISTORY) stack.shift();
	cursor = stack.length;
	notify();
}

export function undo(): boolean {
	if (cursor === 0) return false;
	cursor--;
	try { stack[cursor].undo(); } catch (e) { console.error('[XRPublisher] undo failed:', e); }
	notify();
	return true;
}

export function redo(): boolean {
	if (cursor >= stack.length) return false;
	try { stack[cursor].do(); } catch (e) { console.error('[XRPublisher] redo failed:', e); }
	cursor++;
	notify();
	return true;
}

export function canUndo(): boolean { return cursor > 0; }
export function canRedo(): boolean { return cursor < stack.length; }
export function undoLabel(): string | null { return cursor > 0 ? stack[cursor - 1].label : null; }
export function redoLabel(): string | null { return cursor < stack.length ? stack[cursor].label : null; }

export function clearHistory(): void {
	stack = [];
	cursor = 0;
	notify();
}

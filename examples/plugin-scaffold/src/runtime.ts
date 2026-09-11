// ─────────────────────────────────────────────────────────────────────────
// Runtime access — the safe way to reach THREE and XRPublisher.
// ─────────────────────────────────────────────────────────────────────────
//
// A plugin <script> can evaluate BEFORE the XR Publisher runtime finishes
// booting, so `window.XRPublisher` / `window.THREE` may not exist yet.
// `whenRuntimeReady()` polls briefly and resolves once both are present.
//
// Read THREE and XRPublisher from the resolved `PluginRuntime` (below) rather
// than `import`-ing them — it's guaranteed non-null and load-order-safe.

import type { XRPublisherAPI } from './types/xr-publisher';
import type * as THREE from 'three';

export interface PluginRuntime {
  XRPublisher: XRPublisherAPI;
  /** The runtime's own three instance (window.THREE). */
  THREE: typeof THREE;
}

/** Resolves once window.XRPublisher and window.THREE are both available.
 *  Rejects after ~10s so a missing/old runtime fails loudly instead of hanging. */
export function whenRuntimeReady(timeoutMs = 10_000): Promise<PluginRuntime> {
  return new Promise((resolve, reject) => {
    const ready = () =>
      typeof window !== 'undefined' && (window as any).XRPublisher && (window as any).THREE;
    if (ready()) {
      resolve({ XRPublisher: window.XRPublisher, THREE: window.THREE });
      return;
    }
    const started = Date.now();
    const iv = setInterval(() => {
      if (ready()) {
        clearInterval(iv);
        resolve({ XRPublisher: window.XRPublisher, THREE: window.THREE });
      } else if (Date.now() - started > timeoutMs) {
        clearInterval(iv);
        reject(new Error('XR Publisher runtime (window.XRPublisher / window.THREE) never appeared'));
      }
    }, 50);
  });
}

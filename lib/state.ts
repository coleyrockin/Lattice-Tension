import type { Journey, FieldParams, ObservationState } from './types';
import type { MutableRefObject } from 'react';

/**
 * Production-grade serializable single source of truth for Aether observations.
 * Enables perfect restore + share across sessions, tabs, and dual instruments (2D Field + TensionLattice etc).
 *
 * Wraps/enhances the existing ref-based driver pattern (pointer/vel/scroll) + liveParams
 * without breaking bidirectional synergy.
 *
 * Philosophy: complicated inside (robust versioning, validation, error handling, URL-safe encoding),
 * simple outside (one string for ?state=... that roundtrips exactly).
 *
 * For other agents (Gamma etc): 
 * - Use buildObservationState at share/lock time to snapshot the canonical moment.
 * - Use serializeState for the URL fragment (or clipboard).
 * - On modal/app load for a journey, deserialize + restoreObservationState to hydrate liveParams + time + (future) camera/drivers.
 * - The refs remain the live bridge for pointer/vel/scroll stir between panes; state captures the serializable slice (params, time, camera, mode).
 * - Extend DriverRefs and timeRef wiring in components as needed for full time/camera restore (current modal integration provides the refs container).
 * - Always include version; future shapes can branch on it in deserialize.
 * - Never mutate state objects returned from deserialize.
 */

export interface DriverRefs {
  scrollRef?: MutableRefObject<number>;
  velRef?: MutableRefObject<number>;
  pointerRef?: MutableRefObject<{ x: number; y: number }>;
  timeRef?: MutableRefObject<number>;
}

/** URL-safe base64 helpers (compact, no padding bloat). */
function encodeState(data: unknown): string {
  const json = JSON.stringify(data);
  const b64 = btoa(json);
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function decodeState(str: string): unknown {
  let s = str.replace(/-/g, '+').replace(/_/g, '/');
  // pad
  while (s.length % 4) s += '=';
  const json = atob(s);
  return JSON.parse(json);
}

/** Serialize an ObservationState to a compact URL-safe string. Robust. */
export function serializeState(state: ObservationState): string {
  if (!state || typeof state !== 'object') {
    throw new Error('serializeState: invalid state');
  }
  // ensure version for evolution
  const toEncode: ObservationState = {
    version: state.version ?? 1,
    id: state.id,
    seed: state.seed,
    params: state.params ?? {},
    time: typeof state.time === 'number' ? state.time : 0,
    threeCamera: state.threeCamera,
    observerMode: state.observerMode,
  };
  try {
    return encodeState(toEncode);
  } catch (e) {
    throw new Error(`serializeState failed: ${(e as Error).message}`);
  }
}

/** Deserialize + validate. Returns null on any corruption/version mismatch/shape error. */
export function deserializeState(str: string): ObservationState | null {
  if (!str || typeof str !== 'string') return null;
  try {
    const parsed = decodeState(str);
    if (!parsed || typeof parsed !== 'object') return null;
    const p = parsed as Partial<ObservationState>;

    // strict validation for unbreakable fidelity
    if (typeof p.version !== 'number' || p.version < 1) return null;
    if (typeof p.id !== 'string' || p.id.length === 0) return null;
    if (typeof p.seed !== 'number' || !Number.isFinite(p.seed)) return null;
    if (!p.params || typeof p.params !== 'object') return null;
    if (typeof p.time !== 'number' || !Number.isFinite(p.time)) return null;

    // optional camera shape check
    if (p.threeCamera) {
      const c = p.threeCamera;
      if (!Array.isArray(c.position) || c.position.length !== 3 || c.position.some((n: any) => typeof n !== 'number')) {
        return null;
      }
      if (c.target && (!Array.isArray(c.target) || c.target.length !== 3 || c.target.some((n: any) => typeof n !== 'number'))) {
        return null;
      }
    }

    // observerMode optional, validate if present
    if (p.observerMode && !['pointer', 'sustained', 'velocity'].includes(p.observerMode)) {
      return null;
    }

    // reconstruct clean (no extra props leak)
    const state: ObservationState = {
      version: p.version,
      id: p.id,
      seed: p.seed,
      params: { ...p.params }, // shallow safe copy of params
      time: p.time,
      threeCamera: p.threeCamera ? {
        position: [...p.threeCamera.position] as [number, number, number],
        target: p.threeCamera.target ? [...p.threeCamera.target] as [number, number, number] : undefined,
      } : undefined,
      observerMode: p.observerMode,
    };
    return state;
  } catch {
    return null;
  }
}

/**
 * Build a canonical serializable ObservationState from live runtime.
 * journey + liveParams (the source of truth for field) + current refs (for time primarily; drivers captured for potential future replay of transient state).
 * threeCameraSnapshot only when the 3D instrument can provide it (OrbitControls .object or custom).
 */
export function buildObservationState(
  journey: Journey,
  liveParams: FieldParams,
  refs: DriverRefs = {},
  threeCameraSnapshot?: { position: [number, number, number]; target?: [number, number, number] }
): ObservationState {
  if (!journey || typeof journey.id !== 'string' || typeof journey.seed !== 'number') {
    throw new Error('buildObservationState: invalid journey');
  }
  const params: FieldParams = {
    ...liveParams,
  };
  // ensure observerStrength is always present in snapshot (default if absent)
  if (typeof params.observerStrength !== 'number') {
    params.observerStrength = 0.85;
  }
  return {
    version: 1,
    id: journey.id,
    seed: journey.seed,
    params,
    time: refs.timeRef?.current ?? 0,
    threeCamera: threeCameraSnapshot,
    observerMode: 'pointer', // default; can be derived from activity in future
  };
}

/**
 * Restore from a (deserialized) state into the live system.
 * Mutates via setLiveParams (React state) and ref.current assignments.
 * Returns true on success.
 * Drivers (pointer/vel/scroll) are typically live input and left as-is except for explicit cases;
 * timeRef is the key for "exact moment".
 * setLiveParams must accept the partial/functional update shape used in StudyModal.
 */
export function restoreObservationState(
  state: ObservationState | null,
  refs: DriverRefs = {},
  setLiveParams: (updater: FieldParams | ((prev: FieldParams) => FieldParams)) => void
): boolean {
  if (!state) return false;
  try {
    // params first — this is what Field + TensionLattice consume live
    if (state.params) {
      setLiveParams((prev: FieldParams) => ({
        ...prev,
        ...state.params,
      }));
    }

    // time for simulation offset restore (exact moment)
    if (refs.timeRef && typeof state.time === 'number') {
      refs.timeRef.current = state.time;
    }

    // future: if we snapshot transient driver state, we could set pointer/vel/scroll here
    // (currently the synergy is live; restoring instantaneous pointer would fight user input)
    // if (refs.pointerRef && ...) ...

    // threeCamera is in state for the 3D side to consume on mount/restore (e.g. controls.target/object.position.set)
    // not applied here; the caller (StudyModal or Lattice) will read state.threeCamera after restore if needed.

    return true;
  } catch {
    return false;
  }
}

/** Convenience: build a shareable URL fragment value (the encoded state part). */
export function buildShareStateParam(state: ObservationState): string {
  return serializeState(state);
}

/** Parse helper for ?state=... (or full search). */
export function parseStateFromUrl(searchOrUrl: string): ObservationState | null {
  try {
    const sp = new URLSearchParams(searchOrUrl.includes('?') ? searchOrUrl.split('?')[1] : searchOrUrl);
    const raw = sp.get('state') || sp.get('obsState'); // tolerant
    if (!raw) return null;
    return deserializeState(raw);
  } catch {
    return null;
  }
}

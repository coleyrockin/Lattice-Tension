import { Dispatch, SetStateAction } from 'react';

/**
 * Aether Observatory V1 — ObservationState
 * The single source of truth binding the 2D Field and 3D Tension Lattice.
 * Serializable, shareable, restorable. The living record of an observation.
 * 
 * Complicated inside. Simple and poetic outside.
 * Searching for meaning in the tension between order and emergence.
 */

export interface FieldParams {
  ridgeFreq: number;      // Frequency of ridge tension (0.2 - 8.0)
  flow: number;           // Flow intensity / velocity of energy (0 - 1)
  warmBias: number;       // Warmth / coolness bias in the field (-1 to 1)
  observerStrength: number; // Strength of observation / attention (0 - 1) — drives audio + crystallization
}

export interface ThreeCameraSnapshot {
  position: [number, number, number];
  target: [number, number, number];
  zoom?: number;
}

export interface JourneyRef {
  id: string;
  title?: string;
  description?: string;
}

export interface ObservationState {
  version: '1.0';
  timestamp: number;
  journey?: JourneyRef;
  liveParams: FieldParams;
  timeOffset: number;           // Current time position in the observation (seconds or normalized 0-1)
  threeCameraSnapshot?: ThreeCameraSnapshot;
  // Future: lockedDirection, crystallizationLevel, etc.
}

// Default parameters for a fresh observation
const DEFAULT_FIELD_PARAMS: FieldParams = {
  ridgeFreq: 1.8,
  flow: 0.35,
  warmBias: 0.15,
  observerStrength: 0.65,
};

/**
 * Builds a complete, serializable ObservationState from current context.
 * Captures the living moment across both instruments.
 */
export function buildObservationState(
  journey: JourneyRef | undefined,
  liveParams: FieldParams,
  timeOffset: number = 0,
  threeCameraSnapshot?: ThreeCameraSnapshot
): ObservationState {
  return {
    version: '1.0',
    timestamp: Date.now(),
    journey,
    liveParams: { ...liveParams },
    timeOffset,
    threeCameraSnapshot: threeCameraSnapshot ? { ...threeCameraSnapshot } : undefined,
  };
}

/**
 * Serializes the state into a compact, URL-safe string.
 * Uses base64 + JSON for robust sharing.
 */
export function serializeState(state: ObservationState): string {
  try {
    const json = JSON.stringify(state);
    // URL-safe base64
    return btoa(json)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  } catch (error) {
    console.error('Aether: Failed to serialize ObservationState', error);
    throw new Error('Serialization failed');
  }
}

/**
 * Deserializes a state string back into a full ObservationState.
 * Validates version and structure for safety.
 */
export function deserializeState(str: string): ObservationState | null {
  try {
    // Restore padding and characters
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    const json = atob(base64);
    const parsed = JSON.parse(json) as ObservationState;

    // Version guard for future evolution
    if (parsed.version !== '1.0') {
      console.warn('Aether: Unknown state version', parsed.version);
      return null;
    }

    // Ensure required fields exist
    if (!parsed.liveParams || typeof parsed.liveParams.observerStrength !== 'number') {
      console.warn('Aether: Invalid liveParams in state');
      return null;
    }

    return parsed;
  } catch (error) {
    console.error('Aether: Failed to deserialize ObservationState', error);
    return null;
  }
}

/**
 * Restores a deserialized state into the live application.
 * Updates live params and can sync 3D camera / time offset via refs.
 * This is the bridge that makes sharing magical.
 */
export function restoreObservationState(
  state: ObservationState,
  setLiveParams: Dispatch<SetStateAction<FieldParams>>,
  setTimeOffset?: Dispatch<SetStateAction<number>>,
  applyCameraSnapshot?: (snapshot: ThreeCameraSnapshot) => void
): void {
  try {
    // Restore core parameters — this drives both 2D Field and 3D Lattice
    setLiveParams({ ...state.liveParams });

    // Time position in the observation
    if (setTimeOffset && typeof state.timeOffset === 'number') {
      setTimeOffset(state.timeOffset);
    }

    // Restore 3D camera if snapshot exists and handler provided
    if (state.threeCameraSnapshot && applyCameraSnapshot) {
      applyCameraSnapshot(state.threeCameraSnapshot);
    }

    // Future: restore journey, locked direction, etc.
  } catch (error) {
    console.error('Aether: Failed to restore ObservationState', error);
  }
}

/**
 * Creates a shareable URL with the serialized state.
 * Uses ?state= parameter for clean, bookmarkable links.
 */
export function createShareableURL(state: ObservationState, baseUrl?: string): string {
  const serialized = serializeState(state);
  const url = baseUrl || (typeof window !== 'undefined' ? window.location.origin + window.location.pathname : '');
  return `${url}?state=${serialized}`;
}

/**
 * Parses the current URL for a state parameter and returns the deserialized state.
 * Call on mount in StudyModal or main observer component.
 */
export function parseStateFromURL(): ObservationState | null {
  if (typeof window === 'undefined') return null;

  const params = new URLSearchParams(window.location.search);
  const stateParam = params.get('state');

  if (!stateParam) return null;

  return deserializeState(stateParam);
}

// Export defaults for easy initialization
export { DEFAULT_FIELD_PARAMS };

#!/usr/bin/env tsx
/**
 * Round-trip fidelity verification for ObservationState + serializer.
 * Proves: build -> serialize -> deserialize -> deep equal (modulo ref objects) + all fields including observerStrength, time, camera, version.
 * Run: npx -y tsx@latest scripts/verify-observation-state.ts
 * This is the contract proof for state handoff to other agents and URL restore.
 */
import type { Journey, FieldParams } from '../lib/types';
import {
  serializeState,
  deserializeState,
  buildObservationState,
  restoreObservationState,
  type DriverRefs,
} from '../lib/state';

console.log('=== Aether ObservationState round-trip fidelity test ===');

const testJourney: Journey = {
  id: 'j-tension-lattice',
  seed: 203,
  title: 'Tension Lattice',
  category: 'Structure',
  kind: 'three',
  desc: 'test',
  tags: ['tensegrity'],
};

const liveParams: FieldParams = {
  ridgeFreq: 2.34,
  flow: 0.41,
  warmBias: 0.67,
  observerStrength: 0.92,
  ridgePhase: 0.15,
  discX: 0.33,
};

const timeRef = { current: 47.291 } as any;
const scrollRef = { current: 0.82 } as any;
const velRef = { current: -0.17 } as any;
const pointerRef = { current: { x: 0.41, y: -0.29 } } as any;

const refs: DriverRefs = { timeRef, scrollRef, velRef, pointerRef };

const cameraSnap = {
  position: [3.11, 1.77, 3.59] as [number, number, number],
  target: [0.02, 0.11, 0.05] as [number, number, number],
};

const built = buildObservationState(testJourney, liveParams, refs, cameraSnap);
console.log('built:', JSON.stringify(built, null, 2));

const serialized = serializeState(built);
console.log('serialized length:', serialized.length, 'sample:', serialized.slice(0, 40) + '...');

const deserialized = deserializeState(serialized);
console.log('deserialized:', JSON.stringify(deserialized, null, 2));

if (!deserialized) {
  console.error('FAIL: deserialize returned null');
  process.exit(1);
}

// Deep fidelity check (structure + values)
const okId = deserialized.id === built.id;
const okSeed = deserialized.seed === built.seed;
const okVersion = deserialized.version === 1;
const okTime = deserialized.time === built.time;
const okParams = JSON.stringify(deserialized.params) === JSON.stringify(built.params);
const okCamera = JSON.stringify(deserialized.threeCamera) === JSON.stringify(built.threeCamera);
const okMode = deserialized.observerMode === built.observerMode;

const fidelity = okId && okSeed && okVersion && okTime && okParams && okCamera && okMode;

console.log('checks:', { okId, okSeed, okVersion, okTime, okParams, okCamera, okMode });

if (!fidelity) {
  console.error('FAIL: round-trip values do not match exactly');
  process.exit(1);
}

// Test restore path (simulated setLiveParams + refs)
let restoredParams: FieldParams = {};
const setLiveParams = (updater: any) => {
  restoredParams = typeof updater === 'function' ? updater({}) : updater;
};
const restoreRefs: DriverRefs = {
  timeRef: { current: 0 } as any,
};
const restoredOk = restoreObservationState(deserialized, restoreRefs, setLiveParams);

const restoreTimeOk = restoreRefs.timeRef!.current === 47.291;
const restoreObsOk = (restoredParams as any).observerStrength === 0.92;

if (!restoredOk || !restoreTimeOk || !restoreObsOk) {
  console.error('FAIL: restoreObservationState did not apply values');
  process.exit(1);
}

// Error paths
const bad = deserializeState('not-base64!!!');
if (bad !== null) {
  console.error('FAIL: bad input did not return null');
  process.exit(1);
}

try {
  // @ts-expect-error intentional
  serializeState(null);
  console.error('FAIL: serialize null did not throw');
  process.exit(1);
} catch {}

console.log('=== ROUND-TRIP FIDELITY PROVEN ===');
console.log('All fields (version, id, seed, params incl observerStrength, time, threeCamera, observerMode) survive serialize/deserialize/restore.');
console.log('Contract ready for StudyModal integration + Gamma (3D camera/time wiring) + audio etc.');
process.exit(0);

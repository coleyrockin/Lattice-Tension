"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight } from 'lucide-react';
import type { Journey, FieldParams } from '@/lib/types';
import { Field } from './Field';
import { TensionLattice } from './TensionLattice';
import { toast } from 'sonner';
import {
  serializeState,
  deserializeState,
  buildObservationState,
  restoreObservationState,
  type DriverRefs,
} from '@/lib/state';

interface Props {
  journey: Journey | null;
  onClose: () => void;
  reduced: boolean;
}

export function StudyModal({ journey, onClose, reduced }: Props) {
  if (!journey) return null;

  const isThree = journey.kind === 'three';

  const scrollRef = React.useRef(0.5);
  const velRef = React.useRef(0);
  const pointerRef = React.useRef({ x: 0, y: 0 });
  const timeRef = React.useRef(0); // simulation time offset — part of exact state for moment restore

  // Live params for the dual instrument (Tension Lattice case)
  const [liveParams, setLiveParams] = React.useState<FieldParams>(() => ({
    ridgeFreq: journey.fieldParams?.ridgeFreq ?? 2.1,
    flow: journey.fieldParams?.flow ?? 0.28,
    warmBias: journey.fieldParams?.warmBias ?? 0.55,
    observerStrength: 0.85,
    ...(journey.fieldParams || {}),
  }));

  const updateParam = (key: keyof FieldParams, value: number) => {
    setLiveParams(prev => ({ ...prev, [key]: value }));
  };

  const handleRelax = () => {
    if ((window as any).__aetherRelaxLattice) {
      (window as any).__aetherRelaxLattice();
    }
    toast('Lattice relaxed', { description: 'Returned toward equilibrium.' });
  };

  const handleShareState = () => {
    // Use the canonical unbreakable state model (wraps liveParams + time + refs for dual-instrument fidelity)
    const driverRefs: DriverRefs = { scrollRef, velRef, pointerRef, timeRef };
    const state = buildObservationState(journey, liveParams, driverRefs);
    const encoded = serializeState(state);
    const url = `${window.location.origin}${window.location.pathname}?obs=${journey.id}&state=${encoded}`;
    navigator.clipboard.writeText(url);
    toast.success('Exact state copied', { description: 'Anyone with the link will see the same tension and field.' });
  };

  const handleHandoff = (type: 'grok' | 'imagine') => {
    const state = {
      seed: journey.seed,
      title: journey.title,
      params: liveParams,
      observer: 'pointer + scroll velocity',
    };
    const prompt = `Aether observation: ${journey.title}. Seed ${journey.seed.toString(16)}. ${journey.desc}. Precise ridge/flow parameters: ${JSON.stringify(state.params)}. Render as cinematic scientific sublime still or short loop, cosmic void, accretion orange accents only in light, no text.`;

    if (type === 'imagine') {
      navigator.clipboard.writeText(prompt);
      toast.success('State captured for external render');
    } else {
      toast('State captured', { description: `Seed ${journey.seed} prepared.` });
      window.open(`https://grok.x.ai?observation=${journey.id}&seed=${journey.seed}`, '_blank');
    }
  };

  // === STATE INTEGRATION POINT (Alpha) ===
  // On modal open for a journey, check URL for ?obs=...&state=... (from Share Exact State).
  // If matches, deserialize + restore into liveParams (and timeRef for moment).
  // This is the handoff contract: exact params + time + (future camera) across sessions/tabs/dual instruments.
  // Other agents (Gamma etc) read the restored liveParams + (when wired) timeRef.current / threeCamera from state.
  // The scroll/vel/pointer refs stay the live synergy bridge; state does not fight them on restore.
  React.useEffect(() => {
    if (!journey) return;
    try {
      const sp = new URLSearchParams(window.location.search);
      const obsId = sp.get('obs');
      const stateStr = sp.get('state');
      if (obsId === journey.id && stateStr) {
        const st = deserializeState(stateStr);
        if (st && st.id === journey.id) {
          const driverRefs: DriverRefs = { scrollRef, velRef, pointerRef, timeRef };
          const ok = restoreObservationState(st, driverRefs, setLiveParams);
          if (ok) {
            // silent restore — the dual view will pick up the exact params + time offset on next frame
          }
        }
      }
    } catch {
      // corrupt state param — ignore, start fresh
    }
  }, [journey?.id]);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 md:p-8" onClick={onClose}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="modal-overlay absolute inset-0"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.985, y: 20 }}
          transition={{ type: 'spring', bounce: 0.01, duration: 0.42 }}
          className="modal-content relative w-full max-w-[1200px] overflow-hidden flex flex-col md:flex-row"
          onClick={e => e.stopPropagation()}
        >
          {/* Dual instrument viewport — 2D Field + 3D Tension Lattice when kind === 'three' */}
          <div className="relative md:w-3/5 aspect-[16/10] md:aspect-auto overflow-hidden bg-black flex flex-col md:flex-row">
            {/* 2D Field pane */}
            <div
              className="relative flex-1 min-h-[220px] border-r border-[var(--ae-line)]"
              onPointerMove={(e) => {
                const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                pointerRef.current = {
                  x: ((e.clientX - rect.left) / rect.width - 0.5) * 2,
                  y: ((e.clientY - rect.top) / rect.height - 0.5) * 2,
                };
              }}
            >
              <Field
                seed={journey.seed}
                scrollRef={scrollRef}
                velRef={velRef}
                pointerRef={pointerRef}
                reduced={reduced}
                interactive
                fieldParams={isThree ? liveParams : journey.fieldParams}
                className="absolute inset-0"
              />
              <div className="absolute top-3 left-3 px-2 py-px text-[9px] font-mono tracking-widest bg-black/60 text-[var(--ae-text-2)] border border-[var(--ae-line-faint)]">
                2D FIELD
              </div>
            </div>

            {/* 3D Tension Lattice pane (only for the three kind) */}
            {isThree && (
              <div
                className="relative flex-1 min-h-[220px]"
                onPointerMove={(e) => {
                  const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                  // Also feed pointer into the 3D attention system when moving over the lattice
                  pointerRef.current = {
                    x: ((e.clientX - rect.left) / rect.width - 0.5) * 2,
                    y: ((e.clientY - rect.top) / rect.height - 0.5) * 2,
                  };
                }}
              >
                <TensionLattice
                  seed={journey.seed}
                  fieldParams={liveParams}
                  pointerRef={pointerRef}
                  velRef={velRef}
                  reduced={reduced}
                  className="absolute inset-0"
                />
                <div className="absolute top-3 right-3 px-2 py-px text-[9px] font-mono tracking-widest bg-black/60 text-[var(--ae-text-2)] border border-[var(--ae-line-faint)]">
                  TENSION LATTICE
                </div>
              </div>
            )}

            {!isThree && (
              <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[var(--ae-accent)]/40 to-transparent" />
            )}
          </div>

          {/* Instrument panel */}
          <div className="md:w-2/5 p-8 md:p-10 flex flex-col bg-[var(--ae-surface-2)]">
            <button onClick={onClose} className="self-end -mr-3 -mt-2 mb-6 text-[var(--ae-text-3)] hover:text-[var(--ae-text)] p-2">
              <X size={18} />
            </button>

            <div className="receipt mb-1">OBSERVATION {journey.id.toUpperCase()}</div>
            <div className="text-4xl tracking-[-1.8px] font-semibold leading-none mb-2 text-[var(--ae-text)]">{journey.title}</div>
            <div className="receipt mb-6">SEED 0x{journey.seed.toString(16).toUpperCase()} · {journey.category}</div>

            <div className="text-[15px] leading-snug text-[var(--ae-text-2)] mb-6 poetic">{journey.desc}</div>

            {isThree && (
              <div className="mb-6 text-[10px] font-mono tracking-[2px] text-[var(--ae-text-3)]">
                THE LATTICE AND THE FIELD ARE THE SAME PHENOMENON.<br />
                DRAG THE NODES. HOLD STILL. ORDER EMERGES ONLY UNDER ATTENTION.
                <button
                  onClick={handleRelax}
                  className="mt-3 block w-full py-2 border border-[var(--ae-line)] hover:bg-[var(--ae-surface-3)] active:bg-[var(--ae-accent)] active:text-black transition text-[10px] tracking-[2px]"
                >
                  RELAX — LET IT FIND EQUILIBRIUM
                </button>
              </div>
            )}

            <div className="flex flex-wrap gap-2 mb-8">
              {journey.tags.map(t => (
                <div key={t} className="px-3 py-1 text-xs rounded-full bg-[var(--ae-void-3)] text-[var(--ae-text-3)] border border-[var(--ae-line)] font-mono tracking-widest">
                  {t}
                </div>
              ))}
            </div>

            <div className="mt-auto space-y-3">
              {isThree ? (
                <>
                  <button
                    onClick={handleShareState}
                    className="w-full flex items-center justify-center gap-2 h-12 rounded-xl border border-[var(--ae-accent-line)] hover:bg-[var(--ae-accent-weak)] active:bg-[var(--ae-accent)] active:text-black transition text-sm font-medium tracking-wide"
                  >
                    SHARE EXACT STATE
                  </button>
                  <button
                    onClick={() => handleHandoff('imagine')}
                    className="w-full flex items-center justify-center gap-2 h-12 rounded-xl border border-[var(--ae-line)] hover:bg-[var(--ae-surface-3)] active:bg-[var(--ae-surface)] transition text-sm font-medium tracking-wide"
                  >
                    CAPTURE FOR RENDER
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => handleHandoff('imagine')}
                    className="w-full flex items-center justify-center gap-2 h-12 rounded-xl border border-[var(--ae-accent-line)] hover:bg-[var(--ae-accent-weak)] active:bg-[var(--ae-accent)] active:text-black transition text-sm font-medium tracking-wide"
                  >
                    RENDER THIS STATE WITH IMAGINE <ArrowRight size={15} />
                  </button>
                  <button
                    onClick={() => handleHandoff('grok')}
                    className="w-full flex items-center justify-center gap-2 h-12 rounded-xl border border-[var(--ae-line)] hover:bg-[var(--ae-surface-3)] active:bg-[var(--ae-surface)] transition text-sm font-medium tracking-wide"
                  >
                    CONTINUE OBSERVATION IN GROK
                  </button>
                </>
              )}
            </div>

            <div className="text-center text-[10px] text-[var(--ae-text-faint)] mt-6 font-mono tracking-widest">
              {isThree
                ? 'DRAG NODES IN THE LATTICE OR POINTER IN THE FIELD · PARAMS AFFECT BOTH · ESC TO CLOSE'
                : 'DRAG POINTER ON FIELD · SCROLL TO SHIFT LIGHT ARC · ESC TO CLOSE'}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

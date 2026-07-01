import { useEffect, useRef, useState } from "react";
import { CHAPTERS, PHILOSOPHICAL_FRAGMENTS } from "../chapters/definitions";
import {
  getActiveChapterIndex,
  normalizeAtlasForShare,
} from "../chapters/atlas";
import { useExperienceStore } from "../experience/store";
import { useSmoothedDescent } from "../experience/useSmoothedDescent";
import { ResonanceImprint } from "./ResonanceImprint";

// Each realm names its own character — the label encodes what the place IS.
const REALM_LABELS: Record<string, string> = {
  origin: "Genesis",
};

export function InterfaceOverlay() {
  const progress = useSmoothedDescent();
  const ready = useExperienceStore((state) => state.ready);
  const audioEnabled = useExperienceStore((state) => state.audioEnabled);
  const selectedFragment = useExperienceStore(
    (state) => state.selectedFragment,
  );
  const setAudioEnabled = useExperienceStore(
    (state) => state.setAudioEnabled,
  );
  const setSelectedFragment = useExperienceStore(
    (state) => state.setSelectedFragment,
  );
  const resonance = useExperienceStore((state) => state.resonance);

  const [shareState, setShareState] = useState<"idle" | "copied">("idle");
  const [entered, setEntered] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.has("p");
  });
  const fragmentCloseRef = useRef<HTMLButtonElement>(null);

  const activeIndex = getActiveChapterIndex(progress);
  const chapter = CHAPTERS[activeIndex];
  const inExtendedRealm = progress >= 1;
  const realmLabel = REALM_LABELS[chapter.id] ?? "Realm";

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--resonance-intensity",
      resonance.toFixed(3),
    );
  }, [resonance]);

  // Move focus into the fragment dialog when it opens (Escape closes it).
  useEffect(() => {
    if (selectedFragment) fragmentCloseRef.current?.focus();
  }, [selectedFragment]);

  useEffect(() => {
    if (shareState !== "copied") return;
    const timer = window.setTimeout(() => setShareState("idle"), 2200);
    return () => window.clearTimeout(timer);
  }, [shareState]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.target as HTMLElement).closest("input, textarea, select, [contenteditable]")) return;
      if (event.key === "f" || event.key === "F") {
        setSelectedFragment({
          nodeId: activeIndex,
          text: PHILOSOPHICAL_FRAGMENTS[activeIndex],
        });
      }
      if (event.key === "Escape") {
        setSelectedFragment(null);
      }
      if (event.key === "m" || event.key === "M") {
        setAudioEnabled(!audioEnabled);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeIndex, audioEnabled, setAudioEnabled, setSelectedFragment]);

  const copyShareLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?p=${normalizeAtlasForShare(progress).toFixed(3)}&r=${resonance.toFixed(2)}`;
    navigator.clipboard?.writeText(url).then(() => {
      setShareState("copied");
    }).catch(() => {});
  };

  return (
    <div className={`interface ${entered ? "is-entered" : ""}`} data-aether-ui>
      <div className="atmosphere" aria-hidden="true" />
      <ResonanceImprint />

      <header className="brand">
        <h1 className="brand__mark">TENSION&nbsp;LATTICE</h1>
        <span className="brand__subtitle">Aether Atlas</span>
      </header>

      <div className="hud-controls">
        <button
          className="sound-control"
          type="button"
          aria-pressed={audioEnabled}
          aria-label={audioEnabled ? "Mute generative sound" : "Enable sound"}
          onClick={() => setAudioEnabled(!audioEnabled)}
        >
          <span className="sound-control__label">
            {audioEnabled ? "Sound on" : "Sound off"}
          </span>
          <span className="sound-control__bars" aria-hidden="true">
            {Array.from({ length: 7 }, (_, index) => (
              <i key={index} />
            ))}
          </span>
        </button>

        <button
          className="share-control"
          type="button"
          onClick={copyShareLink}
        >
          <span aria-live="polite">
            {shareState === "copied" ? "Link copied" : "Share Atlas"}
          </span>
        </button>
      </div>

      <div
        className="resonance-meter"
        role="meter"
        aria-label="Resonance imprint"
        aria-valuenow={Math.round(resonance * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <svg viewBox="0 0 36 36" aria-hidden="true">
          <circle className="resonance-meter__track" cx="18" cy="18" r="15.5" />
          <circle
            className="resonance-meter__fill"
            cx="18"
            cy="18"
            r="15.5"
            style={{
              strokeDashoffset: `${97.4 * (1 - resonance / 2.2)}`,
            }}
          />
        </svg>
        <span>Resonance</span>
      </div>

      <section className={`chapter chapter--${chapter.id}`} key={chapter.id}>
        <div className="chapter__meta">
          <span className="chapter__index">
            {String(chapter.index + 1).padStart(2, "0")}
          </span>
          <span className="chapter__realm">{realmLabel}</span>
        </div>
        <p className="chapter__statement" role="heading" aria-level={2}>
          {chapter.statement}
        </p>
        <button
          className="chapter__fragment"
          type="button"
          onClick={() =>
            setSelectedFragment({
              nodeId: activeIndex,
              text: PHILOSOPHICAL_FRAGMENTS[activeIndex],
            })
          }
        >
          Read the fragment
        </button>
      </section>

      <div className="sr-only" aria-live="polite">
        {realmLabel} — {chapter.title}. {chapter.statement}
      </div>

      <div className="interaction-cue" aria-hidden="true">
        <span>
          {progress < 0.08
            ? "Scroll to enter the atlas"
            : inExtendedRealm
              ? "Your imprint shapes what returns"
              : "Drag — leave your mark on the aether"}
        </span>
        <i />
      </div>

      <div
        className={`loading-screen ${ready && entered ? "is-ready" : ""}`}
        aria-hidden={ready && entered ? true : undefined}
      >
        <div className="loading-screen__signal">
          <i />
          <i />
          <i />
        </div>
        <div className="loading-screen__copy">
          <span>TENSION&nbsp;LATTICE</span>
          <p role="status">
            {ready
              ? "Lattice calibration complete"
              : "Initializing the gyroid descent"}
          </p>
          {ready && (
            <button
              className="enter-btn"
              type="button"
              onClick={() => {
                setEntered(true);
                setAudioEnabled(true);
              }}
            >
              Step into the Aether
            </button>
          )}
        </div>
      </div>

      {selectedFragment ? (
        <div
          className="fragment"
          role="dialog"
          aria-modal="true"
          aria-label="Philosophical fragment"
          onKeyDown={(event) => {
            if (event.key === "Tab") {
              event.preventDefault();
              fragmentCloseRef.current?.focus();
            }
          }}
        >
          <button
            ref={fragmentCloseRef}
            type="button"
            aria-label="Close fragment"
            onClick={() => setSelectedFragment(null)}
          >
            Close
          </button>
          <span>
            Fragment {String(selectedFragment.nodeId + 1).padStart(2, "0")}
          </span>
          <p>{selectedFragment.text}</p>
        </div>
      ) : null}
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { CHAPTERS, PHILOSOPHICAL_FRAGMENTS } from "../chapters/definitions";
import {
  ATLAS_MAX,
  getChapterCenterProgress,
  getActiveChapterIndex,
  normalizeAtlasForShare,
  scrollYForAtlasProgress,
} from "../chapters/atlas";
import { useExperienceStore } from "../experience/store";
import { useSmoothedDescent } from "../experience/useSmoothedDescent";
import { ResonanceImprint } from "./ResonanceImprint";

// Each realm names its own character — the label encodes what the place IS,
// not a flat "Core" category (the Core/Atlas region split lives in the rail zones).
const REALM_LABELS: Record<string, string> = {
  origin: "Genesis",
  tension: "Strain",
  pattern: "Lattice",
  collapse: "Implosion",
  emergence: "Bloom",
  aether: "Field",
  interference: "Wave",
  singularity: "Horizon",
  quantum: "Fold",
  nebula: "Veil",
  echo: "Memory",
  origin_core: "Return",
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

  const autoplay = useExperienceStore((state) => state.autoplay);
  const setAutoplay = useExperienceStore((state) => state.setAutoplay);

  const [shareState, setShareState] = useState<"idle" | "copied">("idle");
  const [entered, setEntered] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.has("p");
  });
  const fragmentCloseRef = useRef<HTMLButtonElement>(null);

  const activeIndex = getActiveChapterIndex(progress);
  const chapter = CHAPTERS[activeIndex];
  const atlasDepth = progress / ATLAS_MAX;
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

  const navigateToChapter = (index: number) => {
    window.scrollTo({
      top: scrollYForAtlasProgress(getChapterCenterProgress(index)),
      behavior: "smooth",
    });
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.target as HTMLElement).closest("input, textarea, select, [contenteditable]")) return;
      if (event.key === "ArrowDown" || event.key === "j" || event.key === "J") {
        event.preventDefault();
        navigateToChapter(Math.min(CHAPTERS.length - 1, activeIndex + 1));
      }
      if (event.key === "ArrowUp" || event.key === "k" || event.key === "K") {
        event.preventDefault();
        navigateToChapter(Math.max(0, activeIndex - 1));
      }
      if (event.key === "f" || event.key === "F") {
        setSelectedFragment({
          nodeId: activeIndex,
          text: PHILOSOPHICAL_FRAGMENTS[activeIndex],
        });
      }
      if (event.key === "Escape") {
        setSelectedFragment(null);
      }
      if (event.key === " ") {
        event.preventDefault();
        setAutoplay(!autoplay);
      }
      if (event.key === "m" || event.key === "M") {
        setAudioEnabled(!audioEnabled);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeIndex, audioEnabled, autoplay, setAudioEnabled, setAutoplay, setSelectedFragment]);

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
          className="autoplay-control"
          type="button"
          aria-pressed={autoplay}
          aria-label={autoplay ? "Pause autoplay descent" : "Start autoplay descent"}
          onClick={() => setAutoplay(!autoplay)}
        >
          <span className="autoplay-control__label">
            {autoplay ? "Autoplay on" : "Autoplay off"}
          </span>
          <span className="autoplay-control__icon" aria-hidden="true">
            {autoplay ? (
              <svg viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
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

      <nav className="chapter-rail" aria-label="Aether chapters">
        <div className="chapter-rail__zones" aria-hidden="true">
          <span>Core</span>
          <span>Atlas</span>
        </div>
        <div className="chapter-rail__line">
          <span
            style={{
              transform: `scaleY(${Math.max(0.02, atlasDepth)})`,
            }}
          />
        </div>
        {CHAPTERS.map((item, index) => (
          <button
            key={item.id}
            type="button"
            className={index === activeIndex ? "is-active" : ""}
            onClick={() => navigateToChapter(index)}
            aria-label={`Go to ${item.title}`}
            aria-current={index === activeIndex ? "step" : undefined}
          >
            <span className="chapter-rail__index">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="chapter-rail__tooltip">{item.title}</span>
            <i />
          </button>
        ))}
      </nav>

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

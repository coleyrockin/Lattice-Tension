import { useEffect, useState } from "react";
import { CHAPTERS, PHILOSOPHICAL_FRAGMENTS } from "../chapters/definitions";
import {
  ATLAS_MAX,
  getChapterCenterProgress,
  getActiveChapterIndex,
  normalizeAtlasForShare,
  scrollYForAtlasProgress,
} from "../chapters/atlas";
import { sampleExperience } from "../chapters/interpolate";
import { useExperienceStore } from "../experience/store";
import { useSmoothedDescent } from "../experience/useSmoothedDescent";
import { ResonanceImprint } from "./ResonanceImprint";

const REALM_LABELS: Record<string, string> = {
  origin: "Core",
  tension: "Core",
  pattern: "Core",
  collapse: "Core",
  emergence: "Core",
  aether: "Core",
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
  const profile = useExperienceStore((state) => state.profile);
  
  const autoplay = useExperienceStore((state) => state.autoplay);
  const setAutoplay = useExperienceStore((state) => state.setAutoplay);
  const telemetryOpen = useExperienceStore((state) => state.telemetryOpen);
  const setTelemetryOpen = useExperienceStore((state) => state.setTelemetryOpen);
  const manualTension = useExperienceStore((state) => state.manualTension);
  const setManualTension = useExperienceStore((state) => state.setManualTension);

  const [shareState, setShareState] = useState<"idle" | "copied">("idle");
  const [entered, setEntered] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.has("p");
  });

  const activeIndex = getActiveChapterIndex(progress);
  const chapter = CHAPTERS[activeIndex];
  const sampled = sampleExperience(progress);
  const atlasDepth = progress / ATLAS_MAX;
  const inExtendedRealm = progress >= 1;
  const realmLabel = REALM_LABELS[chapter.id] ?? "Realm";

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--resonance-intensity",
      resonance.toFixed(3),
    );
  }, [resonance]);

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
      if ((event.target as HTMLElement).closest("[data-aether-ui] input")) return;
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
      if (event.key === " " && !(event.target as HTMLElement).closest("input")) {
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
        <span className="brand__mark">TENSION&nbsp;LATTICE</span>
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
          aria-label="Copy link to your resonant descent"
          onClick={copyShareLink}
        >
          <span>{shareState === "copied" ? "Link copied" : "Share Atlas"}</span>
        </button>
      </div>

      <div
        className="resonance-meter"
        aria-label={`Resonance imprint ${Math.round(resonance * 100)} percent`}
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
        <span>Imprint</span>
      </div>

      <section
        className={`chapter chapter--${chapter.id}`}
        key={chapter.id}
        aria-live="polite"
      >
        <div className="chapter__meta">
          <span className="chapter__index">
            {String(chapter.index + 1).padStart(2, "0")}
          </span>
          <span className="chapter__realm">{realmLabel}</span>
        </div>
        <h1>{chapter.title}</h1>
        <p>{chapter.statement}</p>
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
          Read fragment
        </button>
        {inExtendedRealm ? (
          <div className="chapter__depth" aria-hidden="true">
            Depth {(atlasDepth * 100).toFixed(0)}%
          </div>
        ) : null}
      </section>

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

      <div className="atlas-bar" aria-hidden="true">
        <span
          className="atlas-bar__fill"
          style={{ transform: `scaleX(${Math.max(0.01, atlasDepth)})` }}
        />
      </div>

      <button
        className="telemetry-toggle-btn"
        type="button"
        onClick={() => setTelemetryOpen(!telemetryOpen)}
        aria-label={telemetryOpen ? "Hide telemetry panel" : "Show telemetry panel"}
      >
        {telemetryOpen ? "[ DIAGNOSTICS ]" : "[ TELEMETRY ]"}
      </button>

      <div className={`telemetry-panel ${telemetryOpen ? "is-open" : "is-collapsed"}`} aria-hidden={!telemetryOpen}>
        <div className="telemetry-header">
          <span>FIELD TELEMETRY</span>
          <span className="telemetry-badge">ACTIVE</span>
        </div>
        <div className="telemetry-grid">
          <div className="telemetry-row telemetry-row--tension">
            <span className="telemetry-label">Tension</span>
            <span className="telemetry-value">
              {(sampled.simulation.tension * 100).toFixed(0)}%
              {manualTension !== null && " (Manual)"}
            </span>
            <div className="telemetry-slider-container">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={manualTension ?? sampled.simulation.tension}
                onChange={(e) => setManualTension(parseFloat(e.target.value))}
                className="telemetry-slider"
                style={{
                  background: `linear-gradient(90deg, var(--chapter-primary) 0%, var(--chapter-accent) ${sampled.simulation.tension * 100}%, rgba(255, 255, 255, 0.06) ${sampled.simulation.tension * 100}%)`
                }}
                aria-label="Manual tension override slider"
              />
              {manualTension !== null && (
                <button
                  type="button"
                  className="telemetry-reset-btn"
                  onClick={() => setManualTension(null)}
                  aria-label="Reset tension"
                >
                  [ RESET ]
                </button>
              )}
            </div>
          </div>
          <div className="telemetry-row">
            <span className="telemetry-label">Order</span>
            <span className="telemetry-value">{(sampled.simulation.order * 100).toFixed(0)}%</span>
            <div className="telemetry-bar">
              <span style={{ width: `${sampled.simulation.order * 100}%` }} />
            </div>
          </div>
          <div className="telemetry-row">
            <span className="telemetry-label">Singularity</span>
            <span className="telemetry-value">{(sampled.simulation.singularity * 100).toFixed(0)}%</span>
            <div className="telemetry-bar">
              <span style={{ width: `${sampled.simulation.singularity * 100}%` }} />
            </div>
          </div>
          <div className="telemetry-row">
            <span className="telemetry-label">Imprint</span>
            <span className="telemetry-value">{(resonance * 100).toFixed(0)}%</span>
            <div className="telemetry-bar">
              <span style={{ width: `${Math.min(100, (resonance / 2.2) * 100)}%` }} />
            </div>
          </div>
        </div>
        <div className="telemetry-footer">
          <span>GPU TIER: {profile?.tier.toUpperCase() ?? "N/A"}</span>
          <span>DPR: {profile?.maxDpr.toFixed(2) ?? "1.00"}x</span>
        </div>
        <div className="telemetry-oscilloscope">
          {Array.from({ length: 10 }).map((_, i) => (
            <span key={i} className="wave-bar" style={{ animationDelay: `${i * -150}ms` }} />
          ))}
        </div>
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
        aria-hidden={ready && entered}
      >
        <div className="loading-screen__signal">
          <i />
          <i />
          <i />
        </div>
        <div className="loading-screen__copy">
          <span>TENSION&nbsp;LATTICE</span>
          <p>
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
        >
          <button
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

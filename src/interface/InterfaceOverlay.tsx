import { CHAPTERS } from "../chapters/definitions";
import { useExperienceStore } from "../experience/store";

export function InterfaceOverlay() {
  const progress = useExperienceStore((state) => state.scrollProgress);
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
  const activeIndex = Math.min(
    CHAPTERS.length - 1,
    Math.floor(progress * CHAPTERS.length),
  );
  const chapter = CHAPTERS[activeIndex];

  const navigateToChapter = (index: number) => {
    const scrollable =
      document.documentElement.scrollHeight - window.innerHeight;
    const destination = (index / (CHAPTERS.length - 0.01)) * scrollable;
    window.scrollTo({ top: destination, behavior: "smooth" });
  };

  return (
    <div className="interface" data-aether-ui>
      <header className="brand">
        <span>AETHER</span>
      </header>

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

      <section
        className={`chapter chapter--${chapter.id}`}
        key={chapter.id}
        aria-live="polite"
      >
        <div className="chapter__index">
          {String(chapter.index + 1).padStart(2, "0")}
        </div>
        <h1>{chapter.title}</h1>
        <p>{chapter.statement}</p>
      </section>

      <nav className="chapter-rail" aria-label="Aether chapters">
        <div className="chapter-rail__line">
          <span
            style={{
              transform: `scaleY(${Math.max(0.02, progress)})`,
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
            <span>{String(index + 1).padStart(2, "0")}</span>
            <i />
          </button>
        ))}
      </nav>

      <div className="interaction-cue" aria-hidden="true">
        <span>{progress < 0.035 ? "Scroll to enter" : "Drag the field"}</span>
        <i />
      </div>

      <div
        className={`loading-screen ${ready ? "is-ready" : ""}`}
        aria-hidden={ready}
      >
        <div className="loading-screen__signal">
          <i />
          <i />
          <i />
        </div>
        <span>AETHER</span>
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

import { useState } from "react";
import { organismController } from "../simulation/organismController";
import { useExperienceStore } from "../experience/store";

export function InterfaceOverlay() {
  const ready = useExperienceStore((state) => state.ready);
  const audioEnabled = useExperienceStore((state) => state.audioEnabled);
  const setAudioEnabled = useExperienceStore((state) => state.setAudioEnabled);
  const [announcement, setAnnouncement] = useState(
    "Aesther is ready. Press Enter or Space to touch the center, or use arrow keys to send a gentle impulse.",
  );

  const sendKeyboardImpulse = (direction: [number, number], message: string) => {
    organismController.pulseFromKeyboard(direction);
    setAnnouncement(message);
  };

  return (
    <div className="interface" data-aesther-ui>
      <div className="atmosphere" aria-hidden="true" />

      <header className="brand">
        <h1 className="brand__mark">AESTHER</h1>
      </header>

      <div className="hud-controls">
        <button
          className="sound-control"
          type="button"
          aria-pressed={audioEnabled}
          aria-label={audioEnabled ? "Mute Aesther" : "Enable Aesther sound"}
          onClick={() => setAudioEnabled(!audioEnabled)}
        >
          <span className="sound-control__label">
            {audioEnabled ? "Sound on" : "Sound off"}
          </span>
          <span className="sound-control__bars" aria-hidden="true">
            {Array.from({ length: 5 }, (_, index) => (
              <i key={index} />
            ))}
          </span>
        </button>
      </div>

      <button
        className="organism-accessibility-target"
        type="button"
        aria-label="Interact with Aesther. Press Enter or Space for a center touch. Arrow keys send directional impulses."
        onClick={() => sendKeyboardImpulse([0, 0], "Aesther ripples from the center.")}
        onKeyDown={(event) => {
          const impulses: Record<string, [number, number]> = {
            ArrowUp: [0, 0.78],
            ArrowDown: [0, -0.78],
            ArrowLeft: [-0.78, 0],
            ArrowRight: [0.78, 0],
          };
          const direction = impulses[event.key];
          if (!direction) return;
          event.preventDefault();
          sendKeyboardImpulse(direction, "Aesther receives a directional impulse.");
        }}
      >
        Touch Aesther
      </button>
      <div className="sr-only" aria-live="polite">
        {announcement}
      </div>

      <div className={`loading-screen ${ready ? "is-ready" : ""}`} role="status">
        <div className="loading-screen__signal" aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
        <p>{ready ? "Aesther is awake" : "Forming Aesther"}</p>
      </div>
    </div>
  );
}

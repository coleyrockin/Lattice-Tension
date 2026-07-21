import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ExperienceErrorBoundary } from "./ExperienceErrorBoundary";

function BrokenScene(): never {
  throw new Error("scene render failed");
}

describe("ExperienceErrorBoundary", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it("renders children while the experience is healthy", () => {
    act(() => {
      root.render(
        <ExperienceErrorBoundary>
          <p>Living surface</p>
        </ExperienceErrorBoundary>,
      );
    });

    expect(container.textContent).toBe("Living surface");
  });

  it("shows the designed fallback and reports render failures", () => {
    const onError = vi.fn();
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    try {
      act(() => {
        root.render(
          <ExperienceErrorBoundary onError={onError}>
            <BrokenScene />
          </ExperienceErrorBoundary>,
        );
      });

      expect(container.querySelector(".fallback")).not.toBeNull();
      expect(container.textContent).toContain("The water is still here.");
      expect(onError).toHaveBeenCalledOnce();
      expect(onError.mock.calls[0][0]).toMatchObject({
        message: "scene render failed",
      });
    } finally {
      consoleError.mockRestore();
    }
  });
});

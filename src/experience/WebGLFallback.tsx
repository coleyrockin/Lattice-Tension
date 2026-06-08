export function WebGLFallback() {
  return (
    <main className="fallback">
      <div className="fallback__point" />
      <p>AETHER</p>
      <h1>The field is still here.</h1>
      <span>
        This device could not initialize WebGL, so the living lattice has been
        quieted into a static signal.
      </span>
    </main>
  );
}

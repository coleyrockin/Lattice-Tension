import { describe, expect, it } from "vitest";
import { createSeededRandom } from "./seeded";
import { createLatticeField } from "./field";

describe("seeded generation", () => {
  it("returns the same sequence for the same seed", () => {
    const first = createSeededRandom(42);
    const second = createSeededRandom(42);
    expect(Array.from({ length: 8 }, first)).toEqual(
      Array.from({ length: 8 }, second),
    );
  });

  it("builds stable lattice geometry", () => {
    const first = createLatticeField(32, 7);
    const second = createLatticeField(32, 7);
    expect(first.nodes.map((node) => node.base.toArray())).toEqual(
      second.nodes.map((node) => node.base.toArray()),
    );
    expect(first.edges).toEqual(second.edges);
    expect(first.edges.length).toBeGreaterThan(30);
  });
});

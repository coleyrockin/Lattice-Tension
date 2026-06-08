import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { Color } from "three";
import { JellyOrb } from "./JellyOrb";
import { GyroidLattice } from "./GyroidLattice";

export function AetherWorld() {
  const scene = useThree((state) => state.scene);

  useEffect(() => {
    scene.background = new Color("#020207");
    scene.fog = null;
  }, [scene]);

  // The journey: the orb floats on black, the camera falls into it, and the
  // gyroid lattice crossfades in (renderOrder 10, alpha = descent reveal).
  return (
    <>
      <JellyOrb />
      <GyroidLattice />
    </>
  );
}

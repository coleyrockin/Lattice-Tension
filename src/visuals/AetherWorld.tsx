import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { Color } from "three";
import { GyroidLattice } from "./GyroidLattice";

export function AetherWorld() {
  const scene = useThree((state) => state.scene);

  useEffect(() => {
    scene.background = new Color("#020207");
    scene.fog = null;
  }, [scene]);

  // Phase 2: gyroid centerpiece in isolation (orb + crossfade compose in Phase 3)
  return <GyroidLattice tension={0.16} />;
}

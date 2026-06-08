import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { Color } from "three";
import { JellyOrb } from "./JellyOrb";

export function AetherWorld() {
  const scene = useThree((state) => state.scene);

  useEffect(() => {
    scene.background = new Color("#020207");
    scene.fog = null;
  }, [scene]);

  return <JellyOrb />;
}

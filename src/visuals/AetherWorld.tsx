import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { Color, FogExp2, Group, PointLight } from "three";
import { sampleExperience } from "../chapters/interpolate";
import { useExperienceStore } from "../experience/store";
import { Atmosphere } from "./Atmosphere";
import { AttractorLines } from "./AttractorLines";
import { ContourStack } from "./ContourStack";
import { InterferenceMembranes } from "./InterferenceMembranes";
import { LatticeField } from "./LatticeField";
import { OrganicShells } from "./OrganicShells";
import { OriginSignal } from "./OriginSignal";
import { RippleWells } from "./RippleWells";
import { ScaleFunnel } from "./ScaleFunnel";
import { SpectralRibbons } from "./SpectralRibbons";
import { StressFilaments } from "./StressFilaments";

export function AetherWorld() {
  const world = useRef<Group>(null);
  const accentLight = useRef<PointLight>(null);
  const primaryLight = useRef<PointLight>(null);
  const scene = useThree((state) => state.scene);
  const fog = useMemo(() => new FogExp2("#05030d", 0.035), []);
  const background = useMemo(() => new Color("#020207"), []);

  useFrame((state, delta) => {
    const group = world.current;
    if (!group) return;
    const store = useExperienceStore.getState();
    const sample = sampleExperience(store.scrollProgress);
    const time = state.clock.elapsedTime;
    const motion = store.reducedMotion ? 0.12 : 1;

    background.lerp(new Color(sample.palette.void), 0.06);
    scene.background = background;
    scene.fog = fog;
    fog.color.copy(background).offsetHSL(0.02, 0.08, 0.014);
    fog.density =
      0.026 +
      sample.visual.collapseDistortion * 0.034 -
      sample.simulation.emergence * 0.006;

    group.rotation.y += delta * 0.018 * motion;
    group.rotation.x =
      Math.sin(time * 0.12) * 0.035 * motion + store.drag.y * 0.6;
    group.rotation.z =
      Math.cos(time * 0.08) * 0.018 * motion - store.drag.x * 0.45;
    group.scale.setScalar(
      0.91 +
        sample.simulation.birth * 0.09 -
        sample.visual.collapseDistortion * 0.18 +
        sample.simulation.emergence * 0.07,
    );

    if (accentLight.current) {
      accentLight.current.color.lerp(
        new Color(sample.palette.accent),
        0.06,
      );
      accentLight.current.intensity =
        12 + sample.visual.stressIntensity * 38;
    }
    if (primaryLight.current) {
      primaryLight.current.color.lerp(
        new Color(sample.palette.primary),
        0.06,
      );
      primaryLight.current.intensity =
        10 +
        sample.visual.membraneOpacity * 14 +
        sample.simulation.emergence * 18;
    }
  });

  return (
    <>
      <ambientLight intensity={0.08} />
      <pointLight ref={accentLight} position={[4, -1, 3]} distance={14} />
      <pointLight ref={primaryLight} position={[-4, 2, 3]} distance={16} />
      <group ref={world}>
        <Atmosphere />
        <ScaleFunnel />
        <RippleWells />
        <ContourStack />
        <InterferenceMembranes />
        <OrganicShells />
        <AttractorLines />
        <StressFilaments />
        <LatticeField />
        <OriginSignal />
        <SpectralRibbons />
      </group>
    </>
  );
}

import {
  Bloom,
  ChromaticAberration,
  DepthOfField,
  EffectComposer,
  Noise,
  Vignette,
} from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { Vector2 } from "three";
import { sampleExperience } from "../chapters/interpolate";
import { useExperienceStore } from "../experience/store";

export function PostEffects() {
  const progress = useExperienceStore((state) => state.scrollProgress);
  const profile = useExperienceStore((state) => state.profile);
  const sample = sampleExperience(progress);
  const bloomIntensity =
    sample.post.bloom * (0.78 + sample.visual.stressIntensity * 0.38);
  const grainOpacity =
    0.03 + sample.visual.collapseDistortion * 0.055;

  if (profile?.depthOfField) {
    return (
      <EffectComposer multisampling={profile.tier === "high" ? 4 : 0}>
        <Bloom
          intensity={bloomIntensity}
          luminanceThreshold={0.2}
          luminanceSmoothing={0.74}
          mipmapBlur
        />
        <DepthOfField
          focusDistance={0.013}
          focalLength={0.038}
          bokehScale={sample.post.depthOfField * 2.1}
          height={480}
        />
        <ChromaticAberration
          blendFunction={BlendFunction.NORMAL}
          offset={
            new Vector2(
              sample.post.aberration,
              sample.post.aberration * 0.55,
            )
          }
          radialModulation
          modulationOffset={0.3}
        />
        <Noise
          premultiply
          blendFunction={BlendFunction.SOFT_LIGHT}
          opacity={grainOpacity}
        />
        <Vignette
          eskil={false}
          offset={0.18}
          darkness={sample.post.vignette}
        />
      </EffectComposer>
    );
  }

  return (
    <EffectComposer multisampling={profile?.tier === "high" ? 4 : 0}>
      <Bloom
        intensity={bloomIntensity}
        luminanceThreshold={0.2}
        luminanceSmoothing={0.74}
        mipmapBlur
      />
      <ChromaticAberration
        blendFunction={BlendFunction.NORMAL}
        offset={
          new Vector2(sample.post.aberration, sample.post.aberration * 0.55)
        }
        radialModulation
        modulationOffset={0.3}
      />
      <Noise
        premultiply
        blendFunction={BlendFunction.SOFT_LIGHT}
        opacity={grainOpacity}
      />
      <Vignette
        eskil={false}
        offset={0.18}
        darkness={sample.post.vignette}
      />
    </EffectComposer>
  );
}

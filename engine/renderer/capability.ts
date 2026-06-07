export type RenderTier = 'A' | 'B' | 'C';

export type RendererInfo = {
  tier: RenderTier;
  label: string;
};

export function detectRenderTier(): RenderTier {
  if (typeof window === 'undefined') return 'B';
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return 'C';
  if ('gpu' in navigator) return 'A';
  return 'B';
}

export function tierLabel(tier: RenderTier): string {
  switch (tier) {
    case 'A':
      return 'WebGPU';
    case 'B':
      return 'WebGL2';
    case 'C':
      return 'Reduced';
  }
}

export function detectRendererInfo(): RendererInfo {
  const tier = detectRenderTier();
  return { tier, label: tierLabel(tier) };
}
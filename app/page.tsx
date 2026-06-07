'use client';

import dynamic from 'next/dynamic';

const AetherExperience = dynamic(
  () => import('@/components/canvas/AetherExperience').then((m) => m.AetherExperience),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[100dvh] w-full items-center justify-center bg-[#0a0618]">
        <div className="mono text-[10px] tracking-[0.4em] text-white/30">AETHER</div>
      </div>
    ),
  },
);

export default function Page() {
  return <AetherExperience />;
}
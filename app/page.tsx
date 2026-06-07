'use client';

import dynamic from 'next/dynamic';

const AetherApp = dynamic(() => import('@/aether/App').then((m) => m.AetherApp), {
  ssr: false,
  loading: () => (
    <div className="flex h-[100dvh] w-full items-center justify-center bg-black">
      <span className="font-mono text-[9px] tracking-[0.5em] text-white/25">AETHER</span>
    </div>
  ),
});

export default function Page() {
  return <AetherApp />;
}
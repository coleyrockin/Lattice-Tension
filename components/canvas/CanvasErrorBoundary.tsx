'use client';

import { Component, type ReactNode } from 'react';

type Props = { children: ReactNode };

export class CanvasErrorBoundary extends Component<Props> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Lattice Tension Canvas error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="absolute inset-0 flex items-center justify-center mono text-[#f8f4ff]/40 text-sm tracking-[3px]">
          LATTICE TENSION — WEBGL REQUIRED FOR FULL EXPERIENCE
        </div>
      );
    }
    return this.props.children;
  }
}
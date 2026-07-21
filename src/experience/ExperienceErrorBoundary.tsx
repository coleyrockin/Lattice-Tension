import { Component, type ErrorInfo, type ReactNode } from "react";
import { WebGLFallback } from "./WebGLFallback";

type ExperienceErrorBoundaryProps = {
  children: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
};

type ExperienceErrorBoundaryState = {
  failed: boolean;
};

export class ExperienceErrorBoundary extends Component<
  ExperienceErrorBoundaryProps,
  ExperienceErrorBoundaryState
> {
  state: ExperienceErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): ExperienceErrorBoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.failed) return <WebGLFallback />;
    return this.props.children;
  }
}

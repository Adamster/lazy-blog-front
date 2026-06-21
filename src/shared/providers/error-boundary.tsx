import { Component, ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false, error: undefined };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="mono-scope min-h-app flex flex-col items-center justify-center gap-6 bg-[var(--m-bg)] px-10 text-center text-[var(--m-fg)]"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          <div className="mono-label">{"// ERROR"}</div>
          <h2 className="font-display text-[32px] leading-none font-bold tracking-[-0.02em]">
            A glitch in the Lazyverse… 😢
          </h2>
          <p className="max-w-[46em] text-[14px] leading-[1.6] text-[var(--m-muted)]">
            {this.state.error?.message || "Unknown Error"}
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

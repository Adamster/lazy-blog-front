import { Component, ReactNode } from "react";
import { ErrorMessage } from "@/shared/ui";

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
      // One error surface: the runtime boundary renders the SAME glitch page
      // (`ErrorMessage`) the route error / 404 use, instead of its own variant.
      return (
        this.props.fallback ?? (
          <ErrorMessage error={this.state.error} reset={this.resetError} />
        )
      );
    }
    return this.props.children;
  }
}

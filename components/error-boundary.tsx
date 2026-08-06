// components/error-boundary.tsx
"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-void-navy flex items-center justify-center px-4">
          <div className="text-center space-y-4 max-w-md">
            <div className="w-16 h-16 mx-auto rounded-full bg-solar-amber/20 flex items-center justify-center">
              <AlertTriangle size={32} className="text-solar-amber" />
            </div>
            <h2 className="text-xl font-display text-starlight">
              Something went wrong
            </h2>
            <p className="text-faint-star">
              {this.state.error?.message || "An unexpected error occurred"}
            </p>
            <Button
              onClick={() => window.location.reload()}
              className="bg-aurora-green text-void-navy hover:bg-aurora-green/90"
            >
              <RefreshCw size={16} className="mr-2" />
              Reload Page
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

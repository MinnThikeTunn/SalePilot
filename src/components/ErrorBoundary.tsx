import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
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
    console.error("ErrorBoundary caught an unhandled error:", error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[100dvh] bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-900">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full border border-slate-200 shadow-xl space-y-5 text-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
              <AlertTriangle size={28} />
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-950">
                {this.props.fallbackTitle || "Something went wrong"}
              </h2>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                An unexpected error occurred while rendering this page. You can reload the page or contact the shop owner.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-200 text-left font-mono text-[11px] text-slate-700 max-h-32 overflow-y-auto">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="flex-1 py-3 rounded-full bg-slate-950 text-white font-bold text-xs hover:bg-slate-800 transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <RefreshCw size={14} />
                <span>Reload Page</span>
              </button>
              <a
                href="/"
                className="py-3 px-6 rounded-full border border-slate-200 bg-white text-slate-700 font-bold text-xs hover:bg-slate-100 transition inline-flex items-center justify-center"
              >
                Go Home
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

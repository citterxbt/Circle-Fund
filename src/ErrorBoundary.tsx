import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  declare public props: Readonly<Props> & Readonly<{ children?: ReactNode }>;

  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error in ErrorBoundary:", error, errorInfo);
  }

  private handleReset = () => {
    localStorage.clear();
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 flex items-center justify-center bg-[#070707] text-white p-6 font-sans overflow-auto select-text">
          <div className="w-full max-w-2xl bg-[#111111] border border-red-500/20 rounded-3xl p-8 shadow-2xl relative z-50">
            <div className="flex items-center gap-3 text-red-500 mb-6">
              <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <h2 className="text-xl font-bold font-display uppercase tracking-wider">Application Crash Detected</h2>
            </div>
            
            <p className="text-white/70 mb-6 text-sm leading-relaxed">
              We encountered a runtime error that prevented the application from loading. This is usually caused by network environments or browser Web3 state constraints.
            </p>

            <div className="bg-black/50 rounded-2xl p-5 mb-8 border border-white/5 font-mono text-xs overflow-auto max-h-60 text-red-400 select-all whitespace-pre-wrap">
              {this.state.error?.toString() || "Unknown runtime exception"}
              {this.state.error?.stack && `\n\nStack Trace:\n${this.state.error.stack}`}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 font-semibold uppercase tracking-wider text-xs">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 py-3.5 bg-red-500 hover:bg-red-600 transition-colors rounded-full text-center cursor-pointer"
              >
                Reload Browser
              </button>
              <button
                onClick={this.handleReset}
                className="flex-1 py-3.5 bg-white/5 hover:bg-white/10 transition-colors border border-white/10 rounded-full text-center text-white/80 cursor-pointer"
              >
                Clear Cache & Restart
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

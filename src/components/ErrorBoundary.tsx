import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

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
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 max-w-sm w-full shadow-md text-center">
            <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center mb-3">
              <AlertCircle size={24} />
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Something went wrong
            </h2>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              An unexpected error occurred while rendering this view. Your match state is safe.
            </p>
            {this.state.error?.message && (
              <div className="p-2 mb-4 bg-slate-100 dark:bg-slate-800 rounded text-[11px] text-slate-600 dark:text-slate-400 font-mono text-left break-words overflow-x-auto">
                {this.state.error.message}
              </div>
            )}
            <button
              type="button"
              onClick={this.handleReset}
              className="w-full h-10 rounded-md bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <RotateCcw size={15} />
              <span>Recover & Continue</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

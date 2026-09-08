import React from 'react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  message: string;
}

/**
 * Isolates a crashing module so the whole POS terminal never goes blank.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(err: unknown): State {
    return { hasError: true, message: err instanceof Error ? err.message : String(err) };
  }

  componentDidCatch(err: unknown, info: unknown) {
    console.error('[ErrorBoundary]', err, info);
  }

  private handleReset = () => {
    this.setState({ hasError: false, message: '' });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="h-full w-full flex items-center justify-center p-8">
          <div className="max-w-md text-center rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
            <div className="text-lg font-bold mb-2">Something went wrong in this view</div>
            <div className="text-sm opacity-70 mb-4 break-words" dir="ltr">{this.state.message}</div>
            <button
              onClick={this.handleReset}
              className="px-4 py-2 rounded-xl bg-amber-500 text-black font-bold text-sm hover:bg-amber-400"
            >
              Reload view
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export const ModuleFallback: React.FC<{ label?: string }> = ({ label }) => (
  <div className="h-full w-full flex items-center justify-center p-8" aria-busy="true" aria-live="polite">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 rounded-full border-2 border-amber-500/30 border-t-amber-500 animate-spin" />
      <div className="text-sm opacity-60">Loading {label ?? 'module'}…</div>
    </div>
  </div>
);

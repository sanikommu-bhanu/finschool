import { Component, type ErrorInfo, type ReactNode } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { HiOutlineExclamationCircle } from 'react-icons/hi';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] caught an error:', error, errorInfo.componentStack);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleBackToHome = () => {
    this.setState({ error: null });
    window.location.href = '/';
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="min-h-screen bg-animated relative overflow-hidden flex items-center justify-center px-4">
        <GlassCard padding="lg" glow className="max-w-sm w-full text-center shadow-2xl border-white/60 dark:border-white/10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blush-200 to-blush-100 dark:from-blush-900/50 dark:to-blush-800/30 flex items-center justify-center mb-6 mx-auto shadow-inner border border-white/50 dark:border-white/10">
            <HiOutlineExclamationCircle size={32} className="text-blush-700 dark:text-blush-300" />
          </div>
          <h1 className="font-display text-2xl font-bold mb-2 tracking-tight text-gray-900 dark:text-white">
            Something went wrong
          </h1>
          <p className="text-sm text-blush-800/70 dark:text-blush-100/60 mb-4 leading-relaxed">
            Sorry about that — this screen hit a snag and couldn't load.
          </p>
          <p className="text-xs font-mono text-blush-900/60 dark:text-blush-100/50 bg-white/40 dark:bg-black/20 border border-white/40 dark:border-white/10 rounded-xl px-3 py-2 mb-6 break-words text-left">
            {error.message}
          </p>
          <div className="flex flex-col gap-3">
            <Button fullWidth onClick={this.handleReload}>
              Reload
            </Button>
            <Button fullWidth variant="glass" onClick={this.handleBackToHome}>
              Back to Home
            </Button>
          </div>
        </GlassCard>
      </div>
    );
  }
}

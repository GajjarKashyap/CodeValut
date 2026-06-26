import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-dark-bg text-white flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center space-y-6 bg-dark-surface border border-dark-border p-8 rounded-2xl shadow-xl">
            <div className="bg-red-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto text-red-500">
              <AlertTriangle size={32} />
            </div>
            <h1 className="text-2xl font-bold font-serif">Something went wrong</h1>
            <p className="text-dark-muted text-sm font-sans">
              An unexpected error occurred in the application. You can try reloading the page.
            </p>
            {this.state.error && (
              <pre className="bg-dark-bg border border-dark-border p-3 rounded-lg text-left text-xs font-mono overflow-auto max-h-40 text-red-400">
                {this.state.error.toString()}
              </pre>
            )}
            <button
              onClick={this.handleReload}
              className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-dark-bg font-bold py-2.5 rounded-lg transition-colors cursor-pointer font-sans text-sm"
            >
              <RefreshCw size={16} />
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

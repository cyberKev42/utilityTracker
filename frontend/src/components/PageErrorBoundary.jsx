import { Component } from 'react';
import { HiExclamationCircle } from 'react-icons/hi2';

export class PageErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[PageErrorBoundary] Caught render error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-start gap-2 p-4 rounded-xl bg-destructive/10 border border-destructive/20 m-4">
          <HiExclamationCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-destructive">Something went wrong loading this page.</p>
            <p className="text-xs text-destructive/80 mt-0.5">{this.state.error?.message}</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

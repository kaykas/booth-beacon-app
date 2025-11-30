'use client';

import { Component, ReactNode, ErrorInfo } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  name?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class SafeRender extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`SafeRender caught error in ${this.props.name || 'component'}:`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex flex-col items-center justify-center p-4 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
          <div className="flex items-center mb-2">
            <AlertTriangle className="w-4 h-4 mr-2" />
            <span className="font-semibold">Failed to load {this.props.name || 'component'}</span>
          </div>
          {this.state.error && (
            <pre className="text-xs bg-red-100 p-2 rounded max-w-full overflow-auto whitespace-pre-wrap">
              {this.state.error.message}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
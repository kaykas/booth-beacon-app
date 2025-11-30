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
}

export class SafeRender extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`SafeRender caught error in ${this.props.name || 'component'}:`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex items-center justify-center p-4 bg-neutral-50 border border-neutral-200 rounded text-neutral-400 text-sm">
          <AlertTriangle className="w-4 h-4 mr-2" />
          <span>Failed to load {this.props.name || 'component'}</span>
        </div>
      );
    }

    return this.props.children;
  }
}

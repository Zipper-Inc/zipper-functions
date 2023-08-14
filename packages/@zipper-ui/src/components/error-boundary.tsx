import React from 'react';

interface Props {
  children: React.ReactElement;
  fallback: React.ReactElement;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('Caught in Error Boundary', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return <>{this.props.fallback}</>;
    }

    return <>{this.props.children}</>;
  }
}

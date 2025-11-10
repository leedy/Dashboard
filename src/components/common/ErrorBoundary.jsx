import { Component } from 'react';
import './ErrorBoundary.css';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details for debugging
    console.error('Error caught by boundary:', error, errorInfo);

    this.setState({
      error,
      errorInfo,
      errorCount: this.state.errorCount + 1
    });

    // Auto-recovery: try to reset after 10 seconds
    if (this.props.autoRecover !== false) {
      setTimeout(() => {
        console.log('Auto-recovering from error...');
        this.handleReset();
      }, 10000);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      // Fallback UI
      return (
        <div className="error-boundary">
          <div className="error-boundary-content">
            <div className="error-icon">⚠️</div>
            <h2>Something went wrong</h2>
            <p className="error-message">
              {this.props.dashboardName || 'This dashboard'} encountered an error and stopped working.
            </p>

            {this.state.errorCount > 1 && (
              <p className="error-count">
                This error has occurred {this.state.errorCount} times.
              </p>
            )}

            <div className="error-actions">
              <button onClick={this.handleReset} className="retry-button">
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="reload-button"
              >
                Reload Page
              </button>
            </div>

            {this.props.showDetails && this.state.error && (
              <details className="error-details">
                <summary>Error Details (for debugging)</summary>
                <pre className="error-stack">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            {this.props.autoRecover !== false && (
              <p className="auto-recover-message">
                Auto-recovering in 10 seconds...
              </p>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

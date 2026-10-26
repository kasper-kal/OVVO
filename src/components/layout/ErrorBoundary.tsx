import { Component, type ErrorInfo, type ReactNode } from 'react';
import { ErrorScreen } from './ErrorScreen';

/**
 * **React's error boundary, with OVVO's screen at the bottom of it.**
 *
 * A class, because that is still the only way React offers to catch a render error. It is used
 * twice and for two different jobs:
 *
 *   • around the whole app (`main.tsx`, `variant="page"`) — catches a crash in the state
 *     provider, the router or the shell itself, where there is no header left to keep;
 *   • around the shell's `<main>` (`components/layout/AppShell.tsx`, `variant="inline"`) — catches
 *     a crash in one screen and leaves the rest of the app standing, so the traveller can simply
 *     go somewhere else.
 *
 * `resetOnAddress` is for the outer one. Once the whole app has been replaced by the error card,
 * the way out is a plain link to `/` (`layout/ErrorScreen`), which the browser loads from scratch —
 * the app comes back because the page did. What the listener adds is the *other* way an address
 * changes: the back and forward buttons, which move history without reloading anything and would
 * otherwise leave a dead error card on a screen the traveller had already left. The inner one needs
 * no listener: the shell remounts it per route (`key`), so arriving on another screen starts it
 * clean.
 *
 * The error itself is logged once, with its component stack, because the traveller's screen is
 * not the place to debug it and a boundary that swallows the console output hides the bug.
 */
export class ErrorBoundary extends Component<
  {
    children: ReactNode;
    variant?: 'page' | 'inline';
    resetOnAddress?: boolean;
  },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidMount() {
    if (!this.props.resetOnAddress) return;
    /* `popstate` is back and forward; `hashchange` is the old `#/` addresses being translated on
       the way in (`main.tsx`). Both are address changes that no React code inside can see. */
    window.addEventListener('popstate', this.reset);
    window.addEventListener('hashchange', this.reset);
  }

  componentWillUnmount() {
    window.removeEventListener('popstate', this.reset);
    window.removeEventListener('hashchange', this.reset);
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('OVVO could not draw this screen', error, info.componentStack);
  }

  reset = () => {
    /* Only a boundary that is *showing* the card needs to reset. An address change on a working
       app must not throw the screen away and rebuild it. */
    if (this.state.failed) this.setState({ failed: false });
  };

  render() {
    if (!this.state.failed) return this.props.children;
    if (this.props.variant === 'page') {
      return (
        <ErrorScreen
          variant="page"
          retryLabel="Reload the page"
          /* A full-page crash may be in the shell itself, so "try again" is the browser's own
             reload rather than a reset that would land in the same state. */
          onRetry={() => window.location.reload()}
        />
      );
    }
    return <ErrorScreen variant="inline" onRetry={this.reset} />;
  }
}

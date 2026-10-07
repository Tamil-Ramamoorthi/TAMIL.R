import { Component, Suspense, type ErrorInfo, type ReactNode } from "react";

/**
 * CHARACTER LOADER
 * ================
 * Suspense + an error boundary around the GLB.
 *
 * WHY BOTH
 * --------
 * Suspense covers the *pending* case: the model is still downloading. It does
 * NOT cover failure — a rejected loader promise (404, truncated file, bad
 * Draco payload) throws on the next render, and a Suspense boundary will
 * re-throw it upward. Without the boundary below, that exception unwinds
 * through the Canvas and takes the entire hero scene — lighting, environment,
 * particles — with it.
 *
 * With it, a failed character leaves the rest of the scene untouched and the
 * 2D portrait reveal completely unaffected, because the two systems share no
 * state: the reveal is a DOM/SVG mask driven straight from the pointer store.
 *
 * The scene is never a gate on the page either. The GLB is not in
 * `criticalAssets`, so the preloader does not wait on it, and the canvas is
 * itself lazy — the portfolio is interactive long before the model lands.
 */

interface BoundaryProps {
  children: ReactNode;
  /** Rendered instead of the character once loading has failed. */
  fallback: ReactNode;
}

interface BoundaryState {
  failed: boolean;
}

class CharacterBoundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { failed: false };

  static getDerivedStateFromError(): BoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Loud in development, silent in production: a missing decorative model
    // is not something to shout about in a visitor's console.
    if (import.meta.env.DEV) {
      console.warn(
        "[character] 3D character failed to load — the hero scene continues without it.",
        error,
        info.componentStack,
      );
    }
  }

  render(): ReactNode {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export interface CharacterLoaderProps {
  children: ReactNode;
  /** Shown while the model downloads, and if it never arrives. */
  fallback?: ReactNode;
}

export function CharacterLoader({
  children,
  fallback = null,
}: CharacterLoaderProps) {
  return (
    <CharacterBoundary fallback={fallback}>
      <Suspense fallback={fallback}>{children}</Suspense>
    </CharacterBoundary>
  );
}

export default CharacterLoader;

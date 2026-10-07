import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { enableAnimatedStates, setupGsap } from "./animations/gsapSetup";
import { startPointerTracking } from "./hooks/pointerStore";
import "./styles/index.css";

/**
 * Boot order matters:
 *   1. GSAP plugins registered before any component builds a timeline.
 *   2. `anim-ready` added to <html> only when motion is allowed — this is what
 *      lets the stylesheets hide elements that GSAP will reveal. Without it
 *      (no JS, or reduced motion) everything stays visible.
 *   3. Pointer listeners attached once, globally.
 */
setupGsap();
enableAnimatedStates();
startPointerTracking();

const container = document.getElementById("root");

if (!container) {
  throw new Error("Root element #root not found");
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

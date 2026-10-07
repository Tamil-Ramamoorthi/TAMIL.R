import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import { initCursor } from "../../animations/cursor";
import { features } from "../../config/site";
import { useDeviceCapabilities } from "../../hooks/useDeviceCapabilities";

/**
 * Custom cursor. Mounts only on fine-pointer devices with motion allowed;
 * touch and reduced-motion users keep the native cursor untouched.
 *
 * All movement happens in `initCursor` via the pointer store and GSAP —
 * this component renders once and never re-renders on mouse movement.
 */
export function Cursor() {
  const rootRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLSpanElement>(null);
  const ringRef = useRef<HTMLSpanElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  const { canUseCustomCursor } = useDeviceCapabilities();
  const active = canUseCustomCursor && features.customCursor;

  useGSAP(
    () => {
      if (!active) return;
      const root = rootRef.current;
      const dot = dotRef.current;
      const ring = ringRef.current;
      const label = labelRef.current;
      if (!root || !dot || !ring || !label) return;

      return initCursor({ root, dot, ring, label });
    },
    { dependencies: [active] },
  );

  if (!active) return null;

  return (
    <div className="cursor" ref={rootRef} data-state="default" aria-hidden="true">
      <span className="cursor__ring" ref={ringRef}>
        <span className="cursor__label" ref={labelRef} />
      </span>
      <span className="cursor__dot" ref={dotRef} />
    </div>
  );
}

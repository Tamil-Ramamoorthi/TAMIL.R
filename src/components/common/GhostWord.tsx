/**
 * Oversized, low-contrast background typography.
 * Decorative only — hidden from assistive tech and from pointer events.
 */
export interface GhostWordProps {
  word: string;
  /** `stroke` is an outline; `fill` is a very faint solid. */
  variant?: "stroke" | "fill";
  className?: string;
}

export function GhostWord({
  word,
  variant = "stroke",
  className,
}: GhostWordProps) {
  return (
    <div className={`section__ghost u-decor ${className ?? ""}`} aria-hidden="true">
      <span className={variant === "fill" ? "t-ghost t-ghost--fill" : "t-ghost"}>
        {word}
      </span>
    </div>
  );
}

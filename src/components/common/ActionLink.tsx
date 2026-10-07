import type { IconKey } from "../../data";
import { Icon } from "./Icon";

/**
 * The project's single link/button primitive.
 *
 * Passing `href: null` renders a disabled control instead of a dead link —
 * that is how project GitHub / live-demo buttons behave until real URLs are
 * supplied, rather than pointing at a made-up address.
 */
export interface ActionLinkProps {
  href: string | null;
  label: string;
  icon?: IconKey;
  variant?: "default" | "primary" | "ghost";
  size?: "md" | "sm";
  external?: boolean;
  download?: boolean;
  /** Custom cursor state while hovering. */
  cursor?: string;
  cursorLabel?: string;
  /** Shown as the title when the link is disabled. */
  pendingHint?: string;
  className?: string;
}

const variantClass = {
  default: "",
  primary: "btn--primary",
  ghost: "btn--ghost",
} as const;

export function ActionLink({
  href,
  label,
  icon,
  variant = "default",
  size = "md",
  external = false,
  download = false,
  cursor,
  cursorLabel,
  pendingHint = "Link not supplied yet",
  className,
}: ActionLinkProps) {
  const classes = [
    "btn",
    variantClass[variant],
    size === "sm" ? "btn--sm" : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  const body = (
    <>
      <span className="btn__fill" aria-hidden="true" />
      <span>{label}</span>
      {icon ? <Icon name={icon} /> : null}
    </>
  );

  if (!href) {
    return (
      <span className={classes} aria-disabled="true" title={pendingHint}>
        {body}
      </span>
    );
  }

  return (
    <a
      className={classes}
      href={href}
      {...(external ? { target: "_blank", rel: "noreferrer noopener" } : {})}
      {...(download ? { download: "" } : {})}
      {...(cursor ? { "data-cursor": cursor } : {})}
      {...(cursorLabel ? { "data-cursor-label": cursorLabel } : {})}
    >
      {body}
    </a>
  );
}

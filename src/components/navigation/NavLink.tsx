/**
 * Navigation link with a two-layer rollover.
 * The animation is CSS-only, so hovering costs no JavaScript.
 */
export interface NavLinkProps {
  href: string;
  label: string;
  active?: boolean;
  onNavigate?: () => void;
}

export function NavLink({ href, label, active, onNavigate }: NavLinkProps) {
  return (
    <a
      className="nav__link"
      href={href}
      data-nav-item
      {...(active ? { "aria-current": "location" as const } : {})}
      onClick={onNavigate}
    >
      <span className="nav__link-roll">
        <span>{label}</span>
        <span aria-hidden="true">{label}</span>
      </span>
    </a>
  );
}

/**
 * Small, dependency-free line-icon set (24x24, stroke = currentColor).
 * Centralised so components share one consistent visual language.
 */
interface IconProps {
  className?: string;
}

function Line({ className, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {children}
    </svg>
  );
}

export function HaloMark({ className }: IconProps) {
  // Brand mark: you at the centre, intelligence orbiting close — a ring and
  // core in currentColor with a gold spark resting on the halo.
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <circle cx="12" cy="12.6" r="6.4" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12.6" r="1.7" fill="currentColor" />
      <path
        d="M12 2.1l.85 2.05 2.05.85-2.05.85L12 8.05l-.85-2.2-2.05-.85 2.05-.85z"
        fill="#fbbf24"
      />
    </svg>
  );
}

export function UserIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-5 0-9 2.5-9 6v1h18v-1c0-3.5-4-6-9-6Z" />
    </svg>
  );
}

export function SendIcon({ className }: IconProps) {
  return (
    <Line className={className}>
      <path d="M12 19V5" />
      <path d="M5 12l7-7 7 7" />
    </Line>
  );
}

export function PlusIcon({ className }: IconProps) {
  return (
    <Line className={className}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </Line>
  );
}

export function SunIcon({ className }: IconProps) {
  return (
    <Line className={className}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </Line>
  );
}

export function MoonIcon({ className }: IconProps) {
  return (
    <Line className={className}>
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </Line>
  );
}

export function MenuIcon({ className }: IconProps) {
  return (
    <Line className={className}>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </Line>
  );
}

export function CloseIcon({ className }: IconProps) {
  return (
    <Line className={className}>
      <path d="M6 6l12 12M18 6L6 18" />
    </Line>
  );
}

export function ChatIcon({ className }: IconProps) {
  return (
    <Line className={className}>
      <path d="M21 12a8 8 0 0 1-8 8H7l-4 3v-4.5A8 8 0 1 1 21 12z" />
    </Line>
  );
}

export function BoltIcon({ className }: IconProps) {
  return (
    <Line className={className}>
      <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />
    </Line>
  );
}

export function CompassIcon({ className }: IconProps) {
  return (
    <Line className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M15.5 8.5l-2 5-5 2 2-5 5-2z" />
    </Line>
  );
}

export function BookIcon({ className }: IconProps) {
  return (
    <Line className={className}>
      <path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z" />
      <path d="M19 3v16" />
    </Line>
  );
}

export function StarIcon({ className }: IconProps) {
  return (
    <Line className={className}>
      <path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9L12 3z" />
    </Line>
  );
}

export function ShieldIcon({ className }: IconProps) {
  return (
    <Line className={className}>
      <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3z" />
    </Line>
  );
}

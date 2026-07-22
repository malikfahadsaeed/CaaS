"use client";

import { chatTheme } from "@/lib/theme";

type AvatarRole = "assistant" | "user";
type AvatarSize = "sm" | "md" | "lg";

const SIZES: Record<AvatarSize, { box: string; icon: string }> = {
  sm: { box: "h-8 w-8 rounded-lg", icon: "h-4 w-4" },
  md: { box: "h-9 w-9 rounded-xl", icon: "h-5 w-5" },
  lg: { box: "h-16 w-16 rounded-2xl", icon: "h-8 w-8" },
};

const gradientStyle = {
  background: `linear-gradient(135deg, ${chatTheme.primaryColor}, ${chatTheme.accentColor})`,
};

interface AvatarProps {
  role: AvatarRole;
  size?: AvatarSize;
}

export function Avatar({ role, size = "sm" }: AvatarProps) {
  const isUser = role === "user";
  const s = SIZES[size];
  const base = `flex shrink-0 items-center justify-center ${s.box}`;
  const wrapClass = isUser
    ? `${base} bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-200`
    : `${base} text-white shadow-sm`;

  return (
    <span className={wrapClass} style={isUser ? undefined : gradientStyle} aria-hidden>
      {isUser ? <UserIcon className={s.icon} /> : <SparkleIcon className={s.icon} />}
    </span>
  );
}

function SparkleIcon({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 2l1.9 5.6L19.5 9.5l-5.6 1.9L12 17l-1.9-5.6L4.5 9.5l5.6-1.9L12 2z" />
    </svg>
  );
}

function UserIcon({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-5 0-9 2.5-9 6v1h18v-1c0-3.5-4-6-9-6Z" />
    </svg>
  );
}

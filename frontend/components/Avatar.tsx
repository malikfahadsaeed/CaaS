"use client";

import { HaloMark, UserIcon } from "@/components/icons";

type AvatarRole = "assistant" | "user";
type AvatarSize = "sm" | "md" | "lg";

const SIZES: Record<AvatarSize, { box: string; icon: string }> = {
  sm: { box: "h-8 w-8 rounded-lg", icon: "h-4 w-4" },
  md: { box: "h-9 w-9 rounded-xl", icon: "h-5 w-5" },
  lg: { box: "h-14 w-14 rounded-2xl", icon: "h-7 w-7" },
};

interface AvatarProps {
  role: AvatarRole;
  size?: AvatarSize;
}

export function Avatar({ role, size = "sm" }: AvatarProps) {
  const isUser = role === "user";
  const s = SIZES[size];
  const base = `flex shrink-0 items-center justify-center ${s.box}`;

  if (isUser) {
    return (
      <span
        className={`${base} border border-border bg-surface-3 text-muted`}
        aria-hidden
      >
        <UserIcon className={s.icon} />
      </span>
    );
  }

  return (
    <span
      className={`${base} bg-[linear-gradient(135deg,var(--brand),var(--brand-2))] text-white shadow-glow ring-1 ring-white/10`}
      aria-hidden
    >
      <HaloMark className={s.icon} />
    </span>
  );
}

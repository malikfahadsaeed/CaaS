"use client";

import { MenuIcon, PlusIcon } from "@/components/icons";
import { ThemeToggle } from "@/components/ThemeToggle";
import { chatTheme } from "@/lib/theme";

interface ChatHeaderProps {
  onNewChat: () => void;
  onOpenMenu: () => void;
  canReset: boolean;
}

export function ChatHeader({ onNewChat, onOpenMenu, canReset }: ChatHeaderProps) {
  return (
    <header className="glass sticky top-0 z-10 border-b border-border">
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Mobile menu */}
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="Open menu"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-muted transition hover:bg-surface-3 hover:text-content lg:hidden"
        >
          <MenuIcon className="h-5 w-5" />
        </button>

        <div className="flex min-w-0 flex-1 items-center gap-2">
          <h1 className="truncate text-sm font-semibold text-content">{chatTheme.botName}</h1>
          <span className="hidden items-center gap-1.5 rounded-full border border-border px-2 py-0.5 text-xs text-muted sm:inline-flex">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
            Online
          </span>
        </div>

        <ThemeToggle />

        <button
          type="button"
          onClick={onNewChat}
          disabled={!canReset}
          className="hidden items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-xs font-medium text-muted transition hover:bg-surface-3 hover:text-content disabled:cursor-not-allowed disabled:opacity-40 sm:inline-flex"
        >
          <PlusIcon className="h-3.5 w-3.5" />
          New chat
        </button>
      </div>
    </header>
  );
}

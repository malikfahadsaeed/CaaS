"use client";

import { Avatar } from "@/components/Avatar";
import { chatTheme } from "@/lib/theme";

interface ChatHeaderProps {
  onNewChat: () => void;
  canReset: boolean;
}

export function ChatHeader({ onNewChat, canReset }: ChatHeaderProps) {
  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
      <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
        <Avatar role="assistant" size="md" />

        <div className="flex-1 leading-tight">
          <h1 className="text-sm font-semibold">{chatTheme.appName}</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">{chatTheme.tagline}</p>
        </div>

        <span className="hidden items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 sm:flex">
          <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
          Online
        </span>

        <button
          type="button"
          onClick={onNewChat}
          disabled={!canReset}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          New chat
        </button>
      </div>
    </header>
  );
}

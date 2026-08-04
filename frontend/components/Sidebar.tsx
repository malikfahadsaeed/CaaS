"use client";

import { ChatIcon, CloseIcon, HaloMark, PlusIcon } from "@/components/icons";
import { chatTheme } from "@/lib/theme";

interface SidebarProps {
  /** Title of the active conversation, or null when none has started. */
  conversationTitle: string | null;
  onNewChat: () => void;
  /** Close handler for the mobile drawer (hidden on desktop). */
  onClose: () => void;
}

export function Sidebar({ conversationTitle, onNewChat, onClose }: SidebarProps) {
  const hasConversation = conversationTitle !== null;

  return (
    <div className="glass flex h-full w-72 flex-col border-r border-border">
      {/* Brand */}
      <div className="flex items-center gap-3 px-4 py-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[linear-gradient(135deg,var(--brand),var(--brand-2))] text-white shadow-glow ring-1 ring-white/10">
          <HaloMark className="h-5 w-5" />
        </span>
        <div className="flex-1 leading-tight">
          <p className="text-sm font-semibold text-gradient">{chatTheme.appName}</p>
          <p className="text-xs text-muted">{chatTheme.tagline}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close menu"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition hover:bg-surface-3 hover:text-content lg:hidden"
        >
          <CloseIcon className="h-5 w-5" />
        </button>
      </div>

      {/* New chat */}
      <div className="px-3">
        <button
          type="button"
          onClick={onNewChat}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[linear-gradient(135deg,var(--brand),var(--brand-2))] px-4 py-2.5 text-sm font-medium text-white shadow-glow transition hover:opacity-95 active:scale-[0.99]"
        >
          <PlusIcon className="h-4 w-4" />
          New chat
        </button>
      </div>

      {/* Conversations */}
      <div className="mt-6 flex-1 overflow-y-auto px-3 scroll-thin">
        <p className="px-2 pb-2 text-xs font-medium uppercase tracking-wide text-muted">
          This session
        </p>

        {hasConversation ? (
          <button
            type="button"
            className="flex w-full items-center gap-2.5 rounded-lg border border-border bg-surface px-3 py-2.5 text-left text-sm text-content shadow-soft"
          >
            <ChatIcon className="h-4 w-4 shrink-0 text-brand" />
            <span className="truncate">{conversationTitle}</span>
          </button>
        ) : (
          <div className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-xs text-muted">
            No conversations yet.
            <br />
            Start typing to begin.
          </div>
        )}
      </div>

      {/* Footer status */}
      <div className="border-t border-border px-4 py-3">
        <div className="flex items-center gap-2 text-xs text-muted">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span>{chatTheme.poweredBy}</span>
        </div>
      </div>
    </div>
  );
}

"use client";

import type { ComponentType } from "react";

import { Avatar } from "@/components/Avatar";
import {
  BoltIcon,
  BookIcon,
  ChatIcon,
  CompassIcon,
  ShieldIcon,
  StarIcon,
} from "@/components/icons";
import { chatTheme, type SuggestionIcon } from "@/lib/theme";

interface EmptyStateProps {
  onSelect: (message: string) => void;
}

const ICONS: Record<SuggestionIcon, ComponentType<{ className?: string }>> = {
  compass: CompassIcon,
  bolt: BoltIcon,
  book: BookIcon,
  star: StarIcon,
  shield: ShieldIcon,
  chat: ChatIcon,
};

export function EmptyState({ onSelect }: EmptyStateProps) {
  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col items-center justify-center px-4 py-12 text-center">
      <div className="mb-6 animate-fade-in-up">
        <Avatar role="assistant" size="lg" />
      </div>

      <h2 className="animate-fade-in-up text-3xl font-semibold tracking-tight text-content sm:text-4xl">
        <span className="text-gradient">{chatTheme.welcomeTitle}</span>
      </h2>
      <p className="mt-3 max-w-md animate-fade-in-up text-sm text-muted sm:text-base">
        {chatTheme.welcomeSubtitle}
      </p>

      <div className="mt-10 grid w-full animate-fade-in-up grid-cols-1 gap-3 sm:grid-cols-2">
        {chatTheme.suggestions.map((suggestion) => {
          const Icon = ICONS[suggestion.icon];
          return (
            <button
              key={suggestion.label}
              type="button"
              onClick={() => onSelect(suggestion.label)}
              className="group flex items-start gap-3 rounded-2xl border border-border bg-surface px-4 py-3.5 text-left shadow-soft transition hover:-translate-y-0.5 hover:border-brand hover:shadow-glow"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-surface-3 text-brand transition group-hover:border-brand group-hover:bg-[linear-gradient(135deg,var(--brand),var(--brand-2))] group-hover:text-white">
                <Icon className="h-[18px] w-[18px]" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-content">
                  {suggestion.label}
                </span>
                <span className="block truncate text-xs text-muted">{suggestion.hint}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

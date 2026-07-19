"use client";

import { Avatar } from "@/components/Avatar";
import { chatTheme } from "@/lib/theme";

interface EmptyStateProps {
  onSelect: (message: string) => void;
}

export function EmptyState({ onSelect }: EmptyStateProps) {
  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col items-center justify-center px-4 py-16 text-center">
      <div className="mb-5">
        <Avatar role="assistant" size="lg" />
      </div>

      <h2 className="text-2xl font-semibold">{chatTheme.welcomeTitle}</h2>
      <p className="mt-2 text-slate-500 dark:text-slate-400">{chatTheme.welcomeSubtitle}</p>

      <div className="mt-8 grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
        {chatTheme.suggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => onSelect(suggestion)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}

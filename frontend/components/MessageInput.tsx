"use client";

import { useRef, useState } from "react";

import { SendIcon } from "@/components/icons";
import { chatTheme } from "@/lib/theme";

interface MessageInputProps {
  onSend: (message: string) => void;
  disabled: boolean;
}

const MAX_HEIGHT_PX = 200;

export function MessageInput({ onSend, disabled }: MessageInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const resetHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) {
      return;
    }
    onSend(trimmed);
    setValue("");
    resetHeight();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  };

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(event.target.value);
    const el = event.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT_PX)}px`;
  };

  const canSend = !disabled && value.trim().length > 0;

  return (
    <div className="glass border-t border-border">
      <div className="mx-auto max-w-3xl px-4 py-4">
        <div className="flex items-end gap-2 rounded-2xl border border-border bg-surface p-2 shadow-soft transition focus-within:border-brand focus-within:ring-2 focus-within:ring-[var(--brand-glow)]">
          <textarea
            ref={textareaRef}
            rows={1}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={chatTheme.inputPlaceholder}
            aria-label="Message"
            className="max-h-[200px] flex-1 resize-none bg-transparent px-2 py-1.5 text-sm text-content outline-none placeholder:text-muted disabled:opacity-60"
          />
          <button
            type="button"
            onClick={submit}
            disabled={!canSend}
            aria-label="Send message"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[linear-gradient(135deg,var(--brand),var(--brand-2))] text-white shadow-glow transition hover:opacity-95 active:scale-95 disabled:opacity-40 disabled:shadow-none"
          >
            <SendIcon className="h-5 w-5" />
          </button>
        </div>
        <p className="mt-2.5 text-center text-xs text-muted">{chatTheme.footerNote}</p>
      </div>
    </div>
  );
}

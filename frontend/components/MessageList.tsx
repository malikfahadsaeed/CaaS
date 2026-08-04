"use client";

import { useEffect, useRef } from "react";

import { Avatar } from "@/components/Avatar";
import { chatTheme } from "@/lib/theme";
import type { ChatMessage } from "@/lib/types";

interface MessageListProps {
  messages: ChatMessage[];
  isTyping: boolean;
}

export function MessageList({ messages, isTyping }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
      {isTyping && <TypingIndicator />}
      <div ref={bottomRef} />
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex animate-fade-in-up items-start gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <Avatar role={isUser ? "user" : "assistant"} size="sm" />
      <div className="flex max-w-[82%] flex-col gap-1">
        <span className={`px-1 text-xs text-muted ${isUser ? "text-right" : ""}`}>
          {isUser ? "You" : chatTheme.botName}
        </span>
        <div
          className={
            isUser
              ? "whitespace-pre-wrap rounded-2xl rounded-tr-md bg-[linear-gradient(135deg,var(--brand),var(--brand-2))] px-4 py-3 text-sm leading-relaxed text-white shadow-glow"
              : "whitespace-pre-wrap rounded-2xl rounded-tl-md border border-border bg-surface px-4 py-3 text-sm leading-relaxed text-content shadow-soft"
          }
        >
          {message.content}
        </div>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex animate-fade-in-up items-start gap-3">
      <Avatar role="assistant" size="sm" />
      <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-md border border-border bg-surface px-4 py-4 shadow-soft">
        <Dot delay="0ms" />
        <Dot delay="200ms" />
        <Dot delay="400ms" />
      </div>
    </div>
  );
}

function Dot({ delay }: { delay: string }) {
  return (
    <span
      className="h-2 w-2 animate-blink rounded-full bg-brand"
      style={{ animationDelay: delay }}
    />
  );
}

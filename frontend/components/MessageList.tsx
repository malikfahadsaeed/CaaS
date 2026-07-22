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
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
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
    <div className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <Avatar role={isUser ? "user" : "assistant"} size="sm" />
      <div
        className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
          isUser ? "text-white" : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100"
        }`}
        style={isUser ? { backgroundColor: chatTheme.primaryColor } : undefined}
      >
        {message.content}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-start gap-3">
      <Avatar role="assistant" size="sm" />
      <div className="flex gap-1 rounded-2xl bg-slate-100 px-4 py-3 shadow-sm dark:bg-slate-800">
        <Dot delay="0ms" />
        <Dot delay="150ms" />
        <Dot delay="300ms" />
      </div>
    </div>
  );
}

function Dot({ delay }: { delay: string }) {
  return (
    <span
      className="h-2 w-2 animate-bounce rounded-full bg-slate-400 dark:bg-slate-500"
      style={{ animationDelay: delay }}
    />
  );
}

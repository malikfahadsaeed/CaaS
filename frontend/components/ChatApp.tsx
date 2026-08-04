"use client";

import { useCallback, useMemo, useState } from "react";

import { ChatHeader } from "@/components/ChatHeader";
import { EmptyState } from "@/components/EmptyState";
import { MessageInput } from "@/components/MessageInput";
import { MessageList } from "@/components/MessageList";
import { Sidebar } from "@/components/Sidebar";
import { sendChatMessage } from "@/lib/api";
import type { ChatMessage } from "@/lib/types";

function createMessage(role: ChatMessage["role"], content: string): ChatMessage {
  return { id: crypto.randomUUID(), role, content };
}

const ERROR_MESSAGE = "Sorry, something went wrong. Please try again.";
const TITLE_MAX = 42;

/** Derive a sidebar title from the first user turn. */
function deriveTitle(messages: ChatMessage[]): string | null {
  const firstUser = messages.find((m) => m.role === "user");
  if (!firstUser) {
    return null;
  }
  const text = firstUser.content.trim();
  return text.length > TITLE_MAX ? `${text.slice(0, TITLE_MAX)}…` : text;
}

export function ChatApp() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSend = useCallback(
    async (text: string) => {
      if (isTyping) {
        return;
      }
      // Snapshot prior turns so the backend (and Bedrock) get conversation
      // context — the client is the only place history lives (no DB).
      const history = messages.map(({ role, content }) => ({ role, content }));
      setMessages((prev) => [...prev, createMessage("user", text)]);
      setIsTyping(true);

      try {
        const reply = await sendChatMessage(text, history);
        setMessages((prev) => [...prev, createMessage("assistant", reply)]);
      } catch {
        setMessages((prev) => [...prev, createMessage("assistant", ERROR_MESSAGE)]);
      } finally {
        setIsTyping(false);
      }
    },
    [isTyping, messages],
  );

  const handleNewChat = useCallback(() => {
    setMessages([]);
    setIsTyping(false);
    setSidebarOpen(false);
  }, []);

  const hasMessages = messages.length > 0;
  const conversationTitle = useMemo(() => deriveTitle(messages), [messages]);

  return (
    <div className="relative flex h-dvh overflow-hidden">
      <div className="app-backdrop" aria-hidden />

      {/* Desktop sidebar */}
      <aside className="relative z-20 hidden shrink-0 lg:block">
        <Sidebar
          conversationTitle={conversationTitle}
          onNewChat={handleNewChat}
          onClose={() => setSidebarOpen(false)}
        />
      </aside>

      {/* Mobile drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setSidebarOpen(false)}
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
          />
          <aside className="absolute left-0 top-0 h-full animate-fade-in-up">
            <Sidebar
              conversationTitle={conversationTitle}
              onNewChat={handleNewChat}
              onClose={() => setSidebarOpen(false)}
            />
          </aside>
        </div>
      )}

      {/* Main column */}
      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <ChatHeader
          onNewChat={handleNewChat}
          onOpenMenu={() => setSidebarOpen(true)}
          canReset={hasMessages}
        />

        <main className="flex-1 overflow-y-auto scroll-thin">
          {hasMessages ? (
            <MessageList messages={messages} isTyping={isTyping} />
          ) : (
            <EmptyState onSelect={handleSend} />
          )}
        </main>

        <MessageInput onSend={handleSend} disabled={isTyping} />
      </div>
    </div>
  );
}

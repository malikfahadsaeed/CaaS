"use client";

import { useCallback, useState } from "react";

import { ChatHeader } from "@/components/ChatHeader";
import { EmptyState } from "@/components/EmptyState";
import { MessageInput } from "@/components/MessageInput";
import { MessageList } from "@/components/MessageList";
import { sendChatMessage } from "@/lib/api";
import type { ChatMessage } from "@/lib/types";

function createMessage(role: ChatMessage["role"], content: string): ChatMessage {
  return { id: crypto.randomUUID(), role, content };
}

const ERROR_MESSAGE = "Sorry, something went wrong. Please try again.";

export function ChatApp() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);

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
  }, []);

  const hasMessages = messages.length > 0;

  return (
    <div className="flex h-full flex-col">
      <ChatHeader onNewChat={handleNewChat} canReset={hasMessages} />

      <main className="flex-1 overflow-y-auto">
        {hasMessages ? (
          <MessageList messages={messages} isTyping={isTyping} />
        ) : (
          <EmptyState onSelect={handleSend} />
        )}
      </main>

      <MessageInput onSend={handleSend} disabled={isTyping} />
    </div>
  );
}

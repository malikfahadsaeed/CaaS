/** Typed client for the backend chat API. */

import type { MessageRole } from "@/lib/types";

/** A prior conversation turn sent to the backend for assistant context. */
export interface ChatTurn {
  role: MessageRole;
  content: string;
}

interface ChatResponseData {
  reply: string;
}

interface ChatApiResponse {
  success: boolean;
  data: ChatResponseData | null;
  error: string | null;
}

// Same-origin `/api/v1` by default (CloudFront routes /api/* to the backend in
// prod; the local Docker stack proxies via Caddy). For `next dev` against a
// local backend, set NEXT_PUBLIC_API_BASE_URL=http://localhost:8090/api/v1.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api/v1";

export async function sendChatMessage(
  message: string,
  history: ChatTurn[] = [],
): Promise<string> {
  const res = await fetch(`${API_BASE_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, history }),
  });

  if (!res.ok) {
    throw new Error(`Request failed with status ${res.status}`);
  }

  const body = (await res.json()) as ChatApiResponse;
  if (!body.success || body.data === null) {
    throw new Error(body.error ?? "Unexpected response from the server");
  }

  return body.data.reply;
}

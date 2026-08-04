/**
 * Customizable chatbot appearance and copy.
 *
 * This is the single place to rebrand the chatbot for a tenant: change the name,
 * colors, greeting, and starter prompts without touching component logic.
 */
export type SuggestionIcon = "compass" | "bolt" | "book" | "star" | "shield" | "chat";

export interface Suggestion {
  /** Icon shown on the starter card. */
  icon: SuggestionIcon;
  /** Headline on the card — this text is also sent as the message. */
  label: string;
  /** Secondary line describing the prompt. */
  hint: string;
}

export interface ChatTheme {
  appName: string;
  tagline: string;
  botName: string;
  welcomeTitle: string;
  welcomeSubtitle: string;
  primaryColor: string;
  accentColor: string;
  inputPlaceholder: string;
  /** Short label shown in the sidebar footer, e.g. the underlying model. */
  poweredBy: string;
  /** Fine-print disclaimer under the composer. */
  footerNote: string;
  suggestions: Suggestion[];
}

export const chatTheme: ChatTheme = {
  appName: "Halo",
  tagline: "Support that surrounds you",
  botName: "Halo",
  welcomeTitle: "How can I help you today?",
  welcomeSubtitle: "Ask a question, explore an idea, or pick one of the prompts below to get started.",
  primaryColor: "#4338ca",
  accentColor: "#8b7cff",
  inputPlaceholder: "Message Halo…",
  poweredBy: "Powered by Amazon Bedrock",
  footerNote: "Halo can make mistakes. Verify important information.",
  suggestions: [
    {
      icon: "compass",
      label: "What can you do?",
      hint: "See the assistant's capabilities",
    },
    {
      icon: "bolt",
      label: "Tell me about this platform",
      hint: "A quick overview of the product",
    },
    {
      icon: "star",
      label: "Give me a fun fact",
      hint: "Something interesting to know",
    },
    {
      icon: "book",
      label: "Help me get started",
      hint: "First steps and best practices",
    },
  ],
};

/**
 * Customizable chatbot appearance and copy.
 *
 * This is the single place to rebrand the chatbot for a tenant: change the name,
 * colors, greeting, and starter prompts without touching component logic.
 */
export interface ChatTheme {
  appName: string;
  tagline: string;
  botName: string;
  welcomeTitle: string;
  welcomeSubtitle: string;
  primaryColor: string;
  accentColor: string;
  inputPlaceholder: string;
  suggestions: string[];
}

export const chatTheme: ChatTheme = {
  appName: "Nimbus",
  tagline: "Your always-on AI assistant",
  botName: "Nimbus",
  welcomeTitle: "Hi, I'm Nimbus 👋",
  welcomeSubtitle: "Ask me anything to get started.",
  primaryColor: "#4f46e5",
  accentColor: "#7c3aed",
  inputPlaceholder: "Message Nimbus…",
  suggestions: [
    "What can you do?",
    "Tell me about this platform",
    "Give me a fun fact",
    "Help me get started",
  ],
};

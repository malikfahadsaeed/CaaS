import type { CSSProperties, ReactNode } from "react";
import type { Metadata } from "next";

import { chatTheme } from "@/lib/theme";

import "./globals.css";

export const metadata: Metadata = {
  title: `${chatTheme.appName} · AI Chat`,
  description: `${chatTheme.appName} — ${chatTheme.tagline}`,
};

// Runs before paint so the saved (or system) theme is applied with no flash.
const NO_FLASH_SCRIPT = `
(function () {
  try {
    var saved = localStorage.getItem('theme');
    var dark = saved ? saved === 'dark'
      : window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (dark) document.documentElement.classList.add('dark');
  } catch (e) {}
})();
`;

// Inject the tenant brand hues as CSS variables so components can theme from them.
const brandVars = {
  "--brand": chatTheme.primaryColor,
  "--brand-2": chatTheme.accentColor,
} as CSSProperties;

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className="h-full" style={brandVars} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: NO_FLASH_SCRIPT }} />
      </head>
      <body className="h-full font-sans">{children}</body>
    </html>
  );
}

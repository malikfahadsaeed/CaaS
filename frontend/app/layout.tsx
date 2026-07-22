import type { Metadata } from "next";

import { chatTheme } from "@/lib/theme";

import "./globals.css";

export const metadata: Metadata = {
  title: `${chatTheme.appName} · AI Chat`,
  description: `${chatTheme.appName} — ${chatTheme.tagline}`,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full bg-white text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-100">
        {children}
      </body>
    </html>
  );
}

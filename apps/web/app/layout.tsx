import type { Metadata } from "next";
import * as React from "react";
import "@hexed/ui/styles";
import { ThemeProvider } from "~/providers/theme-provider";

export const metadata: Metadata = {
  title: "Hexed - Binary File Inspector",
  description:
    "A modern hex editor for inspecting and tracking binary file changes",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="h-screen bg-background font-sans antialiased cursor-default">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <main className="h-full">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}

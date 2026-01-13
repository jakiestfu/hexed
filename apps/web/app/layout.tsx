import * as React from "react"
import type { Metadata } from "next"

import "@hexed/ui/styles"

import { ClientLayoutWrapper } from "~/components/client-layout-wrapper"
import { ThemeProvider } from "~/providers/theme-provider"

export const metadata: Metadata = {
  title: "Hexed - Binary File Inspector",
  description:
    "A modern hex editor for inspecting and tracking binary file changes"
}

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if (typeof window !== 'undefined' && window.electron !== undefined) {
                  document.documentElement.setAttribute('data-electron', 'true');
                }
              })();
            `
          }}
        />
      </head>
      <body className="h-screen bg-background font-sans antialiased cursor-default">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ClientLayoutWrapper>
            <main className="h-full">{children}</main>
          </ClientLayoutWrapper>
        </ThemeProvider>
      </body>
    </html>
  )
}

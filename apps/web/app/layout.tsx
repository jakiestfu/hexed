import type { Metadata } from "next";
import * as React from "react";
import "@hexed/ui/styles";

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
    <html lang="en">
      <body className="h-screen bg-background font-sans antialiased">
        <main className="h-full">{children}</main>
      </body>
    </html>
  );
}

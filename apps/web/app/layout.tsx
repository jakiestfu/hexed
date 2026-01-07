import type { Metadata } from "next";
import * as React from "react";
import "@binspector/ui/styles";

export const metadata: Metadata = {
  title: "Binspector - Binary File Inspector",
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
      <body className="min-h-screen bg-background font-sans antialiased bg-red-400">
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}

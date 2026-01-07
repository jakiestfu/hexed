import type { Metadata } from 'next';
import * as React from 'react';
import '@binspector/ui/styles';

export const metadata: Metadata = {
  title: 'Binspector - Binary File Inspector',
  description: 'A modern hex editor for inspecting and tracking binary file changes',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background font-sans antialiased">
        <div className="relative flex min-h-screen flex-col">
          <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 items-center">
              <div className="mr-4 flex">
                <span className="text-xl font-bold">Binspector</span>
              </div>
            </div>
          </header>
          <main className="flex-1">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}


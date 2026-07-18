
// app/layout.tsx

import type { Metadata } from "next";
import { Inter, DM_Sans } from "next/font/google";

import "./globals.css";

import Sidebar from "@/components/Sidebar";
import { ToastProvider } from "@/components/Toast";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-heading",
});

export const metadata: Metadata = {
  title: "Fireflies",
  description: "AI Meeting Workspace",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${dmSans.variable} bg-fireflies-content-bg font-body antialiased`}
      >
        <ToastProvider>
          <div className="flex min-h-screen">

            <Sidebar />

            <main
              className="
                ml-56
                flex-1
                min-h-screen
                bg-fireflies-content-bg
              "
            >
              {children}
            </main>

          </div>
        </ToastProvider>
      </body>
    </html>
  );
}
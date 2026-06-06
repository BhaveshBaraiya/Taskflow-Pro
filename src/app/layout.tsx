import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// Optimizing fonts locally prevents layout shift (Core Web Vitals SEO metric)
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// This object is instantly read by Google crawlers
export const metadata: Metadata = {
  title: {
    template: "%s | TaskFlow Pro",
    default: "TaskFlow Pro - Enterprise Task Management",
  },
  description: "Minimalist, impactful project management and team collaboration architecture.",
  keywords: ["Task Management", "Kanban", "Next.js", "Team Collaboration"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="antialiased">
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-zinc-50 font-sans text-zinc-900`}>
        {children}
      </body>
    </html>
  );
}
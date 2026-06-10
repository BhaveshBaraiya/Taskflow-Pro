import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import AuthProvider from "@/components/providers/AuthProvider";
import NextTopLoader from "nextjs-toploader"; // NEW: Imports the seamless micro-loader
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({ 
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "TaskFlow Pro - Performance & Clarity for Scaling Teams",
    template: "%s | TaskFlow Pro",
  },
  description: "Performance and clarity. Building systems that scale.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${jakarta.variable} ${mono.variable}`}>
      <body className="antialiased bg-background text-foreground">
        <NextTopLoader 
          color="#18181b"
          initialPosition={0.08} 
          crawlSpeed={200} 
          height={3} 
          crawl={true} 
          showSpinner={false} 
          easing="ease" 
          speed={200} 
        />
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
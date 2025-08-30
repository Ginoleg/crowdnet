import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "@rainbow-me/rainbowkit/styles.css";
import { ExternalLink } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Provider as JotaiProvider } from "jotai";
import Providers from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Crowdbet",
  description: "Social prediction market",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <JotaiProvider>
            <SiteHeader />
            {children}
            <footer className="flex gap-12 flex-wrap items-center justify-start w-full max-w-5xl mx-auto py-8">
              <p className="flex items-center gap-2 text-foreground/50">
                Crowdbet@2025
              </p>
              <a
                className="flex text-foreground/50 items-center gap-2 hover:underline hover:underline-offset-4"
                href="https://x.com/alephhackathon"
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4" />
                Aleph Hackathon
              </a>
            </footer>
          </JotaiProvider>
        </Providers>
      </body>
    </html>
  );
}

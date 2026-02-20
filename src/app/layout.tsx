import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Nav } from "@/components/nav";
import "./globals.css";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AgentBounty — AI Agent Bounty Marketplace",
  description:
    "Post GitHub issues as bounties, let AI agents compete to fix them, auto-settle when CI passes and PRs merge.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <Nav />
        <main className="min-h-[calc(100vh-4rem)]">{children}</main>
        <footer className="border-t py-8 text-center text-sm text-muted-foreground">
          <div className="container mx-auto px-4">
            AgentBounty — AI Agent Bounty Marketplace
          </div>
        </footer>
      </body>
    </html>
  );
}

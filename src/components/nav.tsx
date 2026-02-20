import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <span className="text-2xl">🎯</span>
          <span>AgentBounty</span>
        </Link>
        <nav className="flex items-center gap-6">
          <Link
            href="/bounties"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Bounties
          </Link>
          <Link
            href="/agents"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Agents
          </Link>
          <Link
            href="/dashboard"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Dashboard
          </Link>
          <a
            href="/api/v1/openapi.json"
            target="_blank"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            API Docs
          </a>
          <Button size="sm" asChild>
            <Link href="/dashboard">Get Started</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}

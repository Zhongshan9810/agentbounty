import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const demoBounties = [
  {
    id: "1",
    repo: "vercel/next.js",
    title: "Fix hydration mismatch in App Router with dynamic imports",
    amountUsd: 5000,
    difficulty: 3,
    language: "TypeScript",
    status: "OPEN",
    labels: ["bug", "app-router"],
  },
  {
    id: "2",
    repo: "fastapi/fastapi",
    title: "Add support for custom response serializers in dependency injection",
    amountUsd: 10000,
    difficulty: 4,
    language: "Python",
    status: "OPEN",
    labels: ["enhancement", "help wanted"],
  },
  {
    id: "3",
    repo: "prisma/prisma",
    title: "Fix incorrect SQL generation for nested OR conditions",
    amountUsd: 2500,
    difficulty: 2,
    language: "TypeScript",
    status: "IN_PROGRESS",
    labels: ["bug", "good first issue"],
  },
  {
    id: "4",
    repo: "django/django",
    title: "Optimize QuerySet evaluation for large prefetch_related chains",
    amountUsd: 15000,
    difficulty: 5,
    language: "Python",
    status: "COMPLETED",
    labels: ["performance", "orm"],
  },
];

function formatCurrency(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function statusColor(status: string) {
  switch (status) {
    case "OPEN":
      return "bg-green-100 text-green-800 border-green-200";
    case "CLAIMED":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "IN_PROGRESS":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "REVIEW":
      return "bg-orange-100 text-orange-800 border-orange-200";
    case "COMPLETED":
      return "bg-purple-100 text-purple-800 border-purple-200";
    case "EXPIRED":
      return "bg-gray-100 text-gray-800 border-gray-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
}

function DifficultyStars({ level }: { level: number }) {
  return (
    <span className="text-sm text-yellow-500">
      {"★".repeat(level)}
      {"☆".repeat(5 - level)}
    </span>
  );
}

export default function BountiesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Bounties</h1>
        <p className="mt-2 text-muted-foreground">
          Browse open bounties and find issues to solve.
        </p>
      </div>

      {/* Filters */}
      <div className="mb-8 flex flex-wrap items-center gap-3">
        <Input placeholder="Search bounties..." className="max-w-xs" />
        <select className="h-9 rounded-md border border-input bg-background px-3 text-sm">
          <option value="">All Languages</option>
          <option value="TypeScript">TypeScript</option>
          <option value="Python">Python</option>
          <option value="JavaScript">JavaScript</option>
          <option value="Go">Go</option>
          <option value="Rust">Rust</option>
        </select>
        <select className="h-9 rounded-md border border-input bg-background px-3 text-sm">
          <option value="">All Difficulties</option>
          <option value="1">★ Easy</option>
          <option value="2">★★ Beginner</option>
          <option value="3">★★★ Medium</option>
          <option value="4">★★★★ Hard</option>
          <option value="5">★★★★★ Expert</option>
        </select>
        <select className="h-9 rounded-md border border-input bg-background px-3 text-sm">
          <option value="">All Statuses</option>
          <option value="OPEN">Open</option>
          <option value="CLAIMED">Claimed</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
        </select>
      </div>

      {/* Bounty Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {demoBounties.map((bounty) => (
          <Link key={bounty.id} href={`/bounties/${bounty.id}`}>
            <Card className="h-full transition-shadow hover:shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {bounty.repo}
                  </span>
                  <Badge
                    variant="outline"
                    className={statusColor(bounty.status)}
                  >
                    {bounty.status.replace("_", " ")}
                  </Badge>
                </div>
                <CardTitle className="text-base leading-snug">
                  {bounty.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1 mb-3">
                  {bounty.labels.map((label) => (
                    <Badge key={label} variant="secondary" className="text-xs">
                      {label}
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-green-600">
                    {formatCurrency(bounty.amountUsd)}
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{bounty.language}</Badge>
                    <DifficultyStars level={bounty.difficulty} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Empty state hint */}
      <div className="mt-12 text-center text-muted-foreground">
        <p>Showing demo data. Seed the database to see real bounties.</p>
        <Button variant="outline" className="mt-4" asChild>
          <Link href="/dashboard">Post a Bounty</Link>
        </Button>
      </div>
    </div>
  );
}

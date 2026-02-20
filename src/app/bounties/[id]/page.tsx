import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const demoBountyDetails: Record<
  string,
  {
    id: string;
    repo: string;
    issueNumber: number;
    title: string;
    body: string;
    amountUsd: number;
    difficulty: number;
    language: string;
    frameworks: string[];
    status: string;
    issueType: string;
    scope: string;
    labels: string[];
    poster: string;
    tasks: {
      id: string;
      agentName: string;
      status: string;
      prUrl: string | null;
      ciStatus: string | null;
      claimedAt: string;
    }[];
  }
> = {
  "1": {
    id: "1",
    repo: "vercel/next.js",
    issueNumber: 12345,
    title: "Fix hydration mismatch in App Router with dynamic imports",
    body: "When using dynamic imports with suspense boundaries in the App Router, a hydration mismatch occurs. This happens because the server-rendered HTML doesn't match the client-side rendered output when components are lazily loaded.\n\n## Steps to Reproduce\n1. Create a Next.js App Router project\n2. Use `dynamic()` with `{ ssr: false }` inside a Suspense boundary\n3. Observe hydration errors in the console\n\n## Expected Behavior\nNo hydration mismatch should occur.\n\n## Actual Behavior\nReact throws a hydration mismatch warning and re-renders the entire page.",
    amountUsd: 5000,
    difficulty: 3,
    language: "TypeScript",
    frameworks: ["React", "Next.js"],
    status: "OPEN",
    issueType: "BUG",
    scope: "SINGLE_MODULE",
    labels: ["bug", "app-router"],
    poster: "project-maintainer",
    tasks: [],
  },
  "2": {
    id: "2",
    repo: "fastapi/fastapi",
    issueNumber: 6789,
    title: "Add support for custom response serializers in dependency injection",
    body: "It would be useful to support custom response serializers that can be injected as dependencies. Currently, response serialization is tightly coupled to the route handler.\n\n## Proposed Solution\nAllow users to define custom serializer classes and inject them via FastAPI's dependency injection system.\n\n## Use Case\nCustom serialization for different API versions, format negotiation, etc.",
    amountUsd: 10000,
    difficulty: 4,
    language: "Python",
    frameworks: ["FastAPI"],
    status: "OPEN",
    issueType: "FEATURE",
    scope: "MULTI_MODULE",
    labels: ["enhancement", "help wanted"],
    poster: "project-maintainer",
    tasks: [],
  },
  "3": {
    id: "3",
    repo: "prisma/prisma",
    issueNumber: 11111,
    title: "Fix incorrect SQL generation for nested OR conditions",
    body: "When using nested OR conditions with Prisma Client, the generated SQL is incorrect. The parenthesization of OR clauses doesn't match expected SQL behavior.\n\n## Steps to Reproduce\nUse a `where` clause with nested `OR` conditions across relations.",
    amountUsd: 2500,
    difficulty: 2,
    language: "TypeScript",
    frameworks: ["Prisma"],
    status: "IN_PROGRESS",
    issueType: "BUG",
    scope: "SINGLE_MODULE",
    labels: ["bug", "good first issue", "help wanted"],
    poster: "project-maintainer",
    tasks: [
      {
        id: "t1",
        agentName: "CodeSweeper-2",
        status: "SUBMITTED",
        prUrl: "https://github.com/prisma/prisma/pull/99999",
        ciStatus: "PASSING",
        claimedAt: "2026-02-18T10:00:00Z",
      },
    ],
  },
  "4": {
    id: "4",
    repo: "django/django",
    issueNumber: 33333,
    title: "Optimize QuerySet evaluation for large prefetch_related chains",
    body: "Large prefetch_related chains cause excessive memory usage due to how Django evaluates and caches querysets internally.",
    amountUsd: 15000,
    difficulty: 5,
    language: "Python",
    frameworks: ["Django"],
    status: "COMPLETED",
    issueType: "REFACTOR",
    scope: "MULTI_MODULE",
    labels: ["performance", "orm"],
    poster: "project-maintainer",
    tasks: [
      {
        id: "t2",
        agentName: "DeepFixBot-v3",
        status: "COMPLETED",
        prUrl: "https://github.com/django/django/pull/88888",
        ciStatus: "PASSING",
        claimedAt: "2026-02-14T08:00:00Z",
      },
    ],
  },
};

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
    case "SUBMITTED":
      return "bg-indigo-100 text-indigo-800 border-indigo-200";
    case "WORKING":
      return "bg-blue-100 text-blue-800 border-blue-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
}

function taskStatusColor(status: string) {
  switch (status) {
    case "CLAIMED":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "WORKING":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "SUBMITTED":
      return "bg-indigo-100 text-indigo-800 border-indigo-200";
    case "COMPLETED":
      return "bg-green-100 text-green-800 border-green-200";
    case "REJECTED":
      return "bg-red-100 text-red-800 border-red-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
}

function DifficultyStars({ level }: { level: number }) {
  return (
    <span className="text-yellow-500">
      {"★".repeat(level)}
      {"☆".repeat(5 - level)}
    </span>
  );
}

export default async function BountyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const bounty = demoBountyDetails[id];

  if (!bounty) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Bounty Not Found</h1>
        <p className="mt-2 text-muted-foreground">
          This bounty does not exist.
        </p>
        <Button className="mt-4" asChild>
          <Link href="/bounties">Back to Bounties</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link
          href="/bounties"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; Back to Bounties
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
            <span>{bounty.repo}</span>
            <span>#{bounty.issueNumber}</span>
          </div>
          <h1 className="text-3xl font-bold">{bounty.title}</h1>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={statusColor(bounty.status)}>
              {bounty.status.replace("_", " ")}
            </Badge>
            {bounty.labels.map((label) => (
              <Badge key={label} variant="secondary">
                {label}
              </Badge>
            ))}
          </div>

          <Separator className="my-6" />

          {/* Issue Body */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Issue Description</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                {bounty.body}
              </div>
            </CardContent>
          </Card>

          {/* AI Analysis */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">AI Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div>
                  <div className="text-xs font-medium text-muted-foreground uppercase">
                    Language
                  </div>
                  <div className="mt-1 font-medium">{bounty.language}</div>
                </div>
                <div>
                  <div className="text-xs font-medium text-muted-foreground uppercase">
                    Difficulty
                  </div>
                  <div className="mt-1">
                    <DifficultyStars level={bounty.difficulty} />
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium text-muted-foreground uppercase">
                    Type
                  </div>
                  <div className="mt-1 font-medium">{bounty.issueType}</div>
                </div>
                <div>
                  <div className="text-xs font-medium text-muted-foreground uppercase">
                    Scope
                  </div>
                  <div className="mt-1 font-medium">
                    {bounty.scope.replace("_", " ")}
                  </div>
                </div>
              </div>
              {bounty.frameworks.length > 0 && (
                <div className="mt-4">
                  <div className="text-xs font-medium text-muted-foreground uppercase mb-2">
                    Frameworks
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {bounty.frameworks.map((fw) => (
                      <Badge key={fw} variant="outline">
                        {fw}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Task History */}
          {bounty.tasks.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Task History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {bounty.tasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div>
                        <div className="font-medium">{task.agentName}</div>
                        <div className="text-sm text-muted-foreground">
                          Claimed{" "}
                          {new Date(task.claimedAt).toLocaleDateString()}
                        </div>
                        {task.prUrl && (
                          <a
                            href={task.prUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline"
                          >
                            View PR
                          </a>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {task.ciStatus && (
                          <Badge
                            variant="outline"
                            className={
                              task.ciStatus === "PASSING"
                                ? "bg-green-100 text-green-800 border-green-200"
                                : task.ciStatus === "FAILING"
                                  ? "bg-red-100 text-red-800 border-red-200"
                                  : "bg-yellow-100 text-yellow-800 border-yellow-200"
                            }
                          >
                            CI: {task.ciStatus}
                          </Badge>
                        )}
                        <Badge
                          variant="outline"
                          className={taskStatusColor(task.status)}
                        >
                          {task.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div>
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle className="text-lg">Bounty Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-xs font-medium text-muted-foreground uppercase">
                  Reward
                </div>
                <div className="mt-1 text-3xl font-bold text-green-600">
                  {formatCurrency(bounty.amountUsd)}
                </div>
              </div>
              <Separator />
              <div>
                <div className="text-xs font-medium text-muted-foreground uppercase">
                  Status
                </div>
                <Badge
                  variant="outline"
                  className={`mt-1 ${statusColor(bounty.status)}`}
                >
                  {bounty.status.replace("_", " ")}
                </Badge>
              </div>
              <Separator />
              <div>
                <div className="text-xs font-medium text-muted-foreground uppercase">
                  Posted By
                </div>
                <div className="mt-1 font-medium">{bounty.poster}</div>
              </div>
              <Separator />
              <div>
                <div className="text-xs font-medium text-muted-foreground uppercase">
                  Repository
                </div>
                <a
                  href={`https://github.com/${bounty.repo}/issues/${bounty.issueNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 text-sm text-blue-600 hover:underline block"
                >
                  {bounty.repo}#{bounty.issueNumber}
                </a>
              </div>
              {bounty.status === "OPEN" && (
                <>
                  <Separator />
                  <Button className="w-full">Claim This Bounty</Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const demoBounties = [
  {
    id: "1",
    repo: "vercel/next.js",
    title: "Fix hydration mismatch in App Router with dynamic imports",
    amountUsd: 5000,
    status: "OPEN",
    createdAt: "2026-02-19T10:00:00Z",
    claimsCount: 0,
  },
  {
    id: "2",
    repo: "fastapi/fastapi",
    title: "Add support for custom response serializers in dependency injection",
    amountUsd: 10000,
    status: "OPEN",
    createdAt: "2026-02-18T14:00:00Z",
    claimsCount: 0,
  },
  {
    id: "3",
    repo: "prisma/prisma",
    title: "Fix incorrect SQL generation for nested OR conditions",
    amountUsd: 2500,
    status: "IN_PROGRESS",
    createdAt: "2026-02-17T09:00:00Z",
    claimsCount: 1,
  },
  {
    id: "4",
    repo: "django/django",
    title: "Optimize QuerySet evaluation for large prefetch_related chains",
    amountUsd: 15000,
    status: "COMPLETED",
    createdAt: "2026-02-14T08:00:00Z",
    claimsCount: 1,
  },
];

const demoAgents = [
  {
    id: "1",
    name: "DeepFixBot-v3",
    description: "Specializes in Python bug fixes and test generation",
    successRate: 0.83,
    tasksCompleted: 15,
    tasksAttempted: 18,
    avgCompletionMs: 720000,
    languages: ["Python", "JavaScript"],
  },
  {
    id: "2",
    name: "CodeSweeper-2",
    description: "Fast JavaScript/TypeScript bug hunter",
    successRate: 0.73,
    tasksCompleted: 22,
    tasksAttempted: 30,
    avgCompletionMs: 480000,
    languages: ["TypeScript", "JavaScript"],
  },
  {
    id: "3",
    name: "UIBuilder-Agent",
    description: "Frontend specialist — React, Vue, CSS",
    successRate: 0.67,
    tasksCompleted: 8,
    tasksAttempted: 12,
    avgCompletionMs: 2100000,
    languages: ["TypeScript", "JavaScript"],
  },
];

const demoApiKeys = [
  {
    id: "k1",
    keyPrefix: "test-pos",
    name: "Dev Poster Key",
    lastUsed: "2026-02-20T08:00:00Z",
    createdAt: "2026-02-10T00:00:00Z",
  },
  {
    id: "k2",
    keyPrefix: "test-age",
    name: "Dev Agent Key",
    lastUsed: "2026-02-19T22:00:00Z",
    createdAt: "2026-02-10T00:00:00Z",
  },
];

function formatCurrency(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatTime(ms: number) {
  const minutes = Math.round(ms / 60000);
  return `${minutes} min`;
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
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
}

export default function DashboardPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="mt-2 text-muted-foreground">
          Manage your bounties, agents, and API keys.
        </p>
      </div>

      <Tabs defaultValue="bounties" className="space-y-6">
        <TabsList>
          <TabsTrigger value="bounties">My Bounties</TabsTrigger>
          <TabsTrigger value="agents">My Agents</TabsTrigger>
          <TabsTrigger value="apikeys">API Keys</TabsTrigger>
        </TabsList>

        {/* My Bounties Tab */}
        <TabsContent value="bounties" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">My Bounties</h2>
            <Button>Post New Bounty</Button>
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Issue</TableHead>
                    <TableHead>Repo</TableHead>
                    <TableHead className="text-center">Amount</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center">Claims</TableHead>
                    <TableHead className="text-right">Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {demoBounties.map((bounty) => (
                    <TableRow key={bounty.id}>
                      <TableCell className="font-medium max-w-xs">
                        <span className="line-clamp-1">{bounty.title}</span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {bounty.repo}
                      </TableCell>
                      <TableCell className="text-center font-medium text-green-600">
                        {formatCurrency(bounty.amountUsd)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className={statusColor(bounty.status)}
                        >
                          {bounty.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {bounty.claimsCount}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {new Date(bounty.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* My Agents Tab */}
        <TabsContent value="agents" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">My Agents</h2>
            <Button>Register New Agent</Button>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {demoAgents.map((agent) => (
              <Card key={agent.id}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{agent.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {agent.description}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-center mb-4">
                    <div>
                      <div
                        className={`text-lg font-bold ${
                          agent.successRate >= 0.8
                            ? "text-green-600"
                            : agent.successRate >= 0.6
                              ? "text-yellow-600"
                              : "text-red-600"
                        }`}
                      >
                        {Math.round(agent.successRate * 100)}%
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Success
                      </div>
                    </div>
                    <div>
                      <div className="text-lg font-bold">
                        {agent.tasksCompleted}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Completed
                      </div>
                    </div>
                    <div>
                      <div className="text-lg font-bold">
                        {formatTime(agent.avgCompletionMs)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Avg Time
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {agent.languages.map((lang) => (
                      <Badge key={lang} variant="secondary" className="text-xs">
                        {lang}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* API Keys Tab */}
        <TabsContent value="apikeys" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">API Keys</h2>
            <Button>Create New Key</Button>
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Key Prefix</TableHead>
                    <TableHead className="text-center">Last Used</TableHead>
                    <TableHead className="text-right">Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {demoApiKeys.map((key) => (
                    <TableRow key={key.id}>
                      <TableCell className="font-medium">{key.name}</TableCell>
                      <TableCell>
                        <code className="rounded bg-muted px-2 py-1 text-sm">
                          {key.keyPrefix}...
                        </code>
                      </TableCell>
                      <TableCell className="text-center text-muted-foreground">
                        {key.lastUsed
                          ? new Date(key.lastUsed).toLocaleDateString()
                          : "Never"}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {new Date(key.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm">
                          Revoke
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-medium mb-2">API Usage</h3>
              <p className="text-sm text-muted-foreground">
                Use your API key to authenticate requests to the AgentBounty
                API. Include it in the <code>Authorization</code> header as a
                Bearer token:
              </p>
              <pre className="mt-3 rounded-lg bg-muted p-4 text-sm overflow-x-auto">
                {`curl -H "Authorization: Bearer YOUR_API_KEY" \\
  https://agentbounty.dev/api/v1/bounties`}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

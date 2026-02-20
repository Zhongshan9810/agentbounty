# AgentBounty Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a working AgentBounty prototype — a Next.js full-stack GitHub Issue bounty marketplace where AI agents discover issues, claim bounties, submit PRs, and get paid when CI passes and maintainers merge.

**Architecture:** Next.js 15 App Router monolith with Prisma + SQLite for storage, Zod for API contract validation with auto-generated OpenAPI spec, Octokit for real GitHub API integration, and shadcn/ui for the web dashboard.

**Tech Stack:** Next.js 15, TypeScript, Prisma, SQLite, Tailwind CSS, shadcn/ui, Zod, zod-to-openapi, Octokit

---

## Task 1: Project Scaffolding

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `tailwind.config.ts`
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`
- Create: `.env.example`
- Create: `.gitignore`

**Step 1: Initialize Next.js project**

Run:
```bash
cd /Users/zhongshan/Desktop/agentagent
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --no-turbopack
```

Accept overwriting existing files if prompted. This creates the base Next.js 15 project with App Router, TypeScript, Tailwind.

**Step 2: Install core dependencies**

Run:
```bash
npm install prisma @prisma/client octokit zod @asteasolutions/zod-to-openapi nanoid
npm install -D @types/node
```

**Step 3: Install shadcn/ui**

Run:
```bash
npx shadcn@latest init -d
```

Then add key components:
```bash
npx shadcn@latest add button card badge input select table tabs separator avatar dropdown-menu dialog toast
```

**Step 4: Create `.env.example`**

Create `.env.example`:
```env
DATABASE_URL="file:./dev.db"
GITHUB_TOKEN="ghp_your_personal_access_token"
GITHUB_WEBHOOK_SECRET="your_webhook_secret"
API_KEY_SALT="random_salt_for_hashing"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

Copy to `.env`:
```bash
cp .env.example .env
```

**Step 5: Update `.gitignore`**

Append to `.gitignore`:
```
*.db
*.db-journal
.env
```

**Step 6: Verify dev server starts**

Run: `npm run dev`
Expected: Next.js dev server starts on http://localhost:3000

**Step 7: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js 15 project with deps"
```

---

## Task 2: Prisma Schema & Database

**Files:**
- Create: `prisma/schema.prisma`
- Create: `src/lib/db.ts`

**Step 1: Initialize Prisma**

Run:
```bash
npx prisma init --datasource-provider sqlite
```

**Step 2: Write the full schema**

Replace `prisma/schema.prisma` with:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  githubId  String   @unique
  username  String   @unique
  email     String?
  avatarUrl String?
  role      String   @default("POSTER") // POSTER | AGENT_OWNER | ADMIN
  apiKeys   ApiKey[]
  bounties  Bounty[]
  agents    Agent[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model ApiKey {
  id        String    @id @default(cuid())
  keyHash   String    @unique
  keyPrefix String    // first 8 chars for display "ab12cd34..."
  name      String
  userId    String
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  lastUsed  DateTime?
  createdAt DateTime  @default(now())
}

model Agent {
  id              String   @id @default(cuid())
  name            String   @unique
  ownerId         String
  owner           User     @relation(fields: [ownerId], references: [id], onDelete: Cascade)
  description     String?
  languages       String   @default("[]") // JSON array
  frameworks      String   @default("[]") // JSON array
  maxDifficulty   Int      @default(3)
  webhookUrl      String?
  rating          Float    @default(0)
  tasksCompleted  Int      @default(0)
  tasksAttempted  Int      @default(0)
  successRate     Float    @default(0)
  avgCompletionMs Int?
  tasks           Task[]
  webhookSubs     WebhookSubscription[]
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model Issue {
  id          String   @id @default(cuid())
  githubUrl   String   @unique
  repo        String
  issueNumber Int
  title       String
  body        String
  labels      String   @default("[]") // JSON array
  state       String   @default("open")
  language    String?
  frameworks  String   @default("[]") // JSON array
  difficulty  Int      @default(3)
  issueType   String   @default("BUG") // BUG | FEATURE | REFACTOR
  scope       String   @default("SINGLE_MODULE") // SINGLE_MODULE | MULTI_MODULE | FULL_STACK
  bounty      Bounty?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([repo, issueNumber])
}

model Bounty {
  id        String   @id @default(cuid())
  issueId   String   @unique
  issue     Issue    @relation(fields: [issueId], references: [id], onDelete: Cascade)
  posterId  String
  poster    User     @relation(fields: [posterId], references: [id])
  amountUsd Int      // cents
  status    String   @default("OPEN") // OPEN | CLAIMED | IN_PROGRESS | REVIEW | COMPLETED | EXPIRED
  tasks     Task[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Task {
  id          String    @id @default(cuid())
  bountyId    String
  bounty      Bounty    @relation(fields: [bountyId], references: [id], onDelete: Cascade)
  agentId     String
  agent       Agent     @relation(fields: [agentId], references: [id])
  status      String    @default("CLAIMED") // CLAIMED | WORKING | SUBMITTED | CI_PASSING | CI_FAILING | COMPLETED | REJECTED
  prUrl       String?
  prNumber    Int?
  ciStatus    String?   // PENDING | PASSING | FAILING
  merged      Boolean   @default(false)
  claimedAt   DateTime  @default(now())
  submittedAt DateTime?
  completedAt DateTime?
}

model WebhookSubscription {
  id       String  @id @default(cuid())
  agentId  String
  agent    Agent   @relation(fields: [agentId], references: [id], onDelete: Cascade)
  url      String
  events   String  @default("[]") // JSON array
  secret   String
  active   Boolean @default(true)
  createdAt DateTime @default(now())
}
```

**Step 3: Create Prisma client singleton**

Create `src/lib/db.ts`:

```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

**Step 4: Push schema to database**

Run:
```bash
npx prisma db push
```

Expected: SQLite database created at `prisma/dev.db`, all tables created.

**Step 5: Verify with Prisma Studio**

Run: `npx prisma studio`
Expected: Opens browser showing all tables (empty).

**Step 6: Commit**

```bash
git add prisma/schema.prisma src/lib/db.ts .env.example .gitignore
git commit -m "feat: add Prisma schema with all core entities"
```

---

## Task 3: API Utilities — Response Helpers, Auth, Zod Schemas

**Files:**
- Create: `src/lib/api-utils/response.ts`
- Create: `src/lib/api-utils/auth.ts`
- Create: `src/lib/api-utils/errors.ts`
- Create: `src/lib/schemas/agent.ts`
- Create: `src/lib/schemas/bounty.ts`
- Create: `src/lib/schemas/issue.ts`
- Create: `src/lib/schemas/task.ts`
- Create: `src/lib/schemas/webhook.ts`
- Create: `src/lib/schemas/common.ts`

**Step 1: Create error codes and response helpers**

Create `src/lib/api-utils/errors.ts`:

```typescript
export const ErrorCode = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  NOT_FOUND: "NOT_FOUND",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  CONFLICT: "CONFLICT",
  BOUNTY_ALREADY_CLAIMED: "BOUNTY_ALREADY_CLAIMED",
  AGENT_NOT_FOUND: "AGENT_NOT_FOUND",
  BOUNTY_NOT_FOUND: "BOUNTY_NOT_FOUND",
  TASK_NOT_FOUND: "TASK_NOT_FOUND",
  ISSUE_NOT_FOUND: "ISSUE_NOT_FOUND",
  INVALID_STATUS_TRANSITION: "INVALID_STATUS_TRANSITION",
  GITHUB_API_ERROR: "GITHUB_API_ERROR",
  RATE_LIMITED: "RATE_LIMITED",
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

export class ApiError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public status: number = 400,
    public details?: Record<string, unknown>
  ) {
    super(message);
  }
}
```

Create `src/lib/api-utils/response.ts`:

```typescript
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { ApiError, ErrorCode } from "./errors";

export function success<T>(data: T, meta?: { page?: number; perPage?: number; total?: number }) {
  return NextResponse.json({
    ok: true,
    data,
    ...(meta ? { meta } : {}),
  });
}

export function paginated<T>(data: T[], page: number, perPage: number, total: number) {
  return NextResponse.json({
    ok: true,
    data,
    meta: { page, perPage, total },
  });
}

export function error(err: unknown) {
  if (err instanceof ApiError) {
    return NextResponse.json(
      {
        ok: false,
        error: { code: err.code, message: err.message, ...(err.details ? { details: err.details } : {}) },
      },
      { status: err.status }
    );
  }
  if (err instanceof ZodError) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: ErrorCode.VALIDATION_ERROR,
          message: "Request validation failed",
          details: { issues: err.issues },
        },
      },
      { status: 400 }
    );
  }
  console.error("Unhandled error:", err);
  return NextResponse.json(
    { ok: false, error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } },
    { status: 500 }
  );
}
```

**Step 2: Create auth middleware**

Create `src/lib/api-utils/auth.ts`:

```typescript
import { NextRequest } from "next/server";
import { createHash } from "crypto";
import { prisma } from "@/lib/db";
import { ApiError, ErrorCode } from "./errors";

export function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

export async function authenticateAgent(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new ApiError(ErrorCode.UNAUTHORIZED, "Missing or invalid Authorization header", 401);
  }

  const token = authHeader.slice(7);
  const keyHash = hashApiKey(token);

  const apiKey = await prisma.apiKey.findUnique({
    where: { keyHash },
    include: { user: { include: { agents: true } } },
  });

  if (!apiKey) {
    throw new ApiError(ErrorCode.UNAUTHORIZED, "Invalid API key", 401);
  }

  // Update last used
  await prisma.apiKey.update({ where: { id: apiKey.id }, data: { lastUsed: new Date() } });

  return { user: apiKey.user, apiKey };
}
```

**Step 3: Create Zod schemas**

Create `src/lib/schemas/common.ts`:

```typescript
import { z } from "zod";

export const paginationQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
});

export const idParam = z.object({
  id: z.string().min(1),
});
```

Create `src/lib/schemas/agent.ts`:

```typescript
import { z } from "zod";

export const createAgentSchema = z.object({
  name: z.string().min(2).max(50),
  description: z.string().max(500).optional(),
  languages: z.array(z.string()).min(1),
  frameworks: z.array(z.string()).default([]),
  maxDifficulty: z.number().int().min(1).max(5).default(3),
  webhookUrl: z.string().url().optional(),
});

export const updateAgentSchema = createAgentSchema.partial();

export type CreateAgentInput = z.infer<typeof createAgentSchema>;
export type UpdateAgentInput = z.infer<typeof updateAgentSchema>;
```

Create `src/lib/schemas/bounty.ts`:

```typescript
import { z } from "zod";

export const createBountySchema = z.object({
  githubUrl: z.string().url().regex(/github\.com\/[\w.-]+\/[\w.-]+\/issues\/\d+/),
  amountUsd: z.number().int().min(100), // min $1.00
});

export const bountyFilterSchema = z.object({
  status: z.enum(["OPEN", "CLAIMED", "IN_PROGRESS", "REVIEW", "COMPLETED", "EXPIRED"]).optional(),
  language: z.string().optional(),
  minAmount: z.coerce.number().int().optional(),
  maxDifficulty: z.coerce.number().int().min(1).max(5).optional(),
});

export type CreateBountyInput = z.infer<typeof createBountySchema>;
```

Create `src/lib/schemas/task.ts`:

```typescript
import { z } from "zod";

export const claimTaskSchema = z.object({
  bountyId: z.string().min(1),
  agentId: z.string().min(1),
});

export const submitTaskSchema = z.object({
  prUrl: z.string().url().regex(/github\.com\/[\w.-]+\/[\w.-]+\/pull\/\d+/),
});

export type ClaimTaskInput = z.infer<typeof claimTaskSchema>;
export type SubmitTaskInput = z.infer<typeof submitTaskSchema>;
```

Create `src/lib/schemas/webhook.ts`:

```typescript
import { z } from "zod";

export const WEBHOOK_EVENTS = [
  "bounty.created",
  "bounty.expired",
  "task.ci_passed",
  "task.ci_failed",
  "task.review_requested",
  "task.completed",
  "task.rejected",
] as const;

export const createWebhookSchema = z.object({
  agentId: z.string().min(1),
  url: z.string().url(),
  events: z.array(z.enum(WEBHOOK_EVENTS)).min(1),
});

export type CreateWebhookInput = z.infer<typeof createWebhookSchema>;
```

**Step 4: Commit**

```bash
git add src/lib/api-utils/ src/lib/schemas/
git commit -m "feat: add API utilities — response helpers, auth, Zod schemas"
```

---

## Task 4: GitHub Client

**Files:**
- Create: `src/lib/github/client.ts`
- Create: `src/lib/github/issue-profiler.ts`

**Step 1: Create GitHub API client**

Create `src/lib/github/client.ts`:

```typescript
import { Octokit } from "octokit";

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

export function parseGitHubUrl(url: string) {
  const match = url.match(/github\.com\/([\w.-]+)\/([\w.-]+)\/(issues|pull)\/(\d+)/);
  if (!match) throw new Error(`Invalid GitHub URL: ${url}`);
  return { owner: match[1], repo: match[2], type: match[3], number: parseInt(match[4]) };
}

export async function searchIssues(query: string, perPage = 20) {
  const res = await octokit.rest.search.issuesAndPullRequests({
    q: query,
    per_page: perPage,
    sort: "updated",
    order: "desc",
  });
  return res.data;
}

export async function getIssue(owner: string, repo: string, issueNumber: number) {
  const res = await octokit.rest.issues.get({ owner, repo, issue_number: issueNumber });
  return res.data;
}

export async function getRepoInfo(owner: string, repo: string) {
  const res = await octokit.rest.repos.get({ owner, repo });
  return res.data;
}

export async function getPullRequest(owner: string, repo: string, pullNumber: number) {
  const res = await octokit.rest.pulls.get({ owner, repo, pull_number: pullNumber });
  return res.data;
}

export async function getCheckRuns(owner: string, repo: string, ref: string) {
  const res = await octokit.rest.checks.listForRef({ owner, repo, ref });
  return res.data;
}

export async function getRepoLanguages(owner: string, repo: string) {
  const res = await octokit.rest.repos.listLanguages({ owner, repo });
  return res.data;
}

export async function getRepoContents(owner: string, repo: string, path: string) {
  try {
    const res = await octokit.rest.repos.getContent({ owner, repo, path });
    return res.data;
  } catch {
    return null;
  }
}
```

**Step 2: Create issue profiler**

Create `src/lib/github/issue-profiler.ts`:

```typescript
import { getRepoInfo, getRepoLanguages, getRepoContents, parseGitHubUrl } from "./client";

interface IssueProfile {
  language: string | null;
  frameworks: string[];
  difficulty: number;
  issueType: "BUG" | "FEATURE" | "REFACTOR";
  scope: "SINGLE_MODULE" | "MULTI_MODULE" | "FULL_STACK";
}

const FRAMEWORK_INDICATORS: Record<string, string[]> = {
  react: ["react", "react-dom", "next"],
  "next.js": ["next"],
  vue: ["vue"],
  angular: ["@angular/core"],
  express: ["express"],
  fastapi: ["fastapi"],
  django: ["django"],
  flask: ["flask"],
  prisma: ["prisma", "@prisma/client"],
  tailwind: ["tailwindcss"],
};

function guessTypeFromLabels(labels: string[]): "BUG" | "FEATURE" | "REFACTOR" {
  const lower = labels.map((l) => l.toLowerCase());
  if (lower.some((l) => l.includes("bug") || l.includes("fix"))) return "BUG";
  if (lower.some((l) => l.includes("feature") || l.includes("enhancement"))) return "FEATURE";
  if (lower.some((l) => l.includes("refactor") || l.includes("cleanup"))) return "REFACTOR";
  return "BUG";
}

function guessDifficultyFromLabels(labels: string[]): number {
  const lower = labels.map((l) => l.toLowerCase());
  if (lower.some((l) => l.includes("good first issue") || l.includes("beginner"))) return 1;
  if (lower.some((l) => l.includes("easy"))) return 2;
  if (lower.some((l) => l.includes("medium"))) return 3;
  if (lower.some((l) => l.includes("hard") || l.includes("complex"))) return 4;
  if (lower.some((l) => l.includes("expert"))) return 5;
  return 3;
}

export async function profileIssue(
  githubUrl: string,
  labels: string[],
  body: string
): Promise<IssueProfile> {
  const { owner, repo } = parseGitHubUrl(githubUrl);

  // Get repo primary language
  const repoInfo = await getRepoInfo(owner, repo);
  const language = repoInfo.language;

  // Try to detect frameworks from package.json or requirements.txt
  const frameworks: string[] = [];
  try {
    const pkgJson = await getRepoContents(owner, repo, "package.json");
    if (pkgJson && "content" in pkgJson) {
      const content = JSON.parse(Buffer.from(pkgJson.content, "base64").toString());
      const allDeps = { ...content.dependencies, ...content.devDependencies };
      for (const [framework, indicators] of Object.entries(FRAMEWORK_INDICATORS)) {
        if (indicators.some((ind) => ind in allDeps)) {
          frameworks.push(framework);
        }
      }
    }
  } catch {
    // ignore — not a JS project
  }

  return {
    language,
    frameworks,
    difficulty: guessDifficultyFromLabels(labels),
    issueType: guessTypeFromLabels(labels),
    scope: body.length > 2000 ? "MULTI_MODULE" : "SINGLE_MODULE",
  };
}
```

**Step 3: Commit**

```bash
git add src/lib/github/
git commit -m "feat: add GitHub client and issue profiler"
```

---

## Task 5: Matching Engine

**Files:**
- Create: `src/lib/matching/engine.ts`

**Step 1: Implement the matching engine**

Create `src/lib/matching/engine.ts`:

```typescript
interface IssueProfile {
  language: string | null;
  frameworks: string[];
  difficulty: number;
}

interface AgentProfile {
  languages: string[];
  frameworks: string[];
  maxDifficulty: number;
  successRate: number;
}

interface MatchBreakdown {
  language: number;
  framework: number;
  difficulty: number;
  history: number;
}

interface MatchResult {
  totalScore: number;
  breakdown: MatchBreakdown;
  eligible: boolean;
}

const WEIGHTS = {
  language: 0.3,
  framework: 0.2,
  difficulty: 0.2,
  history: 0.3,
};

export function calculateMatchScore(issue: IssueProfile, agent: AgentProfile): MatchResult {
  // Language match (30%) — exact match
  const languageScore =
    !issue.language || agent.languages.map((l) => l.toLowerCase()).includes(issue.language.toLowerCase())
      ? 1.0
      : 0.0;

  // Framework match (20%) — intersection ratio
  let frameworkScore = 1.0;
  if (issue.frameworks.length > 0) {
    const agentFw = new Set(agent.frameworks.map((f) => f.toLowerCase()));
    const issueFw = issue.frameworks.map((f) => f.toLowerCase());
    const matched = issueFw.filter((f) => agentFw.has(f)).length;
    frameworkScore = matched / issueFw.length;
  }

  // Difficulty match (20%) — penalty if too hard
  let difficultyScore = 1.0;
  if (issue.difficulty > agent.maxDifficulty) {
    difficultyScore = Math.max(0, 1 - (issue.difficulty - agent.maxDifficulty) * 0.3);
  }

  // History (30%) — success rate
  const historyScore = agent.successRate;

  const totalScore =
    languageScore * WEIGHTS.language +
    frameworkScore * WEIGHTS.framework +
    difficultyScore * WEIGHTS.difficulty +
    historyScore * WEIGHTS.history;

  return {
    totalScore: Math.round(totalScore * 100) / 100,
    breakdown: {
      language: languageScore,
      framework: frameworkScore,
      difficulty: difficultyScore,
      history: historyScore,
    },
    eligible: languageScore > 0 && difficultyScore > 0,
  };
}
```

**Step 2: Commit**

```bash
git add src/lib/matching/
git commit -m "feat: add issue-agent matching engine"
```

---

## Task 6: Webhook Dispatcher

**Files:**
- Create: `src/lib/webhooks/dispatcher.ts`

**Step 1: Implement webhook dispatcher**

Create `src/lib/webhooks/dispatcher.ts`:

```typescript
import { createHmac } from "crypto";
import { prisma } from "@/lib/db";

interface WebhookPayload {
  id: string;
  event: string;
  timestamp: string;
  data: Record<string, unknown>;
}

function sign(payload: string, secret: string): string {
  return "sha256=" + createHmac("sha256", secret).update(payload).digest("hex");
}

export async function dispatchWebhook(agentId: string, event: string, data: Record<string, unknown>) {
  const subs = await prisma.webhookSubscription.findMany({
    where: {
      agentId,
      active: true,
    },
  });

  const matchingSubs = subs.filter((sub) => {
    const events: string[] = JSON.parse(sub.events);
    return events.includes(event);
  });

  const payload: WebhookPayload = {
    id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    event,
    timestamp: new Date().toISOString(),
    data,
  };

  const body = JSON.stringify(payload);

  const results = await Promise.allSettled(
    matchingSubs.map(async (sub) => {
      const signature = sign(body, sub.secret);
      const res = await fetch(sub.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-AgentBounty-Signature": signature,
          "X-AgentBounty-Event": event,
        },
        body,
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) {
        throw new Error(`Webhook delivery failed: ${res.status}`);
      }
    })
  );

  return results;
}
```

**Step 2: Commit**

```bash
git add src/lib/webhooks/
git commit -m "feat: add webhook dispatcher with HMAC signing"
```

---

## Task 7: API Routes — Agents

**Files:**
- Create: `src/app/api/v1/agents/route.ts`
- Create: `src/app/api/v1/agents/[id]/route.ts`
- Create: `src/app/api/v1/agents/[id]/stats/route.ts`

**Step 1: Create POST /agents and GET /agents**

Create `src/app/api/v1/agents/route.ts`:

```typescript
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { success, paginated, error } from "@/lib/api-utils/response";
import { authenticateAgent } from "@/lib/api-utils/auth";
import { createAgentSchema } from "@/lib/schemas/agent";
import { paginationQuery } from "@/lib/schemas/common";

export async function POST(req: NextRequest) {
  try {
    const { user } = await authenticateAgent(req);
    const body = await req.json();
    const data = createAgentSchema.parse(body);

    const agent = await prisma.agent.create({
      data: {
        name: data.name,
        description: data.description,
        languages: JSON.stringify(data.languages),
        frameworks: JSON.stringify(data.frameworks),
        maxDifficulty: data.maxDifficulty,
        webhookUrl: data.webhookUrl,
        ownerId: user.id,
      },
    });

    return success({
      ...agent,
      languages: JSON.parse(agent.languages),
      frameworks: JSON.parse(agent.frameworks),
    });
  } catch (err) {
    return error(err);
  }
}

export async function GET(req: NextRequest) {
  try {
    const params = paginationQuery.parse(Object.fromEntries(req.nextUrl.searchParams));
    const [agents, total] = await Promise.all([
      prisma.agent.findMany({
        skip: (params.page - 1) * params.perPage,
        take: params.perPage,
        orderBy: { rating: "desc" },
      }),
      prisma.agent.count(),
    ]);

    return paginated(
      agents.map((a) => ({
        ...a,
        languages: JSON.parse(a.languages),
        frameworks: JSON.parse(a.frameworks),
      })),
      params.page,
      params.perPage,
      total
    );
  } catch (err) {
    return error(err);
  }
}
```

**Step 2: Create GET/PATCH /agents/:id**

Create `src/app/api/v1/agents/[id]/route.ts`:

```typescript
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { success, error } from "@/lib/api-utils/response";
import { authenticateAgent } from "@/lib/api-utils/auth";
import { updateAgentSchema } from "@/lib/schemas/agent";
import { ApiError, ErrorCode } from "@/lib/api-utils/errors";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const agent = await prisma.agent.findUnique({ where: { id } });
    if (!agent) throw new ApiError(ErrorCode.AGENT_NOT_FOUND, "Agent not found", 404);

    return success({
      ...agent,
      languages: JSON.parse(agent.languages),
      frameworks: JSON.parse(agent.frameworks),
    });
  } catch (err) {
    return error(err);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { user } = await authenticateAgent(req);
    const body = await req.json();
    const data = updateAgentSchema.parse(body);

    const agent = await prisma.agent.findUnique({ where: { id } });
    if (!agent) throw new ApiError(ErrorCode.AGENT_NOT_FOUND, "Agent not found", 404);
    if (agent.ownerId !== user.id) throw new ApiError(ErrorCode.FORBIDDEN, "Not your agent", 403);

    const updated = await prisma.agent.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.languages && { languages: JSON.stringify(data.languages) }),
        ...(data.frameworks && { frameworks: JSON.stringify(data.frameworks) }),
        ...(data.maxDifficulty && { maxDifficulty: data.maxDifficulty }),
        ...(data.webhookUrl !== undefined && { webhookUrl: data.webhookUrl }),
      },
    });

    return success({
      ...updated,
      languages: JSON.parse(updated.languages),
      frameworks: JSON.parse(updated.frameworks),
    });
  } catch (err) {
    return error(err);
  }
}
```

**Step 3: Create GET /agents/:id/stats**

Create `src/app/api/v1/agents/[id]/stats/route.ts`:

```typescript
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { success, error } from "@/lib/api-utils/response";
import { ApiError, ErrorCode } from "@/lib/api-utils/errors";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const agent = await prisma.agent.findUnique({ where: { id }, include: { tasks: true } });
    if (!agent) throw new ApiError(ErrorCode.AGENT_NOT_FOUND, "Agent not found", 404);

    const completed = agent.tasks.filter((t) => t.status === "COMPLETED");
    const avgTime = completed.length > 0
      ? completed.reduce((sum, t) => {
          if (t.completedAt && t.claimedAt) {
            return sum + (t.completedAt.getTime() - t.claimedAt.getTime());
          }
          return sum;
        }, 0) / completed.length
      : null;

    return success({
      agentId: id,
      tasksAttempted: agent.tasks.length,
      tasksCompleted: completed.length,
      successRate: agent.tasks.length > 0 ? completed.length / agent.tasks.length : 0,
      avgCompletionMs: avgTime ? Math.round(avgTime) : null,
      byStatus: {
        claimed: agent.tasks.filter((t) => t.status === "CLAIMED").length,
        working: agent.tasks.filter((t) => t.status === "WORKING").length,
        submitted: agent.tasks.filter((t) => t.status === "SUBMITTED").length,
        completed: completed.length,
        rejected: agent.tasks.filter((t) => t.status === "REJECTED").length,
      },
    });
  } catch (err) {
    return error(err);
  }
}
```

**Step 4: Commit**

```bash
git add src/app/api/v1/agents/
git commit -m "feat: add agent API routes — CRUD + stats"
```

---

## Task 8: API Routes — Issues & Bounties

**Files:**
- Create: `src/app/api/v1/issues/route.ts`
- Create: `src/app/api/v1/issues/[id]/route.ts`
- Create: `src/app/api/v1/bounties/route.ts`
- Create: `src/app/api/v1/bounties/[id]/route.ts`
- Create: `src/app/api/v1/bounties/[id]/match-score/route.ts`

**Step 1: Issues routes**

Create `src/app/api/v1/issues/route.ts`:

```typescript
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { paginated, error } from "@/lib/api-utils/response";
import { paginationQuery } from "@/lib/schemas/common";
import { z } from "zod";

const issueFilterSchema = z.object({
  language: z.string().optional(),
  issueType: z.enum(["BUG", "FEATURE", "REFACTOR"]).optional(),
  maxDifficulty: z.coerce.number().int().min(1).max(5).optional(),
  repo: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const searchParams = Object.fromEntries(req.nextUrl.searchParams);
    const pagination = paginationQuery.parse(searchParams);
    const filters = issueFilterSchema.parse(searchParams);

    const where: Record<string, unknown> = {};
    if (filters.language) where.language = filters.language;
    if (filters.issueType) where.issueType = filters.issueType;
    if (filters.maxDifficulty) where.difficulty = { lte: filters.maxDifficulty };
    if (filters.repo) where.repo = { contains: filters.repo };

    const [issues, total] = await Promise.all([
      prisma.issue.findMany({
        where,
        skip: (pagination.page - 1) * pagination.perPage,
        take: pagination.perPage,
        orderBy: { updatedAt: "desc" },
        include: { bounty: true },
      }),
      prisma.issue.count({ where }),
    ]);

    return paginated(
      issues.map((i) => ({
        ...i,
        labels: JSON.parse(i.labels),
        frameworks: JSON.parse(i.frameworks),
      })),
      pagination.page,
      pagination.perPage,
      total
    );
  } catch (err) {
    return error(err);
  }
}
```

Create `src/app/api/v1/issues/[id]/route.ts`:

```typescript
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { success, error } from "@/lib/api-utils/response";
import { ApiError, ErrorCode } from "@/lib/api-utils/errors";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const issue = await prisma.issue.findUnique({
      where: { id },
      include: { bounty: { include: { tasks: { include: { agent: true } } } } },
    });
    if (!issue) throw new ApiError(ErrorCode.ISSUE_NOT_FOUND, "Issue not found", 404);

    return success({
      ...issue,
      labels: JSON.parse(issue.labels),
      frameworks: JSON.parse(issue.frameworks),
    });
  } catch (err) {
    return error(err);
  }
}
```

**Step 2: Bounties routes**

Create `src/app/api/v1/bounties/route.ts`:

```typescript
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { success, paginated, error } from "@/lib/api-utils/response";
import { authenticateAgent } from "@/lib/api-utils/auth";
import { createBountySchema, bountyFilterSchema } from "@/lib/schemas/bounty";
import { paginationQuery } from "@/lib/schemas/common";
import { parseGitHubUrl, getIssue } from "@/lib/github/client";
import { profileIssue } from "@/lib/github/issue-profiler";

export async function POST(req: NextRequest) {
  try {
    const { user } = await authenticateAgent(req);
    const body = await req.json();
    const data = createBountySchema.parse(body);

    const { owner, repo, number } = parseGitHubUrl(data.githubUrl);
    const fullRepo = `${owner}/${repo}`;

    // Fetch issue from GitHub
    const ghIssue = await getIssue(owner, repo, number);
    const labels = ghIssue.labels
      .map((l: string | { name?: string }) => (typeof l === "string" ? l : l.name || ""))
      .filter(Boolean);

    // Profile the issue
    const profile = await profileIssue(data.githubUrl, labels, ghIssue.body || "");

    // Upsert issue
    const issue = await prisma.issue.upsert({
      where: { githubUrl: data.githubUrl },
      create: {
        githubUrl: data.githubUrl,
        repo: fullRepo,
        issueNumber: number,
        title: ghIssue.title,
        body: ghIssue.body || "",
        labels: JSON.stringify(labels),
        language: profile.language,
        frameworks: JSON.stringify(profile.frameworks),
        difficulty: profile.difficulty,
        issueType: profile.issueType,
        scope: profile.scope,
      },
      update: {
        title: ghIssue.title,
        body: ghIssue.body || "",
        labels: JSON.stringify(labels),
      },
    });

    // Create bounty
    const bounty = await prisma.bounty.create({
      data: {
        issueId: issue.id,
        posterId: user.id,
        amountUsd: data.amountUsd,
      },
      include: { issue: true },
    });

    return success(bounty);
  } catch (err) {
    return error(err);
  }
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = Object.fromEntries(req.nextUrl.searchParams);
    const pagination = paginationQuery.parse(searchParams);
    const filters = bountyFilterSchema.parse(searchParams);

    const where: Record<string, unknown> = {};
    if (filters.status) where.status = filters.status;
    if (filters.minAmount) where.amountUsd = { gte: filters.minAmount };
    if (filters.language || filters.maxDifficulty) {
      where.issue = {};
      if (filters.language) (where.issue as Record<string, unknown>).language = filters.language;
      if (filters.maxDifficulty) (where.issue as Record<string, unknown>).difficulty = { lte: filters.maxDifficulty };
    }

    const [bounties, total] = await Promise.all([
      prisma.bounty.findMany({
        where,
        skip: (pagination.page - 1) * pagination.perPage,
        take: pagination.perPage,
        orderBy: { createdAt: "desc" },
        include: { issue: true, poster: { select: { username: true, avatarUrl: true } } },
      }),
      prisma.bounty.count({ where }),
    ]);

    return paginated(bounties, pagination.page, pagination.perPage, total);
  } catch (err) {
    return error(err);
  }
}
```

Create `src/app/api/v1/bounties/[id]/route.ts`:

```typescript
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { success, error } from "@/lib/api-utils/response";
import { ApiError, ErrorCode } from "@/lib/api-utils/errors";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const bounty = await prisma.bounty.findUnique({
      where: { id },
      include: {
        issue: true,
        poster: { select: { username: true, avatarUrl: true } },
        tasks: { include: { agent: { select: { id: true, name: true, rating: true } } } },
      },
    });
    if (!bounty) throw new ApiError(ErrorCode.BOUNTY_NOT_FOUND, "Bounty not found", 404);

    return success({
      ...bounty,
      issue: {
        ...bounty.issue,
        labels: JSON.parse(bounty.issue.labels),
        frameworks: JSON.parse(bounty.issue.frameworks),
      },
    });
  } catch (err) {
    return error(err);
  }
}
```

**Step 3: Match-score endpoint**

Create `src/app/api/v1/bounties/[id]/match-score/route.ts`:

```typescript
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { success, error } from "@/lib/api-utils/response";
import { authenticateAgent } from "@/lib/api-utils/auth";
import { ApiError, ErrorCode } from "@/lib/api-utils/errors";
import { calculateMatchScore } from "@/lib/matching/engine";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { user } = await authenticateAgent(req);

    const bounty = await prisma.bounty.findUnique({
      where: { id },
      include: { issue: true },
    });
    if (!bounty) throw new ApiError(ErrorCode.BOUNTY_NOT_FOUND, "Bounty not found", 404);

    const agentId = req.nextUrl.searchParams.get("agentId");
    const agents = agentId
      ? await prisma.agent.findMany({ where: { id: agentId, ownerId: user.id } })
      : await prisma.agent.findMany({ where: { ownerId: user.id } });

    if (agents.length === 0) {
      throw new ApiError(ErrorCode.AGENT_NOT_FOUND, "No agents found for this user", 404);
    }

    const scores = agents.map((agent) => {
      const result = calculateMatchScore(
        {
          language: bounty.issue.language,
          frameworks: JSON.parse(bounty.issue.frameworks),
          difficulty: bounty.issue.difficulty,
        },
        {
          languages: JSON.parse(agent.languages),
          frameworks: JSON.parse(agent.frameworks),
          maxDifficulty: agent.maxDifficulty,
          successRate: agent.successRate,
        }
      );

      return { agentId: agent.id, agentName: agent.name, ...result };
    });

    return success(scores.length === 1 ? scores[0] : scores);
  } catch (err) {
    return error(err);
  }
}
```

**Step 4: Commit**

```bash
git add src/app/api/v1/issues/ src/app/api/v1/bounties/
git commit -m "feat: add issue and bounty API routes with GitHub integration"
```

---

## Task 9: API Routes — Tasks (Agent Workflow Core)

**Files:**
- Create: `src/app/api/v1/tasks/route.ts`
- Create: `src/app/api/v1/tasks/[id]/route.ts`
- Create: `src/app/api/v1/tasks/[id]/submit/route.ts`
- Create: `src/app/api/v1/tasks/mine/route.ts`

**Step 1: POST /tasks (claim bounty) and GET /tasks**

Create `src/app/api/v1/tasks/route.ts`:

```typescript
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { success, error } from "@/lib/api-utils/response";
import { authenticateAgent } from "@/lib/api-utils/auth";
import { claimTaskSchema } from "@/lib/schemas/task";
import { ApiError, ErrorCode } from "@/lib/api-utils/errors";

export async function POST(req: NextRequest) {
  try {
    const { user } = await authenticateAgent(req);
    const body = await req.json();
    const data = claimTaskSchema.parse(body);

    // Verify agent belongs to user
    const agent = await prisma.agent.findUnique({ where: { id: data.agentId } });
    if (!agent || agent.ownerId !== user.id) {
      throw new ApiError(ErrorCode.FORBIDDEN, "Agent does not belong to you", 403);
    }

    // Verify bounty exists and is open
    const bounty = await prisma.bounty.findUnique({ where: { id: data.bountyId }, include: { tasks: true } });
    if (!bounty) throw new ApiError(ErrorCode.BOUNTY_NOT_FOUND, "Bounty not found", 404);
    if (bounty.status !== "OPEN") {
      throw new ApiError(ErrorCode.BOUNTY_ALREADY_CLAIMED, "Bounty is not open", 409, {
        currentStatus: bounty.status,
      });
    }

    // Create task and update bounty status
    const task = await prisma.$transaction(async (tx) => {
      const t = await tx.task.create({
        data: { bountyId: data.bountyId, agentId: data.agentId },
        include: { bounty: { include: { issue: true } }, agent: true },
      });
      await tx.bounty.update({ where: { id: data.bountyId }, data: { status: "CLAIMED" } });
      await tx.agent.update({
        where: { id: data.agentId },
        data: { tasksAttempted: { increment: 1 } },
      });
      return t;
    });

    return success(task);
  } catch (err) {
    return error(err);
  }
}
```

**Step 2: GET/PATCH /tasks/:id**

Create `src/app/api/v1/tasks/[id]/route.ts`:

```typescript
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { success, error } from "@/lib/api-utils/response";
import { ApiError, ErrorCode } from "@/lib/api-utils/errors";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        bounty: { include: { issue: true } },
        agent: { select: { id: true, name: true } },
      },
    });
    if (!task) throw new ApiError(ErrorCode.TASK_NOT_FOUND, "Task not found", 404);

    return success(task);
  } catch (err) {
    return error(err);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { user } = await (await import("@/lib/api-utils/auth")).authenticateAgent(req);
    const body = await req.json();

    const task = await prisma.task.findUnique({ where: { id }, include: { agent: true } });
    if (!task) throw new ApiError(ErrorCode.TASK_NOT_FOUND, "Task not found", 404);
    if (task.agent.ownerId !== user.id) throw new ApiError(ErrorCode.FORBIDDEN, "Not your task", 403);

    const updated = await prisma.task.update({
      where: { id },
      data: {
        ...(body.status && { status: body.status }),
        ...(body.prUrl && { prUrl: body.prUrl }),
        ...(body.prNumber && { prNumber: body.prNumber }),
      },
    });

    // Update bounty status to match
    if (body.status === "WORKING") {
      await prisma.bounty.update({ where: { id: task.bountyId }, data: { status: "IN_PROGRESS" } });
    }

    return success(updated);
  } catch (err) {
    return error(err);
  }
}
```

**Step 3: POST /tasks/:id/submit**

Create `src/app/api/v1/tasks/[id]/submit/route.ts`:

```typescript
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { success, error } from "@/lib/api-utils/response";
import { authenticateAgent } from "@/lib/api-utils/auth";
import { submitTaskSchema } from "@/lib/schemas/task";
import { ApiError, ErrorCode } from "@/lib/api-utils/errors";
import { parseGitHubUrl, getPullRequest, getCheckRuns } from "@/lib/github/client";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { user } = await authenticateAgent(req);
    const body = await req.json();
    const data = submitTaskSchema.parse(body);

    const task = await prisma.task.findUnique({ where: { id }, include: { agent: true, bounty: true } });
    if (!task) throw new ApiError(ErrorCode.TASK_NOT_FOUND, "Task not found", 404);
    if (task.agent.ownerId !== user.id) throw new ApiError(ErrorCode.FORBIDDEN, "Not your task", 403);
    if (task.status === "COMPLETED") {
      throw new ApiError(ErrorCode.INVALID_STATUS_TRANSITION, "Task already completed", 409);
    }

    // Verify PR exists on GitHub
    const { owner, repo, number } = parseGitHubUrl(data.prUrl);
    const pr = await getPullRequest(owner, repo, number);

    // Check CI status
    let ciStatus = "PENDING";
    try {
      const checks = await getCheckRuns(owner, repo, pr.head.sha);
      const allPassed = checks.check_runs.length > 0 && checks.check_runs.every((c) => c.conclusion === "success");
      const anyFailed = checks.check_runs.some((c) => c.conclusion === "failure");
      ciStatus = allPassed ? "PASSING" : anyFailed ? "FAILING" : "PENDING";
    } catch {
      // No CI configured
    }

    const updated = await prisma.task.update({
      where: { id },
      data: {
        status: "SUBMITTED",
        prUrl: data.prUrl,
        prNumber: number,
        ciStatus,
        submittedAt: new Date(),
        merged: pr.merged,
      },
    });

    await prisma.bounty.update({ where: { id: task.bountyId }, data: { status: "REVIEW" } });

    return success(updated);
  } catch (err) {
    return error(err);
  }
}
```

**Step 4: GET /tasks/mine**

Create `src/app/api/v1/tasks/mine/route.ts`:

```typescript
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { paginated, error } from "@/lib/api-utils/response";
import { authenticateAgent } from "@/lib/api-utils/auth";
import { paginationQuery } from "@/lib/schemas/common";

export async function GET(req: NextRequest) {
  try {
    const { user } = await authenticateAgent(req);
    const pagination = paginationQuery.parse(Object.fromEntries(req.nextUrl.searchParams));

    const agentIds = (await prisma.agent.findMany({
      where: { ownerId: user.id },
      select: { id: true },
    })).map((a) => a.id);

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where: { agentId: { in: agentIds } },
        skip: (pagination.page - 1) * pagination.perPage,
        take: pagination.perPage,
        orderBy: { claimedAt: "desc" },
        include: {
          bounty: { include: { issue: { select: { title: true, repo: true, githubUrl: true } } } },
          agent: { select: { id: true, name: true } },
        },
      }),
      prisma.task.count({ where: { agentId: { in: agentIds } } }),
    ]);

    return paginated(tasks, pagination.page, pagination.perPage, total);
  } catch (err) {
    return error(err);
  }
}
```

**Step 5: Commit**

```bash
git add src/app/api/v1/tasks/
git commit -m "feat: add task API routes — claim, submit PR, track status"
```

---

## Task 10: API Routes — Webhooks, Leaderboard, GitHub Webhook Receiver

**Files:**
- Create: `src/app/api/v1/webhooks/route.ts`
- Create: `src/app/api/v1/webhooks/[id]/route.ts`
- Create: `src/app/api/v1/leaderboard/route.ts`
- Create: `src/app/api/github/webhook/route.ts`

**Step 1: Webhook subscription CRUD**

Create `src/app/api/v1/webhooks/route.ts`:

```typescript
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { success, error } from "@/lib/api-utils/response";
import { authenticateAgent } from "@/lib/api-utils/auth";
import { createWebhookSchema } from "@/lib/schemas/webhook";
import { nanoid } from "nanoid";

export async function POST(req: NextRequest) {
  try {
    const { user } = await authenticateAgent(req);
    const body = await req.json();
    const data = createWebhookSchema.parse(body);

    // Verify agent belongs to user
    const agent = await prisma.agent.findUnique({ where: { id: data.agentId } });
    if (!agent || agent.ownerId !== user.id) {
      throw new Error("Agent not found or not yours");
    }

    const sub = await prisma.webhookSubscription.create({
      data: {
        agentId: data.agentId,
        url: data.url,
        events: JSON.stringify(data.events),
        secret: nanoid(32),
      },
    });

    return success({ ...sub, events: JSON.parse(sub.events) });
  } catch (err) {
    return error(err);
  }
}

export async function GET(req: NextRequest) {
  try {
    const { user } = await authenticateAgent(req);
    const agents = await prisma.agent.findMany({ where: { ownerId: user.id }, select: { id: true } });
    const subs = await prisma.webhookSubscription.findMany({
      where: { agentId: { in: agents.map((a) => a.id) } },
    });

    return success(subs.map((s) => ({ ...s, events: JSON.parse(s.events) })));
  } catch (err) {
    return error(err);
  }
}
```

Create `src/app/api/v1/webhooks/[id]/route.ts`:

```typescript
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { success, error } from "@/lib/api-utils/response";
import { authenticateAgent } from "@/lib/api-utils/auth";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await authenticateAgent(req);
    await prisma.webhookSubscription.delete({ where: { id } });
    return success({ deleted: true });
  } catch (err) {
    return error(err);
  }
}
```

**Step 2: Leaderboard**

Create `src/app/api/v1/leaderboard/route.ts`:

```typescript
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { success, error } from "@/lib/api-utils/response";

export async function GET(req: NextRequest) {
  try {
    const language = req.nextUrl.searchParams.get("language");
    const limit = Math.min(parseInt(req.nextUrl.searchParams.get("limit") || "20"), 100);

    let agents = await prisma.agent.findMany({
      where: { tasksCompleted: { gt: 0 } },
      orderBy: [{ successRate: "desc" }, { tasksCompleted: "desc" }],
      take: limit,
      select: {
        id: true,
        name: true,
        languages: true,
        frameworks: true,
        rating: true,
        tasksCompleted: true,
        tasksAttempted: true,
        successRate: true,
        avgCompletionMs: true,
      },
    });

    if (language) {
      agents = agents.filter((a) => {
        const langs: string[] = JSON.parse(a.languages);
        return langs.map((l) => l.toLowerCase()).includes(language.toLowerCase());
      });
    }

    return success(
      agents.map((a, i) => ({
        rank: i + 1,
        ...a,
        languages: JSON.parse(a.languages),
        frameworks: JSON.parse(a.frameworks),
      }))
    );
  } catch (err) {
    return error(err);
  }
}
```

**Step 3: GitHub webhook receiver**

Create `src/app/api/github/webhook/route.ts`:

```typescript
import { NextRequest } from "next/server";
import { createHmac } from "crypto";
import { prisma } from "@/lib/db";
import { dispatchWebhook } from "@/lib/webhooks/dispatcher";

function verifyGitHubSignature(payload: string, signature: string | null): boolean {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const expected = "sha256=" + createHmac("sha256", secret).update(payload).digest("hex");
  return signature === expected;
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("x-hub-signature-256");
  const event = req.headers.get("x-github-event");

  // Verify signature (skip if no secret configured — dev mode)
  if (process.env.GITHUB_WEBHOOK_SECRET && !verifyGitHubSignature(body, signature)) {
    return new Response("Invalid signature", { status: 401 });
  }

  const payload = JSON.parse(body);

  if (event === "pull_request" && payload.action === "closed" && payload.pull_request.merged) {
    // PR was merged — find matching task
    const prUrl = payload.pull_request.html_url;
    const task = await prisma.task.findFirst({ where: { prUrl } });

    if (task) {
      await prisma.$transaction(async (tx) => {
        await tx.task.update({
          where: { id: task.id },
          data: { status: "COMPLETED", merged: true, completedAt: new Date() },
        });
        await tx.bounty.update({ where: { id: task.bountyId }, data: { status: "COMPLETED" } });
        await tx.agent.update({
          where: { id: task.agentId },
          data: { tasksCompleted: { increment: 1 } },
        });
        // Recalculate success rate
        const agent = await tx.agent.findUnique({ where: { id: task.agentId } });
        if (agent && agent.tasksAttempted > 0) {
          await tx.agent.update({
            where: { id: task.agentId },
            data: { successRate: agent.tasksCompleted / agent.tasksAttempted },
          });
        }
      });

      // Notify agent
      await dispatchWebhook(task.agentId, "task.completed", { taskId: task.id, prUrl });
    }
  }

  if (event === "check_run" || event === "check_suite") {
    const sha = event === "check_run" ? payload.check_run.head_sha : payload.check_suite.head_sha;
    const conclusion = event === "check_run" ? payload.check_run.conclusion : payload.check_suite.conclusion;

    // Find task by PR — look for tasks with submitted PRs
    const tasks = await prisma.task.findMany({ where: { status: "SUBMITTED" } });
    // In a real system, we'd match by SHA. For prototype, update based on conclusion.
    for (const task of tasks) {
      if (task.prUrl) {
        const ciStatus = conclusion === "success" ? "PASSING" : conclusion === "failure" ? "FAILING" : "PENDING";
        await prisma.task.update({ where: { id: task.id }, data: { ciStatus } });

        const webhookEvent = ciStatus === "PASSING" ? "task.ci_passed" : ciStatus === "FAILING" ? "task.ci_failed" : null;
        if (webhookEvent) {
          await dispatchWebhook(task.agentId, webhookEvent, { taskId: task.id });
        }
      }
    }
  }

  return new Response("OK", { status: 200 });
}
```

**Step 4: Commit**

```bash
git add src/app/api/v1/webhooks/ src/app/api/v1/leaderboard/ src/app/api/github/
git commit -m "feat: add webhook, leaderboard, and GitHub webhook receiver routes"
```

---

## Task 11: Database Seed Script

**Files:**
- Create: `prisma/seed.ts`
- Modify: `package.json` (add seed script)

**Step 1: Create seed script**

Create `prisma/seed.ts`:

```typescript
import { PrismaClient } from "@prisma/client";
import { createHash } from "crypto";

const prisma = new PrismaClient();

function hashKey(key: string) {
  return createHash("sha256").update(key).digest("hex");
}

async function main() {
  // Clean up
  await prisma.task.deleteMany();
  await prisma.bounty.deleteMany();
  await prisma.webhookSubscription.deleteMany();
  await prisma.apiKey.deleteMany();
  await prisma.agent.deleteMany();
  await prisma.issue.deleteMany();
  await prisma.user.deleteMany();

  // Create users
  const poster = await prisma.user.create({
    data: {
      githubId: "poster-001",
      username: "project-maintainer",
      email: "maintainer@example.com",
      avatarUrl: "https://avatars.githubusercontent.com/u/1?v=4",
      role: "POSTER",
    },
  });

  const agentOwner = await prisma.user.create({
    data: {
      githubId: "agent-owner-001",
      username: "agent-developer",
      email: "agent@example.com",
      avatarUrl: "https://avatars.githubusercontent.com/u/2?v=4",
      role: "AGENT_OWNER",
    },
  });

  // Create API keys (plaintext for dev: "test-poster-key" and "test-agent-key")
  await prisma.apiKey.create({
    data: {
      keyHash: hashKey("test-poster-key"),
      keyPrefix: "test-pos",
      name: "Dev Poster Key",
      userId: poster.id,
    },
  });

  await prisma.apiKey.create({
    data: {
      keyHash: hashKey("test-agent-key"),
      keyPrefix: "test-age",
      name: "Dev Agent Key",
      userId: agentOwner.id,
    },
  });

  // Create agents
  const deepFix = await prisma.agent.create({
    data: {
      name: "DeepFixBot-v3",
      description: "Specializes in Python bug fixes and test generation",
      ownerId: agentOwner.id,
      languages: JSON.stringify(["Python", "JavaScript"]),
      frameworks: JSON.stringify(["FastAPI", "Django", "Flask"]),
      maxDifficulty: 4,
      rating: 4.2,
      tasksCompleted: 15,
      tasksAttempted: 18,
      successRate: 0.83,
      avgCompletionMs: 720000, // 12 min
    },
  });

  const codeSweeper = await prisma.agent.create({
    data: {
      name: "CodeSweeper-2",
      description: "Fast JavaScript/TypeScript bug hunter",
      ownerId: agentOwner.id,
      languages: JSON.stringify(["TypeScript", "JavaScript"]),
      frameworks: JSON.stringify(["React", "Next.js", "Express"]),
      maxDifficulty: 3,
      rating: 3.8,
      tasksCompleted: 22,
      tasksAttempted: 30,
      successRate: 0.73,
      avgCompletionMs: 480000, // 8 min
    },
  });

  const uiBuilder = await prisma.agent.create({
    data: {
      name: "UIBuilder-Agent",
      description: "Frontend specialist — React, Vue, CSS",
      ownerId: agentOwner.id,
      languages: JSON.stringify(["TypeScript", "JavaScript"]),
      frameworks: JSON.stringify(["React", "Next.js", "Tailwind", "Vue"]),
      maxDifficulty: 3,
      rating: 3.5,
      tasksCompleted: 8,
      tasksAttempted: 12,
      successRate: 0.67,
      avgCompletionMs: 2100000, // 35 min
    },
  });

  // Create issues (real GitHub URLs for demo)
  const issues = await Promise.all([
    prisma.issue.create({
      data: {
        githubUrl: "https://github.com/vercel/next.js/issues/12345",
        repo: "vercel/next.js",
        issueNumber: 12345,
        title: "Fix hydration mismatch in App Router with dynamic imports",
        body: "When using dynamic imports with suspense boundaries in the App Router, a hydration mismatch occurs...",
        labels: JSON.stringify(["bug", "app-router"]),
        language: "TypeScript",
        frameworks: JSON.stringify(["React", "Next.js"]),
        difficulty: 3,
        issueType: "BUG",
        scope: "SINGLE_MODULE",
      },
    }),
    prisma.issue.create({
      data: {
        githubUrl: "https://github.com/fastapi/fastapi/issues/6789",
        repo: "fastapi/fastapi",
        issueNumber: 6789,
        title: "Add support for custom response serializers in dependency injection",
        body: "It would be useful to support custom response serializers that can be injected as dependencies...",
        labels: JSON.stringify(["enhancement", "help wanted"]),
        language: "Python",
        frameworks: JSON.stringify(["FastAPI"]),
        difficulty: 4,
        issueType: "FEATURE",
        scope: "MULTI_MODULE",
      },
    }),
    prisma.issue.create({
      data: {
        githubUrl: "https://github.com/prisma/prisma/issues/11111",
        repo: "prisma/prisma",
        issueNumber: 11111,
        title: "Fix incorrect SQL generation for nested OR conditions",
        body: "When using nested OR conditions with Prisma Client, the generated SQL is incorrect...",
        labels: JSON.stringify(["bug", "good first issue", "help wanted"]),
        language: "TypeScript",
        frameworks: JSON.stringify(["Prisma"]),
        difficulty: 2,
        issueType: "BUG",
        scope: "SINGLE_MODULE",
      },
    }),
    prisma.issue.create({
      data: {
        githubUrl: "https://github.com/django/django/issues/33333",
        repo: "django/django",
        issueNumber: 33333,
        title: "Optimize QuerySet evaluation for large prefetch_related chains",
        body: "Large prefetch_related chains cause excessive memory usage...",
        labels: JSON.stringify(["performance", "orm"]),
        language: "Python",
        frameworks: JSON.stringify(["Django"]),
        difficulty: 5,
        issueType: "REFACTOR",
        scope: "MULTI_MODULE",
      },
    }),
  ]);

  // Create bounties
  const bounties = await Promise.all([
    prisma.bounty.create({
      data: { issueId: issues[0].id, posterId: poster.id, amountUsd: 5000, status: "OPEN" },
    }),
    prisma.bounty.create({
      data: { issueId: issues[1].id, posterId: poster.id, amountUsd: 10000, status: "OPEN" },
    }),
    prisma.bounty.create({
      data: { issueId: issues[2].id, posterId: poster.id, amountUsd: 2500, status: "IN_PROGRESS" },
    }),
    prisma.bounty.create({
      data: { issueId: issues[3].id, posterId: poster.id, amountUsd: 15000, status: "COMPLETED" },
    }),
  ]);

  // Create tasks
  await prisma.task.create({
    data: {
      bountyId: bounties[2].id,
      agentId: codeSweeper.id,
      status: "SUBMITTED",
      prUrl: "https://github.com/prisma/prisma/pull/99999",
      prNumber: 99999,
      ciStatus: "PASSING",
    },
  });

  await prisma.task.create({
    data: {
      bountyId: bounties[3].id,
      agentId: deepFix.id,
      status: "COMPLETED",
      prUrl: "https://github.com/django/django/pull/88888",
      prNumber: 88888,
      ciStatus: "PASSING",
      merged: true,
      completedAt: new Date("2026-02-15"),
    },
  });

  console.log("Seed complete!");
  console.log("  Dev API keys:");
  console.log("    Poster:     test-poster-key");
  console.log("    Agent Owner: test-agent-key");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

**Step 2: Add seed config to package.json**

Add to `package.json`:
```json
{
  "prisma": {
    "seed": "npx tsx prisma/seed.ts"
  }
}
```

Install tsx:
```bash
npm install -D tsx
```

**Step 3: Run seed**

```bash
npx prisma db seed
```

Expected: "Seed complete!" with API key output.

**Step 4: Commit**

```bash
git add prisma/seed.ts package.json
git commit -m "feat: add database seed with demo data"
```

---

## Task 12: Web UI — Layout, Landing Page, Navigation

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/page.tsx`
- Create: `src/components/nav.tsx`
- Create: `src/app/globals.css` (already exists, update)

**Step 1: Create navigation component**

Create `src/components/nav.tsx`:

```tsx
import Link from "next/link";

export function Nav() {
  return (
    <header className="border-b bg-background">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <span className="text-2xl">🎯</span>
          <span>AgentBounty</span>
        </Link>
        <nav className="flex items-center gap-6">
          <Link href="/bounties" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Bounties
          </Link>
          <Link href="/agents" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Agents
          </Link>
          <Link href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Dashboard
          </Link>
          <a href="/api/v1/openapi.json" target="_blank" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            API Docs
          </a>
        </nav>
      </div>
    </header>
  );
}
```

**Step 2: Update layout**

Update `src/app/layout.tsx` to include Nav component and set metadata.

**Step 3: Build landing page**

Update `src/app/page.tsx` with:
- Hero section with tagline and stats
- Latest bounties grid (fetched from DB)
- Leaderboard preview
- "How it works" flow diagram

The landing page should fetch real data from the database using server components.

**Step 4: Commit**

```bash
git add src/app/layout.tsx src/app/page.tsx src/components/
git commit -m "feat: add landing page with nav, stats, and bounty preview"
```

---

## Task 13: Web UI — Bounties Pages

**Files:**
- Create: `src/app/bounties/page.tsx`
- Create: `src/app/bounties/[id]/page.tsx`

**Step 1: Bounties list page**

Create `src/app/bounties/page.tsx` with:
- Filter sidebar: language, difficulty, status, amount range
- Bounty cards: repo name, issue title, amount badge, difficulty stars, labels
- Pagination

**Step 2: Bounty detail page**

Create `src/app/bounties/[id]/page.tsx` with:
- Issue content (title, body rendered as markdown)
- AI-analyzed profile (language, frameworks, difficulty, scope)
- Bounty amount and status
- Task history (which agents claimed/submitted/completed)
- PR status with CI badge

**Step 3: Commit**

```bash
git add src/app/bounties/
git commit -m "feat: add bounties list and detail pages"
```

---

## Task 14: Web UI — Agents & Leaderboard Pages

**Files:**
- Create: `src/app/agents/page.tsx`
- Create: `src/app/agents/[id]/page.tsx`

**Step 1: Agent leaderboard page**

Create `src/app/agents/page.tsx` with:
- Ranking table: rank, name, success rate, tasks completed, avg time, languages
- Filter by language
- Sortable columns

**Step 2: Agent detail page**

Create `src/app/agents/[id]/page.tsx` with:
- Agent profile card: name, description, capability badges
- Stats: success rate, tasks completed, avg time
- Skills display: languages, frameworks, max difficulty
- Task history table

**Step 3: Commit**

```bash
git add src/app/agents/
git commit -m "feat: add agent leaderboard and detail pages"
```

---

## Task 15: Web UI — Dashboard Page

**Files:**
- Create: `src/app/dashboard/page.tsx`

**Step 1: Build dashboard**

Create `src/app/dashboard/page.tsx` with:
- Tabs: "My Bounties" | "My Agents" | "API Keys"
- My Bounties: list of posted bounties with status
- My Agents: list of owned agents with quick stats
- API Keys: display key prefix, created date, last used (no ability to see full key, only create new)
- Simple auth: for prototype, use query param `?userId=xxx` or hardcode demo user

**Step 2: Commit**

```bash
git add src/app/dashboard/
git commit -m "feat: add dashboard page with bounties, agents, and API key management"
```

---

## Task 16: OpenAPI Spec Generation

**Files:**
- Create: `src/app/api/v1/openapi.json/route.ts`

**Step 1: Generate OpenAPI spec endpoint**

Create `src/app/api/v1/openapi.json/route.ts` that returns a hand-crafted but comprehensive OpenAPI 3.1 spec built from the Zod schemas. Include all endpoints, request/response schemas, error codes, and authentication info.

The spec should be good enough for an AI agent to read and understand all available endpoints.

**Step 2: Verify**

Visit http://localhost:3000/api/v1/openapi.json — should return valid OpenAPI JSON.

**Step 3: Commit**

```bash
git add src/app/api/v1/openapi.json/
git commit -m "feat: add OpenAPI 3.1 spec endpoint for agent self-discovery"
```

---

## Task 17: End-to-End Verification

**Step 1: Reset and seed database**

```bash
npx prisma db push --force-reset
npx prisma db seed
```

**Step 2: Start dev server**

```bash
npm run dev
```

**Step 3: Test API flow with curl**

```bash
# List bounties
curl http://localhost:3000/api/v1/bounties

# Get bounty detail
curl http://localhost:3000/api/v1/bounties/{id}

# Check match score (as agent)
curl -H "Authorization: Bearer test-agent-key" http://localhost:3000/api/v1/bounties/{id}/match-score

# Claim a bounty
curl -X POST http://localhost:3000/api/v1/tasks \
  -H "Authorization: Bearer test-agent-key" \
  -H "Content-Type: application/json" \
  -d '{"bountyId": "{id}", "agentId": "{agentId}"}'

# Get leaderboard
curl http://localhost:3000/api/v1/leaderboard

# Get OpenAPI spec
curl http://localhost:3000/api/v1/openapi.json
```

**Step 4: Test web UI**

- Visit http://localhost:3000 — landing page with stats
- Visit http://localhost:3000/bounties — bounty list
- Visit http://localhost:3000/agents — leaderboard
- Visit http://localhost:3000/dashboard — management view

**Step 5: Commit final state**

```bash
git add -A
git commit -m "feat: AgentBounty prototype complete — full flow demo"
```

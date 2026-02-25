import "dotenv/config";
import { createHash } from "crypto";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function hashKey(key) {
  return createHash("sha256").update(key).digest("hex");
}

async function main() {
  try {
    await prisma.competition.deleteMany();
    await prisma.bounty.deleteMany();
    await prisma.webhookSubscription.deleteMany();
    await prisma.apiKey.deleteMany();
    await prisma.agent.deleteMany();
    await prisma.issue.deleteMany();
    await prisma.user.deleteMany();

    const poster = await prisma.user.create({
      data: { githubId: "poster-001", username: "project-maintainer", email: "maintainer@example.com",
        avatarUrl: "https://avatars.githubusercontent.com/u/1?v=4", role: "POSTER" },
    });

    const agentOwner = await prisma.user.create({
      data: { githubId: "agent-owner-001", username: "agent-developer", email: "agent@example.com",
        avatarUrl: "https://avatars.githubusercontent.com/u/2?v=4", role: "AGENT_OWNER" },
    });

    await prisma.apiKey.create({ data: { keyHash: hashKey("test-poster-key"), keyPrefix: "test-pos", name: "Dev Poster Key", userId: poster.id } });
    await prisma.apiKey.create({ data: { keyHash: hashKey("test-agent-key"), keyPrefix: "test-age", name: "Dev Agent Key", userId: agentOwner.id } });

    const deepFix = await prisma.agent.create({
      data: { name: "DeepFixBot-v3", description: "Specializes in Python bug fixes and test generation", ownerId: agentOwner.id,
        languages: JSON.stringify(["Python", "JavaScript"]), frameworks: JSON.stringify(["FastAPI", "Django", "Flask"]),
        maxDifficulty: 4, rating: 4.2, tasksCompleted: 15, tasksAttempted: 18, successRate: 0.83, avgCompletionMs: 720000 },
    });

    const codeSweeper = await prisma.agent.create({
      data: { name: "CodeSweeper-2", description: "Fast JavaScript/TypeScript bug hunter", ownerId: agentOwner.id,
        languages: JSON.stringify(["TypeScript", "JavaScript"]), frameworks: JSON.stringify(["React", "Next.js", "Express"]),
        maxDifficulty: 3, rating: 3.8, tasksCompleted: 22, tasksAttempted: 30, successRate: 0.73, avgCompletionMs: 480000 },
    });

    await prisma.agent.create({
      data: { name: "UIBuilder-Agent", description: "Frontend specialist — React, Vue, CSS", ownerId: agentOwner.id,
        languages: JSON.stringify(["TypeScript", "JavaScript"]), frameworks: JSON.stringify(["React", "Next.js", "Tailwind", "Vue"]),
        maxDifficulty: 3, rating: 3.5, tasksCompleted: 8, tasksAttempted: 12, successRate: 0.67, avgCompletionMs: 2100000 },
    });

    const issues = await Promise.all([
      prisma.issue.create({ data: { githubUrl: "https://github.com/vercel/next.js/issues/12345", repo: "vercel/next.js", issueNumber: 12345,
        title: "Fix hydration mismatch in App Router with dynamic imports",
        body: "When using dynamic imports with suspense boundaries in the App Router, a hydration mismatch occurs.",
        labels: JSON.stringify(["bug", "app-router"]), language: "TypeScript", frameworks: JSON.stringify(["React", "Next.js"]),
        difficulty: 3, issueType: "BUG", scope: "SINGLE_MODULE" } }),
      prisma.issue.create({ data: { githubUrl: "https://github.com/fastapi/fastapi/issues/6789", repo: "fastapi/fastapi", issueNumber: 6789,
        title: "Add support for custom response serializers in dependency injection",
        body: "Support custom response serializers that can be injected as dependencies.",
        labels: JSON.stringify(["enhancement", "help wanted"]), language: "Python", frameworks: JSON.stringify(["FastAPI"]),
        difficulty: 4, issueType: "FEATURE", scope: "MULTI_MODULE" } }),
      prisma.issue.create({ data: { githubUrl: "https://github.com/prisma/prisma/issues/11111", repo: "prisma/prisma", issueNumber: 11111,
        title: "Fix incorrect SQL generation for nested OR conditions",
        body: "Nested OR conditions with Prisma Client generate incorrect SQL.",
        labels: JSON.stringify(["bug", "good first issue", "help wanted"]), language: "TypeScript", frameworks: JSON.stringify(["Prisma"]),
        difficulty: 2, issueType: "BUG", scope: "SINGLE_MODULE" } }),
      prisma.issue.create({ data: { githubUrl: "https://github.com/django/django/issues/33333", repo: "django/django", issueNumber: 33333,
        title: "Optimize QuerySet evaluation for large prefetch_related chains",
        body: "Large prefetch_related chains cause excessive memory usage.",
        labels: JSON.stringify(["performance", "orm"]), language: "Python", frameworks: JSON.stringify(["Django"]),
        difficulty: 5, issueType: "REFACTOR", scope: "MULTI_MODULE" } }),
    ]);

    const bounties = await Promise.all([
      prisma.bounty.create({ data: { issueId: issues[0].id, posterId: poster.id, amountUsd: 5000, status: "ACTIVE" } }),
      prisma.bounty.create({ data: { issueId: issues[1].id, posterId: poster.id, amountUsd: 10000, status: "OPEN" } }),
      prisma.bounty.create({ data: { issueId: issues[2].id, posterId: poster.id, amountUsd: 2500, status: "ACTIVE" } }),
      prisma.bounty.create({ data: { issueId: issues[3].id, posterId: poster.id, amountUsd: 15000, status: "COMPLETED" } }),
    ]);

    // --- Competitions: multiple agents racing on the same bounty ---

    // Bounty[2] (Prisma SQL bug, ACTIVE) — two agents competing
    await prisma.competition.create({ data: { bountyId: bounties[2].id, agentId: codeSweeper.id, status: "CI_PASSING",
      prUrl: "https://github.com/prisma/prisma/pull/99999", prNumber: 99999, ciStatus: "PASSING",
      joinedAt: new Date("2026-02-18"), submittedAt: new Date("2026-02-19") } });
    await prisma.competition.create({ data: { bountyId: bounties[2].id, agentId: deepFix.id, status: "PR_SUBMITTED",
      prUrl: "https://github.com/prisma/prisma/pull/99998", prNumber: 99998, ciStatus: "PENDING",
      joinedAt: new Date("2026-02-18"), submittedAt: new Date("2026-02-20") } });

    // Bounty[3] (Django perf, COMPLETED) — one agent won, one lost
    await prisma.competition.create({ data: { bountyId: bounties[3].id, agentId: deepFix.id, status: "WON",
      prUrl: "https://github.com/django/django/pull/88888", prNumber: 88888, ciStatus: "PASSING", merged: true,
      joinedAt: new Date("2026-02-10"), submittedAt: new Date("2026-02-12"), completedAt: new Date("2026-02-15") } });
    await prisma.competition.create({ data: { bountyId: bounties[3].id, agentId: codeSweeper.id, status: "LOST",
      prUrl: "https://github.com/django/django/pull/88887", prNumber: 88887, ciStatus: "FAILING",
      joinedAt: new Date("2026-02-10"), submittedAt: new Date("2026-02-13") } });

    // Bounty[0] (Next.js hydration, OPEN) — one agent just joined, no PR yet
    await prisma.competition.create({ data: { bountyId: bounties[0].id, agentId: codeSweeper.id, status: "JOINED",
      joinedAt: new Date("2026-02-22") } });

    console.log("Seed complete!");
    console.log("  Dev API keys:");
    console.log("    Poster:      test-poster-key");
    console.log("    Agent Owner: test-agent-key");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);

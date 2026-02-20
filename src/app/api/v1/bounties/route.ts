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

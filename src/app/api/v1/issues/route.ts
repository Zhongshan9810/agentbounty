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

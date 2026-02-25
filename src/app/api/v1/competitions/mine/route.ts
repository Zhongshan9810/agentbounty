import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { paginated, error } from "@/lib/api-utils/response";
import { authenticateAgent } from "@/lib/api-utils/auth";
import { paginationQuery } from "@/lib/schemas/common";

export async function GET(req: NextRequest) {
  try {
    const { user } = await authenticateAgent(req);
    const searchParams = Object.fromEntries(req.nextUrl.searchParams);
    const pagination = paginationQuery.parse(searchParams);

    // Get all agent IDs belonging to this user
    const agentIds = (
      await prisma.agent.findMany({
        where: { ownerId: user.id },
        select: { id: true },
      })
    ).map((a) => a.id);

    // Optional agentId filter
    const agentIdFilter = req.nextUrl.searchParams.get("agentId");
    const where = {
      agentId: agentIdFilter && agentIds.includes(agentIdFilter)
        ? agentIdFilter
        : { in: agentIds },
    };

    const [competitions, total] = await Promise.all([
      prisma.competition.findMany({
        where,
        skip: (pagination.page - 1) * pagination.perPage,
        take: pagination.perPage,
        orderBy: { joinedAt: "desc" },
        include: {
          bounty: {
            include: {
              issue: { select: { title: true, repo: true, githubUrl: true } },
            },
          },
          agent: { select: { id: true, name: true } },
        },
      }),
      prisma.competition.count({ where }),
    ]);

    return paginated(competitions, pagination.page, pagination.perPage, total);
  } catch (err) {
    return error(err);
  }
}

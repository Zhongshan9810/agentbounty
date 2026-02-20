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

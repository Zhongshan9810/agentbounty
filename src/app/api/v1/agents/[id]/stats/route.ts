import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { success, error } from "@/lib/api-utils/response";
import { ApiError, ErrorCode } from "@/lib/api-utils/errors";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const agent = await prisma.agent.findUnique({ where: { id }, include: { competitions: true } });
    if (!agent) throw new ApiError(ErrorCode.AGENT_NOT_FOUND, "Agent not found", 404);

    const won = agent.competitions.filter((c) => c.status === "WON");
    const avgTime = won.length > 0
      ? won.reduce((sum, c) => {
          if (c.completedAt && c.joinedAt) {
            return sum + (c.completedAt.getTime() - c.joinedAt.getTime());
          }
          return sum;
        }, 0) / won.length
      : null;

    return success({
      agentId: id,
      competitionsEntered: agent.competitions.length,
      competitionsWon: won.length,
      successRate: agent.competitions.length > 0 ? won.length / agent.competitions.length : 0,
      avgCompletionMs: avgTime ? Math.round(avgTime) : null,
      byStatus: {
        joined: agent.competitions.filter((c) => c.status === "JOINED").length,
        pr_submitted: agent.competitions.filter((c) => c.status === "PR_SUBMITTED").length,
        ci_passing: agent.competitions.filter((c) => c.status === "CI_PASSING").length,
        ci_failing: agent.competitions.filter((c) => c.status === "CI_FAILING").length,
        won: won.length,
        lost: agent.competitions.filter((c) => c.status === "LOST").length,
      },
    });
  } catch (err) {
    return error(err);
  }
}

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

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

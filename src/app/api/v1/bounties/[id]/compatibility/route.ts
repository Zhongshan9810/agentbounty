import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { success, error } from "@/lib/api-utils/response";
import { ApiError, ErrorCode } from "@/lib/api-utils/errors";
import { checkCompatibility } from "@/lib/matching/compatibility";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const agentId = req.nextUrl.searchParams.get("agentId");

    if (!agentId) {
      throw new ApiError(
        ErrorCode.VALIDATION_ERROR,
        "agentId query parameter is required",
        400
      );
    }

    const bounty = await prisma.bounty.findUnique({
      where: { id },
      include: { issue: true },
    });

    if (!bounty) {
      throw new ApiError(ErrorCode.BOUNTY_NOT_FOUND, "Bounty not found", 404);
    }

    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
    });

    if (!agent) {
      throw new ApiError(ErrorCode.AGENT_NOT_FOUND, "Agent not found", 404);
    }

    const issueProfile = {
      language: bounty.issue.language,
      frameworks: JSON.parse(bounty.issue.frameworks) as string[],
      difficulty: bounty.issue.difficulty,
    };

    const agentProfile = {
      languages: JSON.parse(agent.languages) as string[],
      frameworks: JSON.parse(agent.frameworks) as string[],
      maxDifficulty: agent.maxDifficulty,
    };

    const result = checkCompatibility(issueProfile, agentProfile);

    return success(result);
  } catch (err) {
    return error(err);
  }
}

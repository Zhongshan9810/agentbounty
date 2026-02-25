import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { success, error } from "@/lib/api-utils/response";
import { authenticateAgent } from "@/lib/api-utils/auth";
import { submitPrSchema } from "@/lib/schemas/competition";
import { ApiError, ErrorCode } from "@/lib/api-utils/errors";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ bountyId: string; competitionId: string }> }
) {
  try {
    const { bountyId, competitionId } = await params;
    const { user } = await authenticateAgent(req);
    const body = await req.json();
    const data = submitPrSchema.parse(body);

    // Find the competition and verify ownership
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
      include: { agent: true, bounty: true },
    });

    if (!competition || competition.bountyId !== bountyId) {
      throw new ApiError(ErrorCode.NOT_FOUND, "Competition not found", 404);
    }

    if (competition.agent.ownerId !== user.id) {
      throw new ApiError(ErrorCode.FORBIDDEN, "Not your competition", 403);
    }

    if (competition.status === "WON" || competition.status === "LOST") {
      throw new ApiError(
        ErrorCode.INVALID_STATUS_TRANSITION,
        "Competition already concluded",
        409
      );
    }

    // Extract PR number from URL
    const prMatch = data.prUrl.match(/\/pull\/(\d+)/);
    const prNumber = prMatch ? parseInt(prMatch[1]) : null;

    // Update competition with PR submission
    const updated = await prisma.competition.update({
      where: { id: competitionId },
      data: {
        status: "PR_SUBMITTED",
        prUrl: data.prUrl,
        prNumber,
        submittedAt: new Date(),
      },
    });

    // If bounty is still ACTIVE, move to REVIEW since a PR was submitted
    if (competition.bounty.status === "ACTIVE") {
      await prisma.bounty.update({
        where: { id: bountyId },
        data: { status: "REVIEW" },
      });
    }

    return success(updated);
  } catch (err) {
    return error(err);
  }
}

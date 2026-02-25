import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { success, error } from "@/lib/api-utils/response";
import { authenticateAgent } from "@/lib/api-utils/auth";
import { joinCompetitionSchema } from "@/lib/schemas/competition";
import { ApiError, ErrorCode } from "@/lib/api-utils/errors";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ bountyId: string }> }
) {
  try {
    const { bountyId } = await params;
    const { user } = await authenticateAgent(req);
    const body = await req.json();
    const data = joinCompetitionSchema.parse(body);

    // Verify agent belongs to user
    const agent = await prisma.agent.findUnique({ where: { id: data.agentId } });
    if (!agent || agent.ownerId !== user.id) {
      throw new ApiError(ErrorCode.FORBIDDEN, "Agent does not belong to you", 403);
    }

    // Verify bounty exists and is OPEN or ACTIVE
    const bounty = await prisma.bounty.findUnique({ where: { id: bountyId } });
    if (!bounty) {
      throw new ApiError(ErrorCode.BOUNTY_NOT_FOUND, "Bounty not found", 404);
    }
    if (bounty.status !== "OPEN" && bounty.status !== "ACTIVE") {
      throw new ApiError(
        ErrorCode.INVALID_STATUS_TRANSITION,
        "Bounty is not accepting competitors",
        409,
        { currentStatus: bounty.status }
      );
    }

    // Check if agent already joined
    const existing = await prisma.competition.findFirst({
      where: { bountyId, agentId: data.agentId },
    });
    if (existing) {
      throw new ApiError(ErrorCode.CONFLICT, "Agent already joined this competition", 409);
    }

    // Create competition record; if first competitor, set bounty to ACTIVE
    const competition = await prisma.$transaction(async (tx) => {
      const comp = await tx.competition.create({
        data: { bountyId, agentId: data.agentId },
        include: {
          bounty: { include: { issue: true } },
          agent: { select: { id: true, name: true } },
        },
      });

      if (bounty.status === "OPEN") {
        await tx.bounty.update({
          where: { id: bountyId },
          data: { status: "ACTIVE" },
        });
      }

      return comp;
    });

    return success(competition);
  } catch (err) {
    return error(err);
  }
}

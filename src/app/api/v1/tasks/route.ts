import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { success, error } from "@/lib/api-utils/response";
import { authenticateAgent } from "@/lib/api-utils/auth";
import { claimTaskSchema } from "@/lib/schemas/task";
import { ApiError, ErrorCode } from "@/lib/api-utils/errors";

export async function POST(req: NextRequest) {
  try {
    const { user } = await authenticateAgent(req);
    const body = await req.json();
    const data = claimTaskSchema.parse(body);

    // Verify agent belongs to user
    const agent = await prisma.agent.findUnique({ where: { id: data.agentId } });
    if (!agent || agent.ownerId !== user.id) {
      throw new ApiError(ErrorCode.FORBIDDEN, "Agent does not belong to you", 403);
    }

    // Verify bounty exists and is open
    const bounty = await prisma.bounty.findUnique({ where: { id: data.bountyId } });
    if (!bounty) throw new ApiError(ErrorCode.BOUNTY_NOT_FOUND, "Bounty not found", 404);
    if (bounty.status !== "OPEN") {
      throw new ApiError(ErrorCode.BOUNTY_ALREADY_CLAIMED, "Bounty is not open", 409, {
        currentStatus: bounty.status,
      });
    }

    // Create task and update bounty status
    const task = await prisma.$transaction(async (tx) => {
      const t = await tx.task.create({
        data: { bountyId: data.bountyId, agentId: data.agentId },
        include: { bounty: { include: { issue: true } }, agent: true },
      });
      await tx.bounty.update({ where: { id: data.bountyId }, data: { status: "CLAIMED" } });
      await tx.agent.update({
        where: { id: data.agentId },
        data: { tasksAttempted: { increment: 1 } },
      });
      return t;
    });

    return success(task);
  } catch (err) {
    return error(err);
  }
}

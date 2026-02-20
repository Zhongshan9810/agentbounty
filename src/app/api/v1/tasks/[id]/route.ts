import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { success, error } from "@/lib/api-utils/response";
import { authenticateAgent } from "@/lib/api-utils/auth";
import { ApiError, ErrorCode } from "@/lib/api-utils/errors";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        bounty: { include: { issue: true } },
        agent: { select: { id: true, name: true } },
      },
    });
    if (!task) throw new ApiError(ErrorCode.TASK_NOT_FOUND, "Task not found", 404);

    return success(task);
  } catch (err) {
    return error(err);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { user } = await authenticateAgent(req);
    const body = await req.json();

    const task = await prisma.task.findUnique({ where: { id }, include: { agent: true } });
    if (!task) throw new ApiError(ErrorCode.TASK_NOT_FOUND, "Task not found", 404);
    if (task.agent.ownerId !== user.id) throw new ApiError(ErrorCode.FORBIDDEN, "Not your task", 403);

    const updated = await prisma.task.update({
      where: { id },
      data: {
        ...(body.status && { status: body.status }),
        ...(body.prUrl && { prUrl: body.prUrl }),
        ...(body.prNumber && { prNumber: body.prNumber }),
      },
    });

    if (body.status === "WORKING") {
      await prisma.bounty.update({ where: { id: task.bountyId }, data: { status: "IN_PROGRESS" } });
    }

    return success(updated);
  } catch (err) {
    return error(err);
  }
}

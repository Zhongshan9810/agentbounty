import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { success, error } from "@/lib/api-utils/response";
import { authenticateAgent } from "@/lib/api-utils/auth";
import { submitTaskSchema } from "@/lib/schemas/task";
import { ApiError, ErrorCode } from "@/lib/api-utils/errors";
import { parseGitHubUrl, getPullRequest, getCheckRuns } from "@/lib/github/client";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { user } = await authenticateAgent(req);
    const body = await req.json();
    const data = submitTaskSchema.parse(body);

    const task = await prisma.task.findUnique({ where: { id }, include: { agent: true, bounty: true } });
    if (!task) throw new ApiError(ErrorCode.TASK_NOT_FOUND, "Task not found", 404);
    if (task.agent.ownerId !== user.id) throw new ApiError(ErrorCode.FORBIDDEN, "Not your task", 403);
    if (task.status === "COMPLETED") {
      throw new ApiError(ErrorCode.INVALID_STATUS_TRANSITION, "Task already completed", 409);
    }

    // Verify PR exists on GitHub
    const { owner, repo, number } = parseGitHubUrl(data.prUrl);
    const pr = await getPullRequest(owner, repo, number);

    // Check CI status
    let ciStatus = "PENDING";
    try {
      const checks = await getCheckRuns(owner, repo, pr.head.sha);
      const allPassed = checks.check_runs.length > 0 && checks.check_runs.every((c) => c.conclusion === "success");
      const anyFailed = checks.check_runs.some((c) => c.conclusion === "failure");
      ciStatus = allPassed ? "PASSING" : anyFailed ? "FAILING" : "PENDING";
    } catch {
      // No CI configured
    }

    const updated = await prisma.task.update({
      where: { id },
      data: {
        status: "SUBMITTED",
        prUrl: data.prUrl,
        prNumber: number,
        ciStatus,
        submittedAt: new Date(),
        merged: pr.merged,
      },
    });

    await prisma.bounty.update({ where: { id: task.bountyId }, data: { status: "REVIEW" } });

    return success(updated);
  } catch (err) {
    return error(err);
  }
}

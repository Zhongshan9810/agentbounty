import { NextRequest } from "next/server";
import { createHmac } from "crypto";
import { prisma } from "@/lib/db";
import { dispatchWebhook } from "@/lib/webhooks/dispatcher";

function verifyGitHubSignature(payload: string, signature: string | null): boolean {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const expected = "sha256=" + createHmac("sha256", secret).update(payload).digest("hex");
  return signature === expected;
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("x-hub-signature-256");
  const event = req.headers.get("x-github-event");

  // Verify signature (skip if no secret configured — dev mode)
  if (process.env.GITHUB_WEBHOOK_SECRET && process.env.GITHUB_WEBHOOK_SECRET !== "your_webhook_secret" && !verifyGitHubSignature(body, signature)) {
    return new Response("Invalid signature", { status: 401 });
  }

  const payload = JSON.parse(body);

  if (event === "pull_request" && payload.action === "closed" && payload.pull_request?.merged) {
    const prUrl = payload.pull_request.html_url;
    const task = await prisma.task.findFirst({ where: { prUrl } });

    if (task) {
      await prisma.$transaction(async (tx) => {
        await tx.task.update({
          where: { id: task.id },
          data: { status: "COMPLETED", merged: true, completedAt: new Date() },
        });
        await tx.bounty.update({ where: { id: task.bountyId }, data: { status: "COMPLETED" } });
        const agent = await tx.agent.findUnique({ where: { id: task.agentId } });
        if (agent) {
          const newCompleted = agent.tasksCompleted + 1;
          await tx.agent.update({
            where: { id: task.agentId },
            data: {
              tasksCompleted: newCompleted,
              successRate: agent.tasksAttempted > 0 ? newCompleted / agent.tasksAttempted : 0,
            },
          });
        }
      });

      await dispatchWebhook(task.agentId, "task.completed", { taskId: task.id, prUrl });
    }
  }

  if (event === "check_run" || event === "check_suite") {
    const conclusion = event === "check_run" ? payload.check_run?.conclusion : payload.check_suite?.conclusion;

    const tasks = await prisma.task.findMany({ where: { status: "SUBMITTED" } });
    for (const task of tasks) {
      if (task.prUrl) {
        const ciStatus = conclusion === "success" ? "PASSING" : conclusion === "failure" ? "FAILING" : "PENDING";
        await prisma.task.update({ where: { id: task.id }, data: { ciStatus } });

        const webhookEvent = ciStatus === "PASSING" ? "task.ci_passed" : ciStatus === "FAILING" ? "task.ci_failed" : null;
        if (webhookEvent) {
          await dispatchWebhook(task.agentId, webhookEvent, { taskId: task.id });
        }
      }
    }
  }

  return new Response("OK", { status: 200 });
}

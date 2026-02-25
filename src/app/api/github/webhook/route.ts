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
    const winner = await prisma.competition.findFirst({ where: { prUrl } });

    if (winner) {
      await prisma.$transaction(async (tx) => {
        // Mark the winning competition
        await tx.competition.update({
          where: { id: winner.id },
          data: { status: "WON", merged: true, completedAt: new Date() },
        });

        // Mark all other competitions on this bounty as LOST
        await tx.competition.updateMany({
          where: { bountyId: winner.bountyId, id: { not: winner.id } },
          data: { status: "LOST" },
        });

        // Move bounty to COMPLETED
        await tx.bounty.update({ where: { id: winner.bountyId }, data: { status: "COMPLETED" } });

        // Update winner agent stats
        const agent = await tx.agent.findUnique({ where: { id: winner.agentId } });
        if (agent) {
          const newCompleted = agent.tasksCompleted + 1;
          await tx.agent.update({
            where: { id: winner.agentId },
            data: {
              tasksCompleted: newCompleted,
              successRate: agent.tasksAttempted > 0 ? newCompleted / agent.tasksAttempted : 0,
            },
          });
        }
      });

      // Notify the winner
      await dispatchWebhook(winner.agentId, "competition.won", { competitionId: winner.id, bountyId: winner.bountyId, prUrl });

      // Notify losers
      const losers = await prisma.competition.findMany({
        where: { bountyId: winner.bountyId, id: { not: winner.id } },
      });
      for (const loser of losers) {
        await dispatchWebhook(loser.agentId, "competition.lost", { competitionId: loser.id, bountyId: winner.bountyId });
      }

      // Notify bounty settled event
      await dispatchWebhook(winner.agentId, "bounty.settled", { bountyId: winner.bountyId });
    }
  }

  if (event === "check_run" || event === "check_suite") {
    const conclusion = event === "check_run" ? payload.check_run?.conclusion : payload.check_suite?.conclusion;

    const competitions = await prisma.competition.findMany({ where: { status: "PR_SUBMITTED" } });
    for (const comp of competitions) {
      if (comp.prUrl) {
        const ciStatus = conclusion === "success" ? "PASSING" : conclusion === "failure" ? "FAILING" : "PENDING";
        const newStatus = ciStatus === "PASSING" ? "CI_PASSING" : ciStatus === "FAILING" ? "CI_FAILING" : comp.status;
        await prisma.competition.update({ where: { id: comp.id }, data: { ciStatus, status: newStatus } });

        const webhookEvent = ciStatus === "PASSING" ? "competition.ci_passed" : ciStatus === "FAILING" ? "competition.ci_failed" : null;
        if (webhookEvent) {
          await dispatchWebhook(comp.agentId, webhookEvent, { competitionId: comp.id });
        }
      }
    }
  }

  return new Response("OK", { status: 200 });
}

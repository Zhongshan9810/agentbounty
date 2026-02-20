import { createHmac } from "crypto";
import { prisma } from "@/lib/db";

interface WebhookPayload {
  id: string;
  event: string;
  timestamp: string;
  data: Record<string, unknown>;
}

function sign(payload: string, secret: string): string {
  return "sha256=" + createHmac("sha256", secret).update(payload).digest("hex");
}

export async function dispatchWebhook(agentId: string, event: string, data: Record<string, unknown>) {
  const subs = await prisma.webhookSubscription.findMany({
    where: {
      agentId,
      active: true,
    },
  });

  const matchingSubs = subs.filter((sub) => {
    const events: string[] = JSON.parse(sub.events);
    return events.includes(event);
  });

  const payload: WebhookPayload = {
    id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    event,
    timestamp: new Date().toISOString(),
    data,
  };

  const body = JSON.stringify(payload);

  const results = await Promise.allSettled(
    matchingSubs.map(async (sub) => {
      const signature = sign(body, sub.secret);
      const res = await fetch(sub.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-AgentBounty-Signature": signature,
          "X-AgentBounty-Event": event,
        },
        body,
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) {
        throw new Error(`Webhook delivery failed: ${res.status}`);
      }
    })
  );

  return results;
}

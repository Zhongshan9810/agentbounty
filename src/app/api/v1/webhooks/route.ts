import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { success, error } from "@/lib/api-utils/response";
import { authenticateAgent } from "@/lib/api-utils/auth";
import { createWebhookSchema } from "@/lib/schemas/webhook";
import { nanoid } from "nanoid";

export async function POST(req: NextRequest) {
  try {
    const { user } = await authenticateAgent(req);
    const body = await req.json();
    const data = createWebhookSchema.parse(body);

    const agent = await prisma.agent.findUnique({ where: { id: data.agentId } });
    if (!agent || agent.ownerId !== user.id) {
      throw new Error("Agent not found or not yours");
    }

    const sub = await prisma.webhookSubscription.create({
      data: {
        agentId: data.agentId,
        url: data.url,
        events: JSON.stringify(data.events),
        secret: nanoid(32),
      },
    });

    return success({ ...sub, events: JSON.parse(sub.events) });
  } catch (err) {
    return error(err);
  }
}

export async function GET(req: NextRequest) {
  try {
    const { user } = await authenticateAgent(req);
    const agents = await prisma.agent.findMany({ where: { ownerId: user.id }, select: { id: true } });
    const subs = await prisma.webhookSubscription.findMany({
      where: { agentId: { in: agents.map((a) => a.id) } },
    });

    return success(subs.map((s) => ({ ...s, events: JSON.parse(s.events) })));
  } catch (err) {
    return error(err);
  }
}

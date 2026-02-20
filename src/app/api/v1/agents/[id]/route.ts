import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { success, error } from "@/lib/api-utils/response";
import { authenticateAgent } from "@/lib/api-utils/auth";
import { updateAgentSchema } from "@/lib/schemas/agent";
import { ApiError, ErrorCode } from "@/lib/api-utils/errors";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const agent = await prisma.agent.findUnique({ where: { id } });
    if (!agent) throw new ApiError(ErrorCode.AGENT_NOT_FOUND, "Agent not found", 404);

    return success({
      ...agent,
      languages: JSON.parse(agent.languages),
      frameworks: JSON.parse(agent.frameworks),
    });
  } catch (err) {
    return error(err);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { user } = await authenticateAgent(req);
    const body = await req.json();
    const data = updateAgentSchema.parse(body);

    const agent = await prisma.agent.findUnique({ where: { id } });
    if (!agent) throw new ApiError(ErrorCode.AGENT_NOT_FOUND, "Agent not found", 404);
    if (agent.ownerId !== user.id) throw new ApiError(ErrorCode.FORBIDDEN, "Not your agent", 403);

    const updated = await prisma.agent.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.languages && { languages: JSON.stringify(data.languages) }),
        ...(data.frameworks && { frameworks: JSON.stringify(data.frameworks) }),
        ...(data.maxDifficulty && { maxDifficulty: data.maxDifficulty }),
        ...(data.webhookUrl !== undefined && { webhookUrl: data.webhookUrl }),
      },
    });

    return success({
      ...updated,
      languages: JSON.parse(updated.languages),
      frameworks: JSON.parse(updated.frameworks),
    });
  } catch (err) {
    return error(err);
  }
}

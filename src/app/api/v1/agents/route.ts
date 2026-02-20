import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { success, paginated, error } from "@/lib/api-utils/response";
import { authenticateAgent } from "@/lib/api-utils/auth";
import { createAgentSchema } from "@/lib/schemas/agent";
import { paginationQuery } from "@/lib/schemas/common";

export async function POST(req: NextRequest) {
  try {
    const { user } = await authenticateAgent(req);
    const body = await req.json();
    const data = createAgentSchema.parse(body);

    const agent = await prisma.agent.create({
      data: {
        name: data.name,
        description: data.description,
        languages: JSON.stringify(data.languages),
        frameworks: JSON.stringify(data.frameworks),
        maxDifficulty: data.maxDifficulty,
        webhookUrl: data.webhookUrl,
        ownerId: user.id,
      },
    });

    return success({
      ...agent,
      languages: JSON.parse(agent.languages),
      frameworks: JSON.parse(agent.frameworks),
    });
  } catch (err) {
    return error(err);
  }
}

export async function GET(req: NextRequest) {
  try {
    const params = paginationQuery.parse(Object.fromEntries(req.nextUrl.searchParams));
    const [agents, total] = await Promise.all([
      prisma.agent.findMany({
        skip: (params.page - 1) * params.perPage,
        take: params.perPage,
        orderBy: { rating: "desc" },
      }),
      prisma.agent.count(),
    ]);

    return paginated(
      agents.map((a) => ({
        ...a,
        languages: JSON.parse(a.languages),
        frameworks: JSON.parse(a.frameworks),
      })),
      params.page,
      params.perPage,
      total
    );
  } catch (err) {
    return error(err);
  }
}

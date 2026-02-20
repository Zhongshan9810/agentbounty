import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { success, error } from "@/lib/api-utils/response";

export async function GET(req: NextRequest) {
  try {
    const language = req.nextUrl.searchParams.get("language");
    const limit = Math.min(parseInt(req.nextUrl.searchParams.get("limit") || "20"), 100);

    let agents = await prisma.agent.findMany({
      where: { tasksCompleted: { gt: 0 } },
      orderBy: [{ successRate: "desc" }, { tasksCompleted: "desc" }],
      take: limit,
      select: {
        id: true,
        name: true,
        languages: true,
        frameworks: true,
        rating: true,
        tasksCompleted: true,
        tasksAttempted: true,
        successRate: true,
        avgCompletionMs: true,
      },
    });

    if (language) {
      agents = agents.filter((a) => {
        const langs: string[] = JSON.parse(a.languages);
        return langs.map((l) => l.toLowerCase()).includes(language.toLowerCase());
      });
    }

    return success(
      agents.map((a, i) => ({
        rank: i + 1,
        ...a,
        languages: JSON.parse(a.languages),
        frameworks: JSON.parse(a.frameworks),
      }))
    );
  } catch (err) {
    return error(err);
  }
}

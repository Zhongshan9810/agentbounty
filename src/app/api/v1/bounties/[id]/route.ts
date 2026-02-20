import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { success, error } from "@/lib/api-utils/response";
import { ApiError, ErrorCode } from "@/lib/api-utils/errors";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const bounty = await prisma.bounty.findUnique({
      where: { id },
      include: {
        issue: true,
        poster: { select: { username: true, avatarUrl: true } },
        tasks: { include: { agent: { select: { id: true, name: true, rating: true } } } },
      },
    });
    if (!bounty) throw new ApiError(ErrorCode.BOUNTY_NOT_FOUND, "Bounty not found", 404);

    return success({
      ...bounty,
      issue: {
        ...bounty.issue,
        labels: JSON.parse(bounty.issue.labels),
        frameworks: JSON.parse(bounty.issue.frameworks),
      },
    });
  } catch (err) {
    return error(err);
  }
}

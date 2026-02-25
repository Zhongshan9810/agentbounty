import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { success, error } from "@/lib/api-utils/response";
import { ApiError, ErrorCode } from "@/lib/api-utils/errors";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const bounty = await prisma.bounty.findUnique({
      where: { id },
      include: {
        issue: true,
        poster: { select: { username: true, avatarUrl: true } },
        competitions: {
          include: {
            agent: {
              select: { id: true, name: true, rating: true, successRate: true },
            },
          },
        },
      },
    });

    if (!bounty) {
      throw new ApiError(ErrorCode.BOUNTY_NOT_FOUND, "Bounty not found", 404);
    }

    return success(bounty);
  } catch (err) {
    return error(err);
  }
}

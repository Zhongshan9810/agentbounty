import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { paginated, error } from "@/lib/api-utils/response";
import { paginationQuery } from "@/lib/schemas/common";
import { ApiError, ErrorCode } from "@/lib/api-utils/errors";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ bountyId: string }> }
) {
  try {
    const { bountyId } = await params;
    const searchParams = Object.fromEntries(req.nextUrl.searchParams);
    const pagination = paginationQuery.parse(searchParams);

    // Verify bounty exists
    const bounty = await prisma.bounty.findUnique({ where: { id: bountyId } });
    if (!bounty) {
      throw new ApiError(ErrorCode.BOUNTY_NOT_FOUND, "Bounty not found", 404);
    }

    const where = { bountyId };

    const [competitions, total] = await Promise.all([
      prisma.competition.findMany({
        where,
        skip: (pagination.page - 1) * pagination.perPage,
        take: pagination.perPage,
        orderBy: { joinedAt: "desc" },
        include: {
          agent: {
            select: { id: true, name: true, successRate: true, tasksCompleted: true },
          },
        },
      }),
      prisma.competition.count({ where }),
    ]);

    return paginated(competitions, pagination.page, pagination.perPage, total);
  } catch (err) {
    return error(err);
  }
}

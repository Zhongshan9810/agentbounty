import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { success, error } from "@/lib/api-utils/response";
import { ApiError, ErrorCode } from "@/lib/api-utils/errors";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const issue = await prisma.issue.findUnique({
      where: { id },
      include: { bounty: { include: { competitions: { include: { agent: true } } } } },
    });
    if (!issue) throw new ApiError(ErrorCode.ISSUE_NOT_FOUND, "Issue not found", 404);

    return success({
      ...issue,
      labels: JSON.parse(issue.labels),
      frameworks: JSON.parse(issue.frameworks),
    });
  } catch (err) {
    return error(err);
  }
}

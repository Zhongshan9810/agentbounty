import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { success, error } from "@/lib/api-utils/response";
import { authenticateAgent } from "@/lib/api-utils/auth";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await authenticateAgent(req);
    await prisma.webhookSubscription.delete({ where: { id } });
    return success({ deleted: true });
  } catch (err) {
    return error(err);
  }
}

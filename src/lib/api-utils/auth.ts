import { NextRequest } from "next/server";
import { createHash } from "crypto";
import { prisma } from "@/lib/db";
import { ApiError, ErrorCode } from "./errors";

export function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

export async function authenticateAgent(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new ApiError(ErrorCode.UNAUTHORIZED, "Missing or invalid Authorization header", 401);
  }

  const token = authHeader.slice(7);
  const keyHash = hashApiKey(token);

  const apiKey = await prisma.apiKey.findUnique({
    where: { keyHash },
    include: { user: { include: { agents: true } } },
  });

  if (!apiKey) {
    throw new ApiError(ErrorCode.UNAUTHORIZED, "Invalid API key", 401);
  }

  // Update last used
  await prisma.apiKey.update({ where: { id: apiKey.id }, data: { lastUsed: new Date() } });

  return { user: apiKey.user, apiKey };
}

import { z } from "zod";

export const createBountySchema = z.object({
  githubUrl: z.string().url().regex(/github\.com\/[\w.-]+\/[\w.-]+\/issues\/\d+/),
  amountUsd: z.number().int().min(100), // min $1.00
});

export const bountyFilterSchema = z.object({
  status: z.enum(["OPEN", "ACTIVE", "REVIEW", "COMPLETED", "SETTLED", "EXPIRED"]).optional(),
  language: z.string().optional(),
  minAmount: z.coerce.number().int().optional(),
  maxDifficulty: z.coerce.number().int().min(1).max(5).optional(),
});

export type CreateBountyInput = z.infer<typeof createBountySchema>;

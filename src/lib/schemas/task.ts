import { z } from "zod";

export const claimTaskSchema = z.object({
  bountyId: z.string().min(1),
  agentId: z.string().min(1),
});

export const submitTaskSchema = z.object({
  prUrl: z.string().url().regex(/github\.com\/[\w.-]+\/[\w.-]+\/pull\/\d+/),
});

export type ClaimTaskInput = z.infer<typeof claimTaskSchema>;
export type SubmitTaskInput = z.infer<typeof submitTaskSchema>;

import { z } from "zod";

export const joinCompetitionSchema = z.object({
  agentId: z.string().min(1),
});

export const submitPrSchema = z.object({
  prUrl: z.string().url().regex(/github\.com\/[\w.-]+\/[\w.-]+\/pull\/\d+/),
});

export type JoinCompetitionInput = z.infer<typeof joinCompetitionSchema>;
export type SubmitPrInput = z.infer<typeof submitPrSchema>;

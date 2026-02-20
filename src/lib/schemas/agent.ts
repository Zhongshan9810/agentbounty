import { z } from "zod";

export const createAgentSchema = z.object({
  name: z.string().min(2).max(50),
  description: z.string().max(500).optional(),
  languages: z.array(z.string()).min(1),
  frameworks: z.array(z.string()).default([]),
  maxDifficulty: z.number().int().min(1).max(5).default(3),
  webhookUrl: z.string().url().optional(),
});

export const updateAgentSchema = createAgentSchema.partial();

export type CreateAgentInput = z.infer<typeof createAgentSchema>;
export type UpdateAgentInput = z.infer<typeof updateAgentSchema>;

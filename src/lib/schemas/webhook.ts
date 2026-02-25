import { z } from "zod";

export const WEBHOOK_EVENTS = [
  "bounty.created",
  "bounty.expired",
  "bounty.settled",
  "competition.joined",
  "competition.pr_submitted",
  "competition.ci_passed",
  "competition.ci_failed",
  "competition.won",
  "competition.lost",
] as const;

export const createWebhookSchema = z.object({
  agentId: z.string().min(1),
  url: z.string().url(),
  events: z.array(z.enum(WEBHOOK_EVENTS)).min(1),
});

export type CreateWebhookInput = z.infer<typeof createWebhookSchema>;

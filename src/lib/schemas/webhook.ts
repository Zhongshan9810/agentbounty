import { z } from "zod";

export const WEBHOOK_EVENTS = [
  "bounty.created",
  "bounty.expired",
  "task.ci_passed",
  "task.ci_failed",
  "task.review_requested",
  "task.completed",
  "task.rejected",
] as const;

export const createWebhookSchema = z.object({
  agentId: z.string().min(1),
  url: z.string().url(),
  events: z.array(z.enum(WEBHOOK_EVENTS)).min(1),
});

export type CreateWebhookInput = z.infer<typeof createWebhookSchema>;

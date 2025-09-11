import { z } from "zod";

export const pollSchema = z.object({
  id: z.string().uuid(),
  question: z.string().min(1),
  description: z.string().nullable(),
  created_by: z.string().uuid(),
  created_at: z.string().datetime(),
  expires_at: z.string().datetime().nullable(),
});

export const pollOptionSchema = z.object({
  id: z.string().uuid(),
  poll_id: z.string().uuid(),
  label: z.string().min(1),
  created_at: z.string().datetime(),
});

export const voteSchema = z.object({
  id: z.string().uuid(),
  poll_id: z.string().uuid(),
  option_id: z.string().uuid(),
  voter_id: z.string().uuid().nullable(),
  created_at: z.string().datetime(),
});

export type Poll = z.infer<typeof pollSchema>;
export type PollOption = z.infer<typeof pollOptionSchema>;
export type Vote = z.infer<typeof voteSchema>;

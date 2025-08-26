import { z } from 'zod';

export const createReviewSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email().optional(),
  message: z.string().min(5, 'Message is too short').max(2000),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;

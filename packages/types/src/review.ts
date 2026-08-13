import { z } from "zod";

export const reviewSchema = z.object({
  id: z.string().uuid(),
  productId: z.string().uuid(),
  userId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).nullable(),
  createdAt: z.coerce.date(),
});
export type Review = z.infer<typeof reviewSchema>;

export const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
});
export type CreateReviewInput = z.infer<typeof createReviewSchema>;

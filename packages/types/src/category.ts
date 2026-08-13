import { z } from "zod";

export const categorySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(64),
  slug: z.string().min(1).max(64),
});
export type Category = z.infer<typeof categorySchema>;

export const createCategorySchema = categorySchema.omit({ id: true });
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;

export const updateCategorySchema = createCategorySchema.partial();
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

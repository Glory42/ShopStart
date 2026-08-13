import { z } from "zod";
import { categorySchema } from "./category";

export const productSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200),
  description: z.string().max(5000).nullable().optional(),
  price: z.number().positive(),
  stockQuantity: z.number().int().min(0),
  imageUrl: z.string().url().or(z.literal("")).nullable().optional(),
  categoryId: z.string().uuid(),
  category: categorySchema.optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type Product = z.infer<typeof productSchema>;

export const createProductSchema = productSchema.omit({
  id: true,
  category: true,
  createdAt: true,
  updatedAt: true,
});
export type CreateProductInput = z.infer<typeof createProductSchema>;

export const updateProductSchema = createProductSchema.partial();
export type UpdateProductInput = z.infer<typeof updateProductSchema>;

export const productQuerySchema = z.object({
  categoryId: z.string().uuid().optional(),
  q: z.string().optional(),
  inStock: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type ProductQuery = z.infer<typeof productQuerySchema>;

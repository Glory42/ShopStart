import { z } from "zod";
import { Role } from "./enums";

export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  username: z.string().min(3).max(32),
  phone: z.string().min(7).max(20).nullable(),
  role: z.nativeEnum(Role),
  createdAt: z.coerce.date(),
});
export type User = z.infer<typeof userSchema>;

export const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(32),
  password: z.string().min(8).max(72),
  phone: z.string().min(7).max(20).optional(),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const updateUserSchema = z.object({
  username: z.string().min(3).max(32).optional(),
  phone: z.string().min(7).max(20).optional(),
});
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

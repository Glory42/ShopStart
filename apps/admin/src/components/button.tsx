import type { ButtonHTMLAttributes } from "react";
import { cn } from "../lib/cn";

export type ButtonVariant = "primary" | "danger" | "ghost";

const base =
  "inline-flex items-center justify-center font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2";

const variants: Record<ButtonVariant, string> = {
  primary: "rounded-md bg-neutral-900 px-4 py-2 text-sm text-white hover:bg-neutral-800",
  danger: "text-sm text-red-600 hover:text-red-700",
  ghost: "text-neutral-500 hover:text-neutral-700",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export function Button({ variant = "primary", className, ...props }: ButtonProps) {
  return <button className={cn(base, variants[variant], className)} {...props} />;
}

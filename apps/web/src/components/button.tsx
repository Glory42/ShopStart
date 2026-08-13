import type { ButtonHTMLAttributes } from "react";
import { cn } from "../lib/cn";

export type ButtonVariant = "primary" | "dark" | "secondary" | "ghost";

const base =
  "inline-flex items-center justify-center rounded-full text-[15px] font-medium transition-all duration-200 disabled:opacity-40 disabled:pointer-events-none whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-accent text-white px-6 py-3 hover:bg-accent-hover active:scale-[0.98]",
  dark: "bg-ink text-white px-6 py-3 hover:bg-black active:scale-[0.98]",
  secondary:
    "border border-hairline text-ink px-6 py-3 hover:border-ink bg-white active:scale-[0.98]",
  ghost: "text-accent hover:underline underline-offset-4 px-0 py-0",
};

/** Shared classes so non-<button> elements (e.g. router Links) can look identical. */
export function buttonClasses(variant: ButtonVariant = "primary", className?: string) {
  return cn(base, variants[variant], className);
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export function Button({ variant = "primary", className, ...props }: ButtonProps) {
  return <button className={buttonClasses(variant, className)} {...props} />;
}

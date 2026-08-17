import type { InputHTMLAttributes, SelectHTMLAttributes } from "react";
import { cn } from "../lib/cn";

const fieldClasses = "w-full rounded border border-neutral-300 px-3 py-2 text-sm";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldClasses, className)} {...props} />;
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(fieldClasses, className)} {...props} />;
}

import type { InputHTMLAttributes } from "react";
import { cn } from "../lib/cn";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-xl border border-hairline px-4 py-3 text-[14px] text-ink placeholder:text-graphite transition-colors focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink",
        className,
      )}
      {...props}
    />
  );
}

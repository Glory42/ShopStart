import type { Prisma } from "@prisma/client";

/** Prisma returns currency columns as Decimal; the shared @shopstart/types schemas expect number. */
export function decimalToNumber(value: Prisma.Decimal): number {
  return value.toNumber();
}

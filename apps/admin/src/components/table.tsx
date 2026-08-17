import type { ReactNode } from "react";

/**
 * Minimal, structural table primitives shared by the admin list screens
 * (products/orders/users). Each list screen supplies its own column
 * headers and per-row cell content; these components own only the
 * repeated markup and styling.
 */
export function Table({ children }: { children: ReactNode }) {
  return <table className="w-full text-left text-sm">{children}</table>;
}

export function TableHead({ columns }: { columns: ReactNode[] }) {
  return (
    <thead>
      <tr className="border-b border-neutral-200 text-neutral-500">
        {columns.map((column, index) => (
          <th key={index} className={index === 0 ? "py-2" : undefined}>
            {column}
          </th>
        ))}
      </tr>
    </thead>
  );
}

export function TableBody({ children }: { children: ReactNode }) {
  return <tbody>{children}</tbody>;
}

export function TableRow({ cells }: { cells: ReactNode[] }) {
  return (
    <tr className="border-b border-neutral-100">
      {cells.map((cell, index) => (
        <td key={index} className={index === 0 ? "py-2" : undefined}>
          {cell}
        </td>
      ))}
    </tr>
  );
}

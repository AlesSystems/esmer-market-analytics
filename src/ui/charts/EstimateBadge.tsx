import type { ReactNode } from "react";

/** One compact chip per page; the disclosure carries the contract meanings. Works without script. */
export function EstimateBadge({ children, label = "Doğrulanmamış tahmin" }: { children: ReactNode; label?: string }) {
  return (
    <details className="viz-estimate">
      <summary>{label}</summary>
      <div className="viz-estimate-body">{children}</div>
    </details>
  );
}

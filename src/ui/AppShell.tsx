import type { ReactNode } from "react";
import { Button } from "./components/ui/button";
import { Badge } from "./components/ui/badge";

export const destinations = [
  ["monthly", "Özet"], ["overview", "Satışlar"], ["purchasing", "Alışlar ve maliyet"],
  ["expenses", "Giderler"], ["versions", "Raporlar"],
] as const;
export type Destination = typeof destinations[number][0];

export function AppShell({ destination, navigate, controls, operations, children }: {
  destination?: Destination; navigate?: (destination: Destination) => void;
  controls?: ReactNode; operations?: ReactNode; children: ReactNode;
}) {
  return <div className="sales-app app-shell">
    <div className="sidebar">
      <div className="brand">ESMER <span>MARKET</span></div>
      <div className="sidebar-controls">{controls}{operations && <details className="operations-menu"><summary>İşlemler</summary><div className="operations-hub">{operations}</div></details>}</div>
      {navigate && <nav aria-label="Ana gezinme">{destinations.map(([id, label], index) => <Button type="button" variant="ghost" key={id} disabled={!navigate} aria-current={destination === id ? "page" : undefined} onClick={() => navigate?.(id)}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d={[
          "M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z",
          "M3 20V4 M3 20h18 M7 16l4-6 4 3 6-9",
          "M3 7h18v14H3z M7 7V3h10v4 M3 12h18",
          "M5 3h14v18l-3-2-4 2-4-2-3 2z M8 8h8 M8 12h8",
          "M5 3h10l4 4v14H5z M14 3v5h5 M8 12h8 M8 16h6",
        ][index]} /></svg>{label}
      </Button>)}</nav>}
      <div className="sidebar-note"><Badge variant="outline">Çevrimdışı analiz</Badge></div>
    </div>
    <div className="app-body">
      <div className="workspace">{children}</div>
    </div>
  </div>;
}

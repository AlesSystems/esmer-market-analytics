import { useContext, useEffect, useRef, type ReactNode } from "react";
import { Button } from "./components/ui/button";
import { AppFrame } from "./frame";

export const destinations = [
  ["monthly", "Özet"], ["overview", "Satışlar"], ["purchasing", "Alışlar ve maliyet"],
  ["expenses", "Giderler"], ["versions", "Raporlar"],
] as const;
export type Destination = typeof destinations[number][0];

export function AppShell({ destination, navigate, controls, children }: {
  destination?: Destination; navigate?: (destination: Destination) => void;
  controls?: ReactNode; children: ReactNode;
}) {
  const frame = useContext(AppFrame);
  const body = useRef<HTMLDivElement>(null);
  const focusedLaunch = useRef<number | null>(null);
  const away = !!frame && frame.view !== "workspace";
  useEffect(() => {
    if (away) {focusedLaunch.current = frame?.launchRequest?.sequence ?? null;return;}
    if (!frame?.launchRequest || focusedLaunch.current === frame.launchRequest.sequence) return;
    const request = frame.launchRequest.sequence;
    const id = requestAnimationFrame(() => {
      focusedLaunch.current = request;
      const active = document.activeElement;
      if (active instanceof HTMLElement && active.closest(".app-shell") && active.getClientRects().length) return;
      const heading = Array.from(body.current?.querySelectorAll<HTMLElement>(".workspace-content h1") ?? []).find(element => element.getClientRects().length);
      if (heading) {heading.tabIndex = -1;heading.focus();}
    });
    return () => cancelAnimationFrame(id);
  }, [away, frame?.launchRequest, destination, children]);
  return <div className={`sales-app app-shell${destination === "monthly" && !away ? " monthly-shell" : destination && destination !== "monthly" && !away ? ` page-desk-shell${destination === "overview" ? " sales-desk-shell" : ""}` : ""}`}>
    <div className="sidebar">
      <div className="brand"><img src="/assets/esmer-market-logo.png" alt="Esmer Market" width="459" height="110" /></div>
      <div className="sidebar-controls">{controls}</div>
      {navigate && <nav aria-label="Ana gezinme">{destinations.map(([id, label], index) => <Button type="button" variant="ghost" className="justify-start" key={id} aria-current={!away && destination === id ? "page" : undefined} onClick={() => { if(away){if(destination===id)frame?.show("workspace");else frame?.show("workspace",()=>navigate(id));}else navigate(id); }}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d={[
          "M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z",
          "M3 20V4 M3 20h18 M7 16l4-6 4 3 6-9",
          "M3 7h18v14H3z M7 7V3h10v4 M3 12h18",
          "M5 3h14v18l-3-2-4 2-4-2-3 2z M8 8h8 M8 12h8",
          "M5 3h10l4 4v14H5z M14 3v5h5 M8 12h8 M8 16h6",
        ][index]} /></svg>{label}
      </Button>)}</nav>}
      {frame && <div className="sidebar-footer">
        <Button type="button" variant="ghost" className="justify-start" onClick={() => frame.show("welcome")}>Karşılama</Button>
        {frame.connection}
        <Button type="button" variant="ghost" className="justify-start settings-entry" aria-current={frame.view === "settings" || frame.view === "recovery" ? "page" : undefined} onClick={() => frame.show("settings")}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h10 M18 7h2 M4 17h4 M12 17h8 M16 5v4 M10 15v4" /></svg>Ayarlar
        </Button>
      </div>}
    </div>
    <div className="app-body" ref={body}>
      <div className="workspace">
        {frame?.notices}
        <div className="workspace-content" hidden={away}>{children}</div>
        {away && frame.view !== "welcome" && frame.overlay}
      </div>
    </div>
  </div>;
}

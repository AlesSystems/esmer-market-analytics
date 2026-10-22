import { useContext, useEffect, useRef, type ReactNode } from "react";
import { Button } from "./components/ui/button";
import { AppFrame } from "./frame";
import { sections, type Section } from "./sections";

const icons: Record<Section, string> = {
  month: "M3 20V4 M3 20h18 M7 16l4-6 4 3 6-9",
  products: "M3 7l9-4 9 4v10l-9 4-9-4z M3 7l9 4 9-4 M12 11v10",
  expenses: "M5 3h14v18l-3-2-4 2-4-2-3 2z M8 8h8 M8 12h8",
  reports: "M5 3h10l4 4v14H5z M14 3v5h5 M8 12h8 M8 16h6",
};

/** Sidebar with the four sections, the month control and the Ayarlar corner. Knows nothing about page content. */
export function AppShell({ section, navigate, controls, children }: {
  section?: Section; navigate?: (section: Section) => void;
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
  }, [away, frame?.launchRequest, section, children]);
  return <div className="sales-app app-shell">
    <button className="skip-workspace" onClick={() => body.current?.focus()}>İçeriğe geç</button>
    <div className="sidebar">
      <div className="brand"><img src="/assets/esmer-market-logo.png" alt="Esmer Market" width="459" height="110" /></div>
      <div className="sidebar-controls">{controls}</div>
      {navigate && <nav aria-label="Ana gezinme">{sections.map(([id, label]) => <Button type="button" variant="ghost" className="justify-start" key={id} aria-current={!away && section === id ? "page" : undefined} onClick={() => { if (away) frame?.show("workspace", () => navigate(id)); else navigate(id); }}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d={icons[id]} /></svg>{label}
      </Button>)}</nav>}
      {frame && <div className="sidebar-footer sidebar-corner">
        {frame.connection}
        <Button type="button" variant="ghost" className="justify-start settings-entry" aria-current={frame.view === "settings" || frame.view === "recovery" ? "page" : undefined} onClick={() => frame.show("settings")}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h10 M18 7h2 M4 17h4 M12 17h8 M16 5v4 M10 15v4" /></svg>Ayarlar
        </Button>
      </div>}
    </div>
    <div className="app-body" ref={body} tabIndex={-1}>
      <div className="workspace">
        {frame?.notices}
        <div className="workspace-content" hidden={away}>{children}</div>
        {away && frame.overlay}
      </div>
    </div>
  </div>;
}

import { useContext, useEffect, useRef, type ReactNode } from "react";
import { AppFrame } from "./frame";
import { sections, type Section } from "./sections";

/** Top bar with the three tabs, then whatever the app passes as month and export controls and the gear menu. Knows nothing about page content. */
export function AppShell({ section, navigate, controls, menu, children }: {
  section?: Section; navigate?: (section: Section) => void;
  controls?: ReactNode; menu?: ReactNode; children: ReactNode;
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
    <header className="topbar"><div className="topbar-in">
      <img className="logo" src="/assets/esmer-market-logo.png" alt="Esmer Market" width="125" height="30" />
      {navigate && <nav className="tabs" aria-label="Ana gezinme">{sections.map(([id, label]) => <button type="button" className="tab" key={id} aria-current={!away && section === id ? "page" : undefined} onClick={() => { if (away) frame?.show("workspace", () => navigate(id)); else navigate(id); }}>{label}</button>)}</nav>}
      <div className="topbar-tools">{controls}{menu}</div>
    </div></header>
    <div className="app-body" ref={body} tabIndex={-1}>
      <div className="workspace">
        {frame?.notices}
        <div className="workspace-content" hidden={away}>{children}</div>
        {away && frame.overlay}
      </div>
    </div>
  </div>;
}

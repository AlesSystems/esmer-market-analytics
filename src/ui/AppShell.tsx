import { createContext, useContext, useEffect, useRef, type ReactNode } from "react";
import { AppFrame } from "./frame";
import { sections, type Section } from "./sections";
import { CalendarIcon, ProductsIcon, ReceiptIcon } from "./icons";

const WorkspaceControls = createContext<ReactNode>(null);

/** Normal-flow heading shared by pages; adding a content section never repositions the tools. */
export function WorkspaceHeader({title, label, children}: {title: string; label?: string; children?: ReactNode}) {
  const controls = useContext(WorkspaceControls);
  return <header className="workspace-head"><div className="page-heading">{label && <p>{label}</p>}<h1>{title}</h1>{children}</div><div className="workspace-tools">{controls}</div></header>;
}

/** A's navigation rail and a flexible content workspace. Page sections own their content and service results. */
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
      <div className="workspace-brand">
        <img src="/assets/esmer-market-logo.png" alt="Esmer Market" width={459} height={110} />
        <small>Aylık işletme görünümü</small>
      </div>
      {navigate && <nav className="tabs" aria-label="Ana gezinme">{sections.map(([id, label]) => <button type="button" className="tab" key={id} aria-current={!away && section === id ? "page" : undefined} onClick={() => { if (away) frame?.show("workspace", () => navigate(id)); else navigate(id); }}>{id === "month" ? <CalendarIcon/> : id === "products" ? <ProductsIcon/> : <ReceiptIcon/>}<span>{label}</span></button>)}</nav>}
      <div className="rail-tools">{menu}</div>
      <p className="rail-offline"><span aria-hidden="true"/>Çevrimdışı çalışma<small>Yerel verilerle çalışır</small></p>
    </div></header>
    <div className="app-body" ref={body} tabIndex={-1}>
      <div className="workspace">
        {frame?.notices}
        <div className="workspace-content" hidden={away}><WorkspaceControls.Provider value={controls}>{children}</WorkspaceControls.Provider></div>
        {away && frame.overlay}
      </div>
    </div>
  </div>;
}

import { useEffect, useRef, type ReactNode } from "react";

/** A full-page view that replaces the workspace until "Ana sayfaya dön": title, back button, then its content. */
export function OverlayPage({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus(); }, []);
  return <main className="overlay-page">
    <nav aria-label="Sayfa gezinmesi"><button type="button" className="btn btn-secondary" onClick={onClose}>Ana sayfaya dön</button></nav>
    <h1 ref={heading} tabIndex={-1}>{title}</h1>
    {children}
  </main>;
}

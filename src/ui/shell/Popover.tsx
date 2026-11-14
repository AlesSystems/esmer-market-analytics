import { useCallback, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { useDismiss } from "../use-dismiss";

/** A button with a viewport-bounded non-modal dialog. Escape returns focus to the button; pressing or tabbing outside closes it. */
export function Popover({ label, dialogLabel, buttonClass, panelClass = "", children }: { label: ReactNode; dialogLabel: string; buttonClass: string; panelClass?: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLSpanElement>(null), button = useRef<HTMLButtonElement>(null), panel = useRef<HTMLDivElement>(null);
  const id = useId();
  const close = useCallback((viaKeyboard: boolean) => { setOpen(false); if (viaKeyboard) button.current?.focus(); }, []);
  useDismiss(box, open, close);
  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      if (!button.current || !panel.current) return;
      const anchor = button.current.getBoundingClientRect(), bounds = panel.current.getBoundingClientRect();
      const margin = 16, gap = 8;
      panel.current.style.left = `${Math.max(margin, Math.min(anchor.left, innerWidth - bounds.width - margin))}px`;
      panel.current.style.top = `${Math.max(margin, Math.min(anchor.bottom + gap, innerHeight - bounds.height - margin))}px`;
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, children]);
  return <span className="popwrap" ref={box}>
    <button ref={button} type="button" className={buttonClass} aria-expanded={open} aria-controls={open ? id : undefined} onClick={() => setOpen(value => !value)}>{label}</button>
    {open && <div className={`pop ${panelClass}`} id={id} role="dialog" aria-label={dialogLabel} ref={panel}>{children}</div>}
  </span>;
}

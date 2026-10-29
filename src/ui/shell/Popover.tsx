import { useCallback, useId, useRef, useState, type ReactNode } from "react";
import { useDismiss } from "../use-dismiss";

/** A button with a small non-modal dialog under it. Escape (focus returns to the button), a press outside or tabbing away closes it. */
export function Popover({ label, dialogLabel, buttonClass, panelClass = "", children }: { label: ReactNode; dialogLabel: string; buttonClass: string; panelClass?: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLSpanElement>(null), button = useRef<HTMLButtonElement>(null);
  const id = useId();
  const close = useCallback((viaKeyboard: boolean) => { setOpen(false); if (viaKeyboard) button.current?.focus(); }, []);
  useDismiss(box, open, close);
  return <span className="popwrap" ref={box}>
    <button ref={button} type="button" className={buttonClass} aria-expanded={open} aria-controls={open ? id : undefined} onClick={() => setOpen(value => !value)}>{label}</button>
    {open && <div className={`pop ${panelClass}`} id={id} role="dialog" aria-label={dialogLabel}>{children}</div>}
  </span>;
}

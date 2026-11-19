import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { ExpenseDraftDialog } from "./expenses/ExpenseDraftDialog";

type Protection = { dirty: boolean; locked: boolean };
type Navigation = { leave: (action: () => void) => void; protect: (value: Protection) => void; lock: () => () => void; busy: () => boolean };
type PendingLeave =
  | { kind: "dirty"; action: () => void; opener: HTMLElement | null }
  | { kind: "locked"; opener: HTMLElement | null };

const Context = createContext<Navigation>({ leave: action => action(), protect: () => undefined, lock: () => () => undefined, busy: () => false });
export const useExpenseNavigation = () => useContext(Context);

export function ExpenseNavigationProvider({ children }: { children: ReactNode }) {
  const acceptedAction = useRef(false);
  const operations = useRef(0);
  const protection = useRef<Protection>({ dirty: false, locked: false });
  const lockedTitle = useRef<HTMLHeadingElement>(null);
  const [notice, setNotice] = useState<PendingLeave | null>(null);
  const noticeKind = notice?.kind;

  const locked = useCallback(() => protection.current.locked || operations.current > 0, []);
  const clearLockNotice = useCallback(() => {
    if (!locked()) setNotice(previous => previous?.kind === "locked" ? null : previous);
  }, [locked]);
  const protect = useCallback((value: Protection) => {
    protection.current = value;
    clearLockNotice();
  }, [clearLockNotice]);
  const lock = useCallback(() => {
    operations.current++;
    return () => { operations.current--; clearLockNotice(); };
  }, [clearLockNotice]);
  const busy = useCallback(() => protection.current.dirty || locked(), [locked]);
  const leave = useCallback((next: () => void) => {
    if (acceptedAction.current || !busy()) {
      next();
      return;
    }
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setNotice(locked() ? { kind: "locked", opener } : { kind: "dirty", action: next, opener });
  }, [busy, locked]);

  useEffect(() => {
    if (noticeKind === "locked") lockedTitle.current?.focus();
  }, [noticeKind]);

  function continueEditing() {
    setNotice(null);
    const opener = notice?.opener;
    (opener?.isConnected ? opener : document.querySelector<HTMLElement>(".settings-entry"))?.focus();
  }

  return <Context.Provider value={{ leave, protect, lock, busy }}>
    {notice?.kind === "dirty" && <ExpenseDraftDialog onDecision={decision => {
      if (decision === "keep") {
        continueEditing();
        return;
      }
      setNotice(null);
      acceptedAction.current = true;
      try { notice.action(); } finally { acceptedAction.current = false; }
    }} />}
    {notice?.kind === "locked" && <section className="g-leave" role="alertdialog" aria-labelledby="expense-leave-title"
      onKeyDown={event => { if (event.key === "Escape") continueEditing(); }}>
      <h2 ref={lockedTitle} tabIndex={-1} id="expense-leave-title">Kaydın sonucu bekleniyor</h2>
      <p>Önce kaydı kontrol edin. Aynı gideri yeniden eklemeyin.</p>
      <div className="g-actions"><button type="button" className="btn btn-secondary" onClick={continueEditing}>Düzenlemeye devam et</button></div>
    </section>}
    {children}
  </Context.Provider>;
}

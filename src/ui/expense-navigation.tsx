import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
type Protection = { dirty: boolean; locked: boolean };
type Navigation = { leave: (action: () => void) => void; protect: (value: Protection) => void; lock: () => () => void; busy: () => boolean };
const Context = createContext<Navigation>({ leave: action => action(), protect: () => undefined, lock: () => () => undefined, busy: () => false });
export const useExpenseNavigation = () => useContext(Context);
export function ExpenseNavigationProvider({ children }: { children: ReactNode }) {
  const acceptedAction=useRef(false);
  const operations = useRef(0);
  const protection = useRef<Protection>({ dirty: false, locked: false });
  const action = useRef<(() => void) | null>(null), opener = useRef<HTMLElement | null>(null), title = useRef<HTMLHeadingElement>(null);
  const [notice, setNotice] = useState<"dirty" | "locked" | null>(null);
  const locked = useCallback(() => protection.current.locked || operations.current > 0, []);
  const clearLockNotice = useCallback(() => {
    if (!locked()) setNotice(previous => previous === "locked" ? null : previous);
  }, [locked]);
  const protect = useCallback((value: Protection) => { protection.current = value; clearLockNotice(); }, [clearLockNotice]);
  const lock = useCallback(() => {
    operations.current++;
    return () => { operations.current--; clearLockNotice(); };
  }, [clearLockNotice]);
  const busy = useCallback(() => protection.current.dirty || locked(), [locked]);
  const leave = useCallback((next: () => void) => {
    if (acceptedAction.current || !busy()) { next(); return; }
    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    action.current = next; setNotice(locked() ? "locked" : "dirty");
  }, [busy, locked]);
  useEffect(() => { if (notice) title.current?.focus(); }, [notice]);
  function continueEditing() { action.current = null; setNotice(null); opener.current?.focus(); }
  return <Context.Provider value={{ leave, protect, lock, busy }}>{notice && <section className="g-leave" role="alertdialog" onKeyDown={event => { if (event.key === "Escape") continueEditing(); }} aria-labelledby="expense-leave-title"><h2 ref={title} tabIndex={-1} id="expense-leave-title">{notice === "dirty" ? "Kaydedilmemiş bilgileri bırak?" : "Kaydın sonucu bekleniyor"}</h2><p>{notice === "dirty" ? "Bu formdaki bilgiler kaydedilmedi." : "Önce kaydı kontrol edin. Aynı gideri yeniden eklemeyin."}</p><div className="g-actions"><button type="button" className="btn btn-secondary" onClick={continueEditing}>Düzenlemeye devam et</button>{notice === "dirty" && <button type="button" className="btn btn-primary" onClick={() => { const next = action.current; action.current = null; setNotice(null);acceptedAction.current=true;try{next?.();}finally{acceptedAction.current=false;} }}>Bilgileri bırak</button>}</div></section>}{children}</Context.Provider>;
}

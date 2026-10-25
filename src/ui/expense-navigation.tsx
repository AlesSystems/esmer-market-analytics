import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "./components/ui/button";
type Protection = { dirty: boolean; locked: boolean };
type Navigation = { leave: (action: () => void) => void; protect: (value: Protection) => void; busy: () => boolean };
const Context = createContext<Navigation>({ leave: action => action(), protect: () => undefined, busy: () => false });
export const useExpenseNavigation = () => useContext(Context);
export function ExpenseNavigationProvider({ children }: { children: ReactNode }) {
  const acceptedAction=useRef(false);
  const protection = useRef<Protection>({ dirty: false, locked: false });
  const action = useRef<(() => void) | null>(null), opener = useRef<HTMLElement | null>(null), title = useRef<HTMLHeadingElement>(null);
  const [notice, setNotice] = useState<"dirty" | "locked" | null>(null);
  const protect = useCallback((value: Protection) => { protection.current = value; if (!value.locked) setNotice(previous => previous === "locked" ? null : previous); }, []);
  const busy = useCallback(() => protection.current.dirty || protection.current.locked, []);
  const leave = useCallback((next: () => void) => {
    if (acceptedAction.current || !protection.current.dirty && !protection.current.locked) { next(); return; }
    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    action.current = next; setNotice(protection.current.locked ? "locked" : "dirty");
  }, []);
  useEffect(() => { if (notice) title.current?.focus(); }, [notice]);
  function continueEditing() { action.current = null; setNotice(null); opener.current?.focus(); }
  return <Context.Provider value={{ leave, protect, busy }}>{notice && <section className="notice warning expense-leave" role="alertdialog" onKeyDown={event => { if (event.key === "Escape") continueEditing(); }} aria-labelledby="expense-leave-title"><h2 ref={title} tabIndex={-1} id="expense-leave-title">{notice === "dirty" ? "Kaydedilmemiş bilgileri bırak?" : "Kaydın sonucu bekleniyor"}</h2><p>{notice === "dirty" ? "Bu formdaki bilgiler kaydedilmedi." : "Önce kaydı kontrol edin. Aynı gideri yeniden eklemeyin."}</p><div className="expense-actions"><Button variant="outline" onClick={continueEditing}>Düzenlemeye devam et</Button>{notice === "dirty" && <Button variant="default" onClick={() => { const next = action.current; action.current = null; setNotice(null);acceptedAction.current=true;try{next?.();}finally{acceptedAction.current=false;} }}>Bilgileri bırak</Button>}</div></section>}{children}</Context.Provider>;
}

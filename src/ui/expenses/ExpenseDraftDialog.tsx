import { useLayoutEffect, useRef } from "react";
import { AlertIcon } from "../icons";

type DraftDecision = "keep" | "discard";

export function ExpenseDraftDialog({ onDecision }: { onDecision: (decision: DraftDecision) => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const panel = useRef<HTMLElement>(null);
  const keep = useRef<HTMLButtonElement>(null);

  useLayoutEffect(() => {
    const element = dialog.current!;
    element.showModal();
    keep.current?.focus();
    return () => element.close();
  }, []);

  async function close(decision: DraftDecision) {
    const element = dialog.current;
    if (!element?.open || element.hasAttribute("data-closing")) return;
    element.setAttribute("data-closing", "");
    const animations = panel.current?.getAnimations() ?? [];
    if (animations.length) await Promise.allSettled(animations.map(animation => animation.finished));
    if (!element.open) return;
    element.close();
    onDecision(decision);
  }

  return <dialog ref={dialog} className="g-draft-dialog" role="alertdialog" aria-modal="true"
    aria-labelledby="expense-draft-title" aria-describedby="expense-draft-description"
    onCancel={event => { event.preventDefault(); void close("keep"); }}
    onClick={event => { if (event.target === event.currentTarget) void close("keep"); }}>
    <section ref={panel} className="g-draft-panel">
      <div className="g-draft-icon" aria-hidden="true"><AlertIcon /></div>
      <h2 id="expense-draft-title">Taslak silinsin mi?</h2>
      <p id="expense-draft-description">Bu gideri henüz kaydetmediniz. Taslağı silerseniz girdiğiniz bilgiler kaybolur.</p>
      <div className="g-draft-actions">
        <button type="button" className="btn btn-primary" ref={keep} onClick={() => void close("keep")}>Düzenlemeye dön</button>
        <button type="button" className="btn btn-secondary g-draft-discard" onClick={() => void close("discard")}>Taslağı sil</button>
      </div>
    </section>
  </dialog>;
}

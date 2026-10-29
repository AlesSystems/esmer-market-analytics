import { useEffect, type RefObject } from "react";

/** Closes a popover on Escape, a press outside it, or focus moving outside it. Escape reports `true` so the caller can return focus to the trigger. */
export function useDismiss(box: RefObject<HTMLElement | null>, open: boolean, close: (viaKeyboard: boolean) => void) {
  useEffect(() => {
    if (!open) return;
    const outside = (event: Event) => { if (box.current && event.target instanceof Node && !box.current.contains(event.target)) close(false); };
    const key = (event: KeyboardEvent) => { if (event.key === "Escape") { event.stopPropagation(); close(true); } };
    const focus = (event: FocusEvent) => { if (box.current && event.relatedTarget instanceof Node && !box.current.contains(event.relatedTarget)) close(false); };
    document.addEventListener("mousedown", outside);
    document.addEventListener("keydown", key);
    const node = box.current;
    node?.addEventListener("focusout", focus);
    return () => { document.removeEventListener("mousedown", outside); document.removeEventListener("keydown", key); node?.removeEventListener("focusout", focus); };
  }, [box, open, close]);
}

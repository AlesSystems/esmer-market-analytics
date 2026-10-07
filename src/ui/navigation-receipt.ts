export type ReturnReceipt = {opener: HTMLElement; windowX: number; windowY: number; focusKey: string | null; tables: {element: HTMLElement; x: number; y: number}[]};
export function captureReturn(opener: HTMLElement): ReturnReceipt {
  const scope = opener.closest(".workspace-content") ?? document;
  return {opener, windowX: window.scrollX, windowY: window.scrollY, focusKey: opener.getAttribute("data-focus-key"), tables: [...scope.querySelectorAll<HTMLElement>(".table-scroll")].filter(element => element.getClientRects().length > 0).map(element => ({element, x: element.scrollLeft, y: element.scrollTop}))};
}
export function restoreReturn(receipt: ReturnReceipt | null, fallback: HTMLElement | null) {
  requestAnimationFrame(() => {
    const replacement = receipt?.focusKey ? [...document.querySelectorAll<HTMLElement>("[data-focus-key]")].find(element => element.getAttribute("data-focus-key") === receipt.focusKey && element.getClientRects().length > 0) : null;
    const target=receipt?.opener.isConnected && receipt.opener.getClientRects().length > 0 && (!receipt.focusKey || receipt.opener.getAttribute("data-focus-key")===receipt.focusKey) ? receipt.opener : replacement ?? fallback;
    if(!target?.getClientRects().length)return;
    target.focus({preventScroll:true});
    const visibleTables = [...document.querySelectorAll<HTMLElement>(".table-scroll")].filter(element => element.getClientRects().length > 0);
    for (const [index, table] of (receipt?.tables ?? []).entries()) {const element = table.element.isConnected ? table.element : visibleTables[index]; if(element){element.scrollLeft=table.x;element.scrollTop=table.y;}}
    if (receipt) window.scrollTo(receipt.windowX, receipt.windowY);
  });
}

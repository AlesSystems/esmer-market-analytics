export const PAGE_SIZE = 100;

export function pageRows<T>(rows: readonly T[], page: number): readonly T[] {
  return rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
}

export function PageControls({ page, total, label, onPage, itemLabel = "" }: { page: number; total: number; label: string; onPage: (page: number) => void; itemLabel?: string }) {
  const pages = Math.ceil(total / PAGE_SIZE);
  if (pages <= 1) return null;
  return <nav className="report-actions" aria-label={`${label} sayfaları`}>
    <button disabled={page === 0} onClick={() => onPage(page - 1)}>Önceki {PAGE_SIZE}{itemLabel && ` ${itemLabel}`}</button>
    <span role="status">Sayfa {page + 1} / {pages}</span>
    <button disabled={page + 1 >= pages} onClick={() => onPage(page + 1)}>Sonraki {PAGE_SIZE}{itemLabel && ` ${itemLabel}`}</button>
  </nav>;
}

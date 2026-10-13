import { ChartFrame, CompositionBar, RankBars, type CompositionPart } from "../charts";
import type { CostRow } from "../../analytics/costs";
import type { ReplacementRow } from "../../analytics/purchasing";
import { money, percent } from "../format";
const unit = (value: string) => value === "kg" ? "kg" : value === "piece" ? "adet" : "Bilinmiyor";
const excludedColors = ["var(--viz-accent-3)", "var(--viz-cost)", "var(--pur-slate)", "var(--pur-gold)", "var(--pur-violet)"];
const count = (value: number) => value.toLocaleString("tr-TR");

/** Graph 1: line counts only (covered versus excluded by reason). No amounts are summed. */
export function CostCoverageChart({ covered, excluded, labels }: { covered: number; excluded: CostRow[]; labels: Record<string, string> }) {
  const groups = new Map<string, number>();
  let unknown = 0;
  for (const row of excluded) {
    if (row.reason && labels[row.reason]) groups.set(row.reason, (groups.get(row.reason) ?? 0) + 1);
    else unknown += 1;
  }
  const known = [...groups.entries()].sort((a, b) => b[1] - a[1]);
  const parts: CompositionPart[] = [
    { key: "covered", label: "Maliyeti kapsanan satırlar", value: covered, color: "var(--viz-contribution)" },
    ...known.map(([reason, value], index) => ({ key: reason, label: labels[reason], value, color: excludedColors[index % excludedColors.length] })),
    ...(unknown > 0 ? [{ key: "unknown", label: "Dışlanma nedeni bilinmiyor", value: unknown, color: "unknown" as const }] : []),
  ];
  const table = { caption: "Maliyet kapsamı satır sayıları", columns: [{ label: "Durum veya dışlanma nedeni" }, { label: "Satır sayısı", numeric: true }], rows: parts.map(part => [part.label, count(part.value)]) };
  return <ChartFrame title="Maliyet kapsamı" summary="Satış satırı sayıları. Eksik maliyet sıfır sayılmaz." table={table}>
    <CompositionBar parts={parts} ariaLabel={`Maliyet kapsamı satır dağılımı: ${parts.map(part => `${part.label} ${count(part.value)}`).join(", ")}`} />
  </ChartFrame>;
}

const LIMIT = 10, UNKNOWN_SHOWN = 3;
/** Graph 2: nominal replacement-cost change per product. `Number()` orders rows only; displayed values are service strings. */
export function ReplacementChart({ rows }: { rows: ReplacementRow[] }) {
  if (rows.length === 0) return null;
  const magnitude = (row: ReplacementRow) => row.nominalChangePercent === null ? Number.NEGATIVE_INFINITY : Math.abs(Number(row.nominalChangePercent));
  const ordered = rows.toSorted((a, b) => magnitude(b) - magnitude(a));
  const known = ordered.filter(row => row.nominalChangePercent !== null).slice(0, LIMIT);
  const unknownRows = ordered.filter(row => row.nominalChangePercent === null);
  const shown = [...known, ...unknownRows.slice(0, Math.min(UNKNOWN_SHOWN, LIMIT - known.length))];
  const id = (row: ReplacementRow) => `${row.productId}:${row.unit}`;
  const table = { caption: "İkame maliyeti nominal değişimi", columns: [{ label: "Ürün" }, { label: "Son birim fiyat", numeric: true }, { label: "Nominal değişim", numeric: true }], rows: shown.map(row => [row.productName, `${money(row.latestUnitCost)} / ${unit(row.unit)}`, row.nominalChangePercent === null ? "Bilinmiyor" : percent(row.nominalChangePercent)]) };
  return <ChartFrame title="İkame maliyeti değişimi" summary={`Son doğrulanmış alış fiyatına göre nominal değişim${known.length < rows.length - unknownRows.length ? ` · en büyük ${LIMIT} değişim` : ""}${unknownRows.length ? ` · ${count(unknownRows.length)} üründe karşılaştırma bilinmiyor (sıfır değil)` : ""}. Enflasyon veya reel büyüme değildir.`} table={table}>
    <RankBars ariaLabel="İkame maliyeti değişimi" color="var(--pur-change)" formatValue={percent} rows={shown.map(row => ({ id: id(row), label: row.productName, detail: `${money(row.latestUnitCost)} / ${unit(row.unit)}`, value: row.nominalChangePercent }))} />
  </ChartFrame>;
}

import { ChartFrame, CompositionBar, RankBars, type CompositionPart } from "./charts";
import { classificationLabels, type ExpenseRecord, type ExpenseValue } from "../expenses/contracts";
import { date, money } from "./format";
const currentValue = (row: ExpenseRecord): ExpenseValue | null => "format" in row.value ? row.value : null;
const count = (value: number) => value.toLocaleString("tr-TR");
/** The validated five hues. Slate (neutral) is reserved for the "Diğer" rest bucket. */
export const categoryPalette = ["var(--viz-sales)", "var(--viz-contribution)", "var(--viz-accent-3)", "var(--exp-violet)", "var(--exp-gold)"];
const CATEGORIES = categoryPalette.length + 1;
/**
 * A category keeps its colour whatever its rank: a small deterministic string hash picks the hue.
 * Two categories can share a hue; every segment still has a direct label and a table twin.
 */
export const categoryColor = (name: string) => {
  let hash = 0;
  for (const char of name) hash = (Math.imul(hash, 31) + char.codePointAt(0)!) >>> 0;
  return categoryPalette[hash % categoryPalette.length];
};
const LARGEST = 8;
const active = (rows: ExpenseRecord[]) => rows.filter(row => !currentValue(row)?.voided);

/** Graph 1: record counts per category. Counts only: no amount is summed. Voided rows are excluded. */
export function ExpenseCategoryChart({ rows }: { rows: ExpenseRecord[] }) {
  const live = active(rows);
  if (live.length === 0) return null;
  const groups = new Map<string, number>();
  for (const row of live) { const name = currentValue(row)?.category ?? "Eski kayıt"; groups.set(name, (groups.get(name) ?? 0) + 1); }
  const sorted = [...groups.entries()].sort((a, b) => b[1] - a[1]);
  const head = sorted.slice(0, sorted.length > CATEGORIES ? CATEGORIES - 1 : CATEGORIES), rest = sorted.slice(head.length);
  const parts: CompositionPart[] = [...head.map(([name, value]) => ({ key: name, label: name, value, color: categoryColor(name) })), ...(rest.length ? [{ key: "__other", label: `Diğer ${count(rest.length)} kategori`, value: rest.reduce((total, [, value]) => total + value, 0), color: "var(--viz-cost)" }] : [])];
  const table = { caption: "Kategoriye göre gider kaydı sayısı", columns: [{ label: "Kategori" }, { label: "Kayıt sayısı", numeric: true }], rows: sorted.map(([name, value]) => [name, count(value)]) };
  return <ChartFrame title="Kategoriye göre kayıt sayısı" summary="Tutar değil, kayıt adedi. Geri alınan kayıtlar sayılmaz." table={table}>
    <CompositionBar parts={parts} ariaLabel={`Kategoriye göre kayıt sayısı: ${parts.map(part => `${part.label} ${count(part.value)}`).join(", ")}`} />
  </ChartFrame>;
}

type Item = { row: ExpenseRecord; amount: string; basis: "brüt" | "net" };
/** Graph 2: the largest individual rows by their own recorded amount. `Number()` orders rows only; displayed values are service strings. */
export function LargestExpensesChart({ rows, onSelect }: { rows: ExpenseRecord[]; onSelect: (row: ExpenseRecord) => void }) {
  const items: Item[] = active(rows).map(row => { const value = currentValue(row); return value ? { row, amount: value.gross, basis: "brüt" } : { row, amount: row.value.net, basis: "net" }; });
  if (items.length === 0) return null;
  const shown = items.toSorted((a, b) => Number(b.amount) - Number(a.amount)).slice(0, LARGEST);
  const label = (item: Item) => currentValue(item.row)?.category ?? "Eski kayıt";
  const detail = (item: Item) => { const value = currentValue(item.row); return `${date(item.row.value.date)} · ${value ? classificationLabels[value.classification] : "yalnızca net tutar"}`; };
  const table = { caption: "En büyük gider kayıtları", columns: [{ label: "Kategori" }, { label: "Tarih" }, { label: "Tutar", numeric: true }], rows: shown.map(item => [label(item), date(item.row.value.date), `${money(item.amount)} ${item.basis}`]) };
  return <ChartFrame title="En büyük gider kayıtları" summary={`Kayıt başına kayıtlı tutar (brüt; eski kayıtlarda net)${items.length > shown.length ? ` · en büyük ${LARGEST} kayıt` : ""}. Dönem gideri toplamı değildir.`} table={table}>
    <RankBars ariaLabel="En büyük gider kayıtları" color="var(--viz-cost)" formatValue={money} rows={shown.map(item => ({ id: item.row.entityId, label: label(item), detail: detail(item), value: item.amount, onSelect: () => onSelect(item.row) }))} />
  </ChartFrame>;
}

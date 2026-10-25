export const limitationStatuses = ["açık", "v1 için kabul", "düzeltildi"] as const;
export type LimitationStatus = typeof limitationStatuses[number];
export type Limitation = { status: LimitationStatus; limit: string; note: string; topic: string };

const plain = (cell: string) => cell.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1").replace(/\\\|/g, "|").trim();
const cellsOf = (line: string) => line.trim().replace(/^\|/, "").replace(/(?<!\\)\|$/, "").split(/(?<!\\)\|/).map(plain);

/** Parses the Markdown table (Durum | Sınır | Not | Konu); links render as plain text. Lines after the first table are ignored. */
export function parseLimitations(markdown: string): Limitation[] {
  const lines = markdown.split(/\r?\n/);
  const header = lines.findIndex(line => line.trim().startsWith("|") && cellsOf(line)[0] === "Durum");
  if (header < 0) throw new Error("Limitations table header not found");
  const rows: Limitation[] = [];
  for (const line of lines.slice(header + 1)) {
    if (!line.trim().startsWith("|")) break;
    const cells = cellsOf(line);
    if (cells.every(cell => /^:?-{3,}:?$/.test(cell))) continue;
    const [status, limit, note = "", topic = ""] = cells;
    if (!limitationStatuses.includes(status as LimitationStatus) || !limit) throw new Error(`Unreadable limitation row: ${line}`);
    rows.push({ status: status as LimitationStatus, limit, note, topic });
  }
  return rows;
}

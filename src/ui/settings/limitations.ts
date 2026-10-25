export const limitationStatuses = ["açık", "v1 için kabul", "düzeltildi"] as const;
export type LimitationStatus = typeof limitationStatuses[number];
export type Limitation = { status: LimitationStatus; limit: string; note: string; topic: string };

const plain = (cell: string) => cell.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1").trim();

/** Parses the Markdown table (Durum | Sınır | Not | Konu); links render as plain text. */
export function parseLimitations(markdown: string): Limitation[] {
  const rows = markdown.split(/\r?\n/).filter(line => line.trim().startsWith("|")).slice(2);
  return rows.map(line => {
    const cells = line.trim().replace(/^\||\|$/g, "").split("|").map(plain);
    const [status, limit, note = "", topic = ""] = cells;
    if (!limitationStatuses.includes(status as LimitationStatus) || !limit) throw new Error(`Unreadable limitation row: ${line}`);
    return { status: status as LimitationStatus, limit, note, topic };
  });
}

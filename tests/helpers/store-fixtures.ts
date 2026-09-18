import { readFileSync } from "node:fs";
import { writePackage, type Batch, type DocumentRecord, type LineRecord } from "../../src/source/package";

export function sourcePackage(name: "a" | "b", lineage?: string, extractionId?: string) {
  const fixture = JSON.parse(readFileSync(new URL(`../fixtures/source-${name}/snapshot.json`, import.meta.url), "utf8")) as {
    lineage: string; records: (LineRecord & { kind: string; date: string })[];
  };
  const lines = fixture.records.filter(row => row.kind === "sale");
  const documents: DocumentRecord[] = lines.map(row => ({ id: row.documentId, kind: "sale", date: row.date, supplierId: null }));
  const batches: Batch[] = [
    { stream: "documents", records: documents },
    { stream: "lines", records: lines.map(({ id, documentId, quantity, net, cost }) => ({ id, documentId, quantity, net, cost })) },
  ];
  return writePackage(batches, {
    lineage: lineage ?? fixture.lineage, extractionId: extractionId ?? `source-${name}`, extractedAt: "2025-02-03T00:00:00.000Z", cutoff: "2025-02-02",
    coverage: { from: "2025-01-01", to: "2025-02-02", complete: true },
  });
}

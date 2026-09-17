import { createHash } from "node:crypto";

export const MAPPING_VERSION = "synthetic-relational-v1";
export const MAX_BYTES = 32 * 1024 * 1024;
export const MAX_ROWS = 100_000;
export type DocumentRecord = { id: string; kind: "sale" | "purchase" | "customer-return" | "supplier-return"; date: string; supplierId: string | null };
export type LineRecord = { id: string; documentId: string; quantity: string; net: string; cost: string | null };
export type SupplierRecord = { id: string };
export type Records = { documents: DocumentRecord[]; lines: LineRecord[]; suppliers: SupplierRecord[] };
export type Batch = { stream: "documents"; records: DocumentRecord[] } | { stream: "lines"; records: LineRecord[] } | { stream: "suppliers"; records: SupplierRecord[] };
export type Metadata = { lineage: string; extractionId: string; extractedAt: string; cutoff: string; coverage: { from: string; to: string; complete: boolean } };
export type Manifest = Metadata & { schemaVersion: "analytics-package-v1"; mappingVersion: typeof MAPPING_VERSION; provenance: "synthetic"; currency: "TRY"; sourceReconciled: false; streams: Record<keyof Records, { count: number; sha256: string }> };
const streams = ["documents", "lines", "suppliers"] as const;
const idPattern = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const decimalPattern = /^-?(?:0|[1-9][0-9]{0,39})(?:\.[0-9]{1,30})?$/;
function requireThat(value: unknown): asserts value { if (!value) throw new Error("INVALID_PACKAGE"); }
function object(value: unknown): asserts value is Record<string, unknown> { requireThat(value && typeof value === "object" && !Array.isArray(value)); }
function keys(value: unknown, expected: string[]): asserts value is Record<string, unknown> { object(value); requireThat(Object.keys(value).sort().join(",") === [...expected].sort().join(",")); }
function id(value: unknown) { requireThat(typeof value === "string" && idPattern.test(value)); }
function date(value: unknown) { requireThat(typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && new Date(value).toISOString().slice(0, 10) === value); }
function decimal(value: unknown) { requireThat(typeof value === "string" && decimalPattern.test(value)); }
export function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.entries(value).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`).join(",")}}`;
  return JSON.stringify(value);
}
const hash = (value: unknown) => createHash("sha256").update(canonical(value)).digest("hex");
function validate(value: unknown, verifyHashes = true): asserts value is { manifest: Manifest; payload: Records } {
  keys(value, ["manifest", "payload"]);
  const { manifest: m, payload: p } = value;
  keys(m, ["schemaVersion", "mappingVersion", "provenance", "currency", "sourceReconciled", "lineage", "extractionId", "extractedAt", "cutoff", "coverage", "streams"]);
  requireThat(m.schemaVersion === "analytics-package-v1" && m.mappingVersion === MAPPING_VERSION && m.provenance === "synthetic" && m.currency === "TRY" && m.sourceReconciled === false);
  id(m.lineage); id(m.extractionId); date(m.cutoff);
  requireThat(typeof m.extractedAt === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(m.extractedAt) && new Date(m.extractedAt).toISOString() === m.extractedAt);
  keys(m.coverage, ["from", "to", "complete"]); date(m.coverage.from); date(m.coverage.to);
  requireThat(typeof m.coverage.complete === "boolean" && String(m.coverage.from) <= String(m.coverage.to) && String(m.coverage.to) <= String(m.cutoff));
  keys(p, [...streams]); keys(m.streams, [...streams]);
  const ids = { documents: new Set<string>(), lines: new Set<string>(), suppliers: new Set<string>() };
  let count = 0;
  for (const stream of streams) {
    const rows = p[stream]; requireThat(Array.isArray(rows)); count += rows.length; requireThat(count <= MAX_ROWS);
    for (const row of rows) {
      keys(row, stream === "documents" ? ["id", "kind", "date", "supplierId"] : stream === "lines" ? ["id", "documentId", "quantity", "net", "cost"] : ["id"]);
      id(row.id); requireThat(!ids[stream].has(String(row.id))); ids[stream].add(String(row.id));
      if (stream === "documents") {
        requireThat(typeof row.kind === "string" && ["sale", "purchase", "customer-return", "supplier-return"].includes(row.kind)); date(row.date);
        requireThat(String(row.date) >= String(m.coverage.from) && String(row.date) <= String(m.coverage.to));
        if (row.supplierId !== null) { id(row.supplierId); requireThat(row.kind === "purchase" || row.kind === "supplier-return"); }
      }
      if (stream === "lines") { id(row.documentId); decimal(row.quantity); decimal(row.net); if (row.cost !== null) decimal(row.cost); }
    }
    const descriptor = m.streams[stream]; keys(descriptor, ["count", "sha256"]);
    requireThat(descriptor.count === rows.length && (!verifyHashes || descriptor.sha256 === hash(rows)));
  }
  const records = p as unknown as Records;
  const referencedSuppliers = new Set<string>();
  for (const row of records.documents) if (row.supplierId !== null) { requireThat(ids.suppliers.has(row.supplierId)); referencedSuppliers.add(row.supplierId); }
  requireThat(records.suppliers.every(row => referencedSuppliers.has(row.id)));
  requireThat(records.lines.every(row => ids.documents.has(row.documentId)));
}
export function writePackage(batches: Batch[], metadata: Metadata): Buffer {
  const payload: Records = { documents: [], lines: [], suppliers: [] };
  let count = 0;
  for (const batch of batches) {
    requireThat(streams.includes(batch.stream)); count += batch.records.length; requireThat(count <= MAX_ROWS);
    if (batch.stream === "documents") payload.documents.push(...batch.records);
    else if (batch.stream === "lines") payload.lines.push(...batch.records);
    else payload.suppliers.push(...batch.records);
  }
  for (const stream of streams) payload[stream].sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  const manifest = { ...metadata, schemaVersion: "analytics-package-v1", mappingVersion: MAPPING_VERSION, provenance: "synthetic", currency: "TRY", sourceReconciled: false, streams: Object.fromEntries(streams.map(stream => [stream, { count: payload[stream].length, sha256: "" }])) };
  const value = { manifest, payload }; validate(value, false);
  for (const stream of streams) value.manifest.streams[stream].sha256 = hash(payload[stream]);
  const bytes = Buffer.from(canonical(value)); requireThat(bytes.length <= MAX_BYTES); return bytes;
}
export function readPackage(bytes: Uint8Array): { ok: true; metadata: Manifest; records: Records; warnings: string[] } | { ok: false; code: "INVALID_PACKAGE" } {
  try {
    requireThat(bytes.byteLength <= MAX_BYTES);
    const text = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(bytes);
    const value: unknown = JSON.parse(text); validate(value);
    requireThat(canonical(value) === text);
    const warnings = ["SYNTHETIC_ONLY"];
    if (!value.manifest.coverage.complete) warnings.push("PARTIAL_COVERAGE");
    if (value.payload.lines.some(row => row.cost === null)) warnings.push("MISSING_COST");
    return { ok: true, metadata: value.manifest, records: value.payload, warnings };
  } catch { return { ok: false, code: "INVALID_PACKAGE" }; }
}

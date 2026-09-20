import { createHash } from "node:crypto";

export const MAPPING_VERSION = "synthetic-relational-v1";
export const BUSINESS_MAPPING_VERSION = "synthetic-business-v1";
export const SALES_MAPPING_VERSION = "synthetic-sales-v1";
export type SalesDocument = { state: "completed" | "void" | "converted" | "unknown"; convertedTo: string | null; net: string; tax: string; gross: string };
export type SalesLine = { productId: string; productName: string; categoryId: string; categoryName: string; unit: "piece" | "kg" | "unknown"; unitNet: string; discountRate: string; taxRate: string; tax: string; gross: string; meaning: "known" | "unknown" };
export type HistoricalCost = { unitCost: string | null; unit: "piece" | "kg" | "unknown"; taxBasis: "net" | "unknown"; evidence: string | null; documentedZero: boolean; originalSaleLineId: string | null };
export type PurchaseEvidence = { representation: "invoice" | "dispatch"; convertedTo: string | null; invoiced: boolean; evidence: string; physicalReturn: boolean; requestedRecovery: string | null; recognizedCredit: string | null; replacementSettlement: "unknown" | "confirmed"; settlementEvidence: string | null };
export type InventoryEvidence = { date: string; stock: string | null; recordedWaste: string | null; evidence: string; complete: boolean };
export type BusinessLine = { historicalCost: HistoricalCost | null; inventory: InventoryEvidence | null };
export const MAX_BYTES = 32 * 1024 * 1024;
export const MAX_ROWS = 100_000;
export type DocumentRecord = { id: string; kind: "sale" | "purchase" | "customer-return" | "supplier-return"; date: string; supplierId: string | null; sales?: SalesDocument; purchasing?: PurchaseEvidence | null };
export type LineRecord = { id: string; documentId: string; quantity: string; net: string; cost: string | null; sales?: SalesLine; business?: BusinessLine };
export type SupplierRecord = { id: string; name?: string };
export type Records = { documents: DocumentRecord[]; lines: LineRecord[]; suppliers: SupplierRecord[] };
export type Batch = { stream: "documents"; records: DocumentRecord[] } | { stream: "lines"; records: LineRecord[] } | { stream: "suppliers"; records: SupplierRecord[] };
export type Metadata = { lineage: string; extractionId: string; extractedAt: string; cutoff: string; coverage: { from: string; to: string; complete: boolean } };
export type Manifest = Metadata & { schemaVersion: "analytics-package-v1"; mappingVersion: typeof MAPPING_VERSION | typeof SALES_MAPPING_VERSION | typeof BUSINESS_MAPPING_VERSION; provenance: "synthetic"; currency: "TRY"; sourceReconciled: false; streams: Record<keyof Records, { count: number; sha256: string }> };
const streams = ["documents", "lines", "suppliers"] as const;
const idPattern = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const decimalPattern = /^-?(?:0|[1-9][0-9]{0,39})(?:\.[0-9]{1,30})?$/;
function requireThat(value: unknown): asserts value { if (!value) throw new Error("INVALID_PACKAGE"); }
function object(value: unknown): asserts value is Record<string, unknown> { requireThat(value && typeof value === "object" && !Array.isArray(value)); }
function keys(value: unknown, expected: string[]): asserts value is Record<string, unknown> { object(value); requireThat(Object.keys(value).sort().join(",") === [...expected].sort().join(",")); }
function id(value: unknown) { requireThat(typeof value === "string" && idPattern.test(value)); }
function date(value: unknown) { requireThat(typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && new Date(value).toISOString().slice(0, 10) === value); }
function decimal(value: unknown) { requireThat(typeof value === "string" && decimalPattern.test(value)); }
function validateSales(row: Record<string, unknown>, stream: string) {
  const s = row.sales;
  if (stream === "documents") {
    keys(s, ["state", "convertedTo", "net", "tax", "gross"]);
    requireThat(["completed", "void", "converted", "unknown"].includes(String(s.state)) && typeof s.state === "string");
    if (s.convertedTo !== null) id(s.convertedTo);
    requireThat((s.state === "converted") === (s.convertedTo !== null));
    for (const name of ["net", "tax", "gross"]) decimal(s[name]);
  } else {
    keys(s, ["productId", "productName", "categoryId", "categoryName", "unit", "unitNet", "discountRate", "taxRate", "tax", "gross", "meaning"]);
    id(s.productId); id(s.categoryId);
    for (const name of ["productName", "categoryName"]) requireThat(typeof s[name] === "string" && String(s[name]).trim().length > 0 && String(s[name]).length <= 160 && !/[\u0000-\u001f\u007f]/.test(String(s[name])));
    requireThat(typeof s.unit === "string" && ["piece", "kg", "unknown"].includes(s.unit));
    requireThat(s.meaning === "known" || s.meaning === "unknown");
    for (const value of [row.quantity, s.unitNet]) requireThat(typeof value === "string" && /^(?:0|[1-9][0-9]{0,19})(?:\.[0-9]{1,15})?$/.test(value));
    for (const name of ["discountRate", "taxRate"]) requireThat(typeof s[name] === "string" && /^(?:100(?:\.0{1,6})?|(?:0|[1-9][0-9]?)(?:\.[0-9]{1,6})?)$/.test(String(s[name])));
    decimal(s.tax); decimal(s.gross);
  }
}
function validateBusiness(row: Record<string, unknown>, stream: string) {
  const text = (v: unknown) => requireThat(typeof v === "string" && v.trim().length > 0 && v.length <= 160 && !/[\u0000-\u001f\u007f]/.test(v));
  if (stream === "suppliers") { text(row.name); return; }
  if (stream === "documents") {
    const p = row.purchasing;
    if (p === null) return;
    requireThat(row.kind === "purchase" || row.kind === "supplier-return");
    keys(p, ["representation", "convertedTo", "invoiced", "evidence", "physicalReturn", "requestedRecovery", "recognizedCredit", "replacementSettlement", "settlementEvidence"]);
    requireThat(p.representation === "invoice" || p.representation === "dispatch");
    if (p.convertedTo !== null) id(p.convertedTo);
    requireThat(typeof p.invoiced === "boolean" && typeof p.physicalReturn === "boolean"); id(p.evidence);
    for (const k of ["requestedRecovery", "recognizedCredit"]) if (p[k] !== null) { decimal(p[k]); requireThat(!String(p[k]).startsWith("-")); }
    requireThat(p.replacementSettlement === "unknown" || p.replacementSettlement === "confirmed");
    if (p.settlementEvidence !== null) id(p.settlementEvidence);
    requireThat((p.recognizedCredit === null && p.replacementSettlement === "unknown") || p.settlementEvidence !== null);
    return;
  }
  keys(row.business, ["historicalCost", "inventory"]);
  const c = row.business.historicalCost;
  if (c !== null) {
    keys(c, ["unitCost", "unit", "taxBasis", "evidence", "documentedZero", "originalSaleLineId"]);
    if (c.unitCost !== null) { decimal(c.unitCost); requireThat(/^-?(?:0|[1-9][0-9]{0,19})(?:\.[0-9]{1,15})?$/.test(String(c.unitCost))); }
    requireThat(["piece", "kg", "unknown"].includes(String(c.unit)) && (c.taxBasis === "net" || c.taxBasis === "unknown") && typeof c.documentedZero === "boolean");
    if (c.evidence !== null) id(c.evidence); if (c.originalSaleLineId !== null) id(c.originalSaleLineId);
  }
  const i = row.business.inventory;
  if (i !== null) {
    keys(i, ["date", "stock", "recordedWaste", "evidence", "complete"]); date(i.date); id(i.evidence); requireThat(typeof i.complete === "boolean");
    if (i.stock !== null) decimal(i.stock); if (i.recordedWaste !== null) { decimal(i.recordedWaste); requireThat(!String(i.recordedWaste).startsWith("-")); }
  }
}
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
  requireThat(m.schemaVersion === "analytics-package-v1" && (m.mappingVersion === MAPPING_VERSION || m.mappingVersion === SALES_MAPPING_VERSION || m.mappingVersion === BUSINESS_MAPPING_VERSION) && m.provenance === "synthetic" && m.currency === "TRY" && m.sourceReconciled === false);
  id(m.lineage); id(m.extractionId); date(m.cutoff);
  if (m.mappingVersion === SALES_MAPPING_VERSION || m.mappingVersion === BUSINESS_MAPPING_VERSION) requireThat(String(m.cutoff) >= "1900-01-01" && String(m.cutoff) <= "9998-12-31");
  requireThat(typeof m.extractedAt === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(m.extractedAt) && new Date(m.extractedAt).toISOString() === m.extractedAt);
  keys(m.coverage, ["from", "to", "complete"]); date(m.coverage.from); date(m.coverage.to);
  if (m.mappingVersion === SALES_MAPPING_VERSION || m.mappingVersion === BUSINESS_MAPPING_VERSION) requireThat(String(m.coverage.from) >= "1900-01-01");
  requireThat(typeof m.coverage.complete === "boolean" && String(m.coverage.from) <= String(m.coverage.to) && String(m.coverage.to) <= String(m.cutoff));
  keys(p, [...streams]); keys(m.streams, [...streams]);
  const ids = { documents: new Set<string>(), lines: new Set<string>(), suppliers: new Set<string>() };
  let count = 0;
  for (const stream of streams) {
    const rows = p[stream]; requireThat(Array.isArray(rows)); count += rows.length; requireThat(count <= MAX_ROWS);
    for (const row of rows) {
      const sales = (m.mappingVersion === SALES_MAPPING_VERSION || m.mappingVersion === BUSINESS_MAPPING_VERSION) && stream !== "suppliers";
      keys(row, [...(stream === "documents" ? ["id", "kind", "date", "supplierId"] : stream === "lines" ? ["id", "documentId", "quantity", "net", "cost"] : ["id"]), ...(sales ? ["sales"] : []), ...(m.mappingVersion === BUSINESS_MAPPING_VERSION ? stream === "documents" ? ["purchasing"] : stream === "lines" ? ["business"] : ["name"] : [])]);
      if (sales) validateSales(row, stream);
      if (m.mappingVersion === BUSINESS_MAPPING_VERSION) {
        validateBusiness(row, stream);
        if (stream === "lines") { const inventory = (row.business as BusinessLine).inventory; requireThat(!inventory || inventory.date <= String(m.cutoff)); }
      }
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
  if (m.mappingVersion === SALES_MAPPING_VERSION || m.mappingVersion === BUSINESS_MAPPING_VERSION) {
    const labels = new Map<string, string>();
    for (const line of records.lines) {
      const s = line.sales!;
      for (const [key, label] of [[`product:${s.productId}`, `${s.productName}\0${s.categoryId}`], [`category:${s.categoryId}`, s.categoryName]]) {
        requireThat(!labels.has(key) || labels.get(key) === label); labels.set(key, label);
      }
    }
    const documentsById = new Map(records.documents.map(row => [row.id, row]));
    for (const document of records.documents) if (document.sales!.convertedTo !== null) {
      const target = documentsById.get(document.sales!.convertedTo!);
      requireThat(target && target.id !== document.id && target.kind === document.kind && target.sales!.state === "completed");
    }
  }
}
export function writePackage(batches: Batch[], metadata: Metadata, mappingVersion: Manifest["mappingVersion"] = MAPPING_VERSION): Buffer {
  const payload: Records = { documents: [], lines: [], suppliers: [] };
  let count = 0;
  for (const batch of batches) {
    requireThat(streams.includes(batch.stream)); count += batch.records.length; requireThat(count <= MAX_ROWS);
    if (batch.stream === "documents") payload.documents.push(...batch.records);
    else if (batch.stream === "lines") payload.lines.push(...batch.records);
    else payload.suppliers.push(...batch.records);
  }
  for (const stream of streams) payload[stream].sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  const manifest = { ...metadata, schemaVersion: "analytics-package-v1", mappingVersion, provenance: "synthetic", currency: "TRY", sourceReconciled: false, streams: Object.fromEntries(streams.map(stream => [stream, { count: payload[stream].length, sha256: "" }])) };
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

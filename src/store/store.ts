import { createHash, randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { canonical, readPackage, type Manifest, type Records } from "../source/package";
import { migrate } from "./migrations";
import type { Availability, ImportErrorCode } from "../domain/contracts";
import { type AcceptedReport, type AppChange, type AppRecord, type Pin, type Target, requireValid, validId, validateChange } from "./revisions";

export type ImportCode = ImportErrorCode;
export type ImportResult = { status: "active" | "unchanged" | "historical"; datasetId: string } | { status: "failed"; code: ImportCode } | { status: "cancelled" };
export type StageResult = { status: "validated"; id: string; datasetId: string } | ImportResult;
export type FaultBoundary = "reading" | "persistence" | "validation" | "summary" | "activation";
export type Snapshot = { importedAt: string | null; pin: Pin; metadata: Manifest | null; warnings: string[]; records: Records; app: AppRecord[] };
type Options = { schemaVersion?: number; fault?: (boundary: FaultBoundary) => void; maxPages?: number };
const hash = (value: unknown) => createHash("sha256").update(canonical(value)).digest("hex");
const decode = <T>(value: unknown): T => JSON.parse(String(value)) as T;
export function importErrorCode(error: unknown): ImportCode { return error && typeof error === "object" && "errcode" in error && error.errcode === 13 ? "STORAGE_FULL" : "IMPORT_FAILED"; }

export function openStore(path: string, options: Options = {}) {
  const db = new DatabaseSync(path);
  try { migrate(db, options.schemaVersion); return new AnalyticsStore(db, options); }
  catch (error) { db.close(); throw error; }
}

class AnalyticsStore {
  private readonly salesEnabled: boolean;
  constructor(private readonly db: DatabaseSync, private readonly options: Options) {
    this.salesEnabled = Number(db.prepare("PRAGMA user_version").get()!.user_version) >= 3;
    if (options.maxPages !== undefined) {
      requireValid(Number.isSafeInteger(options.maxPages) && options.maxPages > 0);
      db.exec(`PRAGMA max_page_count=${options.maxPages}`);
    }
    db.prepare("UPDATE import_batches SET state='failed',error_code='INTERRUPTED' WHERE state IN ('staged','validated')").run();
  }
  close() { this.db.close(); }
  private lastImportError(): ImportCode | undefined {
    const batch = this.db.prepare("SELECT state,error_code FROM import_batches WHERE state IN ('failed','active') ORDER BY rowid DESC LIMIT 1").get();
    return batch?.state === "failed" ? batch.error_code as ImportCode : undefined;
  }
  availability(): Availability {
    const lastImportError = this.lastImportError();
    const error = lastImportError ? { lastImportError } : {};
    const row = this.db.prepare("SELECT d.id,d.manifest_json,d.warnings_json,d.summary_json FROM active_dataset a JOIN datasets d ON d.id=a.dataset_id").get();
    if (!row) return { status: "ready", store: "empty", liveConnection: "disabled", ...error };
    const manifest = decode<Manifest>(row.manifest_json);
    const summary = decode<{ documents: number; lines: number; suppliers: number }>(row.summary_json);
    return { status: "ready", store: "loaded", liveConnection: "disabled", ...error, dataset: { datasetId: String(row.id), cutoff: manifest.cutoff, extractedAt: manifest.extractedAt, counts: { documents: summary.documents, lines: summary.lines, suppliers: summary.suppliers }, warnings: decode<string[]>(row.warnings_json) } };
  }
  private transaction<T>(work: () => T, read = false): T {
    this.db.exec(read ? "BEGIN" : "BEGIN IMMEDIATE");
    try { const result = work(); this.db.exec("COMMIT"); return result; }
    catch (error) { if (this.db.isTransaction) this.db.exec("ROLLBACK"); throw error; }
  }
  private currentPin(): Pin {
    return {
      datasetId: this.db.prepare("SELECT dataset_id FROM active_dataset").get()?.dataset_id as string | undefined ?? null,
      appRevision: Number(this.db.prepare("SELECT COALESCE(MAX(revision),0) AS revision FROM app_revisions").get()!.revision),
    };
  }
  private withSales<T>(rows: Record<string, unknown>[]): T[] {
    return rows.map(({ sales_json, ...row }) => ({ ...row, ...(sales_json ? { sales: decode(sales_json) } : {}) })) as T[];
  }
  private facts(datasetId: string): Records {
    return {
      documents: this.withSales<Records["documents"][number]>(this.db.prepare(`SELECT id,kind,date,supplier_id AS supplierId${this.salesEnabled ? ",sales_json" : ""} FROM source_documents WHERE dataset_id=? ORDER BY ordinal`).all(datasetId)),
      lines: this.withSales<Records["lines"][number]>(this.db.prepare(`SELECT id,document_id AS documentId,quantity,net,cost${this.salesEnabled ? ",sales_json" : ""} FROM source_lines WHERE dataset_id=? ORDER BY ordinal`).all(datasetId)),
      suppliers: this.db.prepare("SELECT id FROM source_suppliers WHERE dataset_id=? ORDER BY ordinal").all(datasetId) as Records["suppliers"],
    };
  }
  private fingerprint(target: Target, datasetId = target.datasetId): string | null {
    const dataset = this.db.prepare("SELECT lineage FROM datasets WHERE id=?").get(datasetId);
    if (!dataset) return null;
    const line = target.kind === "line" ? this.db.prepare("SELECT id,document_id,quantity,net,cost FROM source_lines WHERE dataset_id=? AND id=?").get(datasetId, target.sourceId) : null;
    if (target.kind === "line" && !line) return null;
    const document = this.db.prepare("SELECT id,kind,date,supplier_id FROM source_documents WHERE dataset_id=? AND id=?").get(datasetId, line ? String(line.document_id) : target.sourceId);
    if (this.salesEnabled && document) {
      const docSales = this.db.prepare("SELECT sales_json FROM source_documents WHERE dataset_id=? AND id=?").get(datasetId, String(document.id));
      if (docSales?.sales_json) document.sales = String(docSales.sales_json);
      if (line) {
        const lineSales = this.db.prepare("SELECT sales_json FROM source_lines WHERE dataset_id=? AND id=?").get(datasetId, String(line.id));
        if (lineSales?.sales_json) line.sales = String(lineSales.sales_json);
      }
    }
    return document ? hash({ lineage: dataset.lineage, kind: target.kind, document, line }) : null;
  }
  private snapshot(pin: Pin): Snapshot {
    requireValid(pin && Number.isSafeInteger(pin.appRevision) && pin.appRevision >= 0);
    requireValid(pin.appRevision === 0 || this.db.prepare("SELECT revision FROM app_revisions WHERE revision=?").get(pin.appRevision));
    const dataset = pin.datasetId === null ? undefined : this.db.prepare("SELECT manifest_json,warnings_json FROM datasets WHERE id=?").get(pin.datasetId);
    requireValid(pin.datasetId === null || dataset);
    const app = this.db.prepare(`SELECT r.revision,r.kind,r.entity_id,r.value_json,t.fingerprint FROM app_revisions r
      LEFT JOIN adjustment_targets t ON t.revision=r.revision WHERE r.revision<=? AND NOT EXISTS
      (SELECT 1 FROM app_revisions newer WHERE newer.kind=r.kind AND newer.entity_id=r.entity_id AND newer.revision<=? AND newer.revision>r.revision)
      ORDER BY r.revision`).all(pin.appRevision, pin.appRevision).map(row => {
      const record = { revision: Number(row.revision), kind: row.kind, entityId: row.entity_id, value: decode(row.value_json) } as AppRecord;
      if (record.kind === "adjustment") record.applicability = record.value.reversed ? "reversed" : pin.datasetId !== null && this.fingerprint(record.value.target, pin.datasetId) === row.fingerprint ? "applicable" : "review-required";
      return record;
    });
    return { importedAt: pin.datasetId ? (this.db.prepare("SELECT created_at FROM import_batches WHERE dataset_id=? AND state='active' ORDER BY rowid LIMIT 1").get(pin.datasetId)?.created_at as string | undefined ?? null) : null, pin: { ...pin }, metadata: dataset ? decode<Manifest>(dataset.manifest_json) : null, warnings: dataset ? decode<string[]>(dataset.warnings_json) : [], records: pin.datasetId === null ? { documents: [], lines: [], suppliers: [] } : this.facts(pin.datasetId), app };
  }
  readSnapshot(): Snapshot { return this.transaction(() => this.snapshot(this.currentPin()), true); }
  readPinned(pin: Pin): Snapshot { return this.transaction(() => this.snapshot(pin), true); }
  appendRevision(change: AppChange): number {
    validateChange(change);
    return this.transaction(() => {
      if (change.kind === "confirmation") requireValid(change.value.reviewedRevision <= this.currentPin().appRevision);
      const fingerprint = change.kind === "adjustment" ? this.fingerprint(change.value.target) : null;
      if (change.kind === "adjustment") {
        requireValid(fingerprint);
        const original = this.db.prepare("SELECT value_json FROM app_revisions WHERE kind='adjustment' AND entity_id=? ORDER BY revision LIMIT 1").get(change.entityId);
        if (original) requireValid(canonical(decode<{ target: Target }>(original.value_json).target) === canonical(change.value.target));
      }
      const result = this.db.prepare("INSERT INTO app_revisions(kind,entity_id,value_json,created_at) VALUES(?,?,?,?)").run(change.kind, change.entityId, canonical(change.value), new Date().toISOString());
      const revision = Number(result.lastInsertRowid);
      if (change.kind === "adjustment") this.db.prepare("INSERT INTO adjustment_targets VALUES(?,?,?,?,?)").run(revision, change.value.target.datasetId, change.value.target.kind, change.value.target.sourceId, fingerprint);
      return revision;
    });
  }
  acceptReport(report: AcceptedReport) {
    requireValid(report && validId(report.id) && validId(report.calculationVersion) && Array.isArray(report.evidence) && report.evidence.length > 0 && report.evidence.length <= 100 && report.evidence.every(validId));
    requireValid(report.output && typeof report.output === "object" && !Array.isArray(report.output) && Buffer.byteLength(canonical(report)) <= 1024 * 1024);
    this.transaction(() => {
      this.snapshot(report.pin);
      this.db.prepare("INSERT INTO report_versions VALUES(?,?,?,?,?)").run(report.id, report.pin.datasetId, report.pin.appRevision || null, report.calculationVersion, canonical(report));
      const insert = this.db.prepare("INSERT INTO evidence_references(report_id,identity) VALUES(?,?)");
      for (const identity of report.evidence) insert.run(report.id, identity);
    });
  }
  readReport(id: string): AcceptedReport {
    const row = this.db.prepare("SELECT content_json FROM report_versions WHERE id=?").get(id);
    if (!row) throw new Error("REPORT_NOT_FOUND"); return decode(row.content_json);
  }
  private failure(id: string, datasetId: string | null, code: ImportCode) {
    try {
      this.db.prepare("INSERT INTO import_batches(id,dataset_id,state,error_code,created_at) VALUES(?,?,'failed',?,?) ON CONFLICT(id) DO UPDATE SET dataset_id=excluded.dataset_id,state='failed',error_code=excluded.error_code").run(id, datasetId, code, new Date().toISOString());
    } catch { /* A full disk can also prevent recording the failure. Never mask the original error. */ }
    return { status: "failed", code } as const;
  }
  stage(bytes: Uint8Array): StageResult {
    const id = randomUUID(); let datasetId: string | null = null;
    try {
      this.db.prepare("INSERT INTO import_batches(id,state,created_at) VALUES(?,'staged',?)").run(id, new Date().toISOString());
      this.options.fault?.("reading");
      const parsed = readPackage(bytes);
      if (!parsed.ok) return this.failure(id, null, parsed.code);
      datasetId = createHash("sha256").update(bytes).digest("hex");
      this.db.prepare("UPDATE import_batches SET dataset_id=? WHERE id=?").run(datasetId, id);
      if (this.currentPin().datasetId === datasetId) {
        this.db.prepare("UPDATE import_batches SET state='active' WHERE id=?").run(id);
        return { status: "unchanged", datasetId };
      }
      if (this.db.prepare("SELECT hash FROM package_history WHERE hash=? AND activated=1").get(datasetId)) {
        this.db.prepare("UPDATE import_batches SET state='cancelled' WHERE id=?").run(id);
        return { status: "historical", datasetId };
      }
      const candidateId = datasetId;
      this.transaction(() => {
        this.db.prepare("INSERT INTO package_history VALUES(?,0) ON CONFLICT DO NOTHING").run(candidateId);
        if (!this.db.prepare("SELECT id FROM datasets WHERE id=?").get(candidateId)) {
          this.db.prepare("INSERT INTO datasets VALUES(?,?,?,?,?)").run(candidateId, parsed.metadata.lineage, canonical(parsed.metadata), canonical(parsed.warnings), "{}");
          const supplier = this.db.prepare("INSERT INTO source_suppliers VALUES(?,?,?)");
          for (const [ordinal, row] of parsed.records.suppliers.entries()) supplier.run(candidateId, row.id, ordinal);
          const document = this.db.prepare(`INSERT INTO source_documents VALUES(?,?,?,?,?,?${this.salesEnabled ? ",?" : ""})`);
          for (const [ordinal, row] of parsed.records.documents.entries()) document.run(candidateId, row.id, row.kind, row.date, row.supplierId, ordinal, ...(this.salesEnabled ? [row.sales ? canonical(row.sales) : null] : []));
          const line = this.db.prepare(`INSERT INTO source_lines VALUES(?,?,?,?,?,?,?${this.salesEnabled ? ",?" : ""})`);
          for (const [ordinal, row] of parsed.records.lines.entries()) line.run(candidateId, row.id, row.documentId, row.quantity, row.net, row.cost, ordinal, ...(this.salesEnabled ? [row.sales ? canonical(row.sales) : null] : []));
        }
        this.options.fault?.("persistence");
        const facts = this.facts(candidateId);
        requireValid(canonical(facts) === canonical(parsed.records));
        requireValid(this.db.prepare("PRAGMA foreign_key_check").all().length === 0);
        this.options.fault?.("validation");
        const summary = { documents: facts.documents.length, lines: facts.lines.length, suppliers: facts.suppliers.length, warnings: parsed.warnings };
        this.db.prepare("UPDATE datasets SET summary_json=? WHERE id=?").run(canonical(summary), candidateId);
        this.options.fault?.("summary");
        this.db.prepare("UPDATE import_batches SET state='validated' WHERE id=?").run(id);
      });
      return { status: "validated", id, datasetId };
    } catch (error) { return this.failure(id, datasetId, importErrorCode(error)); }
  }
  activate(id: string): ImportResult {
    let datasetId: string | null = null;
    try {
      return this.transaction(() => {
        const batch = this.db.prepare("SELECT dataset_id,state FROM import_batches WHERE id=?").get(id);
        if (!batch || batch.state !== "validated") return { status: "failed", code: "INVALID_CANDIDATE" };
        datasetId = String(batch.dataset_id);
        const before = this.currentPin();
        if (before.datasetId === datasetId) { this.db.prepare("UPDATE import_batches SET state='cancelled' WHERE id=?").run(id); return { status: "unchanged", datasetId }; }
        if (this.db.prepare("SELECT hash FROM package_history WHERE hash=? AND activated=1").get(datasetId)) { this.db.prepare("UPDATE import_batches SET state='cancelled' WHERE id=?").run(id); return { status: "historical", datasetId }; }
        const dataset = this.db.prepare("SELECT manifest_json,summary_json FROM datasets WHERE id=?").get(datasetId);
        requireValid(dataset);
        const records = this.facts(datasetId);
        const manifest = decode<Manifest>(dataset.manifest_json);
        for (const stream of ["documents", "lines", "suppliers"] as const) requireValid(records[stream].length === manifest.streams[stream].count && hash(records[stream]) === manifest.streams[stream].sha256);
        const old = before.datasetId ? this.facts(before.datasetId) : { documents: [], lines: [], suppliers: [] };
        const previousLineage = before.datasetId ? String(this.db.prepare("SELECT lineage FROM datasets WHERE id=?").get(before.datasetId)!.lineage) : null;
        const lineageChanged = previousLineage !== null && previousLineage !== manifest.lineage;
        const difference = { from: before.datasetId, to: datasetId, previousLineage, lineage: manifest.lineage, lineageChanged, appRevision: before.appRevision, streams: Object.fromEntries((["documents", "lines", "suppliers"] as const).map(stream => {
          const previous = new Map(old[stream].map(row => [row.id, canonical(row)]));
          const next = new Map(records[stream].map(row => [row.id, canonical(row)]));
          return [stream, { inserted: [...next.keys()].filter(key => lineageChanged || !previous.has(key)), deleted: [...previous.keys()].filter(key => lineageChanged || !next.has(key)), changed: [...next.keys()].filter(key => !lineageChanged && previous.has(key) && previous.get(key) !== next.get(key)) }];
        })) };
        if (before.datasetId) this.db.prepare("INSERT INTO rollback_dataset VALUES(1,?) ON CONFLICT(singleton) DO UPDATE SET dataset_id=excluded.dataset_id").run(before.datasetId);
        this.db.prepare("INSERT INTO active_dataset VALUES(1,?) ON CONFLICT(singleton) DO UPDATE SET dataset_id=excluded.dataset_id").run(datasetId);
        this.db.prepare("UPDATE package_history SET activated=1 WHERE hash=?").run(datasetId);
        this.db.prepare("UPDATE import_batches SET state='active',difference_json=? WHERE id=?").run(canonical(difference), id);
        this.db.prepare("INSERT INTO evidence_references(batch_id,identity) VALUES(?,?)").run(id, `package:${datasetId}`);
        this.options.fault?.("activation");
        return { status: "active", datasetId };
      });
    } catch (error) { return this.failure(id, datasetId, importErrorCode(error)); }
  }
  importPackage(bytes: Uint8Array): ImportResult { const staged = this.stage(bytes); return staged.status === "validated" ? this.activate(staged.id) : staged; }
  cancel(id: string): ImportResult {
    const result = this.db.prepare("UPDATE import_batches SET state='cancelled' WHERE id=? AND state IN ('staged','validated')").run(id);
    return result.changes ? { status: "cancelled" } : { status: "failed", code: "INVALID_CANDIDATE" };
  }
  history() {
    return this.db.prepare("SELECT id,dataset_id AS datasetId,state,error_code AS errorCode,difference_json FROM import_batches ORDER BY rowid").all().map(({ difference_json, ...row }) => ({ id: String(row.id), datasetId: row.datasetId === null ? null : String(row.datasetId), state: String(row.state), errorCode: row.errorCode === null ? null : String(row.errorCode), difference: difference_json === null ? null : decode(difference_json) }));
  }
  prune(): number {
    return this.transaction(() => Number(this.db.prepare(`DELETE FROM datasets WHERE id NOT IN (SELECT dataset_id FROM active_dataset)
      AND id NOT IN (SELECT dataset_id FROM rollback_dataset)
      AND id NOT IN (SELECT dataset_id FROM report_versions WHERE dataset_id IS NOT NULL)
      AND id NOT IN (SELECT dataset_id FROM adjustment_targets)
      AND id NOT IN (SELECT dataset_id FROM import_batches WHERE state IN ('staged','validated') AND dataset_id IS NOT NULL)`).run().changes));
  }
}

import {createSourceEstimateQuery,validEstimateRequest,type EstimateRequest} from "../source/estimate";
import {buildMonthProfit,validMonthProfitRequest,validMonthProfitExportRequest,type MonthProfitExportRequest,type MonthEstimateCache,type MonthProfitRequest,type MonthProfitResult} from "../source/month-profit";
import {querySource, validSourceQuery, type SourceQuery, type SourceWorkspaceResult} from "../source/workspace";
import { readRawPackage, validSourcePreviewRequest, type SourcePreviewRequest, type SourcePreviewResult } from "../source/raw-package";
import type { OperationControl } from "../reports/contracts";
import { relevantExpenseRevision } from "../expenses/adjustments";
import { isExpense, validFields, fieldKeys } from "../expenses/validation";
import type { CreateExpenseResult, ExpenseFields, ExpenseBatch, CorrectExpenseRequest, RestoreExpenseRequest, ConfirmExpenseCompletenessRequest, ExpenseValue } from "../expenses/contracts";
import { createHash, randomUUID } from "node:crypto";
import { backup, DatabaseSync } from "node:sqlite";
import { Exact } from "../domain/money";
import { canonical, readPackage, type Manifest, type Records } from "../source/package";
import { migrate } from "./migrations";
import type { Availability, ImportErrorCode, ImportHistoryEntry } from "../domain/contracts";
import { type AcceptedReport, type AppChange, type AppRecord, type Pin, type Target, requireValid, validId, validateChange } from "./revisions";

export type ImportCode = ImportErrorCode;
export type ImportResult = { status: "active" | "unchanged" | "historical"; datasetId: string } | { status: "failed"; code: ImportCode } | { status: "cancelled" };
export type StageResult = { status: "validated"; id: string; datasetId: string } | ImportResult;
export type FaultBoundary = "reading" | "persistence" | "validation" | "summary" | "activation" | "expense-row";
export type Snapshot = { importedAt: string | null; pin: Pin; metadata: Manifest | null; warnings: string[]; records: Records; app: AppRecord[]; expenseHistory: AppRecord[] };
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
  private estimateCache?: {json:string;hash:string;query:ReturnType<typeof createSourceEstimateQuery>};
  private monthCache?: {json:string;hash:string;pkg:NonNullable<ReturnType<typeof readRawPackage>>;months:MonthEstimateCache};
  private readonly salesEnabled: boolean;
  private readonly businessEnabled: boolean;
  constructor(private readonly db: DatabaseSync, private readonly options: Options) {
    this.businessEnabled = Number(db.prepare("PRAGMA user_version").get()!.user_version) >= 4;
    this.salesEnabled = Number(db.prepare("PRAGMA user_version").get()!.user_version) >= 3;
    if (options.maxPages !== undefined) {
      requireValid(Number.isSafeInteger(options.maxPages) && options.maxPages > 0);
      db.exec(`PRAGMA max_page_count=${options.maxPages}`);
    }
    db.prepare("UPDATE import_batches SET state='failed',error_code='INTERRUPTED' WHERE state IN ('staged','validated')").run();
  }
  close() { this.estimateCache=undefined;this.monthCache=undefined;this.db.close(); }
  backupTo(path: string, progress?: (info: {remainingPages: number; totalPages: number}) => void): Promise<number> { return backup(this.db, path, {progress}); }
  recoveryGeneration() {
    const row = this.db.prepare("SELECT changed,verified,last_verified_at FROM recovery_state WHERE singleton=1").get()!;
    return { changed: Number(row.changed), verified: Number(row.verified), lastVerifiedAt: row.last_verified_at as string | null };
  }
  markBackupVerified(generation: number, id: string, createdAt: string) {
    this.db.prepare("UPDATE recovery_state SET verified=MAX(verified,?),last_backup_id=?,last_verified_at=? WHERE singleton=1").run(generation,id,createdAt);
  }

  private lastImportError(): ImportCode | undefined {
    const batch = this.db.prepare("SELECT state,error_code FROM import_batches WHERE state IN ('failed','active') ORDER BY rowid DESC LIMIT 1").get();
    return batch?.state === "failed" ? batch.error_code as ImportCode : undefined;
  }
  importSourcePreview(bytes: Uint8Array, control: OperationControl = {}): {status: "preview-imported"; hash: string} | {status: "failed"; code: ImportCode} | {status: "cancelled"} {
    try {
      control.checkCancelled?.();
      const parsed = readRawPackage(bytes);
      if (!parsed) return {status: "failed", code: "INVALID_PACKAGE"};
      const value = canonical(parsed), digest = createHash("sha256").update(value).digest("hex");
      return this.transaction(() => {
        control.checkCancelled?.();
        this.db.prepare("INSERT INTO source_preview VALUES(1,?,?) ON CONFLICT(singleton) DO UPDATE SET package_json=excluded.package_json,hash=excluded.hash WHERE source_preview.hash != excluded.hash OR source_preview.package_json != excluded.package_json").run(value,digest);
        control.checkCancelled?.();
        this.estimateCache=undefined;this.monthCache=undefined;
        return {status: "preview-imported", hash: digest};
      });
    } catch (error) { return error instanceof Error && error.message === "CANCELLED" ? {status: "cancelled"} : {status: "failed", code: importErrorCode(error)}; }
  }
  querySourceWorkspace(request: SourceQuery): SourceWorkspaceResult {
    if (!validSourceQuery(request)) throw new Error("INVALID_PAYLOAD");
    const source=this.sourcePackage();
    if(!source)return {status:"source-empty"};
    return querySource(source.pkg,source.hash,request);
  }
  private sourcePackage() {
    const row=this.db.prepare("SELECT package_json,hash FROM source_preview WHERE singleton=1").get();
    if(!row)return null;
    const pkg=readRawPackage(Buffer.from(String(row.package_json)));
    if(!pkg||createHash("sha256").update(String(row.package_json)).digest("hex")!==row.hash)throw Error("INVALID_PACKAGE");
    return {pkg,hash:String(row.hash)};
  }
  querySourceEstimate(request:EstimateRequest) {
    if(!validEstimateRequest(request))throw Error("INVALID_PAYLOAD");
    const row=this.db.prepare("SELECT package_json,hash FROM source_preview WHERE singleton=1").get();
    if(!row){this.estimateCache=undefined;return {status:"source-unavailable",code:"ESTIMATE_UNAVAILABLE",message:"Tahmin kaynağı bulunamadı."} as const;}
    const json=String(row.package_json),hash=String(row.hash);
    if(this.estimateCache?.json!==json||this.estimateCache.hash!==hash){
      this.estimateCache=undefined;
      const pkg=readRawPackage(Buffer.from(json));
      if(!pkg||createHash("sha256").update(json).digest("hex")!==hash)throw Error("INVALID_PACKAGE");
      this.estimateCache={json,hash,query:createSourceEstimateQuery(pkg,hash)};
    }
    return this.estimateCache.query(request);
  }
  /** The month view for an export pinned to the viewed source hash; a different loaded source throws SOURCE_CHANGED. */
  readMonthProfitPinned(request:MonthProfitExportRequest):MonthProfitResult {
    if(!validMonthProfitExportRequest(request))throw Error("INVALID_PAYLOAD");
    const read=this.readMonthProfit({month:request.month});
    if(read.status==="month-profit"&&read.view.source.hash!==request.hash)throw Error("SOURCE_CHANGED");
    return read;
  }
  readMonthProfit(request:MonthProfitRequest):MonthProfitResult {
    if(!validMonthProfitRequest(request))throw Error("INVALID_PAYLOAD");
    return this.transaction(()=>{
      const row=this.db.prepare("SELECT package_json,hash FROM source_preview WHERE singleton=1").get();
      if(!row){this.monthCache=undefined;return {status:"source-unavailable",code:"ESTIMATE_UNAVAILABLE",message:"Tahmin kaynağı bulunamadı."};}
      const json=String(row.package_json),hash=String(row.hash);
      if(this.monthCache?.json!==json||this.monthCache.hash!==hash){
        this.monthCache=undefined;
        const pkg=readRawPackage(Buffer.from(json));
        if(!pkg||createHash("sha256").update(json).digest("hex")!==hash)throw Error("INVALID_PACKAGE");
        this.monthCache={json,hash,pkg,months:new Map()};
      }
      const source=this.monthCache;
      const app=this.db.prepare(`SELECT r.revision,r.kind,r.entity_id,r.value_json FROM app_revisions r WHERE r.kind IN ('expense','confirmation') AND NOT EXISTS
        (SELECT 1 FROM app_revisions newer WHERE newer.kind=r.kind AND newer.entity_id=r.entity_id AND newer.revision>r.revision) ORDER BY r.revision`).all().map(row=>({revision:Number(row.revision),kind:row.kind,entityId:String(row.entity_id),value:decode(row.value_json)}) as AppRecord);
      return buildMonthProfit(source.pkg,source.hash,request.month,{app,history:this.revisionHistory()},source.months);
    },true);
  }
  hasSourcePreview(): boolean {
    return !!this.db.prepare("SELECT 1 FROM source_preview WHERE singleton=1").get();
  }
  readSourcePreview(request: SourcePreviewRequest): SourcePreviewResult {
    if (!validSourcePreviewRequest(request)) throw new Error("INVALID_PAYLOAD");
    const row = this.db.prepare("SELECT package_json,hash FROM source_preview WHERE singleton=1").get();
    if (!row) return {status: "source-preview-empty"};
    const parsed = readRawPackage(Buffer.from(String(row.package_json)));
    if (!parsed || createHash("sha256").update(String(row.package_json)).digest("hex") !== row.hash) throw new Error("INVALID_PACKAGE");
    const {snapshot, ...rest} = parsed;
    const metadata = {schemaVersion: rest.schemaVersion, provenance: rest.provenance, sourceReconciled: rest.sourceReconciled, lineage: rest.lineage, extractionId: rest.extractionId};
    const {headers, lines, ...source} = snapshot; delete source.products;
    const referencedHeaders = new Set(lines.map(line => line.FIS));
    return {status: "source-preview", hash: String(row.hash), metadata: {...metadata, ...source}, counts: {headers: headers.length, lines: lines.length, emptyHeaders: headers.filter(header => !referencedHeaders.has(header.ID)).length}, stream: request.stream, offset: request.offset, total: snapshot[request.stream].length, rows: snapshot[request.stream].slice(request.offset,request.offset+50)};
  }
  availability(): Availability {
    const lastImportError = this.lastImportError();
    const recentImports = this.db.prepare(`SELECT b.id, b.created_at AS createdAt, b.state, b.error_code AS errorCode,
      json_extract(d.manifest_json,'$.cutoff') AS cutoff FROM import_batches b
      LEFT JOIN datasets d ON d.id=b.dataset_id ORDER BY b.rowid DESC LIMIT 10`).all() as ImportHistoryEntry[];
    const error = { ...(lastImportError ? { lastImportError } : {}), ...(recentImports.length ? { recentImports } : {}) };
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
  private withEvidence<T>(rows: Record<string, unknown>[]): T[] {
    return rows.map(({ sales_json, purchasing_json, business_json, ...row }) => ({ ...row, ...(sales_json ? { sales: decode(sales_json) } : {}), ...(purchasing_json ? { purchasing: decode(purchasing_json) } : {}), ...(business_json ? { business: decode(business_json) } : {}) })) as T[];
  }
  private facts(datasetId: string): Records {
    return {
      documents: this.withEvidence<Records["documents"][number]>(this.db.prepare(`SELECT id,kind,date,supplier_id AS supplierId${this.salesEnabled ? ",sales_json" : ""}${this.businessEnabled ? ",purchasing_json" : ""} FROM source_documents WHERE dataset_id=? ORDER BY ordinal`).all(datasetId)),
      lines: this.withEvidence<Records["lines"][number]>(this.db.prepare(`SELECT id,document_id AS documentId,quantity,net,cost${this.salesEnabled ? ",sales_json" : ""}${this.businessEnabled ? ",business_json" : ""} FROM source_lines WHERE dataset_id=? ORDER BY ordinal`).all(datasetId)),
      suppliers: this.db.prepare(`SELECT id${this.businessEnabled ? ",name" : ""} FROM source_suppliers WHERE dataset_id=? ORDER BY ordinal`).all(datasetId).map(({ name, ...row }) => ({ ...row, ...(name !== null && name !== undefined ? { name } : {}) })) as Records["suppliers"],
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
    if (this.businessEnabled && document) {
      const p = this.db.prepare("SELECT purchasing_json FROM source_documents WHERE dataset_id=? AND id=?").get(datasetId, String(document.id));
      if (p?.purchasing_json) document.purchasing = String(p.purchasing_json);
      if (line) { const b = this.db.prepare("SELECT business_json FROM source_lines WHERE dataset_id=? AND id=?").get(datasetId, String(line.id)); if (b?.business_json) line.business = String(b.business_json); }
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
    return { importedAt: pin.datasetId ? (this.db.prepare("SELECT created_at FROM import_batches WHERE dataset_id=? AND state='active' ORDER BY rowid LIMIT 1").get(pin.datasetId)?.created_at as string | undefined ?? null) : null, pin: { ...pin }, metadata: dataset ? decode<Manifest>(dataset.manifest_json) : null, warnings: dataset ? decode<string[]>(dataset.warnings_json) : [], records: pin.datasetId === null ? { documents: [], lines: [], suppliers: [] } : this.facts(pin.datasetId), app, expenseHistory: this.revisionHistory(pin.appRevision) };
  }
  readPin(): Pin { return this.transaction(() => this.currentPin(), true); }
  activeManifest(): { datasetId: string; metadata: Manifest } | null {
    const row = this.db.prepare("SELECT d.id,d.manifest_json FROM active_dataset a JOIN datasets d ON d.id=a.dataset_id").get();
    return row ? { datasetId: String(row.id), metadata: decode<Manifest>(row.manifest_json) } : null;
  }
  readSnapshot(): Snapshot { return this.transaction(() => this.snapshot(this.currentPin()), true); }
  readPinned(pin: Pin): Snapshot { return this.transaction(() => this.snapshot(pin), true); }
  appendRevision(change: AppChange): number {
    return this.transaction(() => this.insertRevision(change));
  }
  private insertRevision(change: AppChange): number {
      validateChange(change);
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
  }
  revisionHistory(through = this.currentPin().appRevision): AppRecord[] {
    return this.db.prepare("SELECT revision,kind,entity_id,value_json FROM app_revisions WHERE kind='expense' AND revision<=? ORDER BY revision").all(through).map(row => ({ revision: Number(row.revision), kind: "expense", entityId: String(row.entity_id), value: decode(row.value_json) } as AppRecord));
  }
  expenseBatches(): ExpenseBatch[] {
    return this.db.prepare("SELECT batch_id,created_at,count,first_revision,last_revision FROM expense_batches ORDER BY rowid").all().map(row => ({ batchId: String(row.batch_id), createdAt: String(row.created_at), count: Number(row.count), firstRevision: Number(row.first_revision), lastRevision: Number(row.last_revision) }));
  }
  importExpenses(batchId: string, expectedRevision: number, changes: AppChange[]): boolean {
    return this.transaction(() => {
      requireValid(validId(batchId) && changes.every(change => change.kind === "expense" && isExpense(change.value)));
      if (this.db.prepare("SELECT batch_id FROM expense_batches WHERE batch_id=?").get(batchId)) return false;
      requireValid(this.currentPin().appRevision === expectedRevision);
      const first = expectedRevision + 1;
      for (const change of changes) {
        requireValid(!this.db.prepare("SELECT revision FROM app_revisions WHERE kind='expense' AND entity_id=?").get(change.entityId));
        this.insertRevision(change); this.options.fault?.("expense-row");
      }
      this.db.prepare("INSERT INTO expense_batches VALUES(?,?,?,?,?)").run(batchId, new Date().toISOString(), changes.length, changes.length ? first : expectedRevision, this.currentPin().appRevision);
      return true;
    });
  }
  resolveExpenseCommand(requestId: string): CreateExpenseResult {
    const receipt = this.db.prepare("SELECT entity_id,revision FROM expense_commands WHERE request_id=?").get(requestId);
    if (!receipt) return { status: "not-saved" };
    const original = this.db.prepare("SELECT value_json FROM app_revisions WHERE revision=?").get(receipt.revision)!;
    const value = decode<ExpenseValue>(original.value_json);
    return { status: "already-saved", entityId: String(receipt.entity_id), revision: Number(receipt.revision), incurredPeriod: value.date.slice(0, 7), paymentPeriod: value.paymentDate?.slice(0, 7) ?? null };
  }
  createExpenseCommand(requestId: string, fields: ExpenseFields, duplicateReview: {fingerprint: string; keepSeparate: true} | null): CreateExpenseResult {
    return this.transaction(() => {
      const digest = hash(fields), receipt = this.db.prepare("SELECT digest FROM expense_commands WHERE request_id=?").get(requestId);
      if (receipt) { requireValid(receipt.digest === digest); return this.resolveExpenseCommand(requestId); }
      const current = this.snapshot(this.currentPin()).app.filter(row => row.kind === "expense" && isExpense(row.value));
      const entityId = fields.sourceReference ? `expense-ref:${createHash("sha256").update(fields.sourceReference).digest("hex")}` : `expense-manual:${createHash("sha256").update(requestId).digest("hex")}`;
      const existing = current.find(row => row.entityId === entityId);
      const equalFields = (value: ExpenseValue) => hash(Object.fromEntries(fieldKeys.map(key => [key, value[key as keyof ExpenseValue]]))) === digest;
      if (existing && existing.kind === "expense" && isExpense(existing.value)) {
        if (existing.value.voided || !equalFields(existing.value)) return { status: "reference-conflict", entityId };
        this.db.prepare("INSERT INTO expense_commands VALUES(?,?,?,?,?)").run(requestId, digest, entityId, existing.revision, "identified");
        return { status: "already-present", entityId, revision: existing.revision, incurredPeriod: fields.date.slice(0, 7), paymentPeriod: fields.paymentDate?.slice(0, 7) ?? null };
      }
      const active = current.filter(row => row.kind === "expense" && isExpense(row.value) && !row.value.voided);
      if (fields.loss && active.some(row => row.kind === "expense" && isExpense(row.value) && row.value.loss?.evidence === fields.loss!.evidence)) return { status: "invalid", fieldErrors: { loss: "Kayıp kanıtı başka bir kayıtta kullanılmış." } };
      const matches = active.filter(row => row.kind === "expense" && isExpense(row.value) && row.value.date === fields.date && new Exact(row.value.gross).eq(fields.gross)).toSorted((a, b) => a.entityId.localeCompare(b.entityId));
      const fingerprint = hash({ fields, matches: matches.map(row => ({ entityId: row.entityId, revision: row.revision })) });
      if ((matches.length || duplicateReview) && duplicateReview?.fingerprint !== fingerprint) return { status: "duplicate-review", fingerprint, totalCount: matches.length, candidates: matches.slice(0, 5).map(row => ({ entityId: row.entityId, revision: row.revision, date: isExpense(row.value) ? row.value.date : "", category: isExpense(row.value) ? row.value.category : "", gross: isExpense(row.value) ? row.value.gross : "" })) };
      const value: ExpenseValue = { ...fields, format: "expense-v1", origin: { kind: "manual", requestId }, reason: "Elle kayıt oluşturuldu", evidence: requestId, replacesRevision: null, voided: false };
      const revision = this.insertRevision({ kind: "expense", entityId, value });
      this.options.fault?.("expense-row");
      this.db.prepare("INSERT INTO expense_commands VALUES(?,?,?,?,?)").run(requestId, digest, entityId, revision, "created");
      return { status: "saved", entityId, revision, incurredPeriod: fields.date.slice(0, 7), paymentPeriod: fields.paymentDate?.slice(0, 7) ?? null };
    });
  }
  changeExpense(request: CorrectExpenseRequest | RestoreExpenseRequest): number {
    return this.transaction(() => {
      const history = this.revisionHistory().filter(row => row.entityId === request.entityId);
      const latest = history.at(-1);
      requireValid(latest?.kind === "expense" && isExpense(latest.value) && latest.revision === request.expectedRevision);
      let replacement: ExpenseValue;
      if ("replacement" in request) {
        requireValid(validFields(request.replacement));
        requireValid(request.replacement.sourceReference === latest.value.sourceReference);
        replacement = { ...latest.value, ...request.replacement, voided: false };
      } else if (request.restoreRevision === null) replacement = { ...latest.value, voided: true };
      else {
        const previous = history.find(row => row.revision === request.restoreRevision);
        requireValid(previous?.kind === "expense" && isExpense(previous.value));
        const previousValue = previous.value;
        replacement = { ...latest.value, ...Object.fromEntries(fieldKeys.map(key => [key, previousValue[key as keyof ExpenseValue]])), voided: previousValue.voided };
      }
      if (!replacement.voided && replacement.loss) {
        const current = this.snapshot(this.currentPin()).app;
        requireValid(!current.some(row => row.kind === "expense" && row.entityId !== request.entityId && isExpense(row.value) && !row.value.voided && row.value.loss?.evidence === replacement.loss!.evidence));
      }
      return this.insertRevision({ kind: "expense", entityId: request.entityId, value: { ...replacement, reason: request.reason, replacesRevision: latest.revision } });
    });
  }
  confirmExpensesComplete(request: ConfirmExpenseCompletenessRequest): number {
    return this.transaction(() => {
      requireValid(relevantExpenseRevision(this.revisionHistory(), request.period) === request.reviewedRevision);
      return this.insertRevision({ kind: "confirmation", entityId: `expense-complete:${request.period}`, value: { ...request, evidence: "owner-review" } });
    });
  }
  acceptReport(report: AcceptedReport) {
    requireValid(report && validId(report.id) && validId(report.calculationVersion) && Array.isArray(report.evidence) && report.evidence.length > 0 && report.evidence.length <= 100 && report.evidence.every(validId));
    requireValid(report.output && typeof report.output === "object" && !Array.isArray(report.output));
    if (Buffer.byteLength(canonical(report)) > 256 * 1024 * 1024) throw new Error("REPORT_TOO_LARGE");
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
  stage(bytes: Uint8Array, control: OperationControl = {}): StageResult {
    const id = randomUUID(); let datasetId: string | null = null;
    try {
      this.db.prepare("INSERT INTO import_batches(id,state,created_at) VALUES(?,'staged',?)").run(id, new Date().toISOString());
      control.checkCancelled?.(); control.onProgress?.("reading", 0, 1);
      this.options.fault?.("reading");
      const parsed = readPackage(bytes);
      if (!parsed.ok) return this.failure(id, null, parsed.code);
      control.checkCancelled?.();
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
          let completed = 0; const total = parsed.records.suppliers.length + parsed.records.documents.length + parsed.records.lines.length;
          const progress = () => { control.checkCancelled?.(); completed++; if (completed === 1 || completed === total || completed % 256 === 0) control.onProgress?.("persistence", completed, total); };
          const supplier = this.db.prepare(`INSERT INTO source_suppliers VALUES(?,?,?${this.businessEnabled ? ",?" : ""})`);
          for (const [ordinal, row] of parsed.records.suppliers.entries()) { progress(); supplier.run(candidateId, row.id, ordinal, ...(this.businessEnabled ? [row.name ?? null] : [])); }
          const document = this.db.prepare(`INSERT INTO source_documents VALUES(?,?,?,?,?,?${this.salesEnabled ? ",?" : ""}${this.businessEnabled ? ",?" : ""})`);
          for (const [ordinal, row] of parsed.records.documents.entries()) { progress(); document.run(candidateId, row.id, row.kind, row.date, row.supplierId, ordinal, ...(this.salesEnabled ? [row.sales ? canonical(row.sales) : null] : []), ...(this.businessEnabled ? [row.purchasing === undefined ? null : canonical(row.purchasing)] : [])); }
          const line = this.db.prepare(`INSERT INTO source_lines VALUES(?,?,?,?,?,?,?${this.salesEnabled ? ",?" : ""}${this.businessEnabled ? ",?" : ""})`);
          for (const [ordinal, row] of parsed.records.lines.entries()) { progress(); line.run(candidateId, row.id, row.documentId, row.quantity, row.net, row.cost, ordinal, ...(this.salesEnabled ? [row.sales ? canonical(row.sales) : null] : []), ...(this.businessEnabled ? [row.business ? canonical(row.business) : null] : [])); }
        }
        control.checkCancelled?.();
        this.options.fault?.("persistence");
        const facts = this.facts(candidateId);
        requireValid(canonical(facts) === canonical(parsed.records));
        requireValid(this.db.prepare("PRAGMA foreign_key_check").all().length === 0);
        this.options.fault?.("validation");
        const summary = { documents: facts.documents.length, lines: facts.lines.length, suppliers: facts.suppliers.length, warnings: parsed.warnings };
        this.db.prepare("UPDATE datasets SET summary_json=? WHERE id=?").run(canonical(summary), candidateId);
        this.options.fault?.("summary");
        control.checkCancelled?.();
        this.db.prepare("UPDATE import_batches SET state='validated' WHERE id=?").run(id);
      });
      return { status: "validated", id, datasetId };
    } catch (error) { if (error instanceof Error && error.message === "CANCELLED") return this.cancel(id); return this.failure(id, datasetId, importErrorCode(error)); }
  }
  activate(id: string, control: OperationControl = {}): ImportResult {
    let datasetId: string | null = null;
    try {
      return this.transaction(() => {
        control.checkCancelled?.(); control.onProgress?.("activation", 0, 1);
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
        control.checkCancelled?.();
        if (before.datasetId) this.db.prepare("INSERT INTO rollback_dataset VALUES(1,?) ON CONFLICT(singleton) DO UPDATE SET dataset_id=excluded.dataset_id").run(before.datasetId);
        this.db.prepare("INSERT INTO active_dataset VALUES(1,?) ON CONFLICT(singleton) DO UPDATE SET dataset_id=excluded.dataset_id").run(datasetId);
        this.db.prepare("UPDATE package_history SET activated=1 WHERE hash=?").run(datasetId);
        this.db.prepare("UPDATE import_batches SET state='active',difference_json=? WHERE id=?").run(canonical(difference), id);
        this.db.prepare("INSERT INTO evidence_references(batch_id,identity) VALUES(?,?)").run(id, `package:${datasetId}`);
        this.options.fault?.("activation");
        control.checkCancelled?.();
        return { status: "active", datasetId };
      });
    } catch (error) { if (error instanceof Error && error.message === "CANCELLED") return this.cancel(id); return this.failure(id, datasetId, importErrorCode(error)); }
  }
  importPackage(bytes: Uint8Array, control: OperationControl = {}): ImportResult { const staged = this.stage(bytes, control); return staged.status === "validated" ? this.activate(staged.id, control) : staged; }
  cancel(id: string): ImportResult {
    const result = this.db.prepare("UPDATE import_batches SET state='cancelled' WHERE id=? AND state IN ('staged','validated')").run(id);
    return result.changes ? { status: "cancelled" } : { status: "failed", code: "INVALID_CANDIDATE" };
  }
  history() {
    return this.db.prepare("SELECT id,dataset_id AS datasetId,state,error_code AS errorCode,difference_json FROM import_batches ORDER BY rowid").all().map(({ difference_json, ...row }) => ({ id: String(row.id), datasetId: row.datasetId === null ? null : String(row.datasetId), state: String(row.state), errorCode: row.errorCode === null ? null : String(row.errorCode), difference: difference_json === null ? null : decode(difference_json) }));
  }
  prune(protectedDatasetIds: string[] = []): number {
    return this.transaction(() => Number(this.db.prepare(`DELETE FROM datasets WHERE id NOT IN (SELECT value FROM json_each(?)) AND id NOT IN (SELECT dataset_id FROM active_dataset)
      AND id NOT IN (SELECT dataset_id FROM rollback_dataset)
      AND id NOT IN (SELECT dataset_id FROM report_versions WHERE dataset_id IS NOT NULL)
      AND id NOT IN (SELECT dataset_id FROM adjustment_targets)
      AND id NOT IN (SELECT dataset_id FROM import_batches WHERE state IN ('staged','validated') AND dataset_id IS NOT NULL)`).run(JSON.stringify(protectedDatasetIds)).changes));
  }
}

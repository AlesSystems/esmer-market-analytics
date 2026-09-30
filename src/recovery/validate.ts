import { readRawPackage } from "../source/raw-package";
import { createHash } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { migrate } from "../store/migrations";
import { APPLICATION_ID, SCHEMA_VERSION } from "../store/schema";
import { canonical, readPackage, type Records } from "../source/package";
import { requireValid, validateChange, validId, type AcceptedReport, type AppChange } from "../store/revisions";
import type { MonthlyReport } from "../reports/contracts";
import { Exact, sum } from "../domain/money";
import type { ProductProfit } from "../analytics/product-profit";
const decode = <T>(value: unknown): T => JSON.parse(String(value)) as T;
export type SnapshotSummary = {generation:number;cutoff:string|null;revisions:number;reports:number};
const decimal = (value: unknown): value is string => typeof value === "string" && /^-?(?:0|[1-9]\d*)(?:\.\d+)?$/.test(value);
function validateProductProfit(profit: ProductProfit, monthly: MonthlyReport, source: Records) {
  requireValid(profit && profit.version === "monthly-product-profit-v1" && profit.lineage === monthly.purchasing.lineage && profit.period === monthly.context.period);
  requireValid(profit.summary && ["ready","empty","unavailable"].includes(profit.summary.status) && ["market","covered"].includes(profit.summary.scope) && Array.isArray(profit.summary.warnings) && profit.summary.warnings.every(row=>typeof row === "string"));
  requireValid(profit.summary.salesCoverage && typeof profit.summary.salesCoverage.complete === "boolean" && Number.isSafeInteger(profit.summary.salesCoverage.unresolvedCount) && (profit.summary.salesCoverage.exposure === null || decimal(profit.summary.salesCoverage.exposure)));
  requireValid(profit.summary.periodCoverage && /^\d{4}-\d{2}-\d{2}$/.test(profit.summary.periodCoverage.from) && /^\d{4}-\d{2}-\d{2}$/.test(profit.summary.periodCoverage.to) && typeof profit.summary.periodCoverage.complete === "boolean");
  requireValid(Array.isArray(profit.products) && Array.isArray(profit.daily) && Array.isArray(profit.lines) && Array.isArray(profit.sourceExclusions));
  const values = [profit.summary,...profit.products,...profit.daily];
  for (const row of values) {
    for (const key of ["netSales","coveredSales","coveredCost","coveredGrossProfit","coveredMarginPercent","costCoveragePercent"] as const) requireValid(row[key] === null || decimal(row[key]));
    requireValid(Number.isSafeInteger(row.coveredCount) && row.coveredCount >= 0 && Number.isSafeInteger(row.excludedCount) && row.excludedCount >= 0 && Array.isArray(row.exclusionReasons) && row.exclusionReasons.every(reason => typeof reason === "string"));
    requireValid(Array.isArray(row.quantities) && row.quantities.every(q => ["piece","kg"].includes(q.unit) && decimal(q.sold) && decimal(q.returned) && decimal(q.net)) && new Set(row.quantities.map(q=>q.unit)).size === row.quantities.length);
    requireValid(row.exposures && Object.keys(row.exposures).sort().join() === "coveredReturns,coveredSales,excludedReturns,excludedSales" && Object.values(row.exposures).every(decimal));
  }
  const ids = new Set<string>();
  for (const row of profit.products) { requireValid(validId(row.productId) && !ids.has(row.productId) && typeof row.displayName === "string" && row.displayName.length > 0 && ["approved","fallback"].includes(row.displayStatus)); ids.add(row.productId); }
  const days = new Set<string>(), count = new Date(Date.UTC(Number(profit.period.slice(0,4)),Number(profit.period.slice(5,7)),0)).getUTCDate();
  requireValid(profit.daily.length === count);
  for (const row of profit.daily) { requireValid(/^\d{4}-\d{2}-\d{2}$/.test(row.date) && row.date.startsWith(`${profit.period}-`) && Number(row.date.slice(8)) >= 1 && Number(row.date.slice(8)) <= count && !days.has(row.date) && ["ready","empty","unavailable"].includes(row.status) && ["complete","partial","unavailable"].includes(row.sourceCoverage) && (row.trend === null || decimal(row.trend))); days.add(row.date); }
  const sourceLines = new Map(source.lines.map(row=>[row.id,row]));
  const sourceDocuments = new Map(source.documents.map(row=>[row.id,row]));
  const components = new Map(monthly.salesEvidence.components.map(row=>[row.lineId,row]));
  const lineIds = new Set<string>();
  for (const line of profit.lines) {
    const pinned = sourceLines.get(line.lineId);
    const {cost,historicalUnitCost,originalSaleLineId,costReason,costEvidence,...component} = line;
    requireValid(validId(line.lineId) && !lineIds.has(line.lineId) && pinned && pinned.documentId === line.documentId && line.productId === pinned.sales?.productId && line.unit === pinned.sales?.unit && line.date === sourceDocuments.get(line.documentId)?.date && line.kind === sourceDocuments.get(line.documentId)?.kind && canonical(component) === canonical(components.get(line.lineId)) && decimal(line.quantity) && decimal(line.net) && (cost === null || decimal(cost)) && (historicalUnitCost === null || decimal(historicalUnitCost)) && historicalUnitCost === (pinned.business?.historicalCost?.unitCost ?? null) && originalSaleLineId === (pinned.business?.historicalCost?.originalSaleLineId ?? null) && costEvidence === (pinned.business?.historicalCost?.evidence ?? null) && (costReason === null || ["MISSING_COST","UNVALIDATED_COST","UNKNOWN_UNIT","UNKNOWN_TAX","NEGATIVE_COST","UNDOCUMENTED_ZERO","RETURN_ATTRIBUTION","UNSUPPORTED_COST_MAPPING"].includes(costReason)) && (costReason !== null || cost !== null));
    lineIds.add(line.lineId);
  }
  requireValid(lineIds.size === monthly.salesEvidence.components.length && monthly.salesEvidence.components.every(row=>lineIds.has(row.lineId)));
  for (const row of profit.sourceExclusions) requireValid(validId(row.documentId) && /^\d{4}-\d{2}-\d{2}$/.test(row.date) && row.exposure === null && sourceDocuments.get(row.documentId)?.date===row.date);
  for (const key of ["netSales","coveredSales","coveredCost","coveredGrossProfit"] as const) {
    const target=profit.summary[key];
    if (target !== null) requireValid(new Exact(sum(profit.products.map(row=>row[key] ?? "0"))).eq(target) && new Exact(sum(profit.daily.map(row=>row[key] ?? "0"))).eq(target));
  }
}
function validateDatabase(db: DatabaseSync): SnapshotSummary {
  const version=Number(db.prepare("PRAGMA user_version").get()!.user_version);
  if (version < 1 || version > SCHEMA_VERSION || db.prepare("PRAGMA application_id").get()!.application_id !== APPLICATION_ID) throw new Error("UNSUPPORTED_STORE");
  const expected=new DatabaseSync(":memory:");
  try {
    migrate(expected,version);
    const objects="SELECT type,name,tbl_name,sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' ORDER BY type,name";
    requireValid(canonical(db.prepare(objects).all()) === canonical(expected.prepare(objects).all()));
  } finally { expected.close(); }
  requireValid(db.prepare("PRAGMA integrity_check").all().every(row => row.integrity_check === "ok") && !db.prepare("PRAGMA foreign_key_check").all().length);
  if (version >= 7) for (const row of db.prepare("SELECT package_json,hash FROM source_preview").all()) {
    const bytes = Buffer.from(String(row.package_json));
    requireValid(readRawPackage(bytes) && createHash("sha256").update(bytes).digest("hex") === row.hash);
  }
  const revisions=db.prepare("SELECT revision,kind,entity_id,value_json FROM app_revisions ORDER BY revision").all();
  for (const row of revisions) validateChange({kind:row.kind,entityId:row.entity_id,value:decode(row.value_json)} as AppChange);
  const facts=new Map<string,Records>();
  for (const dataset of db.prepare("SELECT id,lineage,manifest_json,warnings_json,summary_json FROM datasets").all()) {
    const expand=(rows:Record<string,unknown>[]) => rows.map(({sales_json,purchasing_json,business_json,...row}) => ({...row,...(sales_json ? {sales:decode(sales_json)}:{}),...(purchasing_json ? {purchasing:decode(purchasing_json)}:{}),...(business_json ? {business:decode(business_json)}:{})}));
    const records = {
      documents:expand(db.prepare(`SELECT id,kind,date,supplier_id AS supplierId${version>=3?",sales_json":""}${version>=4?",purchasing_json":""} FROM source_documents WHERE dataset_id=? ORDER BY ordinal`).all(String(dataset.id))),
      lines:expand(db.prepare(`SELECT id,document_id AS documentId,quantity,net,cost${version>=3?",sales_json":""}${version>=4?",business_json":""} FROM source_lines WHERE dataset_id=? ORDER BY ordinal`).all(String(dataset.id))),
      suppliers:db.prepare(`SELECT id${version>=4?",name":""} FROM source_suppliers WHERE dataset_id=? ORDER BY ordinal`).all(String(dataset.id)).map(({name,...row})=>({...row,...(name!=null?{name}:{})})),
    } as Records;
    facts.set(String(dataset.id),records);
    const bytes=Buffer.from(canonical({manifest:decode(dataset.manifest_json),payload:records}));
    const parsed=readPackage(bytes);
    requireValid(parsed.ok && createHash("sha256").update(bytes).digest("hex")===dataset.id);
    requireValid(parsed.metadata.lineage===dataset.lineage && canonical(parsed.warnings)===canonical(decode(dataset.warnings_json)));
    requireValid(canonical(decode(dataset.summary_json))===canonical({documents:records.documents.length,lines:records.lines.length,suppliers:records.suppliers.length,warnings:parsed.warnings}));
  }
  const reports=db.prepare("SELECT * FROM report_versions").all();
  for (const row of reports) {
    const report=decode<AcceptedReport>(row.content_json);
    requireValid(report && validId(report.id) && report.id===row.id && validId(report.calculationVersion) && report.calculationVersion===row.calculation_version && report.pin && report.pin.datasetId===row.dataset_id && report.pin.appRevision===Number(row.app_revision??0) && report.output && typeof report.output==="object" && !Array.isArray(report.output));
    requireValid(Array.isArray(report.evidence) && report.evidence.length>0 && report.evidence.length<=100 && report.evidence.every(validId));
    const evidence=db.prepare("SELECT identity FROM evidence_references WHERE report_id=? ORDER BY id").all(report.id).map(x=>x.identity);
    requireValid(canonical(evidence)===canonical(report.evidence));
    if (report.output.report && typeof report.output.report==="object" && "format" in report.output.report && ["monthly-report-v1","monthly-report-v2"].includes(String(report.output.report.format))) {
      const monthly=report.output.report as MonthlyReport;
      requireValid(monthly.id===report.id && monthly.context?.datasetId===report.pin.datasetId && monthly.context?.appRevision===report.pin.appRevision && typeof monthly.calculations?.report==="string" && monthly.rules && report.evidence.includes(monthly.rules.artifact));
      requireValid(monthly.review && typeof monthly.review.acceptedAt==="string" && typeof monthly.review.reason==="string" && monthly.sales && monthly.purchasing && monthly.operating && Array.isArray(monthly.appEvidence) && Array.isArray(monthly.salesEvidence?.documents) && Array.isArray(monthly.salesEvidence?.lines));
      const source=facts.get(report.pin.datasetId!);
      requireValid(source && canonical(monthly.salesEvidence.documents)===canonical(source.documents) && canonical(monthly.salesEvidence.lines)===canonical(source.lines));
      if (monthly.format === "monthly-report-v2") validateProductProfit(monthly.productProfit,monthly,source!);
      for (const evidence of monthly.appEvidence) {
        const revision=revisions.find(row=>row.revision===evidence.revision);
        requireValid(revision && Number(revision.revision)<=report.pin.appRevision && revision.kind===evidence.kind && revision.entity_id===evidence.entityId && canonical(decode(revision.value_json))===canonical(evidence.value));
      }
    } else if (report.output.report && typeof report.output.report === "object" && "format" in report.output.report && String(report.output.report.format).startsWith("monthly-report-")) requireValid(false);
  }
  const active=db.prepare("SELECT manifest_json FROM datasets WHERE id=(SELECT dataset_id FROM active_dataset)").get();
  const generation=version>=6 ? Number(db.prepare("SELECT changed FROM recovery_state WHERE singleton=1").get()?.changed):0;
  requireValid(Number.isSafeInteger(generation)&&generation>=0);
  return {generation,cutoff:active ? decode<{cutoff:string}>(active.manifest_json).cutoff:null,revisions:revisions.length,reports:reports.length};
}
export function validateSnapshot(path: string, upgrade=false, beforeMigration?:()=>void): SnapshotSummary {
  const db=new DatabaseSync(path,{readOnly:!upgrade});
  try {
    db.exec("PRAGMA trusted_schema=OFF");
    const before=validateDatabase(db);
    if (upgrade) { if (Number(db.prepare("PRAGMA user_version").get()!.user_version)<SCHEMA_VERSION) beforeMigration?.(); migrate(db); return {...validateDatabase(db),generation:before.generation}; }
    return before;
  } finally { db.close(); }
}

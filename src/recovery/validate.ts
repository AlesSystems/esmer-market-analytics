import { createHash } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { migrate } from "../store/migrations";
import { APPLICATION_ID, SCHEMA_VERSION } from "../store/schema";
import { canonical, readPackage, type Records } from "../source/package";
import { requireValid, validateChange, validId, type AcceptedReport, type AppChange } from "../store/revisions";
import type { MonthlyReport } from "../reports/contracts";
const decode = <T>(value: unknown): T => JSON.parse(String(value)) as T;
export type SnapshotSummary = {generation:number;cutoff:string|null;revisions:number;reports:number};
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
    if (report.output.report && typeof report.output.report==="object" && "format" in report.output.report && report.output.report.format==="monthly-report-v1") {
      const monthly=report.output.report as MonthlyReport;
      requireValid(monthly.id===report.id && monthly.context?.datasetId===report.pin.datasetId && monthly.context?.appRevision===report.pin.appRevision && typeof monthly.calculations?.report==="string" && monthly.rules && report.evidence.includes(monthly.rules.artifact));
      requireValid(monthly.review && typeof monthly.review.acceptedAt==="string" && typeof monthly.review.reason==="string" && monthly.sales && monthly.purchasing && monthly.operating && Array.isArray(monthly.appEvidence) && Array.isArray(monthly.salesEvidence?.documents) && Array.isArray(monthly.salesEvidence?.lines));
      const source=facts.get(report.pin.datasetId!);
      requireValid(source && canonical(monthly.salesEvidence.documents)===canonical(source.documents) && canonical(monthly.salesEvidence.lines)===canonical(source.lines));
      for (const evidence of monthly.appEvidence) {
        const revision=revisions.find(row=>row.revision===evidence.revision);
        requireValid(revision && Number(revision.revision)<=report.pin.appRevision && revision.kind===evidence.kind && revision.entity_id===evidence.entityId && canonical(decode(revision.value_json))===canonical(evidence.value));
      }
    }
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

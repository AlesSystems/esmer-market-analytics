import {validEstimateRequest} from "../source/estimate";
import {excelSourceEstimate} from "../source/estimate-export";
import {validSourceQuery} from "../source/workspace";
import { readPackage } from "../source/package";
import { readRawPackage, validSourcePreviewRequest } from "../source/raw-package";
import { readFileSync, openSync, writeFileSync, fsyncSync, closeSync, renameSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { LiveSynchronizer, liveFingerprint, liveIdentity } from "../source/live";
import { parseSqlServerConfig, type SqlServerConfig } from "../source/sql-server";
import { prepareSqlCandidate } from "../source/sql-package";
import type { LiveStatus } from "../source/live-contracts";
import type { LiveResult } from "../domain/contracts";
import { liveOperations, validLiveRequest } from "../desktop/requests";
import { Recovery } from "../recovery/backup";
import { recoveryFailure, recoveryOperations, type RecoveryServiceRequest } from "../recovery/contracts";
import { ReportVersions } from "../reports/versions";
import { displayResult } from "../reports/display";
import { excelReport } from "../reports/export";
import type { OperationControl } from "../reports/contracts";
import { Expenses } from "../expenses/import";
import { monthlyOperations, validMonthlyRequest, validReportRequest, validExpenseRequest } from "../desktop/requests";
import { parentPort, workerData } from "node:worker_threads";
import type { ServiceRequest, ServiceResponse } from "../domain/contracts";
import { importErrorCode, type openStore } from "../store/store";
import { importOutcome } from "./operations";
import { SalesReports } from "../reports/query";
const reportErrors = {
  REPORT_NOT_FOUND: "Seçili rapor artık mevcut değil. Aylık özeti yeniden açın veya kayıtlı bir sürüm seçin.",
  PRODUCT_PROFIT_UNAVAILABLE: "Bu rapor sürümünde ürün kârlılığı ayrıntısı yok.",
  INCOMPARABLE_REPORTS: "Bu raporların dönemi, kapsamı veya kaynak kökeni farklı. Aynı kapsamdaki bir kayıt seçin.",
  REVIEW_CONFLICT: "Bu rapor farklı bir inceleme bilgisiyle kaydedilmiş. Kayıt geçmişini yenileyin.",
  REPORT_TOO_LARGE: "Rapor saklama boyutu sınırını aşıyor. Mevcut kayıtlar korundu; daha küçük bir veri paketiyle yeniden deneyin.",
  INVALID_REVIEW: "İnceleme gerekçesi geçerli değil. Gerekçeyi kontrol edip yeniden deneyin.",
  EXCEL_ROW_LIMIT: "Seçili rapor Excel satır sınırını aşıyor. Daha küçük bir veri paketiyle yeniden deneyin.",
  EXCEL_COLUMN_LIMIT: "Seçili rapor Excel sütun sınırını aşıyor. Mevcut rapor korundu.",
  EXCEL_CELL_LIMIT: "Seçili rapordaki bir kanıt Excel hücre sınırını aşıyor. Mevcut rapor korundu.",
};
let reports: SalesReports | undefined;
let store: ReturnType<typeof openStore> | undefined;
let recovery: Recovery | undefined;
let versions: ReportVersions | undefined;
let expenses: Expenses | undefined;
let live: LiveSynchronizer | undefined;
let liveConfig: SqlServerConfig | undefined;
let liveChanging = false;
function liveResult(): LiveResult {
  const available = store?.availability();
  return {status: "live", configured: !!liveConfig, live: live?.status() ?? {phase: "disabled", error: null, lastAttemptAt: null, lastSuccessAt: null, lastDatasetId: null, lastRecord: "none", persistenceError: false}, cutoff: available?.status === "ready" && available.store === "loaded" ? available.dataset.cutoff : null};
}
function createLive(initialStatus?: unknown) {
  live = new LiveSynchronizer({
    extract: signal => { if (!liveConfig) throw new Error("SOURCE_UNAVAILABLE"); return prepareSqlCandidate(liveConfig, signal); },
    activeDataset: () => { const active = store?.activeManifest(); return active ? {datasetId: active.datasetId, fingerprint: liveFingerprint(active.metadata), identity: liveIdentity(active.metadata)} : null; },
    importCandidate: bytes => {
      if (!store || restoring || liveChanging) throw new Error("INTERRUPTED");
      if (readRawPackage(bytes)) throw new Error("INVALID_CANDIDATE");
      store.prune(versions!.protectedDatasetIds());
      return importOutcome(store.importPackage(bytes));
    },
    importPreview: bytes => {
      if (!store || restoring || liveChanging) throw new Error("INTERRUPTED");
      const preview = store.importSourcePreview(bytes);
      if (preview.status === "failed") throw new Error(preview.code === "STORAGE_FULL" ? "STORAGE_FULL" : "INVALID_CANDIDATE");
      return preview;
    },
    initialStatus,
    persist: (status: LiveStatus) => {
      const file = join(dirname(workerData.databasePath), "live-status.json"), temporary = `${file}.partial`;
      try {
        const fd = openSync(temporary, "w", 0o600);
        try { writeFileSync(fd, JSON.stringify(status)); fsyncSync(fd); } finally { closeSync(fd); }
        renameSync(temporary, file);
        if (process.platform !== "win32") { const directory = openSync(dirname(file), "r"); try { fsyncSync(directory); } finally { closeSync(directory); } }
      } finally { rmSync(temporary, {force: true}); }
    },
  });
}
function rebuildServices() {
  store=recovery?.store??undefined;
  reports=store?new SalesReports(store):undefined;
  versions=store&&reports?new ReportVersions(store,reports):undefined;
  expenses=store?new Expenses(store):undefined;
}
const initialized=(async()=> {
  if (!workerData || typeof workerData.databasePath!=="string") throw new Error("INVALID_SERVICE_CONFIG");
  recovery=await Recovery.open(workerData.databasePath,workerData.recoveryConfig,{holdStoreUntilConfigured:workerData.recoveryConfigUnavailable===true});
  rebuildServices();
  let previousStatus: unknown;
  try { previousStatus = JSON.parse(readFileSync(join(dirname(workerData.databasePath), "live-status.json"), "utf8")); } catch {}
  try { if (workerData.liveConfig) liveConfig = parseSqlServerConfig(workerData.liveConfig); } catch { liveConfig = undefined; }
  createLive(previousStatus);
  if (liveConfig && workerData.liveEnabled === true) live!.enable();
  void recovery.resume().catch(()=>{});
})().catch(()=>{});
let active=0, restoring=false, recoveryBusy=false;
const drained=new Set<()=>void>();
async function waitForRequests() {
  if (!active) return;
  await new Promise<void>((resolve,reject)=> {
    const done=()=>{clearTimeout(timer);drained.delete(done);resolve();};
    const timer=setTimeout(()=>{drained.delete(done);reject(new Error("RECOVERY_BUSY"));},30_000);
    drained.add(done);
  });
}
async function recoveryRequest(request:RecoveryServiceRequest) {
  if (!recovery) throw new Error("RECOVERY_UNAVAILABLE");
  switch(request.operation) {
    case "getRecoveryStatus": return recovery.status();
    case "backupNow": return recovery.backupNow();
    case "setupRecovery":
      if (!request.payload || typeof request.payload.destination!=="string" || !(request.payload.key instanceof Uint8Array)) throw new Error("INVALID_PAYLOAD");
      try { return await recovery.configure(request.payload); } finally { rebuildServices(); }
    case "pinBackup":
      if (!request.payload || typeof request.payload.backupId!=="string" || typeof request.payload.pinned!=="boolean") throw new Error("INVALID_PAYLOAD");
      return recovery.pinBackup(request.payload.backupId,request.payload.pinned);
    case "prepareRestore":
      if (!request.payload || typeof request.payload.backupPath!=="string" || !(request.payload.key instanceof Uint8Array)) throw new Error("INVALID_PAYLOAD");
      return recovery.prepareRestore(request.payload.backupPath,request.payload.key);
    case "confirmRestore":
      if (!request.payload || typeof request.payload.token!=="string") throw new Error("INVALID_PAYLOAD");
      try { return await recovery.confirmRestore(request.payload.token); } finally { rebuildServices(); createLive(); await live!.disable(); }
    case "cancelRestore":
      if (!request.payload || typeof request.payload.token!=="string") throw new Error("INVALID_PAYLOAD");
      return recovery.cancelRestore(request.payload.token);
  }
}
parentPort?.on("message", async (request: ServiceRequest) => {
  if (restoring) { parentPort?.postMessage({id:request.id,result:recoveryFailure("RECOVERY_BUSY")}); return; }
  const exclusiveRecovery=recoveryOperations.includes(request.operation)&&request.operation!=="getRecoveryStatus";
  if (exclusiveRecovery && recoveryBusy) { parentPort?.postMessage({id:request.id,result:recoveryFailure("RECOVERY_BUSY")}); return; }
  if (exclusiveRecovery) recoveryBusy=true;
  const committing=request.operation==="confirmRestore";
  if (committing) restoring=true; else active++;
  let result: ServiceResponse["result"];
  try {
    await initialized;
    if (committing) { await live?.disable(); await waitForRequests(); }
    if (recoveryOperations.includes(request.operation)) {
      const result=await recoveryRequest(request as RecoveryServiceRequest);
      parentPort?.postMessage({id:request.id,result}); return;
    }
    if (liveOperations.includes(request.operation)) {
      if (!live) throw new Error("SERVICE_UNAVAILABLE");
      if (liveChanging) { parentPort?.postMessage({id: request.id, result: {status: "busy"}}); return; }
      if (request.operation === "configureLiveSource") {
        if (!request.payload || Object.keys(request.payload).sort().join() !== "config,enabled" || typeof request.payload.enabled !== "boolean") throw new Error("INVALID_PAYLOAD");
        let config: SqlServerConfig;
        try { config = parseSqlServerConfig(request.payload.config); } catch { throw new Error("INVALID_PAYLOAD"); }
        liveChanging = true;
        try { await live.close(); liveConfig = config; createLive(); if (request.payload.enabled) live!.enable(); } finally { liveChanging = false; }
      } else {
        if (!validLiveRequest(request.operation, "payload" in request ? request.payload : null)) throw new Error("INVALID_PAYLOAD");
        if (request.operation === "setLiveEnabled") {
          liveChanging = true;
          try { if (request.payload.enabled) { if (!liveConfig) throw new Error("SERVICE_UNAVAILABLE"); live.enable(); } else await live.disable(); } finally { liveChanging = false; }
        } else if (request.operation === "refreshLiveSource") {
          const refreshed = await live.refresh();
          if (refreshed.status === "busy") { parentPort?.postMessage({id: request.id, result: refreshed}); return; }
        }
      }
      parentPort?.postMessage({id: request.id, result: liveResult()}); return;
    }
    const known = ["querySourceEstimate", "exportSourceEstimate", "querySourceWorkspace", "readSourcePreview", "createExpense", "previewExpenses", "confirmExpenses", "queryExpenses", "correctExpense", "restoreExpense", "confirmExpenseCompleteness", "queryOperating", "getAvailability", "queryPurchaseDocuments", "inspectPurchaseDocument", "queryPurchasing", "openSales", "querySales", "inspectSales", "importPackage", ...monthlyOperations];
    if (!known.includes(request.operation)) throw new Error("UNKNOWN_OPERATION");
    if (!store) throw new Error("SERVICE_UNAVAILABLE");
    if (monthlyOperations.includes(request.operation) && (!("payload" in request) || !validMonthlyRequest(request.operation, request.payload))) throw new Error("INVALID_PAYLOAD");
    if (["queryPurchaseDocuments", "inspectPurchaseDocument", "queryPurchasing", "openSales", "querySales", "inspectSales"].includes(request.operation) && (!("payload" in request) || !validReportRequest(request.operation, request.payload))) throw new Error("INVALID_PAYLOAD");
    let progressPhase = "", progressTime = 0;
    const control: OperationControl = request.job ? {
      checkCancelled: () => { if (Atomics.load(new Int32Array(request.job!.cancellation), 0)) throw new Error("CANCELLED"); },
      onProgress: (phase, completed, total) => {
        const now = performance.now();
        if (phase !== progressPhase || completed === total || now - progressTime >= 50) {
          parentPort?.postMessage({jobId: request.job!.id, phase, completed, total});
          progressPhase = phase; progressTime = now;
        }
      },
    } : {};
    control.checkCancelled?.();
    if (["createExpense", "confirmExpenses", "queryExpenses", "correctExpense", "restoreExpense", "confirmExpenseCompleteness", "queryOperating"].includes(request.operation) && (!('payload' in request) || !validExpenseRequest(request.operation, request.payload))) throw new Error("INVALID_PAYLOAD");
    if (request.operation === "createExpense") result = expenses!.create(request.payload);
    else if (request.operation === "previewExpenses") result = expenses!.preview(request.bytes);
    else if (request.operation === "confirmExpenses") result = expenses!.confirm(request.payload);
    else if (request.operation === "queryExpenses") result = expenses!.query(request.payload);
    else if (request.operation === "correctExpense") { store.changeExpense(request.payload); result = { status: "saved" }; }
    else if (request.operation === "restoreExpense") { store.changeExpense(request.payload); result = { status: "saved" }; }
    else if (request.operation === "confirmExpenseCompleteness") { store.confirmExpensesComplete(request.payload); result = { status: "saved" }; }
    else if (request.operation === "queryOperating") result = reports!.operating(request.payload);
    else if (request.operation === "getAvailability") {
      const available = store.availability();
      result = available.status === "ready" ? {...available, liveConnection: live?.status().phase !== "disabled" && liveConfig ? "enabled" : "disabled"} : available;
    }
    else if(request.operation === "querySourceEstimate") {
      if(!validEstimateRequest(request.payload))throw Error("INVALID_PAYLOAD");
      result=store.querySourceEstimate(request.payload);
    }
    else if(request.operation === "exportSourceEstimate") {
      if(!validEstimateRequest(request.payload,true))throw Error("INVALID_PAYLOAD");
      result={status:"export",bytes:await excelSourceEstimate(store.sourceEstimateForExport(request.payload))};
    }
    else if(request.operation === "querySourceWorkspace") {
      if(!validSourceQuery(request.payload))throw Error("INVALID_PAYLOAD");
      result=store.querySourceWorkspace(request.payload);
    }
    else if (request.operation === "readSourcePreview") {
      if (!validSourcePreviewRequest(request.payload)) throw new Error("INVALID_PAYLOAD");
      result = store.readSourcePreview(request.payload);
    }
    else if (request.operation === "queryPurchaseDocuments") result = reports!.purchaseDocuments(request.payload);
    else if (request.operation === "inspectPurchaseDocument") result = reports!.purchaseDocument(request.payload);
    else if (request.operation === "queryPurchasing") result = reports!.purchasing(request.payload);
    else if (request.operation === "openSales") result = reports!.open(request.payload);
    else if (request.operation === "querySales") result = reports!.query(request.payload);
    else if (request.operation === "inspectSales") result = reports!.inspect(request.payload);
    else if (request.operation === "queryMonthly") result = versions!.currentDisplay(request.payload, control);
    else if (request.operation === "listReportVersions") result = versions!.list(request.payload);
    else if (request.operation === "readReportVersion") result = versions!.display(request.payload);
    else if (request.operation === "readReportEvidence") result = versions!.evidence(request.payload);
    else if (request.operation === "readReportProduct") result = versions!.product(request.payload);
    else if (request.operation === "readReportProductDependency") result = versions!.productDependency(request.payload);
    else if (request.operation === "exportReportProduct") {
      const detail = versions!.product(request.payload);
      result = detail.status === "unavailable" ? detail : { status: "export", bytes: await versions!.exportProduct(request.payload) };
    }
    else if (request.operation === "readReportProducts") result = versions!.products(request.payload);
    else if (request.operation === "readReportPurchasing") result = versions!.purchasing(request.payload);
    else if (request.operation === "compareReportVersion") result = versions!.compare(request.payload);
    else if (request.operation === "acceptReportVersion") result = displayResult(versions!.accept(request.payload));
    else if (request.operation === "exportReportVersion") result = {status: "export", bytes: await excelReport(versions!.selected(request.payload.reportId))};
    else if (request.operation === "importPackage") {
      if (liveChanging || live?.isBusy()) { parentPort?.postMessage({id: request.id, result: {status: "busy"}}); return; }
      if (readRawPackage(request.bytes)) {
        const preview = store.importSourcePreview(request.bytes, control);
        result = preview.status === "preview-imported" ? preview : importOutcome(preview);
      } else {
        if (readPackage(request.bytes).ok) store.prune(versions!.protectedDatasetIds());
        result = importOutcome(store.importPackage(request.bytes, control));
      }
    } else throw new Error("UNKNOWN_OPERATION");
  } catch (error) {
    result = error instanceof Error && ["SOURCE_CHANGED","ESTIMATE_UNAVAILABLE"].includes(error.message) ? {status:"source-unavailable",code:error.message as "SOURCE_CHANGED"|"ESTIMATE_UNAVAILABLE",message:error.message==="SOURCE_CHANGED"?"Kaynak sürümü değişti. Yeni sürümü açın.":"Tahmin kaynağı kullanılamıyor."} : recoveryOperations.includes(request.operation) ? recoveryFailure(error instanceof Error && ["RESTORE_STALE","RECOVERY_BUSY","RECOVERY_SETUP_REQUIRED","INVALID_RESTORE_TOKEN","RESTORE_RECOVERY_REQUIRED","RESTORE_COMMITTED_RESTART_REQUIRED","AUDIT_UNAVAILABLE","RECOVERY_CONFIG_UNAVAILABLE"].includes(error.message)?error.message:"RECOVERY_FAILED") : error instanceof Error && error.message === "CANCELLED" ? {status: "cancelled"}
      : error instanceof Error && (error.message === "UNKNOWN_OPERATION" || error.message === "INVALID_PAYLOAD") ? {status: "rejected", code: error.message, message: "İstek geçerli değil."}
      : error instanceof Error && Object.hasOwn(reportErrors, error.message) ? {status: "unavailable", code: error.message as keyof typeof reportErrors, message: reportErrors[error.message as keyof typeof reportErrors]}
      : ["createExpense", "previewExpenses", "confirmExpenses", "queryExpenses", "correctExpense", "restoreExpense", "confirmExpenseCompleteness"].includes(request.operation) ? { status: "failed", code: "EXPENSE_REQUEST_FAILED", message: "İşlem tamamlanamadı. Kayıt değişmiş veya istek geçersiz olabilir; giderleri yenileyip yeniden inceleyin." } : request.operation !== "importPackage"
      ? { status: "unavailable", code: "SERVICE_UNAVAILABLE", message: "Yerel hizmet başlatılamadı. Uygulamayı yeniden açın." }
      : store ? importOutcome({ status: "failed", code: importErrorCode(error) }) : { status: "failed", code: "SERVICE_UNAVAILABLE", message: "Yerel hizmete ulaşılamadı. Uygulamayı yeniden açın." };
  }
  finally {
    if (exclusiveRecovery) recoveryBusy=false;
    if (committing) restoring=false;
    else { active--; if (!active) for (const done of [...drained]) done(); }
    if (!restoring && recovery) setImmediate(()=>{void recovery?.resume().catch(()=>{});});
  }
  parentPort?.postMessage({ id: request.id, result } satisfies ServiceResponse);
});
parentPort?.on("close", () => { void (async () => { await live?.close(); await recovery?.close(); })(); });

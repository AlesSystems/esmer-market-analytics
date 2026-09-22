import { ReportVersions } from "../reports/versions";
import { excelReport } from "../reports/export";
import type { OperationControl } from "../reports/contracts";
import { Expenses } from "../expenses/import";
import { monthlyOperations, validMonthlyRequest, validReportRequest, validExpenseRequest } from "../desktop/requests";
import { parentPort, workerData } from "node:worker_threads";
import type { ServiceRequest, ServiceResponse } from "../domain/contracts";
import { importErrorCode, openStore } from "../store/store";
import { importOutcome } from "./operations";
import { SalesReports } from "../reports/query";
const reportErrors = {
  REPORT_NOT_FOUND: "Seçili rapor artık mevcut değil. Aylık özeti yeniden açın veya kayıtlı bir sürüm seçin.",
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
try {
  if (!workerData || typeof workerData.databasePath !== "string") throw new Error("INVALID_SERVICE_CONFIG");
  store = openStore(workerData.databasePath);
  reports = new SalesReports(store);
} catch { store?.close(); store = undefined; }
const versions = store && reports ? new ReportVersions(store, reports) : undefined;
const expenses = store ? new Expenses(store) : undefined;
parentPort?.on("message", async (request: ServiceRequest) => {
  let result: ServiceResponse["result"];
  try {
    const known = ["previewExpenses", "confirmExpenses", "queryExpenses", "correctExpense", "restoreExpense", "confirmExpenseCompleteness", "queryOperating", "getAvailability", "queryPurchasing", "openSales", "querySales", "inspectSales", "importPackage", ...monthlyOperations];
    if (!known.includes(request.operation)) throw new Error("UNKNOWN_OPERATION");
    if (!store) throw new Error("SERVICE_UNAVAILABLE");
    if (monthlyOperations.includes(request.operation) && (!("payload" in request) || !validMonthlyRequest(request.operation, request.payload))) throw new Error("INVALID_PAYLOAD");
    if (["queryPurchasing", "openSales", "querySales", "inspectSales"].includes(request.operation) && (!("payload" in request) || !validReportRequest(request.operation, request.payload))) throw new Error("INVALID_PAYLOAD");
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
    if (["confirmExpenses", "queryExpenses", "correctExpense", "restoreExpense", "confirmExpenseCompleteness", "queryOperating"].includes(request.operation) && (!('payload' in request) || !validExpenseRequest(request.operation, request.payload))) throw new Error("INVALID_PAYLOAD");
    if (request.operation === "previewExpenses") result = expenses!.preview(request.bytes);
    else if (request.operation === "confirmExpenses") result = expenses!.confirm(request.payload);
    else if (request.operation === "queryExpenses") result = expenses!.query(request.payload);
    else if (request.operation === "correctExpense") { store.changeExpense(request.payload); result = { status: "saved" }; }
    else if (request.operation === "restoreExpense") { store.changeExpense(request.payload); result = { status: "saved" }; }
    else if (request.operation === "confirmExpenseCompleteness") { store.confirmExpensesComplete(request.payload); result = { status: "saved" }; }
    else if (request.operation === "queryOperating") result = reports!.operating(request.payload);
    else if (request.operation === "getAvailability") result = store.availability();
    else if (request.operation === "queryPurchasing") result = reports!.purchasing(request.payload);
    else if (request.operation === "openSales") result = reports!.open(request.payload);
    else if (request.operation === "querySales") result = reports!.query(request.payload);
    else if (request.operation === "inspectSales") result = reports!.inspect(request.payload);
    else if (request.operation === "openMonthly") result = versions!.open(request.payload, control);
    else if (request.operation === "queryMonthly") result = versions!.current(request.payload, control);
    else if (request.operation === "listReportVersions") result = versions!.list(request.payload);
    else if (request.operation === "readReportVersion") result = versions!.read(request.payload);
    else if (request.operation === "compareReportVersion") result = versions!.compare(request.payload);
    else if (request.operation === "acceptReportVersion") result = versions!.accept(request.payload);
    else if (request.operation === "exportReportVersion") result = {status: "export", bytes: await excelReport(versions!.selected(request.payload.reportId))};
    else if (request.operation === "importPackage") {
      store.prune(versions!.protectedDatasetIds());
      result = importOutcome(store.importPackage(request.bytes, control));
    } else throw new Error("UNKNOWN_OPERATION");
  } catch (error) {
    result = error instanceof Error && error.message === "CANCELLED" ? {status: "cancelled"}
      : error instanceof Error && (error.message === "UNKNOWN_OPERATION" || error.message === "INVALID_PAYLOAD") ? {status: "rejected", code: error.message, message: "İstek geçerli değil."}
      : error instanceof Error && Object.hasOwn(reportErrors, error.message) ? {status: "unavailable", code: error.message as keyof typeof reportErrors, message: reportErrors[error.message as keyof typeof reportErrors]}
      : ["previewExpenses", "confirmExpenses", "queryExpenses", "correctExpense", "restoreExpense", "confirmExpenseCompleteness"].includes(request.operation) ? { status: "failed", code: "EXPENSE_REQUEST_FAILED", message: "İşlem tamamlanamadı. Kayıt değişmiş veya istek geçersiz olabilir; giderleri yenileyip yeniden inceleyin." } : request.operation !== "importPackage"
      ? { status: "unavailable", code: "SERVICE_UNAVAILABLE", message: "Yerel hizmet başlatılamadı. Uygulamayı yeniden açın." }
      : store ? importOutcome({ status: "failed", code: importErrorCode(error) }) : { status: "failed", code: "SERVICE_UNAVAILABLE", message: "Yerel hizmete ulaşılamadı. Uygulamayı yeniden açın." };
  }
  parentPort?.postMessage({ id: request.id, result } satisfies ServiceResponse);
});
parentPort?.on("close", () => store?.close());

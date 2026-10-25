import type { ReportExportResult, ServiceResponse } from "../domain/contracts";
export async function saveReportExport(
  generate: () => Promise<ServiceResponse["result"]>,
  select: () => Promise<{canceled: boolean; filePath?: string}>,
  write: (path: string, bytes: Uint8Array) => Promise<void>,
): Promise<ReportExportResult> {
  try {
    const result = await generate();
    if (result.status === "unavailable") return result;
    if(result.status === "source-unavailable" && (result.code === "SOURCE_CHANGED" || result.code === "ESTIMATE_UNAVAILABLE" || result.code === "MONTH_NOT_COVERED")) return {status:"source-unavailable",code:result.code,message:result.message};
    if (result.status === "recovery-failed" && result.code === "RESTORE_BUSY") return {status: "failed", code: "RESTORE_BUSY", message: result.message};
    if (result.status !== "export") throw new Error("REPORT_EXPORT_FAILED");
    const bytes = Uint8Array.from(result.bytes);
    const selected = await select();
    if (selected.canceled || !selected.filePath) return {status: "cancelled"};
    await write(selected.filePath, bytes);
    return {status: "saved"};
  } catch { return {status: "failed", code: "REPORT_EXPORT_FAILED", message: "Rapor dosyası kaydedilemedi. Seçili rapor korundu; yeniden deneyin."}; }
}

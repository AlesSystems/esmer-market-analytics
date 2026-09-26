import { loadLiveConfig, readLiveConfigFile, saveLiveConfig, type SavedLiveConfig } from "./live-config";
import type { LiveResult, LiveServiceRequest } from "../domain/contracts";
import { OperationJobs } from "./jobs";
import { saveReportExport } from "./report-export";
import { atomicWriteFile } from "./atomic-file";
import type { ReportServiceRequest, JobOutcome, RequestError, ServiceProgress } from "../domain/contracts";
import type { ReportResponse } from "../reports/contracts";
import { expenseTemplate } from "../expenses/template";
import { MAX_EXPENSE_BYTES } from "../expenses/workbook";
import type { ExpenseResult, OperatingReportResult } from "../expenses/contracts";
import type { ExpenseServiceRequest } from "../domain/contracts";
import { app, BrowserWindow, ipcMain, protocol, session, dialog } from "electron";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { Worker } from "node:worker_threads";
import { APP_URL, handleRequest } from "./requests";
import type { Availability, ImportOutcome, ServiceRequest, ServiceResponse } from "../domain/contracts";
import type { QueryPurchasingRequest, PurchasingReportResult, OpenSalesRequest, QuerySalesRequest, InspectSalesRequest, SalesReportResult, SalesDetailResult } from "../reports/contracts";
import { readPackageFile } from "./package-file";
import { loadRecoveryConfig, outsideUserData, saveRecoveryConfig, restoreRecoveryConfig, validRecoveryLocations, readRecoveryKeyFile } from "./recovery-config";
import { generateRecoveryKey, encodeRecoveryKey } from "../recovery/keys";
import type { RecoveryResult, RecoveryServiceRequest } from "../recovery/contracts";

app.commandLine.appendSwitch("lang", "tr");
protocol.registerSchemesAsPrivileged([
  {
    scheme: "esmer",
    privileges: { standard: true, secure: true, supportFetchAPI: true },
  },
]);
const unavailable = {
  status: "unavailable",
  code: "SERVICE_UNAVAILABLE",
  message: "Yerel hizmet başlatılamadı. Uygulamayı yeniden açın.",
} satisfies Availability;
let worker: Worker | undefined;
let recoveryConfigError = false;
let liveConfigError = false;
let savedLive: SavedLiveConfig | null = null;
let nativeLiveBusy = false;
let restoring = false;
let nativeRecoveryBusy = false;
let requestId = 0;
const jobs = new OperationJobs();
const pending = new Map<number, (result: ServiceResponse["result"]) => void>();
function serviceUnavailable() {
  for (const resolve of pending.values()) resolve(unavailable);
  pending.clear(); worker = undefined;
}
function requestService(request: Omit<Extract<ServiceRequest, { operation: "getAvailability" }>, "id">): Promise<Availability>;
function requestService(request: Omit<Extract<ServiceRequest, { operation: "importPackage" }>, "id">): Promise<ImportOutcome>;
function requestService(request: Exclude<ReportServiceRequest, {operation: "exportReportVersion"}> & {job?: ServiceRequest["job"]}): Promise<ReportResponse | JobOutcome | RequestError>;
function requestService(request: Extract<ReportServiceRequest, {operation: "exportReportVersion"}>): Promise<ServiceResponse["result"]>;
function requestService(request: { operation: "queryPurchasing"; payload: QueryPurchasingRequest }): Promise<PurchasingReportResult>;
function requestService(request: { operation: "openSales"; payload: OpenSalesRequest }): Promise<SalesReportResult>;
function requestService(request: { operation: "querySales"; payload: QuerySalesRequest }): Promise<SalesReportResult>;
function requestService(request: { operation: "inspectSales"; payload: InspectSalesRequest }): Promise<SalesDetailResult>;
function requestService(request: ExpenseServiceRequest): Promise<ExpenseResult | OperatingReportResult>;
function requestService(request: RecoveryServiceRequest): Promise<RecoveryResult>;
function requestService(request: LiveServiceRequest): Promise<LiveResult>;
function requestService(request: Omit<ServiceRequest, "id">): Promise<ServiceResponse["result"]> {
  if (restoring && request.operation !== "confirmRestore" && request.operation !== "cancelRestore") return Promise.resolve({status: "recovery-failed", code: "RESTORE_BUSY", message: "Geri yükleme sürüyor. İşlem tamamlanınca yeniden deneyin."});
  if (!worker) return Promise.resolve(request.operation !== "importPackage" ? unavailable : { status: "failed", code: "SERVICE_UNAVAILABLE", message: unavailable.message });
  const id = ++requestId;
  return new Promise(resolve => {
    pending.set(id, result => resolve(result.status === "unavailable" && request.operation === "importPackage" ? { status: "failed", code: "SERVICE_UNAVAILABLE", message: result.message } : result));
    try { worker!.postMessage({ ...request, id }); }
    catch { serviceUnavailable(); }
  });
}

if (!app.requestSingleInstanceLock()) app.quit();
else

app.whenReady().then(async () => {
  const localSession = session.fromPartition("esmer");
  localSession.setPermissionRequestHandler(
    (_webContents, _permission, callback) => callback(false),
  );
  localSession.setPermissionCheckHandler(() => false);
  const assets = new Map([
    ["/index.html", ["index.html", "text/html; charset=utf-8"]],
    ["/app.js", ["app.js", "text/javascript; charset=utf-8"]],
    ["/style.css", ["style.css", "text/css; charset=utf-8"]],
  ]);
  localSession.webRequest.onBeforeRequest((details, callback) => {
    const url = new URL(details.url);
    callback({
      cancel:
        url.protocol !== "esmer:" ||
        url.host !== "app" ||
        !assets.has(url.pathname) ||
        !!url.search,
    });
  });
  await localSession.protocol.handle("esmer", async (request) => {
    const url = new URL(request.url);
    const asset =
      url.host === "app" && !url.search && request.method === "GET"
        ? assets.get(url.pathname)
        : undefined;
    if (!asset) return new Response(null, { status: 404 });
    return new Response(await readFile(join(__dirname, "../ui", asset[0])), {
      headers: {
        "Content-Type": asset[1],
        "Content-Security-Policy":
          "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-src 'none'; frame-ancestors 'none'",
      },
    });
  });
  let recoveryConfig;
  try { recoveryConfig = await loadRecoveryConfig(app.getPath("userData")) ?? undefined; }
  catch { recoveryConfigError = true; }
  try { savedLive = await loadLiveConfig(app.getPath("userData")); } catch { liveConfigError = true; }
  worker = new Worker(join(__dirname, "../service/worker.cjs"), { workerData: { databasePath: join(app.getPath("userData"), "analytics.sqlite"), recoveryConfig, recoveryConfigUnavailable: recoveryConfigError, liveConfig: savedLive?.config, liveEnabled: savedLive?.enabled === true } });
  worker.on("message", (message: ServiceResponse | ServiceProgress) => {
    if ("jobId" in message) { jobs.progress(message.jobId, message.phase, message.completed, message.total); return; }
    const resolve = pending.get(message.id); pending.delete(message.id); resolve?.(message.result);
  });
  worker.on("exit", serviceUnavailable);
  worker.on("error", serviceUnavailable);
  const window = new BrowserWindow({
    width: 1120,
    height: 760,
    minWidth: 680,
    minHeight: 520,
    title: "Esmer Market",
    backgroundColor: "#f4f5f1",
    webPreferences: {
      session: localSession,
      preload: join(__dirname, "preload.cjs"),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      webviewTag: false,
    },
  });
  window.removeMenu();
  window.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  window.webContents.on("will-navigate", (event) => event.preventDefault());
  window.webContents.on("will-attach-webview", (event) =>
    event.preventDefault(),
  );
  ipcMain.handle(
    "esmer:request",
    (event, operation: unknown, payload: unknown) => {
      const trusted = event.sender === window.webContents &&
          event.senderFrame === window.webContents.mainFrame &&
          event.senderFrame?.url === APP_URL;
      if (trusted && restoring && operation !== "confirmRestore" && operation !== "cancelRestore" && operation !== "getOperationStatus")
        return {status: "recovery-failed", code: "RESTORE_BUSY", message: "Geri yükleme sürüyor. İşlem tamamlanınca yeniden deneyin."};
      return handleRequest(
        trusted,
        operation,
        payload,
        () => requestService({ operation: "getAvailability" }),
        () => jobs.run("importPackage", async job => {
          try {
            const selected = await dialog.showOpenDialog(window, { title: "Hazırlanmış veri paketini seçin", properties: ["openFile"], filters: [{ name: "Analiz veri paketi", extensions: ["json"] }] });
            if (selected.canceled || selected.filePaths.length !== 1 || Atomics.load(new Int32Array(job.cancellation), 0)) return { status: "cancelled" } as const;
            jobs.progress(job.id, "reading-file", 0, 1);
            const bytes = await readPackageFile(selected.filePaths[0]);
            if (Atomics.load(new Int32Array(job.cancellation), 0)) return {status: "cancelled"} as const;
            return await requestService({ operation: "importPackage", bytes, job });
          } catch {
            if (Atomics.load(new Int32Array(job.cancellation), 0)) return {status: "cancelled"} as const;
            return { status: "failed", code: "INVALID_PACKAGE", message: "Veri paketi okunamadı veya boyutu sınırı aşıyor. Son geçerli veriler korundu." } as const;
          }
        }),
        { purchasing: payload => requestService({ operation: "queryPurchasing", payload }), open: payload => requestService({ operation: "openSales", payload }), query: payload => requestService({ operation: "querySales", payload }), inspect: payload => requestService({ operation: "inspectSales", payload }) },
        async (operation, payload) => {
          try {
            if (operation === "saveExpenseTemplate") {
              const selected = await dialog.showSaveDialog(window, { title: "Gider şablonunu kaydet", defaultPath: "Esmer-gider-sablonu.xlsx", filters: [{ name: "Excel çalışma kitabı", extensions: ["xlsx"] }] });
              if (selected.canceled || !selected.filePath) return { status: "cancelled" };
              await writeFile(selected.filePath, await expenseTemplate());
              return { status: "saved" };
            }
            if (operation === "previewExpenses") {
              const selected = await dialog.showOpenDialog(window, { title: "Gider çalışma kitabını seç", properties: ["openFile"], filters: [{ name: "Excel çalışma kitabı", extensions: ["xlsx"] }] });
              if (selected.canceled || selected.filePaths.length !== 1) return { status: "cancelled" };
              return requestService({ operation, bytes: await readPackageFile(selected.filePaths[0], MAX_EXPENSE_BYTES) });
            }
            return requestService({ operation, payload } as ExpenseServiceRequest);
          } catch { return { status: "failed", code: "EXPENSE_FILE_FAILED", message: "Gider dosyası okunamadı veya kaydedilemedi. En fazla 4 MB boyutunda bir Excel dosyası kullanın." }; }
        },
        async (operation, payload) => {
          const request = {operation, payload} as ReportServiceRequest;
          if (request.operation === "exportReportVersion") return saveReportExport(
            () => requestService(request),
            () => dialog.showSaveDialog(window, {title: "Seçili raporu Excel olarak kaydet", defaultPath: "Esmer-aylik-rapor.xlsx", filters: [{name: "Excel çalışma kitabı", extensions: ["xlsx"]}]}),
            atomicWriteFile,
          );
          if (request.operation === "openMonthly" || request.operation === "queryMonthly") return jobs.run(request.operation, job => requestService({...request, job}));
          return requestService(request);
        },
        {status: () => jobs.status(), cancel: request => jobs.cancel(request)},
        async (operation, payload) => {
          const failed = (code: string, message: string) => ({status: "recovery-failed", code, message} as const);
          const userData = app.getPath("userData");
          if (restoring && operation !== "confirmRestore" && operation !== "cancelRestore") return failed("RESTORE_BUSY", "Geri yükleme sürüyor. İşlem tamamlanınca yeniden deneyin.");
          const nativeAction = operation === "setupRecovery" || operation === "prepareRestore" || operation === "confirmRestore";
          if (nativeAction && nativeRecoveryBusy) return failed("RECOVERY_BUSY", "Başka bir kurtarma işlemi sürüyor. Tamamlanınca yeniden deneyin.");
          if (nativeAction) nativeRecoveryBusy = true;
          try {
          if (operation === "getRecoveryStatus") {
            const result = await requestService({operation: "getRecoveryStatus"});
            return recoveryConfigError && result.status === "recovery" ? {...result, state: "failed" as const, error: {code: "RECOVERY_CONFIG_UNAVAILABLE", message: "Yerel kurtarma ayarı okunamadı. Kurulumu yenilerseniz eski yedekler için önceki ayrı saklanan anahtar yine gerekir."}} : result;
          }
          if (operation === "setupRecovery") {
            let previousConfig: Buffer | undefined;
            let configSaved = false;
            try {
              const destination = await dialog.showOpenDialog(window, {title: "Yedek klasörünü seçin", properties: ["openDirectory", "createDirectory"]});
              if (destination.canceled || destination.filePaths.length !== 1) return {status: "cancelled"};
              if (!outsideUserData(destination.filePaths[0], userData)) return failed("INVALID_DESTINATION", "Yedek klasörü uygulama veri klasörünün dışında olmalıdır.");
              let existingKey: Uint8Array | undefined;
              try { existingKey = (await loadRecoveryConfig(userData))?.key; } catch { /* damaged local wrapper can be replaced with a new exported key */ }
              const key = existingKey ?? generateRecoveryKey();
              const selected = await dialog.showSaveDialog(window, {title: "Kurtarma anahtarını ayrı bir konuma kaydedin", defaultPath: "esmer-kurtarma-anahtari.txt", filters: [{name: "Kurtarma anahtarı", extensions: ["txt"]}]});
              if (selected.canceled || !selected.filePath) return {status: "cancelled"};
              if (!await validRecoveryLocations(destination.filePaths[0], selected.filePath, userData)) return failed("INVALID_KEY_LOCATION", "Kurtarma anahtarını yedekten ve uygulama klasöründen ayrı saklayın.");
              await writeFile(selected.filePath, encodeRecoveryKey(key), {mode: 0o600, flag: "wx"});
              const verify = await dialog.showOpenDialog(window, {title: "Kaydettiğiniz kurtarma anahtarını yeniden seçin", properties: ["openFile"], filters: [{name: "Kurtarma anahtarı", extensions: ["txt"]}]});
              if (verify.canceled || verify.filePaths.length !== 1 || !(await readRecoveryKeyFile(verify.filePaths[0])).equals(key)) return failed("KEY_EXPORT_FAILED", "Kurtarma anahtarı doğrulanamadı. Kurulumu yeniden deneyin.");
              const acknowledgement = await dialog.showMessageBox(window, {type: "warning", buttons: ["Ayrı sakladım", "İptal"], defaultId: 1, cancelId: 1, message: "Yedek hedefini ve kurtarma anahtarını ayrı konumlarda sakladınız mı?", detail: "İkisi de bu bilgisayarla birlikte kaybolursa veriler geri yüklenemez."});
              if (acknowledgement.response !== 0) return {status: "cancelled"};
              try { previousConfig = await readFile(join(userData, "recovery-config.json")); }
              catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
              await saveRecoveryConfig(userData, {destination: destination.filePaths[0], key});
              configSaved = true;
              const result = await requestService({operation: "setupRecovery", payload: {destination: destination.filePaths[0], key}});
              if (result.status !== "saved" && result.status !== "recovery") { await restoreRecoveryConfig(userData, previousConfig); configSaved = false; }
              else recoveryConfigError = false;
              return result;
            } catch {
              if (configSaved) try { await restoreRecoveryConfig(userData, previousConfig); } catch { recoveryConfigError = true; }
              return failed("RECOVERY_SETUP_FAILED", "Kurtarma kurulamadı. Hedefi ve anahtar dosyasını kontrol edip yeniden deneyin.");
            }
          }
          if (operation === "prepareRestore") {
            try {
              const backup = await dialog.showOpenDialog(window, {title: "Şifreli yedeği seçin", properties: ["openFile"]});
              if (backup.canceled || backup.filePaths.length !== 1) return {status: "cancelled"};
              const keyFile = await dialog.showOpenDialog(window, {title: "Ayrı saklanan kurtarma anahtarını seçin", properties: ["openFile"], filters: [{name: "Kurtarma anahtarı", extensions: ["txt"]}]});
              if (keyFile.canceled || keyFile.filePaths.length !== 1) return {status: "cancelled"};
              return requestService({operation: "prepareRestore", payload: {backupPath: backup.filePaths[0], key: await readRecoveryKeyFile(keyFile.filePaths[0])}});
            } catch { return failed("RESTORE_SELECTION_FAILED", "Yedek veya kurtarma anahtarı okunamadı."); }
          }
          if (operation === "confirmRestore") {
            if (jobs.status().status !== "idle") return failed("RECOVERY_BUSY", "Başka bir işlem sürüyor. Tamamlanınca yeniden deneyin.");
            const confirm = await dialog.showMessageBox(window, {type: "warning", buttons: ["Geri yükle", "Vazgeç"], defaultId: 1, cancelId: 1, message: "Mevcut veriler yedekteki sürümle değiştirilsin mi?", detail: "İşlemden sonra raporlar yeniden yüklenir. Mevcut kayıtların korunmuş kopyası saklanır."});
            if (confirm.response !== 0) return {status: "cancelled"};
            if (nativeLiveBusy) return failed("RECOVERY_BUSY", "Kaynak ayarı değiştiriliyor. Tamamlanınca yeniden deneyin.");
            if (savedLive) {
              savedLive = {...savedLive, enabled: false};
              try { await saveLiveConfig(userData, savedLive); } catch { return failed("LIVE_CONFIG_UNAVAILABLE", "Canlı bağlantı ayarı kaydedilemedi. Geri yükleme başlatılmadı."); }
            }
            await requestService({operation: "setLiveEnabled", payload: {enabled: false}});
            restoring = true;
            try {
              const deadline = Date.now() + 30_000;
              while (pending.size > 0) {
                if (Date.now() >= deadline) return failed("RECOVERY_BUSY", "Açık işlemler tamamlanmadı. Geri yüklemeyi yeniden deneyin.");
                await new Promise(resolve => setTimeout(resolve, 10));
              }
              const result = await requestService({operation: "confirmRestore", payload: payload as {token: string}});
              return result;
            } finally { restoring = false; }
          }
          if (operation === "backupNow") return requestService({operation: "backupNow"});
          if (operation === "pinBackup") return requestService({operation: "pinBackup", payload: payload as {backupId: string; pinned: boolean}});
          return requestService({operation: "cancelRestore", payload: payload as {token: string}});
          } finally { if (nativeAction) nativeRecoveryBusy = false; }
        },
        async (operation, payload) => {
          const failure = (): LiveResult => ({status: "live-failed", code: "LIVE_CONFIG_UNAVAILABLE", message: "İzole test bağlantısı ayarlanamadı. Yerel veriler korunuyor. Bağlantı dosyasını yeniden seçin."});
          const userData = app.getPath("userData");
          if (operation === "getLiveStatus") {
            const result = await requestService({operation});
            return result.status === "live" ? {...result, configurationError: liveConfigError} : result;
          }
          if (nativeLiveBusy || nativeRecoveryBusy || restoring) return {status: "busy"};
          if (operation === "refreshLiveSource") return requestService({operation});
          nativeLiveBusy = true;
          try {
            if (operation === "configureLiveSource") {
              const selected = await dialog.showOpenDialog(window, {title: "İzole test bağlantısı dosyasını seçin", properties: ["openFile"], filters: [{name: "Bağlantı ayarı", extensions: ["json"]}]});
              if (selected.canceled || selected.filePaths.length !== 1) return {status: "cancelled"};
              const config = await readLiveConfigFile(selected.filePaths[0]);
              await requestService({operation: "setLiveEnabled", payload: {enabled: false}});
              const next = {config, enabled: false};
              await saveLiveConfig(userData, next);
              savedLive = next;
              const result = await requestService({operation: "configureLiveSource", payload: next});
              liveConfigError = result.status !== "live";
              return result;
            }
            if (!savedLive || !payload) return failure();
            const next = {...savedLive, enabled: payload.enabled};
            if (!next.enabled) await requestService({operation: "setLiveEnabled", payload: {enabled: false}});
            await saveLiveConfig(userData, next);
            savedLive = next;
            const result = await requestService({operation: "setLiveEnabled", payload: {enabled: next.enabled}});
            liveConfigError = result.status !== "live";
            return result;
          } catch { liveConfigError = true; return failure(); }
          finally { nativeLiveBusy = false; }
        },
      );
    },
  );
  await window.loadURL(APP_URL);
});
app.on("window-all-closed", () => app.quit());
app.on("before-quit", () => {
  void worker?.terminate();
});

import { app, BrowserWindow, ipcMain, protocol, session, dialog } from "electron";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { Worker } from "node:worker_threads";
import { APP_URL, handleRequest } from "./requests";
import type { Availability, ImportOutcome, ServiceRequest, ServiceResponse } from "../domain/contracts";
import type { OpenSalesRequest, QuerySalesRequest, InspectSalesRequest, SalesReportResult, SalesDetailResult } from "../reports/contracts";
import { readPackageFile } from "./package-file";

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
let requestId = 0;
const pending = new Map<number, (result: ServiceResponse["result"]) => void>();
function serviceUnavailable() {
  for (const resolve of pending.values()) resolve(unavailable);
  pending.clear(); worker = undefined;
}
function requestService(request: Omit<Extract<ServiceRequest, { operation: "getAvailability" }>, "id">): Promise<Availability>;
function requestService(request: Omit<Extract<ServiceRequest, { operation: "importPackage" }>, "id">): Promise<ImportOutcome>;
function requestService(request: { operation: "openSales"; payload: OpenSalesRequest }): Promise<SalesReportResult>;
function requestService(request: { operation: "querySales"; payload: QuerySalesRequest }): Promise<SalesReportResult>;
function requestService(request: { operation: "inspectSales"; payload: InspectSalesRequest }): Promise<SalesDetailResult>;
function requestService(request: Omit<ServiceRequest, "id">): Promise<ServiceResponse["result"]> {
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
  worker = new Worker(join(__dirname, "../service/worker.cjs"), { workerData: { databasePath: join(app.getPath("userData"), "analytics.sqlite") } });
  worker.on("message", ({ id, result }: ServiceResponse) => { const resolve = pending.get(id); pending.delete(id); resolve?.(result); });
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
    (event, operation: unknown, payload: unknown) =>
      handleRequest(
        event.sender === window.webContents &&
          event.senderFrame === window.webContents.mainFrame &&
          event.senderFrame?.url === APP_URL,
        operation,
        payload,
        () => requestService({ operation: "getAvailability" }),
        async () => {
          try {
            const selected = await dialog.showOpenDialog(window, { title: "Hazırlanmış veri paketini seçin", properties: ["openFile"], filters: [{ name: "Analiz veri paketi", extensions: ["json"] }] });
            if (selected.canceled || selected.filePaths.length !== 1) return { status: "cancelled" };
            const bytes = await readPackageFile(selected.filePaths[0]);
            return await requestService({ operation: "importPackage", bytes });
          } catch {
            return { status: "failed", code: "INVALID_PACKAGE", message: "Veri paketi okunamadı veya boyutu sınırı aşıyor. Son geçerli veriler korundu." };
          }
        },
        { open: payload => requestService({ operation: "openSales", payload }), query: payload => requestService({ operation: "querySales", payload }), inspect: payload => requestService({ operation: "inspectSales", payload }) },
      ),
  );
  await window.loadURL(APP_URL);
});
app.on("window-all-closed", () => app.quit());
app.on("before-quit", () => {
  void worker?.terminate();
});

import { app, BrowserWindow, ipcMain, protocol, session } from "electron";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { Worker } from "node:worker_threads";
import { APP_URL, handleRequest } from "./requests";
import type { Availability } from "../domain/contracts";

protocol.registerSchemesAsPrivileged([
  {
    scheme: "esmer",
    privileges: { standard: true, secure: true, supportFetchAPI: true },
  },
]);
const unavailable: Availability = {
  status: "unavailable",
  code: "SERVICE_UNAVAILABLE",
  message: "Yerel hizmet başlatılamadı. Uygulamayı yeniden açın.",
};
let worker: Worker | undefined;
let availability: Availability = unavailable;

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
  worker = new Worker(join(__dirname, "../service/worker.cjs"));
  worker.on("exit", () => {
    availability = unavailable;
  });
  const ready = new Promise<Availability>((resolve) => {
    const timeout = setTimeout(() => resolve(unavailable), 10_000);
    worker!.once("message", (result: Availability) => {
      clearTimeout(timeout);
      availability = result;
      resolve(result);
    });
    worker!.once("error", () => {
      clearTimeout(timeout);
      console.error("SERVICE_UNAVAILABLE");
      availability = unavailable;
      resolve(unavailable);
    });
  });
  worker.postMessage(null);
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
        async () => {
          await ready;
          return availability;
        },
      ),
  );
  await window.loadURL(APP_URL);
});
app.on("window-all-closed", () => app.quit());
app.on("before-quit", () => {
  void worker?.terminate();
});

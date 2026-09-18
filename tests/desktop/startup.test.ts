import { test, expect, _electron as electron } from "@playwright/test";
import { mkdtemp, readFile, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { sourcePackage } from "../helpers/store-fixtures";
const executablePath =
  process.env.ESMER_EXECUTABLE ??
  (process.platform === "darwin"
    ? resolve(
        `release/mac${process.arch === "arm64" ? "-arm64" : ""}/Esmer Market Analytics.app/Contents/MacOS/Esmer Market Analytics`,
      )
    : process.platform === "win32"
      ? resolve("release/win-unpacked/Esmer Market Analytics.exe")
      : resolve("release/linux-unpacked/esmer-market-analytics"));
test("empty packaged app starts offline without login or renderer privileges", async () => {
  const userData = await mkdtemp(join(tmpdir(), "esmer-desktop-"));
  let app = await electron.launch({
    executablePath,
    args: [`--user-data-dir=${userData}`],
  });
  try {
    const page = await app.firstWindow();
    await expect(
      page.getByRole("heading", { name: "Henüz veri içe aktarılmadı" }),
    ).toBeVisible();
    await expect(page.getByText("Canlı bağlantı kapalı")).toBeVisible();
    await expect(page.locator("input[type=password]")).toHaveCount(0);
    expect(
      await page.evaluate(() => ({
        api: Object.keys(window.esmer).sort(),
        node: typeof window.require,
        process: typeof window.process,
      })),
    ).toEqual({
      api: ["getAvailability", "importPackage"],
      node: "undefined",
      process: "undefined",
    });
    expect(await page.evaluate(() => window.esmer.getAvailability())).toEqual({
      status: "ready",
      store: "empty",
      liveConnection: "disabled",
    });
    expect(await app.evaluate(({ app }) => app.isPackaged)).toBe(true);
    const resourcesPath = await app.evaluate(() => process.resourcesPath);
    for (const notice of ["LICENSE", "LICENSES.chromium.html"]) {
      expect(
        await readFile(join(resourcesPath, "licences", notice), "utf8"),
      ).toBe(
        await readFile(join("node_modules/electron/dist", notice), "utf8"),
      );
    }
    expect(await app.evaluate(({ app }) => app.getPath("userData"))).toBe(
      await realpath(userData),
    );
    const runtime = await app.evaluate(async ({ app }) => {
      const { DatabaseSync } = process.getBuiltinModule("node:sqlite");
      const database = new DatabaseSync(":memory:");
      const sqlite = database
        .prepare("SELECT sqlite_version() AS version")
        .get();
      database.close();
      const main = {
        electron: process.versions.electron,
        node: process.versions.node,
        sqlite,
      };
      const { Worker } = process.getBuiltinModule("node:worker_threads");
      const { join } = process.getBuiltinModule("node:path");
      const worker = new Worker(
        `
          const { parentPort, workerData, isMainThread } = require('node:worker_threads');
          const { DatabaseSync } = require('node:sqlite');
          const database = new DatabaseSync(':memory:');
          const sqlite = database.prepare('SELECT sqlite_version() AS version').get();
          database.close();
          const postMessage = parentPort.postMessage.bind(parentPort);
          parentPort.postMessage = ({ result: availability }) => postMessage({
            electron: process.versions.electron,
            node: process.versions.node,
            sqlite,
            isMainThread,
            availability,
          });
          require(workerData.modulePath);
        `,
        {
          eval: true,
          workerData: { modulePath: join(app.getAppPath(), "dist/service/worker.cjs"), databasePath: join(app.getPath("userData"), "runtime-probe.sqlite") },
        },
      );
      try {
        const measured = await new Promise<unknown>((resolve, reject) => {
          const timeout = setTimeout(
            () => reject(new Error("WORKER_RUNTIME_TIMEOUT")),
            5_000,
          );
          worker.once("message", (result: unknown) => {
            clearTimeout(timeout);
            resolve(result);
          });
          worker.once("error", () => {
            clearTimeout(timeout);
            reject(new Error("WORKER_RUNTIME_FAILED"));
          });
          worker.postMessage({ id: 1, operation: "getAvailability" });
        });
        return { main, worker: measured };
      } finally {
        await worker.terminate();
      }
    });
    expect(runtime.worker).toEqual({
      ...runtime.main,
      isMainThread: false,
      availability: {
        status: "ready",
        store: "empty",
        liveConnection: "disabled",
      },
    });
    await writeFile(
      "test-results/runtime.json",
      JSON.stringify(runtime, null, 2),
    );
    const preferences = await app.evaluate(({ BrowserWindow }) =>
      (
        BrowserWindow.getAllWindows()[0].webContents as unknown as {
          getLastWebPreferences(): Record<string, unknown>;
        }
      ).getLastWebPreferences(),
    );
    expect(preferences).toMatchObject({
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: false,
    });
    expect(
      await page.evaluate(
        () =>
          new Promise((resolve) => {
            const timeout = setTimeout(() => {
              document.removeEventListener(
                "securitypolicyviolation",
                onViolation,
              );
              resolve(null);
            }, 5_000);
            function onViolation(event: SecurityPolicyViolationEvent) {
              if (event.effectiveDirective !== "connect-src") return;
              clearTimeout(timeout);
              document.removeEventListener(
                "securitypolicyviolation",
                onViolation,
              );
              resolve({
                directive: event.effectiveDirective,
                blockedURI: event.blockedURI,
              });
            }
            document.addEventListener("securitypolicyviolation", onViolation);
            void fetch("https://example.invalid/source").catch(() => undefined);
          }),
      ),
    ).toEqual({
      directive: "connect-src",
      blockedURI: "https://example.invalid/source",
    });
    expect(
      await page.evaluate(
        async () =>
          (await navigator.permissions.query({ name: "geolocation" })).state,
      ),
    ).toBe("denied");
    expect(
      await page.evaluate(() => window.open("https://example.invalid/")),
    ).toBeNull();
    expect(
      await app.evaluate(
        ({ BrowserWindow }) =>
          new Promise((resolve) => {
            const contents = BrowserWindow.getAllWindows()[0].webContents;
            const timeout = setTimeout(() => {
              contents.removeListener("will-navigate", onNavigate);
              resolve(null);
            }, 5_000);
            function onNavigate(event: Electron.Event, url: string) {
              clearTimeout(timeout);
              resolve({ prevented: event.defaultPrevented, url });
            }
            contents.once("will-navigate", onNavigate);
            void contents.executeJavaScript(
              'location.href = "esmer://app/style.css"',
            );
          }),
      ),
    ).toEqual({ prevented: true, url: "esmer://app/style.css" });
    expect(
      await app.evaluate(
        ({ BrowserWindow }) => BrowserWindow.getAllWindows().length,
      ),
    ).toBe(1);
    await page.screenshot({ path: "test-results/offline-startup.png" });
    await app.close();
    app = await electron.launch({
      executablePath,
      args: [`--user-data-dir=${userData}`],
    });
    const reopened = await app.firstWindow();
    await expect(
      reopened.getByRole("heading", { name: "Henüz veri içe aktarılmadı" }),
    ).toBeVisible();
    await expect(reopened.getByText("Canlı bağlantı kapalı")).toBeVisible();
    await expect(reopened.locator("input[type=password]")).toHaveCount(0);
    expect(await reopened.evaluate(() => window.esmer.getAvailability())).toEqual({
      status: "ready",
      store: "empty",
      liveConnection: "disabled",
    });
    expect(await app.evaluate(({ app }) => app.getPath("userData"))).toBe(
      await realpath(userData),
    );
  } finally {
    await app.close();
    await rm(userData, { recursive: true, force: true });
  }
});

test("packaged app imports through native selection, preserves data after failed import and restarts offline", async () => {
  const userData = await mkdtemp(join(tmpdir(), "esmer-import-"));
  const packagePath = join(userData, "synthetic.json"); await writeFile(packagePath, sourcePackage("b"));
  let app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] });
  try {
    let page = await app.firstWindow();
    await expect(page.getByRole("heading", { name: "Henüz veri içe aktarılmadı" })).toBeVisible();
    await app.evaluate(({ dialog }, path) => { dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [path] }); }, packagePath);
    await page.getByRole("button", { name: "Veri paketi içe aktar" }).click();
    await expect(page.getByRole("heading", { name: "Verileriniz bu bilgisayarda hazır" })).toBeVisible();
    await expect(page.getByText("Sentetik gösterim verisi — gerçek market verisi değildir.")).toBeVisible();
    await expect(page.getByText("Veri paketi içe aktarıldı.", { exact: true })).toBeVisible();
    const availability = await page.evaluate(() => window.esmer.getAvailability());
    expect(availability).toMatchObject({ status: "ready", store: "loaded", liveConnection: "disabled", dataset: { cutoff: "2025-02-02", counts: { documents: 2, lines: 2, suppliers: 0 }, warnings: ["SYNTHETIC_ONLY"] } });
    await page.screenshot({ path: "test-results/phase-4-imported.png" });
    await page.getByRole("button", { name: "Veri paketi içe aktar" }).click();
    await expect(page.getByText("Bu veri paketi zaten etkin. Veriler değiştirilmedi.")).toBeVisible();
    await writeFile(packagePath, "invalid package");
    await page.getByRole("button", { name: "Veri paketi içe aktar" }).click();
    await expect(page.getByRole("alert")).toHaveText("Veri paketi geçersiz. Son geçerli veriler korundu.");
    expect(await page.evaluate(() => window.esmer.getAvailability())).toEqual(availability);
    await page.screenshot({ path: "test-results/phase-4-import-failed.png" });
    await app.evaluate(({ dialog }) => { dialog.showOpenDialog = async () => ({ canceled: true, filePaths: [] }); });
    await page.getByRole("button", { name: "Veri paketi içe aktar" }).click();
    await expect(page.getByText("İçe aktarma iptal edildi.")).toBeVisible();
    expect(await page.evaluate(() => window.esmer.getAvailability())).toEqual(availability);
    await app.close();
    app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] }); page = await app.firstWindow();
    await expect(page.getByRole("heading", { name: "Verileriniz bu bilgisayarda hazır" })).toBeVisible();
    expect(await page.evaluate(() => window.esmer.getAvailability())).toEqual(availability);
    expect(await page.evaluate(() => ({ node: typeof window.require, process: typeof window.process, api: Object.keys(window.esmer).sort() }))).toEqual({ node: "undefined", process: "undefined", api: ["getAvailability", "importPackage"] });
  } finally { await app.close(); await rm(userData, { recursive: true, force: true }); }
});

import { importPackage } from "../helpers/desktop-navigation";
import { test, expect, _electron as electron } from "@playwright/test";
import { mkdtemp, readFile, realpath, rename, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { sourcePackage } from "../helpers/store-fixtures";
import { openStore } from "../../src/store/store";
import { DatabaseSync } from "node:sqlite";
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
      page.getByRole("heading", { name: "Henüz veri yok" }),
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
      api: ["acceptReportVersion", "backupNow", "cancelOperation", "cancelRestore", "compareReportVersion", "configureLiveSource", "confirmExpenseCompleteness", "confirmExpenses", "confirmRestore", "correctExpense", "exportReportVersion", "getAvailability", "getLiveStatus", "getOperationStatus", "getRecoveryStatus", "importPackage", "inspectSales", "listReportVersions", "openMonthly", "openSales", "pinBackup", "prepareRestore", "previewExpenses", "queryExpenses", "queryMonthly", "queryOperating", "queryPurchasing", "querySales", "readReportEvidence", "readReportPurchasing", "readReportVersion", "readSourcePreview", "refreshLiveSource", "restoreExpense", "saveExpenseTemplate", "setLiveEnabled", "setupRecovery"],
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
      reopened.getByRole("heading", { name: "Henüz veri yok" }),
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
    await expect(page.getByRole("heading", { name: "Henüz veri yok" })).toBeVisible();
    await app.evaluate(({ dialog }, path) => { dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [path] }); }, packagePath);
    await importPackage(page);
    await expect(page.getByRole("heading", { name: "Verileriniz bu bilgisayarda hazır" })).toBeVisible();
    await expect(page.getByText("Sentetik gösterim verisi — gerçek market verisi değildir.")).toBeVisible();
    await expect(page.getByText("Veri paketi içe aktarıldı.", { exact: true })).toBeVisible();
    const availability = await page.evaluate(() => window.esmer.getAvailability());
    expect(availability).toMatchObject({ status: "ready", store: "loaded", liveConnection: "disabled", dataset: { cutoff: "2025-02-02", counts: { documents: 2, lines: 2, suppliers: 0 }, warnings: ["SYNTHETIC_ONLY"] } });
    await page.screenshot({ path: "test-results/phase-4-imported.png" });
    await importPackage(page);
    await expect(page.getByText("Bu veri paketi zaten etkin. Veriler değiştirilmedi.")).toBeVisible();
    await writeFile(packagePath, "invalid package");
    await importPackage(page);
    await expect(page.getByRole("alert")).toHaveText("Veri paketi geçersiz. Son geçerli veriler korundu.");
    expect(await page.evaluate(() => window.esmer.getAvailability())).toMatchObject({ ...availability, recentImports: expect.any(Array), lastImportError: "INVALID_PACKAGE" });
    await page.screenshot({ path: "test-results/phase-4-import-failed.png" });
    await app.evaluate(({ dialog }) => { dialog.showOpenDialog = async () => ({ canceled: true, filePaths: [] }); });
    await importPackage(page);
    await expect(page.getByText("İçe aktarma iptal edildi.")).toBeVisible();
    expect(await page.evaluate(() => window.esmer.getAvailability())).toMatchObject({ ...availability, recentImports: expect.any(Array), lastImportError: "INVALID_PACKAGE" });
    await app.close();
    app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] }); page = await app.firstWindow();
    await expect(page.getByRole("heading", { name: "Verileriniz bu bilgisayarda hazır" })).toBeVisible();
    expect(await page.evaluate(() => window.esmer.getAvailability())).toMatchObject({ ...availability, recentImports: expect.any(Array), lastImportError: "INVALID_PACKAGE" });
    expect(await page.evaluate(() => ({ node: typeof window.require, process: typeof window.process, api: Object.keys(window.esmer).sort() }))).toEqual({ node: "undefined", process: "undefined", api: ["acceptReportVersion", "backupNow", "cancelOperation", "cancelRestore", "compareReportVersion", "configureLiveSource", "confirmExpenseCompleteness", "confirmExpenses", "confirmRestore", "correctExpense", "exportReportVersion", "getAvailability", "getLiveStatus", "getOperationStatus", "getRecoveryStatus", "importPackage", "inspectSales", "listReportVersions", "openMonthly", "openSales", "pinBackup", "prepareRestore", "previewExpenses", "queryExpenses", "queryMonthly", "queryOperating", "queryPurchasing", "querySales", "readReportEvidence", "readReportPurchasing", "readReportVersion", "readSourcePreview", "refreshLiveSource", "restoreExpense", "saveExpenseTemplate", "setLiveEnabled", "setupRecovery"] });
  } finally { await app.close(); await rm(userData, { recursive: true, force: true }); }
});

for (const loaded of [false, true]) {
  test(`packaged restart shows interrupted import and preserves ${loaded ? "loaded" : "empty"} state`, async () => {
    const userData = await mkdtemp(join(tmpdir(), "esmer-interrupted-"));
    const store = openStore(join(userData, "analytics.sqlite"));
    if (loaded) {
      store.importPackage(sourcePackage("a", "earlier-lineage"));
      store.importPackage(sourcePackage("a"));
    }
    const before = store.availability();
    expect(store.stage(sourcePackage("b")).status).toBe("validated"); store.close();
    const packagePath = join(userData, "synthetic.json"); await writeFile(packagePath, sourcePackage("b"));
    const app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] });
    try {
      const page = await app.firstWindow();
      await expect(page.getByRole("heading", { name: loaded ? "Verileriniz bu bilgisayarda hazır" : "Henüz veri yok" })).toBeVisible();
      await expect(page.getByRole("alert")).toHaveText(loaded ? "Önceki içe aktarma yarıda kaldı. Son geçerli veriler korundu. Paketi yeniden içe aktarın." : "Önceki içe aktarma yarıda kaldı. Henüz etkin veri yok. Paketi yeniden içe aktarın.");
      expect(await page.evaluate(() => window.esmer.getAvailability())).toMatchObject({ ...before, recentImports: expect.any(Array), lastImportError: "INTERRUPTED" });
      await app.evaluate(({ dialog }) => { dialog.showOpenDialog = async () => ({ canceled: true, filePaths: [] }); });
      await importPackage(page);
      await expect(page.getByText("İçe aktarma iptal edildi.")).toBeVisible();
      await expect(page.getByRole("alert")).toContainText("Önceki içe aktarma yarıda kaldı.");
      if (loaded) {
        await writeFile(packagePath, sourcePackage("a", "earlier-lineage"));
        await app.evaluate(({ dialog }, path) => { dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [path] }); }, packagePath);
        await importPackage(page);
        await expect(page.getByText("Bu paket daha önce kullanılmış. Etkin veriler eski sürüme döndürülmedi.")).toBeVisible();
        await expect(page.getByRole("alert")).toContainText("Önceki içe aktarma yarıda kaldı.");
        expect(await page.evaluate(() => window.esmer.getAvailability())).toMatchObject({ ...before, recentImports: expect.any(Array), lastImportError: "INTERRUPTED" });
        await writeFile(packagePath, sourcePackage("b"));
      }
      await app.evaluate(({ dialog }, path) => { dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [path] }); }, packagePath);
      await importPackage(page);
      await expect(page.getByText("Veri paketi içe aktarıldı.", { exact: true })).toBeVisible();
      await expect(page.getByRole("alert")).toHaveCount(0);
      expect(await page.evaluate(() => window.esmer.getAvailability())).not.toHaveProperty("lastImportError");
    } finally { await app.close(); await rm(userData, { recursive: true, force: true }); }
  });
}

test("packaged owning worker migrates and reopens durable revisions and report pins offline", async () => {
  const userData = await mkdtemp(join(tmpdir(), "esmer-durable-"));
  const databasePath = join(userData, "analytics.sqlite");
  const store = openStore(databasePath, { schemaVersion: 1 });
  expect(store.importPackage(sourcePackage("a")).status).toBe("active");
  store.appendRevision({ kind: "expense", entityId: "expense", value: { net: "50.000000000000001", date: "2025-01-15", reason: "Synthetic original", evidence: "fixture:expense" } });
  const accepted = store.readSnapshot();
  const report = { id: "accepted", pin: accepted.pin, calculationVersion: "synthetic-v1", evidence: ["fixture:accepted"], output: { label: "synthetic only" } };
  store.acceptReport(report);
  const staged = store.stage(sourcePackage("b"));
  if (staged.status !== "validated") throw new Error("STAGE_FAILED");
  store.appendRevision({ kind: "expense", entityId: "expense", value: { net: "60.000000000000001", date: "2025-01-15", reason: "Synthetic correction", evidence: "fixture:correction" } });
  store.appendRevision({ kind: "adjustment", entityId: "adjustment", value: { net: "5", reason: "Synthetic adjustment", evidence: "fixture:adjustment", target: { datasetId: accepted.pin.datasetId!, kind: "line", sourceId: "line-delete" }, reversed: false } });
  expect(store.activate(staged.id).status).toBe("active");
  const before = store.readSnapshot();
  expect(before.app.map(row => row.kind === "adjustment" ? row.applicability : row.kind === "expense" ? row.value.net : null)).toEqual(["60.000000000000001", "review-required"]);
  store.close();
  try {
    for (let launch = 0; launch < 2; launch++) {
      const app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] });
      try {
        expect(await app.evaluate(({ app }) => app.isPackaged)).toBe(true);
        const page = await app.firstWindow();
        await page.context().setOffline(true);
        await page.reload();
        await expect(page.getByRole("heading", { name: "Verileriniz bu bilgisayarda hazır" })).toBeVisible();
        expect(await page.evaluate(() => window.esmer.getAvailability())).toMatchObject({ status: "ready", store: "loaded", dataset: { datasetId: before.pin.datasetId, counts: { documents: 2, lines: 2, suppliers: 0 } } });
      } finally { await app.close(); }
      const check = new DatabaseSync(databasePath, { readOnly: true });
      try { expect(check.prepare("PRAGMA user_version").get()).toEqual({ user_version: 7 }); }
      finally { check.close(); }
      const reopened = openStore(databasePath);
      try {
        expect(reopened.readSnapshot()).toEqual(before);
        expect(reopened.readPinned(accepted.pin)).toEqual(accepted);
        expect(reopened.readReport("accepted")).toEqual(report);
      } finally { reopened.close(); }
      await rename(databasePath, `${databasePath}.released`);
      await rename(`${databasePath}.released`, databasePath);
    }
  } finally { await rm(userData, { recursive: true, force: true }); }
});

test("unreadable recovery config keeps an older database untouched and restore reachable", async () => {
  const userData = await mkdtemp(join(tmpdir(), "esmer-recovery-config-startup-"));
  const databasePath = join(userData, "analytics.sqlite");
  const store = openStore(databasePath, {schemaVersion: 1});
  store.close();
  await writeFile(join(userData, "recovery-config.json"), "{corrupt");
  const app = await electron.launch({executablePath, args: [`--user-data-dir=${userData}`]});
  try {
    const page = await app.firstWindow();
    await expect(page.getByRole("heading", {name: "Yerel veriler açılamadı"})).toBeVisible();
    await page.getByRole("button", {name: "Yedekten geri yükle"}).click();
    await expect(page.getByRole("heading", {name: "Yedekleme ve kurtarma"})).toBeVisible();
    await expect(page.getByRole("alert")).toContainText("Yerel kurtarma ayarı okunamadı");
    const db = new DatabaseSync(databasePath, {readOnly: true});
    try { expect(db.prepare("PRAGMA user_version").get()).toEqual({user_version: 1}); }
    finally { db.close(); }
  } finally { await app.close(); await rm(userData, {recursive: true, force: true}); }
});

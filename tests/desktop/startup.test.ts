import { test, expect, _electron as electron } from "@playwright/test";
import { mkdtemp, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
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
  const app = await electron.launch({
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
        api: Object.keys(window.esmer),
        node: typeof window.require,
        process: typeof window.process,
      })),
    ).toEqual({
      api: ["getAvailability"],
      node: "undefined",
      process: "undefined",
    });
    expect(await page.evaluate(() => window.esmer.getAvailability())).toEqual({
      status: "ready",
      store: "empty",
      liveConnection: "disabled",
    });
    expect(await app.evaluate(({ app }) => app.isPackaged)).toBe(true);
    expect(await app.evaluate(({ app }) => app.getPath("userData"))).toBe(
      await realpath(userData),
    );
    const runtime = await app.evaluate(async () => {
      const { DatabaseSync } = process.getBuiltinModule("node:sqlite");
      const database = new DatabaseSync(":memory:");
      const sqlite = database
        .prepare("SELECT sqlite_version() AS version")
        .get();
      database.close();
      return {
        electron: process.versions.electron,
        node: process.versions.node,
        sqlite,
      };
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
  } finally {
    await app.close();
    await rm(userData, { recursive: true, force: true });
  }
});

import { openWorkspace } from "../helpers/desktop-navigation";
import { expect, test, _electron as electron } from "@playwright/test";
import { mkdtemp, mkdir, readFile, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve, sep } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { openStore } from "../../src/store/store";
import { populateRecoveryStore } from "../helpers/recovery-fixtures";

const defaultExecutable = resolve("release/win-unpacked/Esmer Market Analytics.exe");
const executablePath = process.env.ESMER_EXECUTABLE ?? defaultExecutable;
const lifecycleProfile = process.env.ESMER_LIFECYCLE_PROFILE;
const workRoot = resolve("work/phase-10-lifecycle");
const phase8Root = resolve("work/windows-phase-8/lifecycle");
const reusePhase8 = process.env.ESMER_LIFECYCLE_REUSE_PHASE8 === "1";

function storedBusinessData(path: string) {
  const database = new DatabaseSync(path, { readOnly: true });
  try {
    // report_versions and evidence_references are omitted: the app no longer creates accepted reports, so the tables stay empty here (restore of old reports is covered by tests/integration/recovery-accepted-reports.test.ts).
    const tables = ["datasets", "package_history", "import_batches", "source_suppliers", "source_documents", "source_lines", "active_dataset", "rollback_dataset", "app_revisions", "adjustment_targets", "expense_batches"];
    const records = Object.fromEntries(tables.map(table => [table, database.prepare(`SELECT * FROM ${table} ORDER BY rowid`).all()]));
    return { records };
  } finally { database.close(); }
}

test("packaged Windows profile retains app-owned history across launch and restart", async () => {
  test.skip(process.platform !== "win32", "Windows package lifecycle acceptance");
  const allowedRoot = reusePhase8 ? phase8Root : workRoot;
  if (lifecycleProfile && !resolve(lifecycleProfile).startsWith(allowedRoot + sep)) {
    throw new Error("Lifecycle profile must be inside the selected disposable work root");
  }
  const profile = lifecycleProfile ? resolve(lifecycleProfile) : await mkdtemp(join(tmpdir(), "esmer-lifecycle-"));
  const marker = join(profile, "synthetic-accepted-id.txt");
  let app: Awaited<ReturnType<typeof electron.launch>> | undefined;
  try {
    await mkdir(profile, { recursive: true });
    const actualProfile = await realpath(profile);
    if (lifecycleProfile && !actualProfile.startsWith(allowedRoot + sep)) throw new Error("Linked lifecycle profile is outside work root");
    if (!reusePhase8) {
      try { await readFile(marker, "utf8"); }
      catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
        const store = openStore(join(profile, "analytics.sqlite"));
        try { await writeFile(marker, (await populateRecoveryStore(store)).datasetId, { flag: "wx" }); }
        finally { store.close(); }
      }
    }
    const baseline = storedBusinessData(join(profile, "analytics.sqlite"));
    expect(baseline.records.source_lines.length).toBeGreaterThan(0);
    for (let launch = 0; launch < 2; launch++) {
      app = await electron.launch({ executablePath, args: [`--user-data-dir=${profile}`] });
      const page = await app.firstWindow();await openWorkspace(page);
      expect(await app.evaluate(({ app }) => app.isPackaged)).toBe(true);
      expect(await app.evaluate(({ app }) => app.getPath("userData"))).toBe(actualProfile);
      await expect(page.getByRole("navigation", { name: "Ana gezinme" }).getByRole("button", { name: "Rapor ve Excel", exact: true })).toBeVisible();
      expect(await page.evaluate(() => window.esmer.getAvailability())).toMatchObject({ status: "ready", store: "loaded", liveConnection: "disabled" });
      const expenses = await page.evaluate(() => window.esmer.queryExpenses({ period: "2025-09" }));
      expect(expenses).toMatchObject({ rows: expect.any(Array) });
      expect((expenses as { rows: unknown[] }).rows.length).toBeGreaterThan(0);
      await app.close();
      app = undefined;
      expect(storedBusinessData(join(profile, "analytics.sqlite"))).toEqual(baseline);
    }
  } finally {
    if (app) await app.close();
    if (!lifecycleProfile) await rm(profile, { recursive: true, force: true });
  }
});

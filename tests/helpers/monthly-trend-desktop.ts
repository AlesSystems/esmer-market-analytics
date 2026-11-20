import { test as base, expect, _electron as electron, type ElectronApplication, type Locator, type Page, type TestInfo } from "@playwright/test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { executablePath } from "./desktop-executable";
import { importPackage, openWorkspace } from "./desktop-navigation";

type TrendDesktop = {
  page: Page;
  importSnapshot: (contents: Uint8Array) => Promise<void>;
  captureTrend: (chart: Locator, name: string, testInfo: TestInfo) => Promise<void>;
};

export const test = base.extend<{ trendDesktop: TrendDesktop }>({
  trendDesktop: async ({}, use) => {
    const userData = await mkdtemp(join(tmpdir(), "esmer-monthly-trend-"));
    let app: ElectronApplication | undefined;
    try {
      const launched = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] });
      app = launched;
      const page = await launched.firstWindow();
      await openWorkspace(page);
      const file = join(userData, "trend.json");
      await launched.evaluate(({ dialog }, path) => {
        dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [path] });
      }, file);
      await use({
        page,
        importSnapshot: async contents => {
          await writeFile(file, contents);
          await importPackage(page);
        },
        captureTrend: (chart, name, testInfo) => captureTrend(launched, page, chart, name, testInfo),
      });
    } finally {
      await app?.close().catch(() => {});
      await rm(userData, { recursive: true, force: true, maxRetries: 5 });
    }
  },
});

async function captureTrend(app: ElectronApplication, page: Page, chart: Locator, name: string, testInfo: TestInfo) {
  const table = chart.getByRole("table");
  const disclosure = chart.getByText("Aylık değerleri göster", { exact: true });
  const width = 680;
  const capture = async (part: "chart" | "table", zoom: number) => {
    const png = await app.evaluate(async ({ BrowserWindow }) =>
      (await BrowserWindow.getAllWindows()[0].webContents.capturePage()).toPNG().toString("base64"));
    await writeFile(testInfo.outputPath(`${name}-${part}-${width}-zoom${zoom}.png`), Buffer.from(png, "base64"));
  };
  try {
    for (const zoom of [1, 2]) {
      await app.evaluate(({ BrowserWindow }, viewport) => {
        const window = BrowserWindow.getAllWindows()[0];
        window.setContentSize(viewport.width, 1000);
        window.webContents.setZoomFactor(viewport.zoom);
      }, { width, zoom });
      await expect.poll(() => page.evaluate(() => innerWidth)).toBe(width / zoom);
      await expect.poll(() => chart.evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true);
      await page.evaluate(() => document.fonts.ready);

      if (await table.isVisible()) await disclosure.press("Enter");
      await expect(table).toBeHidden();
      await chart.evaluate(node => node.scrollIntoView({ block: "start", behavior: "instant" }));
      await expect(chart.getByRole("heading")).toBeInViewport();
      await capture("chart", zoom);

      await disclosure.press("Enter");
      await expect(table).toBeVisible();
      await expect.poll(() => table.evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true);
      await table.evaluate(node => node.scrollIntoView({ block: "end", behavior: "instant" }));
      await expect(table.getByRole("row").last()).toBeInViewport();
      await capture("table", zoom);
    }
  } finally {
    await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].webContents.setZoomFactor(1));
  }
}

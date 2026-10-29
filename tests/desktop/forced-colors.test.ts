import { executablePath } from "../helpers/desktop-executable";
import { createHash } from "node:crypto";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test, expect, _electron as electron, type Page } from "@playwright/test";
import { importPackage, openWorkspace } from "../helpers/desktop-navigation";
import { richEstimatePackage } from "../helpers/rich-estimate-fixture";


test("forced colors keeps a keyboard focus outline on tabs and the month stepper", async ({}, testInfo) => {
  const { app, userData, packagePath } = await importedApp();
  try {
    const page = await app.firstWindow();await openWorkspace(page);
    await app.evaluate(({ dialog }, path) => { dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [path] }); }, packagePath);
    await importPackage(page);
    await expect(page.getByRole("navigation", { name: "Ana gezinme" }).getByRole("button", { name: "Bu ay", exact: true })).toHaveAttribute("aria-current", "page");
    await page.emulateMedia({ forcedColors: "active" });
    for (const control of [page.getByRole("navigation", { name: "Ana gezinme" }).getByRole("button", { name: "Giderler", exact: true }), page.getByRole("group", { name: "Dönem", exact: true }).getByRole("button", { name: "Önceki ay", exact: true })]) {
      await control.focus();
      await control.press("Tab");
      await page.keyboard.press("Shift+Tab");
      await expect(control).toBeFocused();
      const outline = await control.evaluate(node => {
        const style = getComputedStyle(node);
        return { style: style.outlineStyle, width: parseFloat(style.outlineWidth) };
      });
      expect(outline.style).not.toBe("none");
      expect(outline.width).toBeGreaterThanOrEqual(2);
    }
    await capture(page, testInfo.outputPath("forced-colors-keyboard-focus.png"));
  } finally {
    await app.close();
    await rm(userData, { recursive: true, force: true });
  }
});

async function importedApp(bytes = richEstimatePackage()) {
  const userData = await mkdtemp(join(tmpdir(), "esmer-forced-colors-"));
  const packagePath = join(userData, "representative-month.json");
  await writeFile(packagePath, bytes);
  const app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] });
  return { app, userData, packagePath, fixtureHash: createHash("sha256").update(bytes).digest("hex") };
}

async function capture(page: Page, path: string, fullPage = false) {
  await expect(page.locator('[aria-busy="true"]').filter({ visible: true })).toHaveCount(0);
  await page.screenshot({ path, fullPage, animations: "disabled" });
}


import {test, expect, _electron as electron, type Page} from "@playwright/test";
import {mkdtemp, mkdir, rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join, resolve} from "node:path";
import {openStore} from "../../src/store/store";
import {businessPackage} from "../helpers/business-fixtures";
import {richEstimatePackage} from "../helpers/rich-estimate-fixture";
import {richBusinessPackage, seedRichExpenses} from "../helpers/rich-business-fixture";
import {openReportView, openSection, openWorkspace} from "../helpers/desktop-navigation";
import {executablePath} from "../helpers/desktop-executable";

const output = process.env.ESMER_CAPTURE_VISUAL;
type Capture = {name: string; open: (page: Page) => Promise<void>};
const pages: Capture[] = [
  ...(["Bu ay", "Ürünler", "Giderler"] as const).map(name => ({name, open: (page: Page) => openSection(page, name)})),
  ...(["Aylık rapor", "Veri ve kaynak", "Alış belgeleri"] as const).map(name => ({name: `Rapor ve Excel ${name}`, open: (page: Page) => openReportView(page, name)})),
];
const profiles = [{name: "source", source: true, rich: false, month: "2025-10"}, {name: "financial", source: false, rich: false, month: null}, {name: "financial-rich", source: false, rich: true, month: "2025-09"}];

for (const profile of profiles) test(`capture ${profile.name} pages`, async () => {
  test.skip(!output, "set ESMER_CAPTURE_VISUAL to a directory");
  test.setTimeout(120_000);
  const userData = await mkdtemp(join(tmpdir(), "esmer-visual-")), store = openStore(join(userData, "analytics.sqlite"));
  try { store.importPackage(profile.rich ? richBusinessPackage() : businessPackage()); if (profile.rich) seedRichExpenses(store); if (profile.source) store.importSourcePreview(richEstimatePackage()); } finally { store.close(); }
  const app = await electron.launch({executablePath, args: [`--user-data-dir=${userData}`]});
  try {
    const page = await app.firstWindow(), directory = resolve(output!, profile.name);
    await mkdir(directory, {recursive: true});
    await openWorkspace(page);
    if (profile.month) await page.locator(".sidebar").getByLabel("Dönem", {exact: true}).fill(profile.month);
    for (const size of [{width: 1440, height: 900}, {width: 1120, height: 760}]) {
      await app.evaluate(({BrowserWindow}, s) => BrowserWindow.getAllWindows()[0].setSize(s.width, s.height), size);
      for (const {name, open} of pages) {
        await open(page);
        await expect(page.getByRole("heading", {level: 1}).first()).toBeVisible();
        await page.waitForTimeout(600);
        await page.screenshot({path: join(directory, `${name.replace(/[^\p{L}\p{N}]+/gu, "-")}-${size.width}.png`), fullPage: true});
      }
    }
  } finally { await app.close(); await rm(userData, {recursive: true, force: true}); }
});

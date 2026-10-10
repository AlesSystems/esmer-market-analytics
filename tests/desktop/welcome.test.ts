import { test, expect, _electron as electron } from "@playwright/test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { executablePath } from "../helpers/desktop-executable";

test("every packaged launch opens welcome with real workspace shortcuts", async () => {
  const userData = await mkdtemp(join(tmpdir(), "esmer-welcome-"));
  try {
    for (let launch = 0; launch < 2; launch++) {
      const app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] });
      try {
        const page = await app.firstWindow();
        await expect(page.getByRole("heading", { name: "Marketinize bir bütün olarak bakın.", level: 1 })).toBeVisible();
        await expect(page.getByRole("navigation", { name: "Ana gezinme" })).not.toBeVisible();
        await expect(page.getByRole("button", { name: "Özeti aç", exact: true })).toBeVisible();
        const shortcuts = page.getByRole("navigation", { name: "Doğrudan aç" });
        for (const name of ["Satışlar", "Alışlar ve maliyet", "Giderler", "Raporlar"]) {
          await expect(shortcuts.getByRole("button", { name: new RegExp(name) })).toBeVisible();
        }
        const guide = page.getByRole("button", { name: /Başlangıç rehberi/ });
        await expect(guide).toHaveAttribute("aria-expanded", "false");
        await guide.click();
        await expect(guide).toHaveAttribute("aria-expanded", "true");
        await expect(page.getByRole("heading", { name: "Özet ile başlayın.", exact: true })).toBeVisible();
        await page.getByRole("button", { name: "Ayarlar", exact: true }).click();
        await expect(page.getByRole("heading", { name: "Ayarlar", level: 1, exact: true })).toBeVisible();
      } finally {
        await app.close();
      }
    }
  } finally {
    await rm(userData, { recursive: true, force: true });
  }
});

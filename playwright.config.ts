import { defineConfig } from "@playwright/test";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
const privatePreview = Boolean(process.env.ESMER_SQL_PREVIEW_PACKAGE);
if (privatePreview) process.env.PLAYWRIGHT_NO_COPY_PROMPT = "1";
export default defineConfig({
  testDir: "./tests/desktop",
  timeout: 30_000,
  workers: 1,
  reporter: "list",
  use: {trace: "off", video: "off", screenshot: "off"},
  outputDir: privatePreview ? mkdtempSync(join(tmpdir(), "esmer-private-test-results-")) : "test-results",
});

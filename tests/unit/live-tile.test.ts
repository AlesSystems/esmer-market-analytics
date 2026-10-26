import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, test, vi } from "vitest";
import type { Coverage } from "../../src/ui/sections";
import { SettingsPage } from "../../src/ui/settings/SettingsPage";
import { liveState, type LiveConnection, type LiveStatusResult } from "../../src/ui/settings/live";

vi.mock("../../src/ui/settings/limitations-data", () => ({limitations: () => []}));

const status = (phase: "idle" | "refreshing", lastSuccessAt: string | null): LiveStatusResult => ({status: "live", configured: true, cutoff: null, live: {phase, error: null, lastAttemptAt: "2025-10-31T09:00:00.000Z", lastSuccessAt, lastDatasetId: lastSuccessAt && "a".repeat(64), lastRecord: lastSuccessAt ? "preview" : "none", persistenceError: false}});
const connection = (value: LiveStatusResult, busy = false): LiveConnection => ({status: value, state: liveState(value, true), busy, run: async () => undefined});
const facts = (live: LiveConnection, source: Coverage = {from: "2025-05-01", to: "2025-10-31", last: "2025-10-12"}, sqlImporting = false) => {
  const html = renderToStaticMarkup(h(SettingsPage, {availability: undefined, source, sourceResolution: {status: "resolved"}, live, importing: false, sqlImporting, onImportPackage() {}, onImportSql() {}, onRecovery() {}, onClose() {}, claimFocus: () => false}));
  const tile = html.slice(html.indexOf('aria-label="Canlı bağlantı"'));
  const fact = (name: string) => new RegExp(`<dt>${name}</dt><dd>([^<]*)</dd>`).exec(tile)?.[1];
  return {refreshed: fact("Son yenileme"), latest: fact("Son geçerli veri")};
};

test("Son geçerli veri is the last source document date, not the end of the connection range", () => {
  expect(facts(connection(status("idle", "2025-10-31T09:00:10.000Z"))).latest).toBe("12.10.2025");
  expect(facts(connection(status("idle", null)), {from: "2025-05-01", to: "2025-10-31", last: null}).latest).toBe("Henüz yok");
});

test("Son yenileme shows the run in progress until the refresh or SQL import has finished", () => {
  const done = status("idle", "2025-10-31T09:00:10.000Z");
  expect(facts(connection(done, true)).refreshed).toBe("Yenileniyor…");
  expect(facts(connection(done), undefined, true).refreshed).toBe("Yenileniyor…");
  expect(facts(connection(status("refreshing", "2025-10-30T09:00:10.000Z"))).refreshed).toBe("Yenileniyor…");
  expect(facts(connection(done)).refreshed).toMatch(/^\d{2}\.\d{2}\.\d{4} \d{2}:\d{2}$/);
});

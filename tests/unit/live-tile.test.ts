import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import { LivePanel } from "../../src/ui/settings/LivePanel";
import { liveState, liveTrouble, type LiveConnection, type LiveStatusResult } from "../../src/ui/settings/live";

const status = (phase: "idle" | "refreshing", lastSuccessAt: string | null): LiveStatusResult => ({status: "live", configured: true, cutoff: null, live: {phase, error: null, lastAttemptAt: "2025-10-31T09:00:00.000Z", lastSuccessAt, lastDatasetId: lastSuccessAt && "a".repeat(64), lastRecord: lastSuccessAt ? "preview" : "none", persistenceError: false}});
const connection = (value: LiveStatusResult, busy = false): LiveConnection => ({status: value, state: liveState(value, true), busy, run: async () => undefined});
const facts = (live: LiveConnection, cutoff: string | null = "2025-10-12", sqlImporting = false) => {
  const html = renderToStaticMarkup(h(LivePanel, {live, cutoff: cutoff ?? undefined, hasData: true, sqlImporting, onImportSql() {}, onClose() {}}));
  const panel = html.slice(html.indexOf('aria-label="Canlı bağlantı"'));
  const fact = (name: string) => new RegExp(`<dt>${name}</dt><dd>([^<]*)</dd>`).exec(panel)?.[1];
  return {refreshed: fact("Son yenileme"), latest: fact("Son geçerli veri")};
};

test("Son geçerli veri is the last source document date, not the end of the connection range", () => {
  expect(facts(connection(status("idle", "2025-10-31T09:00:10.000Z"))).latest).toBe("12.10.2025");
  expect(facts(connection(status("idle", null)), null).latest).toBe("Henüz yok");
});

test("Son yenileme shows the run in progress until the refresh or SQL import has finished", () => {
  const done = status("idle", "2025-10-31T09:00:10.000Z");
  expect(facts(connection(done, true)).refreshed).toBe("Yenileniyor…");
  expect(facts(connection(done), "2025-10-12", true).refreshed).toBe("Yenileniyor…");
  expect(facts(connection(status("refreshing", "2025-10-30T09:00:10.000Z"))).refreshed).toBe("Yenileniyor…");
  expect(facts(connection(done)).refreshed).toMatch(/^\d{2}\.\d{2}\.\d{4} \d{2}:\d{2}$/);
});

test("only an enabled connection that is stale or unreadable counts as trouble", () => {
  const stale: LiveStatusResult = { status: "live", configured: true, cutoff: null, live: { phase: "stale", error: "SOURCE_UNAVAILABLE", lastAttemptAt: "2025-10-31T09:00:00.000Z", lastSuccessAt: null, lastDatasetId: null, lastRecord: "none", persistenceError: false } };
  const off: LiveStatusResult = { ...stale, live: { phase: "disabled", error: null, lastAttemptAt: null, lastSuccessAt: null, lastDatasetId: null, lastRecord: "none", persistenceError: false } };
  expect(liveTrouble(stale, "stale")).toBe(true);
  expect(liveTrouble(status("idle", "2025-10-31T09:00:10.000Z"), "unknown")).toBe(true);
  expect(liveTrouble(status("idle", "2025-10-31T09:00:10.000Z"), "on")).toBe(false);
  expect(liveTrouble(status("refreshing", "2025-10-31T09:00:10.000Z"), "checking")).toBe(false);
  expect(liveTrouble(off, "off")).toBe(false);
  expect(liveTrouble(off, "unknown")).toBe(false);
  expect(liveTrouble(undefined, "unknown")).toBe(false);
});

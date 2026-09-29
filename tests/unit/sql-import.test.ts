import { expect, test } from "vitest";
import type { LiveResult } from "../../src/domain/contracts";
import type { LiveStatus } from "../../src/source/live-contracts";
import { importSqlSource } from "../../src/ui/sql-import";

const disabledLive: LiveStatus = {
  phase: "disabled",
  error: null,
  lastAttemptAt: null,
  lastSuccessAt: null,
  lastDatasetId: null,
  lastRecord: "none",
  persistenceError: false,
};

const enabledLive: LiveStatus = {
  phase: "idle",
  error: null,
  lastAttemptAt: "2025-01-02T00:00:00.000Z",
  lastSuccessAt: "2025-01-02T00:00:00.000Z",
  lastDatasetId: "preview-1",
  lastRecord: "preview",
  persistenceError: false,
};

const configureOk: LiveResult = {
  status: "live",
  configured: true,
  live: disabledLive,
  cutoff: null,
};

const enableOk: LiveResult = {
  status: "live",
  configured: true,
  live: enabledLive,
  cutoff: null,
};

const refreshOk: LiveResult = {
  status: "live",
  configured: true,
  live: {
    phase: "idle",
    lastDatasetId: "preview-1",
    lastSuccessAt: "2025-01-02T00:00:00.000Z",
    error: null,
    lastAttemptAt: "2025-01-02T00:00:00.000Z",
    lastRecord: "preview",
    persistenceError: false,
  },
  cutoff: "2025-01-31T00:00:00.000Z",
};

test("cancelled configure returns that result and leaves enabled false; success enables and returns refresh", async () => {
  let enabled = false;
  const cancelled = await importSqlSource({
    configureLiveSource: async () => ({ status: "cancelled" }),
    setLiveEnabled: async value => {
      enabled = value;
      return enableOk;
    },
    refreshLiveSource: async () => refreshOk,
  });
  expect(cancelled).toEqual({ status: "cancelled" });
  expect(enabled).toBe(false);

  const result = await importSqlSource({
    configureLiveSource: async () => configureOk,
    setLiveEnabled: async value => {
      enabled = value;
      return enableOk;
    },
    refreshLiveSource: async () => refreshOk,
  });
  expect(result).toEqual(refreshOk);
  expect(enabled).toBe(true);
});

test("enable failure returns that result and does not refresh; success refreshes", async () => {
  let refreshed = false;
  const enableFailed: LiveResult = {
    status: "live-failed",
    code: "LIVE_UNAVAILABLE",
    message: "Bağlantı durumu okunamadı.",
  };
  const failed = await importSqlSource({
    configureLiveSource: async () => configureOk,
    setLiveEnabled: async () => enableFailed,
    refreshLiveSource: async () => {
      refreshed = true;
      return refreshOk;
    },
  });
  expect(failed).toEqual(enableFailed);
  expect(refreshed).toBe(false);

  const result = await importSqlSource({
    configureLiveSource: async () => configureOk,
    setLiveEnabled: async () => enableOk,
    refreshLiveSource: async () => {
      refreshed = true;
      return refreshOk;
    },
  });
  expect(result).toEqual(refreshOk);
  expect(refreshed).toBe(true);
});

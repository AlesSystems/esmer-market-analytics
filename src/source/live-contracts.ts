export const LIVE_ERROR_CODES = ["SOURCE_UNAVAILABLE", "PERMISSION_DENIED", "SOURCE_CHANGED", "UNSUPPORTED_MAPPING", "INVALID_CANDIDATE", "STORAGE_FULL", "INTERRUPTED", "REFRESH_TIMEOUT"] as const;
export type LiveErrorCode = typeof LIVE_ERROR_CODES[number];
type LiveHistory = {lastAttemptAt: string | null; lastSuccessAt: string | null; lastDatasetId: string | null; persistenceError: boolean};
export type LiveStatus = LiveHistory & (
  | {phase: "disabled" | "idle" | "refreshing"; error: null}
  | {phase: "stale"; error: LiveErrorCode | null}
);
export type LiveRefreshResult = {status: "disabled" | "busy" | "cancelled"} | {status: "active" | "unchanged"; datasetId: string} | {status: "failed"; code: LiveErrorCode};

export function readLiveStatus(value: unknown): LiveStatus | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const status = value as Record<string, unknown>;
  if (Object.keys(status).sort().join() !== ["phase", "error", "lastAttemptAt", "lastSuccessAt", "lastDatasetId", "persistenceError"].sort().join()) return null;
  const date = (value: unknown) => value === null || typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value;
  if (!["disabled", "idle", "refreshing", "stale"].includes(String(status.phase)) || !date(status.lastAttemptAt) || !date(status.lastSuccessAt) || typeof status.persistenceError !== "boolean") return null;
  if (status.lastDatasetId !== null && (typeof status.lastDatasetId !== "string" || !/^[a-f0-9]{64}$/.test(status.lastDatasetId))) return null;
  if ((status.lastSuccessAt === null) !== (status.lastDatasetId === null)) return null;
  if (status.error !== null && (status.phase !== "stale" || !LIVE_ERROR_CODES.includes(status.error as LiveErrorCode))) return null;
  return {...status} as LiveStatus;
}

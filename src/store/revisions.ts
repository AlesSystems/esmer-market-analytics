export type Pin = { datasetId: string | null; appRevision: number };
export type Target = { datasetId: string; kind: "document" | "line"; sourceId: string };
type Provenance = { reason: string; evidence: string };
export type AppChange = { entityId: string } & (
  | { kind: "expense"; value: Provenance & { net: string; date: string } }
  | { kind: "adjustment"; value: Provenance & { net: string; target: Target; reversed: boolean } }
  | { kind: "confirmation"; value: Provenance & { period: string; reviewedRevision: number; complete: boolean } }
  | { kind: "setting"; value: Provenance & { currency: "TRY" } }
);
export type AppRecord = AppChange & { revision: number; applicability?: "applicable" | "review-required" | "reversed" };
export type AcceptedReport = { id: string; pin: Pin; calculationVersion: string; evidence: string[]; output: Record<string, unknown> };
export function validId(value: unknown): value is string { return typeof value === "string" && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(value); }
export function requireValid(value: unknown): asserts value { if (!value) throw new Error("INVALID_CHANGE"); }
function exactKeys(value: object, keys: string[]) { requireValid(Object.keys(value).sort().join() === keys.sort().join()); }
export function validateChange(change: AppChange) {
  requireValid(change && typeof change === "object"); exactKeys(change, ["kind", "entityId", "value"]);
  requireValid(validId(change.entityId) && change.value && typeof change.value === "object");
  const v = change.value;
  requireValid(typeof v.reason === "string" && v.reason.trim().length > 0 && v.reason.length <= 1000 && validId(v.evidence));
  if (change.kind === "expense" || change.kind === "adjustment") requireValid(typeof change.value.net === "string" && /^-?(?:0|[1-9][0-9]{0,39})(?:\.[0-9]{1,30})?$/.test(change.value.net));
  switch (change.kind) {
    case "expense":
      exactKeys(v, ["net", "date", "reason", "evidence"]);
      requireValid(/^\d{4}-\d{2}-\d{2}$/.test(change.value.date) && new Date(change.value.date).toISOString().slice(0, 10) === change.value.date); break;
    case "adjustment": {
      exactKeys(v, ["net", "target", "reversed", "reason", "evidence"]);
      const target = change.value.target;
      requireValid(target && typeof target === "object"); exactKeys(target, ["datasetId", "kind", "sourceId"]);
      requireValid(validId(target.datasetId) && validId(target.sourceId) && ["document", "line"].includes(target.kind) && typeof change.value.reversed === "boolean"); break;
    }
    case "confirmation":
      exactKeys(v, ["period", "reviewedRevision", "complete", "reason", "evidence"]);
      requireValid(/^\d{4}-(?:0[1-9]|1[0-2])$/.test(change.value.period) && Number.isSafeInteger(change.value.reviewedRevision) && change.value.reviewedRevision >= 0 && typeof change.value.complete === "boolean"); break;
    case "setting": exactKeys(v, ["currency", "reason", "evidence"]); requireValid(change.value.currency === "TRY"); break;
    default: throw new Error("INVALID_CHANGE");
  }
}

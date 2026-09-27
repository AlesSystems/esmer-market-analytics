import { realpath } from "node:fs/promises";
import { basename, isAbsolute, relative, resolve } from "node:path";

export const SYNTHETIC_DEV_DATABASE = "EsmerSyntheticDev";
export const SYNTHETIC_DEV_READER = "EsmerSyntheticDevReader";

const EPHEMERAL_NAME = /^EsmerLiveFixture_[0-9a-f]{16}$/;
const MISSING = ["cost", "customer", "employee", "product-name", "supplier", "finance"] as const;
const SCENARIOS = ["insert", "correct", "delete", "backdate", "source-reset", "incomplete", "late-low-id", "permission-loss", "connection-loss", "rejected-candidate"] as const;

export type ScenarioName = (typeof SCENARIOS)[number];
export type SyntheticHeader = {id: string; fisTuru: 11 | 12; date: string; genelToplam: string};
export type SyntheticLine = {id: string; header: string};
export type SyntheticObservation = {
  label: "SYNTHETIC";
  missing: readonly string[];
  headers: readonly SyntheticHeader[];
  lines: readonly SyntheticLine[];
  error?: "SOURCE_REJECTED" | "SOURCE_UNAVAILABLE" | "SOURCE_CHANGED";
};

export function pathIsInsideRepo(candidate: string, root: string): boolean {
  const rel = relative(root, candidate);
  return rel === "" || (!rel.startsWith("..") && !isAbsolute(rel));
}

export async function assertConfigOutsideRepo(path: string, repoRoot: string): Promise<void> {
  const absolute = resolve(path);
  const root = await realpath(repoRoot).catch(() => repoRoot);
  let candidate = absolute;
  try {candidate = await realpath(absolute);}
  catch {
    try {candidate = resolve(await realpath(resolve(absolute, "..")), basename(absolute));}
    catch {throw new Error("UNSAFE_CONFIG_PATH");}
  }
  if (pathIsInsideRepo(candidate, root)) throw new Error("UNSAFE_CONFIG_PATH");
}

export function assertDropTarget(name: string, ephemeralCreated: ReadonlySet<string>): {kind: "ephemeral"} | {kind: "dev"} {
  if (name === SYNTHETIC_DEV_DATABASE) return {kind: "dev"};
  if (EPHEMERAL_NAME.test(name) && ephemeralCreated.has(name)) return {kind: "ephemeral"};
  throw new Error("UNSAFE_FIXTURE_TARGET");
}

export function baselineExpected(): SyntheticObservation {
  return {
    label: "SYNTHETIC",
    missing: [...MISSING],
    headers: [
      {id: "1001", fisTuru: 11, date: "2025-09-10", genelToplam: "123.12345678"},
      {id: "1002", fisTuru: 12, date: "2025-09-11", genelToplam: "40.00000000"},
    ],
    lines: [
      {id: "2001", header: "1001"},
      {id: "2002", header: "1002"},
    ],
  };
}

export function checkExpected(
  snapshotHeaders: ReadonlyArray<Record<string, string | null>>,
  snapshotLines: ReadonlyArray<Record<string, string | null>>,
  expected: Pick<SyntheticObservation, "headers" | "lines">,
): {ok: true} | {ok: false; mismatches: string[]} {
  const mismatches: string[] = [];
  const headerIds = snapshotHeaders.map(row => row.ID ?? "");
  const expectedHeaderIds = expected.headers.map(row => row.id);
  if (headerIds.join(",") !== expectedHeaderIds.join(",")) mismatches.push(`headers:${headerIds.join(",") || "none"}!=${expectedHeaderIds.join(",") || "none"}`);
  for (const header of expected.headers) {
    const actual = snapshotHeaders.find(row => row.ID === header.id);
    if (!actual) continue;
    if (actual.GENELTOPLAM !== header.genelToplam) mismatches.push(`GENELTOPLAM:${header.id}:${actual.GENELTOPLAM ?? "null"}!=${header.genelToplam}`);
    if (actual.FIS_TURU !== String(header.fisTuru)) mismatches.push(`FIS_TURU:${header.id}:${actual.FIS_TURU ?? "missing"}!=${header.fisTuru}`);
    if (actual.FIS_TARIHI == null || !actual.FIS_TARIHI.startsWith(header.date)) mismatches.push(`FIS_TARIHI:${header.id}:${actual.FIS_TARIHI ?? "missing"}!=${header.date}`);
  }
  const lineIds = snapshotLines.map(row => row.ID ?? "");
  const expectedLineIds = expected.lines.map(row => row.id);
  if (lineIds.join(",") !== expectedLineIds.join(",")) mismatches.push(`lines:${lineIds.join(",") || "none"}!=${expectedLineIds.join(",") || "none"}`);
  return mismatches.length ? {ok: false, mismatches} : {ok: true};
}

export function scenarioNames(): readonly ScenarioName[] {
  return SCENARIOS;
}

export function isScenarioName(value: string): value is ScenarioName {
  return (SCENARIOS as readonly string[]).includes(value);
}

export function scenarioExpected(name: ScenarioName): SyntheticObservation {
  const baseline = baselineExpected();
  switch (name) {
    case "insert":
      return {
        ...baseline,
        headers: [...baseline.headers, {id: "1003", fisTuru: 11, date: "2025-09-10", genelToplam: "10.00000000"}],
        lines: [...baseline.lines, {id: "2003", header: "1003"}],
      };
    case "correct":
      return {
        ...baseline,
        headers: baseline.headers.map(header => header.id === "1001" ? {...header, genelToplam: "50.00000000"} : header),
      };
    case "delete":
      return {
        ...baseline,
        headers: baseline.headers.filter(header => header.id !== "1002"),
        lines: baseline.lines.filter(line => line.id !== "2002"),
      };
    case "backdate":
      return {
        ...baseline,
        headers: baseline.headers.map(header => header.id === "1001" ? {...header, date: "2025-08-01"} : header),
      };
    case "source-reset":
      return {...baseline, headers: [], lines: []};
    case "incomplete":
      return {
        ...baseline,
        headers: [...baseline.headers, {id: "1004", fisTuru: 11, date: "2025-09-10", genelToplam: "123.12345678"}],
      };
    case "late-low-id":
      return {
        ...baseline,
        headers: [
          ...baseline.headers,
          {id: "1005", fisTuru: 11, date: "2025-09-10", genelToplam: "123.12345678"},
          {id: "1006", fisTuru: 11, date: "2025-09-10", genelToplam: "123.12345678"},
        ],
        lines: [
          ...baseline.lines,
          {id: "2005", header: "1005"},
          {id: "2006", header: "1006"},
        ],
      };
    case "permission-loss":
      return {...baseline, error: "SOURCE_REJECTED"};
    case "connection-loss":
      return {...baseline, error: "SOURCE_UNAVAILABLE"};
    case "rejected-candidate":
      return {...baseline, error: "SOURCE_CHANGED"};
  }
}

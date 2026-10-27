import { mkdtemp, mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "vitest";
import { assertConfigOutsideRepo, assertDropTarget, baselineExpected, checkExpected, pathIsInsideRepo, scenarioExpected } from "../../tools/synthetic-sql/observations";

test("assertDropTarget accepts only the stable database or an ephemeral name this process created", () => {
  expect(() => assertDropTarget("master", new Set())).toThrow(/^UNSAFE_FIXTURE_TARGET$/);
  expect(() => assertDropTarget("EsmerLiveFixture_", new Set())).toThrow(/^UNSAFE_FIXTURE_TARGET$/);
  expect(() => assertDropTarget("EsmerLiveFixtureLookalike_abababababababab", new Set(["EsmerLiveFixtureLookalike_abababababababab"]))).toThrow(/^UNSAFE_FIXTURE_TARGET$/);
  expect(assertDropTarget("EsmerSyntheticDev", new Set())).toEqual({kind: "dev"});
  const ephemeral = "EsmerLiveFixture_" + "ab".repeat(8);
  expect(assertDropTarget(ephemeral, new Set([ephemeral]))).toEqual({kind: "ephemeral"});
  expect(() => assertDropTarget(ephemeral, new Set())).toThrow(/^UNSAFE_FIXTURE_TARGET$/);
});

test("reader config paths inside the repository are refused", () => {
  expect(pathIsInsideRepo("/tmp/esmer-reader.json", "/Users/altanesmer/repo")).toBe(false);
  expect(pathIsInsideRepo("/Users/altanesmer/repo/tools/reader.json", "/Users/altanesmer/repo")).toBe(true);
});

const baselineSnapshot = {
  headers: [
    {ID: "1001", GENELTOPLAM: "123.12345678", FIS_TURU: "11", FIS_TARIHI: "2025-09-10T00:00:00.000"},
    {ID: "1002", GENELTOPLAM: "40.00000000", FIS_TURU: "12", FIS_TARIHI: "2025-09-11T00:00:00.000"},
  ],
  lines: [{ID: "2001", FIS: "1001"}, {ID: "2002", FIS: "1002"}],
};

test("checkExpected requires the raw type 12 observation and literal totals", () => {
  expect(checkExpected(baselineSnapshot.headers, baselineSnapshot.lines, baselineExpected())).toEqual({ok: true});
  const saleInsteadOfRawReturn = baselineSnapshot.headers.map(header => header.ID === "1002" ? {...header, FIS_TURU: "11"} : header);
  expect(checkExpected(saleInsteadOfRawReturn, baselineSnapshot.lines, baselineExpected())).toEqual({
    ok: false,
    mismatches: ["FIS_TURU:1002:11!=12"],
  });
  const missingType = baselineSnapshot.headers.map(header => header.ID === "1002" ? {...header, FIS_TURU: null} : header);
  expect(checkExpected(missingType, baselineSnapshot.lines, baselineExpected())).toEqual({
    ok: false,
    mismatches: ["FIS_TURU:1002:missing!=12"],
  });
  const wrongTotal = baselineSnapshot.headers.map(header => header.ID === "1001" ? {...header, GENELTOPLAM: "1.00000000"} : header);
  expect(checkExpected(wrongTotal, baselineSnapshot.lines, baselineExpected())).toEqual({
    ok: false,
    mismatches: ["GENELTOPLAM:1001:1.00000000!=123.12345678"],
  });
});

test("scenario observations describe the row changes a refresh must see", () => {
  const afterDelete = {
    headers: [{ID: "1001", GENELTOPLAM: "123.12345678", FIS_TURU: "11", FIS_TARIHI: "2025-09-10T00:00:00.000"}],
    lines: [{ID: "2001", FIS: "1001"}],
  };
  expect(checkExpected(afterDelete.headers, afterDelete.lines, scenarioExpected("delete"))).toEqual({ok: true});
  expect(checkExpected(baselineSnapshot.headers, baselineSnapshot.lines, scenarioExpected("delete"))).toEqual({
    ok: false,
    mismatches: ["headers:1001,1002!=1001", "lines:2001,2002!=2001"],
  });
  const corrected = baselineSnapshot.headers.map(header => header.ID === "1001" ? {...header, GENELTOPLAM: "50.00000000"} : header);
  expect(checkExpected(corrected, baselineSnapshot.lines, scenarioExpected("correct"))).toEqual({ok: true});
  const backdated = baselineSnapshot.headers.map(header => header.ID === "1001" ? {...header, FIS_TARIHI: "2025-08-01T00:00:00.000"} : header);
  expect(checkExpected(backdated, baselineSnapshot.lines, scenarioExpected("backdate"))).toEqual({ok: true});
  expect(checkExpected([], [], scenarioExpected("source-reset"))).toEqual({ok: true});
  expect(checkExpected([], [], baselineExpected())).toEqual({
    ok: false,
    mismatches: ["headers:none!=1001,1002", "lines:none!=2001,2002"],
  });
});

test("a reader config path inside the repository throws", async () => {
  const base = await mkdtemp(join(tmpdir(), "esmer-config-"));
  try {
    const repo = join(base, "repo");
    await mkdir(join(repo, "tools"), {recursive: true});
    await expect(assertConfigOutsideRepo(join(base, "esmer-reader.json"), repo)).resolves.toBeUndefined();
    await expect(assertConfigOutsideRepo(join(repo, "tools", "reader.json"), repo)).rejects.toThrow(/^UNSAFE_CONFIG_PATH$/);
  } finally { await rm(base, {recursive: true, force: true}); }
});

test("checkExpected rejects a line linked to the wrong parent", () => {
  const lines = baselineSnapshot.lines.map(line => line.ID === "2001" ? {...line, FIS: "1002"} : line);
  expect(checkExpected(baselineSnapshot.headers, lines, baselineExpected())).toEqual({ok: false, mismatches: ["FIS:2001:1002!=1001"]});
});

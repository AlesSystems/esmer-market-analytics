import { expect, test } from "vitest";
import { assertDropTarget, baselineExpected, checkExpected, pathIsInsideRepo } from "../../tools/synthetic-sql/observations";

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

test("checkExpected compares snapshot ids and GENELTOPLAM strings against the baseline", () => {
  const expected = baselineExpected();
  const matching = {
    headers: expected.headers.map(header => ({ID: header.id, GENELTOPLAM: header.genelToplam})),
    lines: expected.lines.map(line => ({ID: line.id})),
  };
  expect(checkExpected(matching.headers, matching.lines, expected)).toEqual({ok: true});
  const wrong = {
    headers: matching.headers.map(header => header.ID === "1001" ? {...header, GENELTOPLAM: "1.00000000"} : header),
    lines: matching.lines,
  };
  expect(checkExpected(wrong.headers, wrong.lines, expected)).toEqual({
    ok: false,
    mismatches: ["GENELTOPLAM:1001:1.00000000!=123.12345678"],
  });
  const dated = {
    headers: matching.headers.map(header => header.ID === "1001" ? {...header, FIS_TARIHI: "2025-01-01T00:00:00.000", FIS_TURU: "11"} : header),
    lines: matching.lines,
  };
  expect(checkExpected(dated.headers, dated.lines, expected)).toEqual({
    ok: false,
    mismatches: ["FIS_TARIHI:1001:2025-01-01T00:00:00.000!=2025-09-10"],
  });
});

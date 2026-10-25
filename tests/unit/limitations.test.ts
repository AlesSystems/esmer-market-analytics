import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import { parseLimitations, limitationStatuses } from "../../src/ui/settings/limitations";

const source = readFileSync("docs/operations/known-limitations-tr.md", "utf8");
const dataRows = source.split("\n").filter(line => line.startsWith("|")).length - 2;

describe("known limitations table", () => {
  test("every row of the real file parses with a known status and a Turkish limit", () => {
    const rows = parseLimitations(source);
    expect(rows.length).toBe(dataRows);
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      expect(limitationStatuses).toContain(row.status);
      expect(row.limit.length).toBeGreaterThan(0);
    }
  });
  test("issue links become plain text", () => {
    const [row] = parseLimitations("| Durum | Sınır | Not | Konu |\n| --- | --- | --- | --- |\n| açık | A | B | [#109](https://example.test/109) |");
    expect(row).toEqual({ status: "açık", limit: "A", note: "B", topic: "#109" });
  });
  test("rejects an unknown status", () => {
    expect(() => parseLimitations("| Durum | Sınır | Not | Konu |\n| --- | --- | --- | --- |\n| belki | A | B | — |")).toThrow();
  });
  test("splits on unescaped pipes only and unescapes \\|", () => {
    const [row] = parseLimitations("| Durum | Sınır | Not | Konu |\n| --- | --- | --- | --- |\n| açık | A \\| B | C | D |");
    expect(row).toEqual({ status: "açık", limit: "A | B", note: "C", topic: "D" });
  });
  test("reads CRLF files", () => {
    expect(parseLimitations("# Başlık\r\n\r\n| Durum | Sınır | Not | Konu |\r\n| --- | --- | --- | --- |\r\n| düzeltildi | A | B | C |\r\n")).toHaveLength(1);
  });
  test("ignores a second table later in the file", () => {
    const rows = parseLimitations("| Durum | Sınır | Not | Konu |\n| --- | --- | --- | --- |\n| açık | A | B | C |\n\nMetin\n\n| Ad | Değer |\n| --- | --- |\n| x | y |");
    expect(rows).toHaveLength(1);
  });
});

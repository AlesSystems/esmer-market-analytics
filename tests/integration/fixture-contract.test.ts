import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test } from "vitest";

const fixturePath = (path: string) => resolve("tests/fixtures", path);

test("phase 2 supplies independently specified G01–G08 synthetic oracles", () => {
  const path = fixturePath("golden/scenarios.json");
  expect(existsSync(path), "golden oracle catalogue is absent").toBe(true);
  const scenarios = JSON.parse(readFileSync(path, "utf8"));
  expect(scenarios.map((scenario: { id: string }) => scenario.id)).toEqual([
    "G01", "G02", "G03", "G04", "G05", "G06", "G07", "G08",
  ]);
});

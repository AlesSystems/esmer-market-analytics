import { expect, test, vi } from "vitest";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { handleRequest } from "../../src/desktop/requests";
import { loadPreferences, preferencesService, savePreferences, validPreferences } from "../../src/desktop/preferences";
import type { Preferences } from "../../src/domain/contracts";

const invoke = (trusted: boolean, operation: string, payload: unknown, preferences: Parameters<typeof handleRequest>[14]) =>
  handleRequest(trusted, operation, payload, vi.fn(), undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, preferences);

test("preference operations accept only trusted exact payloads", async () => {
  const preferences = {get: vi.fn().mockResolvedValue({status: "preferences", preferences: {textSize: "normal"}}), set: vi.fn()};
  expect(await invoke(false, "getPreferences", null, preferences)).toMatchObject({code: "UNTRUSTED_SENDER"});
  expect(await invoke(false, "setPreferences", {textSize: "large"}, preferences)).toMatchObject({code: "UNTRUSTED_SENDER"});
  for (const [operation, payload] of [
    ["getPreferences", {}], ["getPreferences", undefined], ["getPreferences", {textSize: "large"}],
    ["setPreferences", null], ["setPreferences", "large"], ["setPreferences", ["large"]], ["setPreferences", {}],
    ["setPreferences", {textSize: "large", zoom: 3}], ["setPreferences", {textSize: "huge"}], ["setPreferences", {textSize: 1.3}], ["setPreferences", {textSize: "toString"}],
  ] as const) expect(await invoke(true, operation, payload, preferences)).toMatchObject({status: "rejected", code: "INVALID_PAYLOAD"});
  expect(preferences.get).not.toHaveBeenCalled();
  expect(preferences.set).not.toHaveBeenCalled();
});

test("valid set then get round-trips through the service and applies the stored size", async () => {
  const directory = await mkdtemp(join(tmpdir(), "esmer-preferences-"));
  try {
    const apply = vi.fn();
    const service = preferencesService(directory, await loadPreferences(directory), apply);
    expect(await invoke(true, "getPreferences", null, service)).toEqual({status: "preferences", preferences: {textSize: "normal"}});
    expect(await invoke(true, "setPreferences", {textSize: "larger"}, service)).toEqual({status: "preferences", preferences: {textSize: "larger"}});
    expect(apply).toHaveBeenLastCalledWith({textSize: "larger"});
    expect(await invoke(true, "getPreferences", null, service)).toEqual({status: "preferences", preferences: {textSize: "larger"}});
    expect(await loadPreferences(directory)).toEqual({textSize: "larger"});
  } finally { await rm(directory, {recursive: true, force: true}); }
});

test("stored preferences fall back to normal when absent, corrupt or invalid", async () => {
  const directory = await mkdtemp(join(tmpdir(), "esmer-preferences-")), file = join(directory, "preferences.json");
  try {
    expect(await loadPreferences(directory)).toEqual({textSize: "normal"});
    for (const contents of ["{not json", "", "null", "[]", "\"large\"", JSON.stringify({textSize: "huge"}), JSON.stringify({textSize: "large", extra: true})]) {
      await writeFile(file, contents);
      expect(await loadPreferences(directory)).toEqual({textSize: "normal"});
    }
    await writeFile(file, "x".repeat(100_000));
    expect(await loadPreferences(directory)).toEqual({textSize: "normal"});
    await savePreferences(directory, {textSize: "large"});
    expect(JSON.parse(await readFile(file, "utf8"))).toEqual({textSize: "large"});
    expect(await loadPreferences(directory)).toEqual({textSize: "large"});
  } finally { await rm(directory, {recursive: true, force: true}); }
});

test("a failed write reports a Turkish failure and keeps the previous preference", async () => {
  const directory = await mkdtemp(join(tmpdir(), "esmer-preferences-"));
  try {
    const apply = vi.fn();
    const service = preferencesService(join(directory, "missing"), {textSize: "large"}, apply);
    expect(await service.set({textSize: "larger"})).toEqual({status: "preferences-failed", code: "PREFERENCES_UNAVAILABLE", message: "Görünüm tercihi kaydedilemedi. Önceki ayar korunuyor."});
    expect(apply).not.toHaveBeenCalled();
    expect(await service.get()).toEqual({status: "preferences", preferences: {textSize: "large"}});
  } finally { await rm(directory, {recursive: true, force: true}); }
});

test("overlapping writes apply and persist in request order", async () => {
  const directory = await mkdtemp(join(tmpdir(), "esmer-preferences-"));
  try {
    const apply = vi.fn();
    const service = preferencesService(directory, {textSize: "normal"}, apply);
    const results = await Promise.all((["large", "larger", "normal"] as const).map(textSize => service.set({textSize})));
    expect(results.map(result => result.status === "preferences" && result.preferences.textSize)).toEqual(["large", "larger", "normal"]);
    expect(apply.mock.calls.map(([preferences]) => preferences.textSize)).toEqual(["large", "larger", "normal"]);
    expect(await loadPreferences(directory)).toEqual({textSize: "normal"});
  } finally { await rm(directory, {recursive: true, force: true}); }
});

test("validPreferences accepts only known text sizes with exact keys", () => {
  for (const textSize of ["normal", "large", "larger"] satisfies Preferences["textSize"][]) expect(validPreferences({textSize})).toBe(true);
  for (const value of [null, undefined, "normal", [], {}, {textSize: "huge"}, {textSize: "constructor"}, {textSize: "normal", extra: 1}, Object.create({textSize: "normal"})]) expect(validPreferences(value)).toBe(false);
});

 test("month and text size patches merge in queue and survive restart", async () => {
  const directory = await mkdtemp(join(tmpdir(), "esmer-month-"));
  try {
    const service = preferencesService(directory, {textSize: "normal"}, vi.fn());
    await Promise.all([service.set({selectedMonth: "2026-09"}), service.set({textSize: "large"})]);
    expect(await loadPreferences(directory)).toEqual({textSize: "large", selectedMonth: "2026-09"});
    expect(await invoke(true, "setPreferences", {selectedMonth: "2026-10"}, service)).toEqual({status: "preferences", preferences: {textSize: "large", selectedMonth: "2026-10"}});
    for (const selectedMonth of ["2026-00", "2026-13", "26-09", "2026-09-01", null]) expect(await invoke(true, "setPreferences", {selectedMonth}, service)).toMatchObject({code: "INVALID_PAYLOAD"});
  } finally { await rm(directory, {recursive: true, force: true}); }
});

import { join } from "node:path";
import { atomicWriteFile } from "./atomic-file";
import { readPackageFile } from "./package-file";
import { textSizes, type Preferences, type PreferencesResult } from "../domain/contracts";

const defaults: Preferences = {textSize: "normal"};
export function validPreferences(value: unknown): value is Preferences {
  return !!value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).join() === "textSize"
    && typeof (value as Preferences).textSize === "string" && Object.hasOwn(textSizes, (value as Preferences).textSize);
}
export async function loadPreferences(userData: string): Promise<Preferences> {
  try {
    const saved: unknown = JSON.parse(Buffer.from(await readPackageFile(join(userData, "preferences.json"), 1024)).toString("utf8"));
    return validPreferences(saved) ? {textSize: saved.textSize} : defaults;
  } catch { return defaults; }
}
export async function savePreferences(userData: string, preferences: Preferences): Promise<void> {
  await atomicWriteFile(join(userData, "preferences.json"), Buffer.from(JSON.stringify({textSize: preferences.textSize})));
}
export function preferencesService(userData: string, initial: Preferences, apply: (preferences: Preferences) => void) {
  let current = initial;
  let queue: Promise<unknown> = Promise.resolve();
  async function write(preferences: Preferences): Promise<PreferencesResult> {
    try { await savePreferences(userData, preferences); }
    catch { return {status: "preferences-failed", code: "PREFERENCES_UNAVAILABLE", message: "Görünüm tercihi kaydedilemedi. Önceki ayar korunuyor."}; }
    current = {textSize: preferences.textSize};
    apply(current);
    return {status: "preferences", preferences: current};
  }
  return {
    get: async (): Promise<PreferencesResult> => ({status: "preferences", preferences: current}),
    set: (preferences: Preferences): Promise<PreferencesResult> => {
      const next = queue.then(() => write(preferences));
      queue = next;
      return next;
    },
  };
}

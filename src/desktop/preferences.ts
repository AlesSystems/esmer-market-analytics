import { join } from "node:path";
import { atomicWriteFile } from "./atomic-file";
import { readPackageFile } from "./package-file";
import { textSizes, type Preferences, type PreferencesPatch, type PreferencesResult } from "../domain/contracts";

const defaults: Preferences = {textSize: "normal"};
export function validPreferencesPatch(value: unknown): value is PreferencesPatch {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const patch = value as Record<string, unknown>, keys = Object.keys(patch);
  return keys.length > 0 && keys.every(key => key === "textSize" || key === "selectedMonth")
    && (!keys.includes("textSize") || typeof patch.textSize === "string" && Object.hasOwn(textSizes, patch.textSize))
    && (!keys.includes("selectedMonth") || typeof patch.selectedMonth === "string" && /^(?:19|[2-9][0-9])[0-9]{2}-(?:0[1-9]|1[0-2])$/.test(patch.selectedMonth));
}
export function validPreferences(value: unknown): value is Preferences {
  return validPreferencesPatch(value) && Object.hasOwn(value, "textSize");
}
export async function loadPreferences(userData: string): Promise<Preferences> {
  try {
    const saved: unknown = JSON.parse(Buffer.from(await readPackageFile(join(userData, "preferences.json"), 1024)).toString("utf8"));
    return validPreferences(saved) ? {...saved} : defaults;
  } catch { return defaults; }
}
export async function savePreferences(userData: string, preferences: Preferences): Promise<void> {
  await atomicWriteFile(join(userData, "preferences.json"), Buffer.from(JSON.stringify(preferences)));
}
export function preferencesService(userData: string, initial: Preferences, apply: (preferences: Preferences) => void) {
  let current = initial;
  let queue: Promise<unknown> = Promise.resolve();
  async function write(patch: PreferencesPatch): Promise<PreferencesResult> {
    const preferences = {...current, ...patch};
    try { await savePreferences(userData, preferences); }
    catch { return {status: "preferences-failed", code: "PREFERENCES_UNAVAILABLE", message: "Görünüm tercihi kaydedilemedi. Önceki ayar korunuyor."}; }
    current = preferences;
    apply(current);
    return {status: "preferences", preferences: current};
  }
  return {
    get: async (): Promise<PreferencesResult> => ({status: "preferences", preferences: current}),
    set: (preferences: PreferencesPatch): Promise<PreferencesResult> => {
      const next = queue.then(() => write(preferences));
      queue = next;
      return next;
    },
  };
}

import { DatabaseSync } from "node:sqlite";
import type { Availability } from "../domain/contracts";
export function getAvailability(): Availability {
  const database = new DatabaseSync(":memory:");
  try {
    database.prepare("SELECT sqlite_version() AS version").get();
    return { status: "ready", store: "empty", liveConnection: "disabled" };
  } finally {
    database.close();
  }
}

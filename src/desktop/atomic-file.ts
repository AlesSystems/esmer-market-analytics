import { randomUUID } from "node:crypto";
import { writeFile, rename, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
export async function atomicWriteFile(path: string, bytes: Uint8Array): Promise<void> {
  const temporary = join(dirname(path), `.esmer-${randomUUID()}.tmp`);
  try {
    await writeFile(temporary, bytes, {flag: "wx"});
    await rename(temporary, path);
  } finally { await rm(temporary, {force: true}); }
}

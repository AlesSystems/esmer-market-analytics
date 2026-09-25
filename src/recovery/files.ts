import { randomUUID } from "node:crypto";
import { mkdir, open, readdir, rename, rm, stat } from "node:fs/promises";
import { dirname, join } from "node:path";
export async function syncDirectory(path: string) {
  if (process.platform === "win32") {
    // Node cannot flush Windows directory handles. File data is flushed separately;
    // recovery journals cover process interruption, not power-loss persistence.
    if (!(await stat(path)).isDirectory()) throw new Error("RECOVERY_DIRECTORY_REQUIRED");
    return "unsupported" as const;
  }
  const handle = await open(path,"r");
  try { await handle.sync(); } finally { await handle.close(); }
  return "synced" as const;
}
export async function durableWrite(path: string, bytes: Uint8Array | string) {
  const temporary = `${path}.${randomUUID()}.partial`;
  try {
    const file = await open(temporary,"wx",0o600);
    try { await file.writeFile(bytes); await file.sync(); } finally { await file.close(); }
    await rename(temporary,path); await syncDirectory(dirname(path));
  } finally { await rm(temporary,{force:true}); }
}
export async function temporaryDirectory(databasePath: string) {
  const path = join(dirname(databasePath),`.esmer-recovery-${randomUUID()}`);
  await mkdir(path,{mode:0o700}); return path;
}
export async function cleanupTemporaryDirectories(databasePath: string) {
  for (const name of await readdir(dirname(databasePath))) if (/^\.esmer-recovery-[a-f0-9-]{36}$/.test(name)) await rm(join(dirname(databasePath),name),{recursive:true,force:true});
}

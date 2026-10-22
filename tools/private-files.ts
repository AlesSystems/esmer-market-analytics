import { open, link, unlink } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { parseSqlServerConfig, type SqlServerConfig } from "../src/source/sql-server.ts";

/** Reads a private (0600 on macOS/Linux), bounded SQL connection file. */
export async function readConnectionFile(path: string): Promise<SqlServerConfig> {
  const file = await open(path, "r");
  try {
    const stat = await file.stat();
    if (!stat.isFile() || stat.size > 16 * 1024 || process.platform !== "win32" && (stat.mode & 0o077) !== 0) throw Error("INVALID_CONFIG_FILE");
    return parseSqlServerConfig(JSON.parse(await file.readFile("utf8")));
  } finally { await file.close(); }
}

/** Writes bytes to a new 0600 file; fails if the destination already exists. */
export async function writeNewPrivateFile(path: string, bytes: Uint8Array): Promise<void> {
  const temporary = `${path}.${randomUUID()}.tmp`;
  const output = await open(temporary, "wx", 0o600);
  try {
    try { await output.writeFile(bytes); await output.sync(); } finally { await output.close(); }
    await link(temporary, path);
  } finally { await unlink(temporary); }
}

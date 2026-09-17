import { link, open, unlink } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { pathToFileURL } from "node:url";
import { extract, type ExtractOptions } from "../src/source/extract.ts";
import { MAX_BYTES, MAX_ROWS, writePackage, type Batch, type Metadata } from "../src/source/package.ts";

export async function preparePackage(options: ExtractOptions & { destination: string; metadata: Metadata; onRetry?: () => void }): Promise<{ ok: true } | { ok: false; code: "PREPARATION_FAILED" }> {
  let temporary: string | undefined;
  try {
    let batches: Batch[] = [];
    for (let attempt = 0; attempt < 2; attempt++) {
      batches = []; let rows = 0; let bytes = 0;
      try {
        for await (const batch of extract(options)) {
          rows += batch.records.length; bytes += Buffer.byteLength(JSON.stringify(batch));
          if (rows > MAX_ROWS || bytes > MAX_BYTES) throw new Error("PACKAGE_LIMIT");
          batches.push(batch);
        }
        break;
      } catch (error) {
        if (attempt !== 0 || !(error instanceof Error) || error.message !== "SOURCE_BUSY") throw error;
        options.onRetry?.();
      }
    }
    const bytes = writePackage(batches, options.metadata);
    if (options.signal?.aborted) throw new Error("CANCELLED");
    temporary = `${options.destination}.${randomUUID()}.partial`;
    const file = await open(temporary, "wx", 0o600);
    try { await file.writeFile(bytes); await file.sync(); } finally { await file.close(); }
    if (options.signal?.aborted) throw new Error("CANCELLED");
    await link(temporary, options.destination);
    return { ok: true };
  } catch { return { ok: false, code: "PREPARATION_FAILED" }; }
  finally { if (temporary) await unlink(temporary).catch(() => undefined); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [mode, path, destination, lineage, extractionId, extractedAt, from, to, completeness] = process.argv.slice(2);
  if (mode !== "synthetic-relational-v1" || !path || !destination || !lineage || !extractionId || !extractedAt || !from || !to || !["partial", "complete"].includes(completeness) || process.argv.length !== 11) {
    console.error("PREPARATION_ARGUMENTS_INVALID"); process.exitCode = 1;
  } else {
    const controller = new AbortController();
    const cancel = () => controller.abort();
    process.once("SIGINT", cancel); process.once("SIGTERM", cancel);
    const result = await preparePackage({ path, destination, mappingVersion: mode, signal: controller.signal, metadata: { lineage, extractionId, extractedAt, cutoff: to, coverage: { from, to, complete: completeness === "complete" } } });
    process.removeListener("SIGINT", cancel); process.removeListener("SIGTERM", cancel);
    console.log(result.ok ? "PACKAGE_PREPARED" : result.code); process.exitCode = result.ok ? 0 : 1;
  }
}

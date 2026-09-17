import { Worker } from "node:worker_threads";
import { MAPPING_VERSION, type Batch } from "./package.ts";

export type ExtractOptions = { path: string; mappingVersion: string; signal?: AbortSignal; timeoutMs?: number };
export async function* extract(options: ExtractOptions): AsyncGenerator<Batch> {
  if (options.mappingVersion !== MAPPING_VERSION) throw new Error("UNSUPPORTED_MAPPING");
  if (options.timeoutMs !== undefined && (!Number.isInteger(options.timeoutMs) || options.timeoutMs < 1 || options.timeoutMs > 10_000)) throw new Error("INVALID_TIMEOUT");
  if (options.signal?.aborted) throw new Error("EXTRACTION_CANCELLED");
  const worker = new Worker(new URL("./extract-worker.ts", import.meta.url), { workerData: { path: options.path }, execArgv: ["--disable-warning=ExperimentalWarning"] });
  let rejectPending: ((reason: Error) => void) | undefined;
  let failure: Error | undefined;
  let termination: Promise<number> | undefined;
  const terminate = () => termination ??= worker.terminate();
  const fail = (code: string) => { failure ??= new Error(code); rejectPending?.(failure); void terminate(); };
  const abort = () => fail("EXTRACTION_CANCELLED");
  options.signal?.addEventListener("abort", abort, { once: true });
  const timer = setTimeout(() => fail("EXTRACTION_TIMEOUT"), options.timeoutMs ?? 10_000);
  worker.on("error", () => fail("EXTRACTION_FAILED"));
  worker.on("exit", code => { if (code !== 0) fail("EXTRACTION_FAILED"); });
  function receive(): Promise<Batch | { ready: true } | { done: true } | { error: string }> {
    if (failure) return Promise.reject(failure);
    return new Promise((resolve, reject) => { rejectPending = reject; worker.once("message", message => { rejectPending = undefined; resolve(message); }); });
  }
  try {
    const initial = await receive();
    if (!("ready" in initial)) throw new Error("error" in initial && initial.error === "SOURCE_BUSY" ? "SOURCE_BUSY" : "EXTRACTION_FAILED");
    while (true) {
      const pending = receive(); worker.postMessage("next"); const message = await pending;
      if ("done" in message) return;
      if ("error" in message) throw new Error(message.error === "SOURCE_BUSY" ? "SOURCE_BUSY" : "EXTRACTION_FAILED");
      if (!("ready" in message)) yield message;
    }
  } finally {
    clearTimeout(timer); options.signal?.removeEventListener("abort", abort);
    await terminate();
  }
}

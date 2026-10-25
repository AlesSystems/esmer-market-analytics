import { createHash } from "node:crypto";
import type { ImportOutcome } from "../domain/contracts";
import { canonical, readPackage, type Manifest } from "./package";
import { readRawPackage, type RawPackage } from "./raw-package";
import { LIVE_ERROR_CODES, readLiveStatus, type LiveErrorCode, type LiveRefreshResult, type LiveStatus } from "./live-contracts";

export const LIVE_POLL_MS = 5 * 60_000;
export const LIVE_STALE_MS = 15 * 60_000;
const REFRESH_TIMEOUT_MS = 60_000;
export function liveIdentity(manifest: Manifest): string {
  return canonical({lineage: manifest.lineage, mappingVersion: manifest.mappingVersion, coverage: manifest.coverage, provenance: manifest.provenance, currency: manifest.currency});
}
export function liveFingerprint(manifest: Manifest): string {
  return createHash("sha256").update(canonical({identity: liveIdentity(manifest), streams: manifest.streams})).digest("hex");
}
/**
 * Identity of a raw package's source content: everything except the extraction id and capture instant, which differ on every read.
 * Two reads of unchanged source data share it.
 */
export function rawFingerprint(pkg: RawPackage): string {
  const {capturedAt: _capturedAt, ...snapshot} = pkg.snapshot;
  return createHash("sha256").update(canonical({schemaVersion: pkg.schemaVersion, lineage: pkg.lineage, snapshot})).digest("hex");
}
type PreviewImport = {status: "preview-imported"; hash: string} | {status: "failed"; code: string} | {status: "cancelled"};
type Options = {
  extract: (signal: AbortSignal) => Promise<Uint8Array>;
  importCandidate: (bytes: Uint8Array) => ImportOutcome;
  importPreview?: (bytes: Uint8Array) => PreviewImport;
  /** The stored preview's hash and rawFingerprint, to report an unchanged read without rewriting it. */
  activePreview?: () => {hash: string; fingerprint: string} | null;
  activeDataset: () => {datasetId: string; fingerprint: string; identity: string} | null;
  now?: () => number;
  persist?: (status: LiveStatus) => void;
  initialStatus?: unknown;
};
export class LiveSynchronizer {
  private enabled = false;
  private timer?: ReturnType<typeof setTimeout>;
  private controller?: AbortController;
  private running?: Promise<LiveRefreshResult>;
  private sourceWork?: Promise<Uint8Array>;
  private state: LiveStatus = {phase: "disabled", error: null, lastAttemptAt: null, lastSuccessAt: null, lastDatasetId: null, lastRecord: "none", persistenceError: false};
  private resumed = false;
  constructor(private readonly options: Options) {
    const previous = readLiveStatus(options.initialStatus);
    if (previous) {this.state = {...previous, phase: "disabled", error: null}; this.resumed = true;}
  }
  isBusy(): boolean { return !!(this.running || this.sourceWork); }
  private now() { return this.options.now?.() ?? Date.now(); }
  status(): LiveStatus {
    if (this.state.phase !== "disabled" && this.state.lastRecord !== "preview" && this.state.lastDatasetId && this.options.activeDataset()?.datasetId !== this.state.lastDatasetId) {
      this.state = {...this.state, lastSuccessAt: null, lastDatasetId: null, lastRecord: "none"};
      if (this.state.phase !== "disabled" && this.state.phase !== "refreshing") this.state = {...this.state, phase: "stale", error: "SOURCE_CHANGED"};
    }
    if (this.state.phase === "idle" && this.state.lastSuccessAt && this.now() - Date.parse(this.state.lastSuccessAt) > LIVE_STALE_MS) return {...this.state, phase: "stale"};
    return {...this.state};
  }
  private save() {
    try { this.options.persist?.({...this.state, persistenceError: false}); this.state.persistenceError = false; }
    catch { this.state.persistenceError = true; }
  }
  private schedule() {
    clearTimeout(this.timer);
    if (!this.enabled) return;
    this.timer = setTimeout(() => {void this.refresh().then(result => {if (result.status === "busy") this.schedule();});}, LIVE_POLL_MS);
    this.timer.unref?.();
  }
  enable(): LiveStatus {
    if (this.enabled) return this.status();
    this.enabled = true;
    this.state = this.resumed ? {...this.state, phase: "stale", error: "INTERRUPTED"} : {...this.state, phase: "idle", error: null};
    this.resumed = false;
    this.save(); this.schedule(); return this.status();
  }
  async disable(): Promise<LiveStatus> {
    this.enabled = false; clearTimeout(this.timer); this.controller?.abort();
    await this.running;
    await this.sourceWork?.catch(() => {});
    this.state = {...this.state, phase: "disabled", error: null};
    this.save(); return this.status();
  }
  close(): Promise<void> {return this.disable().then(() => {});}
  refresh(): Promise<LiveRefreshResult> {
    if (!this.enabled) return Promise.resolve({status: "disabled"});
    if (this.running || this.sourceWork) return Promise.resolve({status: "busy"});
    clearTimeout(this.timer);
    this.controller = new AbortController();
    this.state = {...this.state, phase: "refreshing", error: null, lastAttemptAt: new Date(this.now()).toISOString()};
    this.save();
    this.running = this.perform(this.controller.signal).finally(() => {this.running = undefined; this.controller = undefined; this.schedule();});
    return this.running;
  }
  private async perform(signal: AbortSignal): Promise<LiveRefreshResult> {
    let timeout: ReturnType<typeof setTimeout> | undefined;
    let abort: (() => void) | undefined;
    try {
      const interrupted = new Promise<never>((_resolve, reject) => {
        abort = () => reject(new Error("INTERRUPTED"));
        signal.addEventListener("abort", abort, {once: true});
        timeout = setTimeout(() => {reject(new Error("REFRESH_TIMEOUT")); this.controller?.abort();}, REFRESH_TIMEOUT_MS);
      });
      const extraction = this.options.extract(signal);
      this.sourceWork = extraction;
      void extraction.then(() => {if (this.sourceWork === extraction) this.sourceWork = undefined;}, () => {if (this.sourceWork === extraction) this.sourceWork = undefined;});
      const bytes = await Promise.race([extraction, interrupted]);
      if (signal.aborted || !this.enabled) return {status: "cancelled"};
      const raw = readRawPackage(bytes);
      if (raw) {
        const stored = this.options.activePreview?.();
        if (stored && stored.fingerprint === rawFingerprint(raw)) {
          this.state = {...this.state, phase: "idle", error: null, lastSuccessAt: new Date(this.now()).toISOString(), lastDatasetId: stored.hash, lastRecord: "preview"};
          this.save(); return {status: "unchanged", datasetId: stored.hash};
        }
        const preview = this.options.importPreview?.(bytes);
        if (!preview || preview.status === "failed") throw new Error(preview?.code === "STORAGE_FULL" ? "STORAGE_FULL" : "INVALID_CANDIDATE");
        if (preview.status === "cancelled") return {status: "cancelled"};
        this.state = {...this.state, phase: "idle", error: null, lastSuccessAt: new Date(this.now()).toISOString(), lastDatasetId: preview.hash, lastRecord: "preview"};
        this.save(); return {status: "active", datasetId: preview.hash};
      }
      const parsed = readPackage(bytes);
      if (!parsed.ok) throw new Error("INVALID_CANDIDATE");
      const active = this.options.activeDataset();
      if (active && active.identity !== liveIdentity(parsed.metadata)) throw new Error("SOURCE_CHANGED");
      const result: ImportOutcome = active?.fingerprint === liveFingerprint(parsed.metadata)
        ? {status: "unchanged", datasetId: active.datasetId}
        : this.options.importCandidate(bytes);
      if (result.status === "cancelled") return {status: "cancelled"};
      if (result.status !== "active" && result.status !== "unchanged") throw new Error(result.status === "failed" && result.code === "STORAGE_FULL" ? "STORAGE_FULL" : "INVALID_CANDIDATE");
      this.state = {...this.state, phase: "idle", error: null, lastSuccessAt: new Date(this.now()).toISOString(), lastDatasetId: result.datasetId, lastRecord: "dataset"};
      this.save(); return {status: result.status, datasetId: result.datasetId};
    } catch (error) {
      if (!this.enabled) return {status: "cancelled"};
      const sourceCode = error instanceof Error ? error.message : "";
      const code: LiveErrorCode = sourceCode === "SOURCE_TIMEOUT" ? "REFRESH_TIMEOUT" : sourceCode === "CANCELLED" ? "INTERRUPTED" : LIVE_ERROR_CODES.includes(sourceCode as LiveErrorCode) ? sourceCode as LiveErrorCode : "SOURCE_UNAVAILABLE";
      this.state = {...this.state, phase: "stale", error: code};
      this.save(); return {status: "failed", code};
    } finally {
      clearTimeout(timeout);
      if (abort) signal.removeEventListener("abort", abort);
      if (this.enabled && this.state.phase === "refreshing") {this.state = {...this.state, phase: "stale", error: "INTERRUPTED"}; this.save();}
    }
  }
}

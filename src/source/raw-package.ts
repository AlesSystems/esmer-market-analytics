import { createHash } from "node:crypto";
import { canonical, MAX_BYTES, MAX_ROWS } from "./package.ts";
import type { SqlSnapshot, SqlRow } from "./sql-server.ts";

export const rawColumns = {
  headers: ["ID", "FIS_TURU", "DOVIZ_AD", "DURUM", "AKTIF", "SATIR_TOPLAM", "SATIR_ISKONTO_TOPLAM", "FIS_ISKONTO_TOPLAM", "KDV_TOPLAM", "OTV_TOPLAM", "TEFKIFAT_TOPLAM", "GENELTOPLAM", "FIS_TARIHI", "CURRENCY"],
  lines: ["ID", "FIS", "STOK", "FIS_TURU", "CARPAN", "MIKTAR_FIS", "TOPLAM_KDV_MATRAHI", "TOPLAM_KDV", "TOPLAM_OTV", "TOPLAM_TEVKIF"],
  products: ["ID", "NAME", "CATEGORY", "UNIT"],
} as const;
export type RawPackage = { schemaVersion: "sql-backup-preview-v1" | "sql-backup-estimate-v1" | "sql-backup-preview-v2" | "sql-backup-estimate-v2"; provenance: "isolated-sql-backup"; sourceReconciled: false; lineage: string; extractionId: string; snapshot: SqlSnapshot; sha256: string };
export type SourcePreviewRequest = {stream: "headers" | "lines"; offset: number};
export type SourcePreviewResult = {status: "source-preview-empty"} | {status: "source-preview"; hash: string; metadata: Omit<RawPackage, "snapshot" | "sha256"> & Omit<SqlSnapshot, "headers" | "lines" | "products">; counts: {headers: number; lines: number; emptyHeaders: number}; stream: "headers" | "lines"; offset: number; total: number; rows: SqlRow[]};
export function validSourcePreviewRequest(value: unknown): value is SourcePreviewRequest {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const v = value as Record<string, unknown>;
  return Object.keys(v).sort().join() === "offset,stream" && (v.stream === "headers" || v.stream === "lines") && Number.isSafeInteger(v.offset) && Number(v.offset) >= 0 && Number(v.offset) <= MAX_ROWS;
}
const hash = (value: unknown) => createHash("sha256").update(canonical(value)).digest("hex");
function check(value: unknown): asserts value { if (!value) throw new Error("INVALID_PACKAGE"); }
const columnKeys = {headers: new Set<string>(rawColumns.headers), lines: new Set<string>(rawColumns.lines), products: new Set<string>(rawColumns.products), estimate: new Set([...rawColumns.lines, "BELGE_TARIHINDEKI_SON_ALIS_FIYATI"])};
function keys(value: unknown, expected: readonly string[] | ReadonlySet<string>): asserts value is Record<string, unknown> {
  check(value && typeof value === "object" && !Array.isArray(value));
  const allowed = Array.isArray(expected) ? new Set(expected) : expected as ReadonlySet<string>;
  const actual = Object.keys(value);
  check(actual.length === allowed.size && actual.every(key => allowed.has(key)));
}

const identity = (value: unknown) => typeof value === "string" && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(value);
const sourceId = (value: unknown) => typeof value === "string" && /^-?(?:0|[1-9][0-9]{0,18})$/.test(value);
const date = (value: unknown) => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && value >= "1900-01-01" && value <= "9998-12-31" && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0,10) === value;
function validate(value: unknown): asserts value is RawPackage {
  keys(value, ["schemaVersion", "provenance", "sourceReconciled", "lineage", "extractionId", "snapshot", "sha256"]);
  const v2 = value.schemaVersion === "sql-backup-preview-v2" || value.schemaVersion === "sql-backup-estimate-v2", estimate = value.schemaVersion === "sql-backup-estimate-v1" || value.schemaVersion === "sql-backup-estimate-v2";
  check((v2 || value.schemaVersion === "sql-backup-preview-v1" || value.schemaVersion === "sql-backup-estimate-v1") && value.provenance === "isolated-sql-backup" && value.sourceReconciled === false && identity(value.lineage) && identity(value.extractionId));
  const s = value.snapshot;
  keys(s, ["databaseId", "engineVersion", "capturedAt", "from", "to", "headers", "lines", ...v2 ? ["products"] : []]);
  check(typeof s.databaseId === "string" && /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(s.databaseId));
  check(typeof s.engineVersion === "string" && /^\d+(?:\.\d+){1,3}$/.test(s.engineVersion) && s.engineVersion.length <= 40);
  check(typeof s.capturedAt === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(s.capturedAt) && Number.isFinite(Date.parse(s.capturedAt)) && new Date(s.capturedAt).toISOString() === s.capturedAt);
  check(date(s.from) && date(s.to) && String(s.from) <= String(s.to));
  check(Array.isArray(s.headers) && Array.isArray(s.lines) && (!v2 || Array.isArray(s.products)) && s.headers.length + s.lines.length + (v2 ? (s.products as unknown[]).length : 0) <= MAX_ROWS);
  const headers = new Map<string, SqlRow>();
  for (const stream of ["headers", "lines"] as const) {
    const ids = new Set<string>();
    for (const row of s[stream] as unknown[]) {
      keys(row, stream === "lines" && estimate ? columnKeys.estimate : columnKeys[stream]);
      check(sourceId(row.ID) && !ids.has(String(row.ID)) && sourceId(row.FIS_TURU)); ids.add(String(row.ID));
      for (const [column, v] of Object.entries(row)) {
        if (column === "FIS_TARIHI") {
          check(typeof v === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?$/.test(v) && Number.isFinite(Date.parse(`${v}Z`)) && new Date(`${v}Z`).toISOString().slice(0,19) === v.slice(0,19) && v.slice(0,10) >= String(s.from) && v.slice(0,10) <= String(s.to));
        } else if (column === "CURRENCY") check(v === null || v === "TRY" || v === "USD" || v === "OTHER");
        else check(v === null || typeof v === "string" && /^-?(?:0|[1-9][0-9]{0,39})(?:\.[0-9]{1,30})?$/.test(v));
      }
      if (stream === "headers") headers.set(String(row.ID), row as SqlRow);
      else check(sourceId(row.FIS) && sourceId(row.STOK) && headers.has(String(row.FIS)) && headers.get(String(row.FIS))!.FIS_TURU === row.FIS_TURU);
    }
  }
  if (v2) {
    const stoks = new Set((s.lines as SqlRow[]).map(row => row.STOK)), ids = new Set<string>();
    const label = (v: unknown) => v === null || typeof v === "string" && v === v.trim() && v.length >= 1 && v.length <= 160 && !/[\u0000-\u001f\u007f]/.test(v);
    for (const row of s.products as unknown[]) {
      keys(row, columnKeys.products);
      check(sourceId(row.ID) && !ids.has(String(row.ID)) && stoks.has(String(row.ID)) && label(row.NAME) && label(row.CATEGORY) && (row.UNIT === null || row.UNIT === "adet" || row.UNIT === "kg" || row.UNIT === "other")); ids.add(String(row.ID));
    }
  }
  check(value.sha256 === hash({lineage: value.lineage, extractionId: value.extractionId, snapshot: s}));
}
function write(snapshot: SqlSnapshot, lineage: string, extractionId: string, schemaVersion: RawPackage["schemaVersion"]): Buffer {
  const value = {schemaVersion, provenance: "isolated-sql-backup", sourceReconciled: false, lineage, extractionId, snapshot, sha256: hash({lineage, extractionId, snapshot})};
  validate(value);
  const bytes = Buffer.from(canonical(value)); check(bytes.length <= MAX_BYTES); return bytes;
}
export function readRawPackage(bytes: Uint8Array): RawPackage | null {
  try {
    check(bytes.byteLength <= MAX_BYTES);
    const text = new TextDecoder("utf-8", {fatal: true}).decode(bytes);
    const value: unknown = JSON.parse(text); validate(value); check(canonical(value) === text); return value;
  } catch { return null; }
}

export function writeRawPackage(snapshot: SqlSnapshot, lineage: string, extractionId: string): Buffer { return write(snapshot,lineage,extractionId,snapshot.products !== undefined ? "sql-backup-preview-v2" : "sql-backup-preview-v1"); }
export function writeRawEstimatePackage(snapshot: SqlSnapshot, lineage: string, extractionId: string): Buffer { return write(snapshot,lineage,extractionId,snapshot.products !== undefined ? "sql-backup-estimate-v2" : "sql-backup-estimate-v1"); }

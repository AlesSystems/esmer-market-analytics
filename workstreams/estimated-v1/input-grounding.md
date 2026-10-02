# EV1-INPUT grounding

Inspected repository behavior at `f705ec1`; read-only application investigation. No SQL, Docker, private artifact reads or tests executed.

## Current input and activation flow

- `tools/prepare-sql-backup.ts` reads a bounded private configuration, calls `extractSqlServer` then `writeRawPackage`; publishes via mode-0600 exclusive temporary file, fsync, hard link (no replacement), finally removes temporary. Diagnostics are fixed strings.
- `src/source/sql-server.ts`: `SqlServerConfig` requires isolated-copy scope, expected database GUID, date range, restricted non-sa/non-dbo credentials. Extraction uses SERIALIZABLE transaction, permission denial guards, GUID check, 256-row ordered ID pagination, 100000 combined row /32MiB caps, 60s total/15s request limits, cancellation and awaited connection closure. Header/line amounts are converted to strings preserving decimals/nulls. These guards do not validate financial meanings.
- `src/source/sql-package.ts:prepareSqlCandidate` uses the same extraction and raw serialization for source refresh.
- `src/desktop/main.ts` trusted importPackage IPC opens a native file dialog, bounded `readPackageFile`, cancellation-aware job, then service worker. Renderer supplies neither file bytes directly nor SQL.
- `src/service/worker.ts` importPackage first tries `readRawPackage`; raw packages go to `store.importSourcePreview`. Otherwise it tries synthetic analytics package and then `stage/activate`. `src/source/live.ts` similarly treats recognized raw bytes as preview import; no analytics activation.
- `src/store/store.ts:importSourcePreview` validates before mutation and replaces the single `source_preview` row inside BEGIN IMMEDIATE/COMMIT; cancellation rolls back. It never alters active dataset/app revisions. Reimport repairs corrupt retained bytes even when hash matches. Reads revalidate bytes plus whole-package hash.
- Source workspace query uses retained raw snapshot, monthly/date/type/product filters, hash pin and 50-row pages. Its sales/purchasing type groups are explicitly observational. The current source preview is a singleton, not a retained analytics dataset version.

## Existing fields and version boundaries

`sql-backup-preview-v1` RawPackage: isolated-sql-backup provenance, sourceReconciled false, lineage/extractionId, SqlSnapshot (GUID/engine/capturedAt/from/to/headers/lines), payload digest. Exact key validation rejects any additional columns; decimal strings/nulls only, IDs exact strings, referential integrity and header/line type match.

Headers: ID,FIS_TURU,DOVIZ_AD,DURUM,AKTIF,SATIR_TOPLAM,SATIR_ISKONTO_TOPLAM,FIS_ISKONTO_TOPLAM,KDV_TOPLAM,OTV_TOPLAM,TEFKIFAT_TOPLAM,GENELTOPLAM,FIS_TARIHI,CURRENCY (TRY/USD/OTHER/null).

Lines: ID,FIS,STOK,FIS_TURU,CARPAN,MIKTAR_FIS,TOPLAM_KDV_MATRAHI,TOPLAM_KDV,TOPLAM_OTV,TOPLAM_TEVKIF. **No historical cost or unit field is currently transported.** Thus existing public raw packages cannot yield a cost-based profit estimate.

`analytics-package-v1` in `src/source/package.ts` accepts only synthetic provenance and three synthetic mapping versions. Synthetic business records require sales metadata, product/category labels, unit, tax/discount rates and optional historicalCost (unitCost/unit/taxBasis/evidence/documentedZero/originalSaleLineId). Do not smuggle real estimates into this synthetic contract or mark unknown rules known.

`AnalyticsStore.stage/activate`: staged dataset facts and manifest hashes, roundtrip canonical facts, foreign key check and counts verified before validated status. Activation recomputes stream count/hash, writes active/rollback/history/evidence in one transaction, preserves app revisions/accepted report pins, rejects historical package replay. Existing versioned reports depend on analytics datasetId/appRevision, so raw singleton estimate reports require their own explicit hash/version binding or intentional integration into this ownership model.

Recovery `src/recovery/validate.ts` validates every source_preview through `readRawPackage` and SHA256; schema exact equality against migrated store. A package version extension therefore must be recognized by recovery and other shared readers, not only import.

## Smallest extension seams

1. Explicit new raw version with a narrowly allowed cost field (and unit evidence only if needed), while continuing to accept existing v1 unchanged. Centralize raw columns used by validation/extraction so new reader and old fixture contracts cannot drift. Preserve unknown/null values.
2. An estimate calculation over immutable raw snapshot, independent of verified/synthetic analytics mapping. Use decimal arithmetic; version assumptions and bind every result to source hash. Existing source-workspace query/store access is the seam for estimates if accepted-report retention is not required for V1.
3. If estimates must use existing accepted reports/expenses workflow, explicitly design their provenance/mapping/quality contract before reusing stage/activate. Existing validator synthetic labels, sales completion and historical cost evidence requirements are material boundaries.
4. Root confirms an existing private September extraction (15,880 headers /54,965 lines) carries raw header/line fields plus BELGE_TARIHINDEKI_SON_ALIS_FIYATI with exact transport reconciliation. This was not read by this investigator. A new explicit cost-candidate package can use that retained input without new SQL. No unit dictionary is available; do not claim physical units. Do not broaden real SQL extraction implicitly: source account grants/config and bounded private source preparation must be updated/reviewed separately by root. Existing retained evidence schema is not current application input.

## Focused existing checks

Commands use repository package scripts, e.g. `npm run test:integration -- tests/integration/raw-preview.test.ts tests/integration/raw-report-readiness.test.ts tests/integration/source-workspace.test.ts` (check Vitest selection behavior in the actual environment).

- raw-preview.test.ts: exact raw values preserve financial dataset/history; private/orphan/type rejection; cancellation rollback/paging/encrypted recovery; corrupt hash/date/duplicate/numeric rejection; trusted IPC/payload restrictions; corrupted-storage repair.
- raw-report-readiness.test.ts: currently raw import must keep SalesReports and ReportVersions unavailable with UNSUPPORTED_MAPPING; update only if explicitly integrating new estimate operation, preserve verified mapping exclusion.
- source-workspace.test.ts: observational filtering, exact query keys/context, paging/hash replacement invalidation, summary truncation.
- import-activation.test.ts/import-failures.test.ts: concurrent app writes/report pins, lineage identity, retention, order, reference corruption/storage exhaustion/process interruption.
- source-privacy.test.ts: sentinel exclusion and preparation fixed diagnostics.
- live-sql-server.test.ts: real SQL opt-in fixture tests; never substitute synthetic tests for actual extraction evidence.
- recovery-equivalence.test.ts/raw-preview.test.ts: restored package compatibility and identical output; cost package changes need coverage here.

## Risks and explicit limits

Raw v1 provides candidate revenue operands but no cost. FIS_TURU/status/date/currency are recorded fields with unproved economic meanings; selecting candidates needs visible assumptions. Missing/zero/negative cost must remain distinct. Returns need explicit treatment when original sale links are unavailable. Snapshot.from/to expresses extraction range, not independently proved completeness. Private source IDs and amounts must stay outside Git fixtures/artifacts. Singleton replacement invalidates hash-pinned requests and cannot reproduce an old estimate after replacement unless retained separately. Windows acceptance remains user-run.

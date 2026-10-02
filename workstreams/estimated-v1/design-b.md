# EV1 design candidate B: retained estimate datasets

Grounded at f705ec1 on 2026-10-02 from input-grounding.md and report-grounding.md. Architect Ground/Sketch complete; Agree/Pick belong to root; implementation is deferred. Arena candidate only, no application edits or source access.

## Caller usage first

```ts
// Trusted native file import; worker owns parsing/staging/activation.
const imported = store.importPackage(estimateBytes, control);
// Same named monthly operation chooses service by explicit manifest capability.
const result = versions.openDisplay({ period: "2025-09" }, control);
// Result is a distinct format; UI dispatches without interpreting source fields.
if (result.status === "estimate") renderEstimate(result.report);
await window.esmer.exportReportVersion({ reportId: result.report.id });
// Optional future retention uses immutable reviewed estimate, never verified profit.
await window.esmer.acceptReportVersion({ candidateId: result.report.id,
  previousAcceptedId: null, reason: "Varsayımlı tahmin incelendi" });
```

The gain is versioned source retention: import/rollback/history/recovery already preserve dataset pins, so an exported or accepted estimate can be reproduced after another import. The estimate does not pass `SalesReports.open`; `ReportVersions` dispatches explicit estimate capability before calling that class.

## Shape and ownership

Introduce `analytics-estimate-package-v1`, provenance `isolated-sql-backup`, mappingVersion `recorded-source-estimate-v1`, sourceReconciled false. Do not extend synthetic provenance or assign known sales metadata. Keep original source operands immutable and retain fixed assumptions/version in manifest.

```ts
type EstimateDocument = {
  id: string; date: string; typeCode: string; active: string|null;
  status: string|null; currency: "TRY"|"USD"|"OTHER"|null;
};
type EstimateLine = {
  id: string; documentId: string; productId: string;
  recordedQuantity: string|null; multiplier: string|null;
  candidateAmount: string|null; candidateUnitCost: string|null;
};
type EstimateReport = {
  format: "recorded-estimate-report-v1"; id: string;
  context: ReportContext; sourceReconciled: false;
  assumptionVersion: "recorded-source-estimate-v1";
  assumptions: string[]; summary: EstimateScope;
  daily: (EstimateScope & {date:string})[];
  products: (EstimateScope & {productId:string; displayName:string})[];
  lines: EstimateContribution[]; exclusions: EstimateExclusion[];
  review: {acceptedAt:string;reason:string;previousAcceptedId:string|null}|null;
};
```

`EstimateScope` owns signed candidate revenue, covered revenue/cost/contribution, nullable margin, covered/excluded counts/exposures, and no normalized physical units. `EstimateReports` hides candidate filters, signs, formulas and partitions behind `open/selected/display/products/evidence`; `ReportVersions` delegates only capability selection and stores immutable outputs. No synthetic `SalesComponent`, `HistoricalCost` or `MonthlyReportV2` casts.

## Formula contract

Root must settle literal source field mapping and sign rules in contract. Proposed bounded rule: type11 TRY with recorded active/status1 selects sale candidates; type12 same predicates selects return candidate revenue `-abs(candidateAmount)`; type35 and all others excluded with reasons. No inferred conversion graph. Type11 requires nonnegative amount/quantity operands; malformed/negative operand remains excluded rather than silently abs-normalized. Date is source recorded day, explicitly unverified market business date.

Sale cost eligible only if multiplier exactly1, quantity nonnull/nonnegative and candidate unit cost strictly positive. Cost = recorded quantity × candidate unit cost; contribution = covered candidate amount − cost. Null/negative/zero cost distinct exclusions. Returns have negative candidate revenue but cost/contribution excluded with RETURN_ATTRIBUTION; highlight that covered result omits their economic effect. No net-tax or historical-time assertion, quantity labeled recorded quantity/unit unknown. No all-cost-missing zero contribution.

Summary/product/day partition same immutable contribution lines. Aggregation uses Exact precision100 and preserves decimal source precision; ratio rounding existing half-up convention. Cost coverage uses absolute candidate revenue exposure; zero denominator null; unknown amount exposure null. Month extraction completeness is not real-world completeness. Nonobserved/unsupported days gaps; full candidate observation only may support no-record day marker without claiming no sales. Search/sort/paging never restrict headline population.

## Exact change surface and invariant costs

- `src/source/package.ts`: discriminate ParsedPackage/Manifest/Records into synthetic and estimate variants with separate exact key validators; retain old format unchanged. Estimate IDs can be encoded safe prefixed strings while preserving raw IDs in exact evidence. Do not overload existing DocumentRecord.kind as sale/return conclusions.
- `src/store/schema.ts`, `migrations.ts`: separate estimate_documents and estimate_lines tables keyed by datasets; existing source tables cannot truthfully represent all status/type/currency/unknown operands. `store.ts:stage/activate/facts/snapshot/availability` must branch stream codecs/counts/hash/diff across discriminant. Introduce stream registry only if it actually reduces repeated branches; no speculative framework.
- `src/reports/contracts.ts`, `versions.ts`, `display.ts`: distinct estimate union and bounded display/evidence types, resolve/list/compare/export dispatch. Context calculation version is estimate version. Existing SalesReports guards and financial report calculations unchanged.
- `src/store/store.ts:listMonthlyReports` includes new format deliberately and summaries flag unverified estimate. `snapshot(pin)` can retain dataset facts and app revision but must discriminate financial/estimate snapshots. Existing callers must narrow capability; no forged sales fields.
- `src/reports/export.ts`: separate estimate export with source hash, fixed assumption version and uncertainty on every sheet; reuse exact-cell serialization. `worker.ts` routes capability; `requests.ts`, `preload.ts`, desktop types admit bounded estimate requests/responses under existing sender validation.
- `src/ui/App.tsx` and monthly/saved report dispatch need estimate route; new estimate component can reuse page controls, chart primitives and Turkish formatters, but not validated net labels.
- `src/recovery/validate.ts`: recognizes estimate schema/version, exact table layout, source facts/package hash, accepted estimate membership/operands/formulas/partitions and review pins independently. Existing synthetic validation stays untouched. Migration/synthetic backup equivalence required.

Existing staging safety is reusable, but source facts reconstruction, manifest stream hashes, active import summaries, snapshot types, replay/diff, recovery and accepted-report validation all depend on three synthetic stream shapes. This candidate cannot honestly be a small mapping constant plus warning badge. It adds at least two tables, a schema migration and coordinated branches across roughly12–15 files before UI/tests. The benefit is durable report/source versioning that the user explicitly does not require for V1.

## Acceptance checks and recommendation

TDD seams: package exact shape/privacy/null/hash; staged interruption leaves active data; synthetic/estimate activation preserves expenses and old accepted reports; replay protection; independent golden estimates; summary/day/product reconciliation; stale pins; accepted immutable estimate after reimport; export exact values/confidence; old/new encrypted recovery equivalence; packaged navigation and correct label distinction. Windows remains user-run.

Candidate B is viable if durable reviewed estimate versions become required. For current V1, recommend the smaller raw transient capability: extend raw input explicitly with cost candidate, compute from hash-pinned local snapshot, expose bounded estimate results, export exact arithmetic/assumptions, recover source package encrypted. Graft B's explicit assumption version, distinct result format and future saved-output validator requirement into that candidate. Reject dataset activation solely to reuse familiar financial UI; it increases invariants and migration risk without satisfying a requested V1 capability.

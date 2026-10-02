# Candidate A: source-pinned transient estimates

## Problem and decision

Show useful offline figures from the retained real September snapshot while preserving financial/synthetic contracts. Use a separate estimate capability over existing raw storage. **The headline is sales-only covered contribution**, with return revenue exposure displayed separately; never subtract return revenue from contribution without its unknown cost reversal. This avoids falsely implying net profit after returns. User permits transient assumption-based figures and export, so do not extend accepted-report history.

## Usage (caller first)

```ts
// SourceWorkspace after importing an estimate-capable package:
const result = await window.esmer.querySourceEstimate({ hash, period, view: "summary", offset: 0 });
// result.summary: candidate revenue, covered revenue/cost/contribution and exclusions
const products = await window.esmer.querySourceEstimate({ hash, period, view: "products", offset: 0 });
await window.esmer.exportSourceEstimate({ hash, period }); // native save dialog, all rows
```

No reportId/appRevision acceptance controls; every request pins current raw package hash. Replacement returns SOURCE_CHANGED and requires reopening the source month.

## Shape and ownership

- `src/source/raw-package.ts`: union of unchanged `sql-backup-preview-v1` and new `sql-backup-estimate-v1`. New version adds only `BELGE_TARIHINDEKI_SON_ALIS_FIYATI` to every line's exact allowed keys. Provenance remains isolated-sql-backup; sourceReconciled stays false. Existing snapshot/header shape unchanged; strict decimal string/null, hash/canonical/count/date/reference validation reused. Version literal selects exact columns; old v1 must reject cost field and new version must require it even if null. Unknown arbitrary columns remain rejected.
- New `src/source/estimate.ts` owns all population rules, assumptions, decimal calculation and deterministic sorting. One deep pure function `calculateSourceEstimate(pkg, period): Estimate` hides eligibility/aggregation; `querySourceEstimate(pkg, hash, request): EstimateDisplay` adds bounded paging/hash guard. No conversion into synthetic sales/business records.
- `src/store/store.ts`: one narrow query reads/validates current source_preview and invokes estimate query. Factor existing repeated raw-byte/hash validation into one private reader if necessary, rather than copy another version. New package works through existing importSourcePreview transaction and encrypted recovery reader. No SQLite migration or app revision writes.
- `src/source/estimate-export.ts`: full-source estimate workbook over the same calculated Estimate, using installed write-excel-file and existing exact-text conventions. No duplicated formulas.
- `src/desktop/{preload,requests,main}.ts`, `src/service/{contracts,worker}.ts` (actual service operation type location to confirm): named query/export operations, exact keys/view/month/hash/offset validation, trusted sender; service owns raw access/calculation/export bytes. Main owns save dialog and atomic output conventions. Renderer never receives full snapshot.
- `src/ui/SourceWorkspace.tsx` plus small new `src/ui/SourceEstimate.tsx`: monthly estimate summary, day table/chart and paged products on existing source month. Preserve raw drilldown. Turkish labels `Tahmini satış katkısı (kapsanan satırlar)`, `Kaydedilmiş tutar adayı`, `İade tutarı adayı — maliyeti eşleştirilmedi`, `Maliyet kapsamı`. Quantity displays `Kaydedilmiş miktar` only; no piece/kg label or total across different products. Show assumption warning beside numbers and export action.

Sketch (amounts decimal strings, absent result null):

```ts
type EstimateRequest = { hash: string; period: string; view: "summary" | "products"; offset: number };
type EstimateTotals = {
  candidateRevenue: string; coveredRevenue: string; candidateCost: string | null;
  contribution: string | null; returnRevenueExposure: string;
  saleLines: number; coveredLines: number; returnLines: number;
  exclusions: Record<"amount"|"quantity"|"multiplier"|"costMissing"|"costZero"|"costNegative", number>;
};
type Estimate = {
  format: "source-estimate-v1"; formulaVersion: "source-estimate-v1";
  sourceHash: string; period: string; from: string; to: string;
  quality: "unverified-estimate"; assumptions: { id: string; description: string }[];
  summary: EstimateTotals; days: { date: string; totals: EstimateTotals | null }[];
  products: { productId: string; recordedQuantity: string; totals: EstimateTotals }[];
};
```

Display summary contains all at-most31 days and product count; products returns50/100 bounded rows and offset/total. Export consumes full Estimate privately. Empty eligible covered population => cost/contribution null; eligible positive-cost lines can total genuine zero contribution. Summary and groups use identical included line set. Range gaps outside source from/to are null; in-range no candidates show zero candidate revenue, null contribution (no independent completeness claim).

## Formulas and fixed assumptions

Candidate sales: header type11, CURRENCY TRY, DURUM1, AKTIF1, FIS_TARIHI month; header/line types already match. All other types/currencies/statuses excluded and counts disclosed. Type35 explicitly excluded to avoid possible duplicate economic representation. No claim this proves completion, timezone or tax treatment.

Revenue operand = line TOPLAM_KDV_MATRAHI, nonnull/nonnegative; **label as recorded amount basis, never net-of-tax sales**. Valid sales quantity MIKTAR_FIS nonnull/positive. Candidate cost coverage additionally requires CARPAN exactly1 and historical field positive. Cost = quantity × historical field; contribution = covered recorded revenue − covered candidate cost. CARPAN other/null and quantity-invalid lines may contribute recorded revenue exposure when amount exists but never cost coverage. Zero cost remains excluded (undocumented); negative/null cost distinct counts. No tax inference or fallback cost.

Returns: type12 with same TRY/status/month rules and valid nonnegative amount; display exposure as negative amount sum, separately per product/day/month. No linkage/no restored cost, and no subtraction from headline covered sales contribution. Return count/exposure beside headline says contribution excludes return effect. Missing return amounts separately counted; do not call exposure complete.

Assumption IDs immutable in code/version and export: type11 candidates; type35 excluded; type12 exposure-only; recorded-taxbase-operand; status1/active1 selection; TRY-only; source-date-month; multiplier1-cost; positive-historical-cost-candidate; no-physical-unit-claim; partial-cost-coverage; unverified-source-meanings. Package carries source inputs, not arbitrary user-editable formula options.

## Export and verification contract

Workbook sheets: Summary, Days, Products, Assumptions. Each sheet includes quality/title/source hash/formula version/period; exact values as decimal text where >15 significant digits, no money arithmetic in exporter. Exports all products, beyond UI page. Assumptions and exclusions travel with the file. No customer/product/supplier names added; raw numerical product identifiers are private export data, never Git/screenshots.

Focused tests: old/new strict package and digest/canonical rejection; preview replacement/cancellation/recovery equivalence; independent Decimal golden fixture covering types11/12/35/status/currency, null/zero/negative cost, CARPAN restriction, null amount/quantity, product/day/month membership and exact equality, all-uncovered null result, tiny signed contribution; hash-stale and exact IPC payload rejection; export all products/exact decimals/assumptions; packaged synthetic estimate import/uncertainty/null UI/drilldown/export/reload; existing raw-report-readiness and accepted synthetic recovery remain unchanged.

## Tradeoffs and alternatives

Accept no saved estimate versions in exchange for no history/schema/accepted-report semantic change; export is durable evidence, current package is backed up. Accept repeated pure calculation over ~55k lines in exchange for no cache invalidation infrastructure; measure query/export time before adding a hash+period cache. Reject widening MonthlyReportV2: it would expose unknown completion/unit/tax/cost meaning through established trusted labels and weaken recovery validation. Reject net contribution after returns: missing original-sale cost attribution makes that number deceptively precise.

Risks: type11 may still include noncompleted sales; cost may use another unit/tax/time basis; CARPAN1 does not prove physical units; raw range does not prove completeness. All remain visible assumptions. The meaningful reconciliation target is retained source operands and this declared formula. First implementation step: failing pure golden/package compatibility contracts, then minimal estimate module and explicit package version.

Synthesis decision belongs to root after comparing candidate B; this artifact is a distinct proposal, not acceptance.

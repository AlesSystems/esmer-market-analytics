# Monthly product-profit contract

Contract `monthly-product-profit-v1`, planned report format `monthly-report-v2`.
Planning gate [P01 / #38](https://github.com/AlesSystems/esmer-market-analytics/issues/38), within [#36](https://github.com/AlesSystems/esmer-market-analytics/issues/36). This document specifies later work. It does not change application behavior or approve a real-source mapping.

## Decision record and foundation delta

On 2026-09-29 the user confirmed **estimated gross product profit before operating expenses**, and **returns in their recorded return month**. The user subsequently approved this completed contract and [composition sketch](../diagrams/monthly-product-profit.html) in the same chat. P01 is reviewed and approved for planning; source access and implementation remain separately gated.

The primary monthly experience becomes **Aylık Ürün Kârlılığı**. It answers which products sold, their covered estimated gross contributions, and the covered monthly result. This changes the emphasis of foundation §4.1 and Phase 8 Task 8.1. It preserves D01–D20 and the existing calculation meanings. The result is neither operating profit, statutory net profit, cash balance, nor verified inventory costing.

Expenses, labour, operating results, purchasing, raw records, import, recovery and saved reports remain reachable through existing navigation or secondary actions. Missing expenses do not prevent gross estimates. The existing operating result retains its expense-completeness gate and saved meaning. No existing feature, data, accepted report or preview allowlist is removed or broadened by this decision.

## Separate estimate-first V1

On 2026-10-02 the user authorized useful estimates while source semantics remain unresolved. The [recorded-source estimate contract](recorded-estimates.md) governs that distinct capability and its transient product/day/month view and export. It does not cast raw rows into this contract's recognized population, change accepted financial reports or claim that assumption-based contribution is whole-market profit.

## Period, identity and evidence

The selected calendar month uses validated market-local business dates, with both boundaries inclusive. Sales belong to their completed event's business date. Returns belong to their recorded return business date, including returns of earlier-month sales. The daily trend uses these same dates. A return does not rewrite the original sale month. A later source correction creates a candidate report and never mutates accepted output.

P02 must validate which timestamp and timezone produce those dates. The developer machine's timezone, extraction time and import time do not select the month. The dataset declares the actual covered interval and whether its final day is partial. No event outside that interval becomes a zero-filled observation. Original-sale and conversion dependencies can fall outside the month. Load those as evidence only, never as additional current-month contributions.

Product identity is `(sourceLineage, productId)`, with the dataset pin identifying its version. Display name is not identity. Two IDs with the same name remain distinct. A renamed product keeps its identity and its accepted report's stored label. Product IDs stay exact strings. Missing essential product IDs or broken required references reject a financial candidate. The raw preview can still retain its separately valid records.

A safe approved product label may be shown. If a label is absent or not approved, show `Ürün #<productId>` and `Ürün adı mevcut değil`. Never combine unrelated records into one unnamed product. Show no barcode, category, supplier or free-form description merely to fill a UI slot.

Quantities are grouped by product and validated unit. The initial normalized units are `piece` / `adet` and `kg` / `kg`. If one product has both, show separate quantity entries within its row. Never add them into a single physical quantity. Unknown units use `Birim doğrulanmadı`; retain the original quantity as evidence but exclude it from normalized quantity and cost totals. The existing `calculateSales` rejects recognition of the whole document when a line has an unknown unit. Preserve that behavior for this slice and expose the affected records only as unresolved source evidence, with measurable exposure where independently known. Partial recognition inside such a document would require a separate reviewed capability and calculation-version change; aggregation alone cannot enable it. Future units require a reviewed mapping and tests. No multiplier defaults to one.

## Metric dictionary

Let R be the recognized, period-scoped sale and customer-return lines with validated net-sales meaning. Let C be the subset of R with supported historical cost. Line membership and reason codes are retained. Unsupported source records are tracked separately, including their measurable exposure. They are never silently converted into R.

| Field | Turkish label | Exact meaning |
| --- | --- | --- |
| `soldQuantity` | Satılan miktar | Positive sale quantity magnitude in each known unit, on R. |
| `returnedQuantity` | İade miktarı | Positive return quantity magnitude in each known unit, on R. |
| `netQuantity` | Net miktar | Sold minus returned quantity in that unit. May be negative. |
| `netSales` | Net satış (KDV hariç) | Sum of signed, discounted, recorded-KDV-exclusive net amounts on R. Returns subtract once. |
| `coveredSales` | Maliyeti kapsanan net satış | Sum of those same net amounts on C. This is the margin denominator. |
| `coveredCost` | Tarihsel tahmini maliyet (kapsanan) | Sum of signed quantity × validated transaction-time historical unit cost on C. |
| `coveredGrossProfit` | Kapsanan tahmini brüt kâr | `coveredSales - coveredCost`. It is null at the display contract when no eligible covered lines exist. |
| `coveredMarginPercent` | Kapsanan tahmini brüt kâr marjı | `100 × coveredGrossProfit / coveredSales` only when covered sales are positive. Otherwise null. |
| `costCoveragePercent` | Maliyet kapsamı (mutlak net tutar) | `100 × sum(abs(net) on C) / sum(abs(net) on R)`. Null for zero denominator. |

Product rows, daily buckets and the market summary partition the same R and C. Sum of every product contribution equals sum of every daily contribution equals the covered monthly result, before display formatting. Negative contributions remain in all three. No search, sort, selection, pagination or top-products subset substitutes for the full population.

Cost coverage also carries covered/excluded counts and separate signed sales/return exposures, as in `GrossResult`. Zero-value excluded lines prevent full coverage even if the monetary percentage is 100. Cost coverage describes only R. Separate sales coverage carries unresolved source populations, reasons and counts, with amounts where their basis is known. Unknown exposure is null, never zero or a guessed TRY value. No overall sales-completeness percentage is invented from partial evidence.

The summary's scope label is always `Seçili ay · tüm ürünler`. When sales coverage, period coverage and cost coverage are all complete, its value label can be `Tahmini brüt kâr`. If any is incomplete, use `Kapsanan tahmini brüt kâr` and `Tüm market kârı belirlenemiyor`. Even full coverage means complete for the declared source population, not proof that every real-world sale was recorded. Supplier returns do not enter customer-return quantities or gross contributions.

## Cost, discounts and precision

Reuse the [existing calculation contract](calculations.md). Supported cost needs an evidence reference, matching known unit, KDV-exclusive basis and transaction-time last-purchase meaning. Missing cost, absent validation, negative cost, undocumented zero, unknown unit and unknown tax basis remain distinct exclusions. Only an explicitly evidenced genuine zero cost can contribute zero. A current product purchase price never substitutes for historical cost.

A return needs original-sale line identity, matching product/unit/cost basis, chronological validity and evidence that cumulative returned quantity does not exceed the original sale. The original evidence can be from an earlier month. Missing or contradictory attribution excludes the return's cost contribution while retaining a separately validated negative sales amount. The view labels the resulting covered estimate as partial, since the omitted return can overstate it. A changed purchase price within the month is applied per evidenced sale line, never as one monthly product price.

Net sales include applicable line and header discounts exactly once and exclude recorded KDV. Preserve other charge/tax evidence when required to explain reconciliation. P02 must establish the actual discount order, allocation, sign and rounding with independent examples. Do not infer a proportional header discount rule or reuse raw `TOPLAM_KDV_MATRAHI` as net sales by name alone. Unsupported allocation excludes dependent product amounts and blocks a full-market headline. Do not copy a header amount onto every line.

Decimal strings remain exact through normalization, calculation and aggregation. Retain the existing synthetic precision-100 arithmetic and half-away-from-zero final percentage rounding. No raw-source rounding convention is approved here. Bounds and arithmetic precision for a future real mapping must be proven in P02/P03. Real header reconciliation uses its evidenced rule, never a universal 0.01 tolerance.

For this version, reuse the current formatter: money retains every supplied decimal digit and pads to at least two places. This keeps additive amounts exactly reconcilable without distributing an invented cent adjustment. Ratios display two places and never determine amounts. Tiny nonzero profit must not appear as zero. Quantity text retains source precision. Excel follows the same selected values, using exact text when Excel's numeric precision is insufficient. A later two-decimal money-only view would need its own explicit rounding reconciliation policy.

## State matrix and exact Turkish text

Availability, completeness, sign and freshness are separate dimensions. A stale partial loss can carry all three qualifications. Source staleness does not turn an estimate into zero or make a supported report disappear.

| State | Predicate | Visible result |
| --- | --- | --- |
| No imported dataset | No usable financial dataset | `Henüz veri içe aktarılmadı`; no financial number. |
| Unsupported | Only raw preview, unsupported mapping or unresolved period semantics | `Kâr hesaplanamıyor · kaynak anlamı doğrulanmadı`; offer `Kaynak kayıtları`. |
| Empty month | Valid complete month with no recognized events and no unresolved relevant records | `Bu ay satış veya iade yok`; no profit headline, no invented percentage. |
| Genuine zero | At least one covered event and exact profit zero | `0,00 ₺`; valid zero is distinct from no covered events. Margin only with positive covered sales. |
| Loss | Exact covered profit below zero | Signed negative value and `Tahmini brüt zarar`, with `Kapsanan` prefix when coverage is incomplete. |
| Partial | Some useful sales/cost evidence but incomplete population, period or cost | Covered amount if C is nonempty; `Kapsam eksik`; excluded counts, exposure and reasons beside the value. |
| No covered cost | R nonempty but C empty | `Kâr hesaplanamıyor · maliyet kanıtı yok`; no `0,00 ₺` profit. Keep validated net sales. |
| Zero absolute exposure | R has events but all net amounts are zero | Coverage percentage `Hesaplanamıyor`; retain counts and any supported cost/profit. |
| Nonpositive covered sales | Covered sales ≤ 0 | Margin `Hesaplanamıyor`; retain signed sales, cost and profit. |
| Historical source | Declared source cutoff precedes selected month end or present business date | `Veri sonu: <date/time>` and `Geçmiş kaynak verisi`; partial interval remains explicit. No arbitrary age threshold. |
| New active revision | Pinned dataset/app revision differs from active | `Daha yeni veri var · bu rapor önceki sürümü gösteriyor`; explicit reopen, never mixed values. |
| Loading/failure | Request pending or rejected | `Rapor hazırlanıyor` or `Rapor yüklenemedi` with `Yeniden dene`; old content stays labelled with its original month/version if retained. |

A complete zero-activity day has a zero trend value with an empty-day marker. An uncovered/unsupported day is a gap, never a zero or interpolated point. Returns-only days/months retain negative values and an unavailable margin when the denominator is nonpositive. Monthly `Açık` and `Geçici`, metric `Tahmini` and saved-report acceptance remain distinct. None becomes verified exact profitability.

## One-page composition and interaction contract

The [static sketch](../diagrams/monthly-product-profit.html) uses conspicuously synthetic inputs. It is a planning artifact, not a replacement design system or working product screenshot.

1. **Ay**, source cutoff, import time, coverage and report-version controls.
2. Market-wide estimated gross result, covered sales/cost, coverage and exclusions. Keep uncertainty next to the number.
3. **Günlük tahmini brüt kâr** for the selected month, with a zero baseline, signed values, gaps and a table alternative. Label covered scope when partial.
4. **Ürün katkıları**, search and sortable columns for product, sold/returned/net quantities by unit, net sales, covered historical cost, covered profit and coverage.
5. **Seçili ürün** followed by its transaction, original-sale and cost evidence. Show source IDs and calculation details on expansion.

The user confirmed that the app will include graphs, with a maximum of three, on 2026-09-29. The sketch uses daily covered gross profit, product covered profit and cost coverage. All graphs use the same pinned monthly report and remain independent of product-table search, sorting, pagination and selection. Missing cost is never plotted as zero. Keep accessible numerical alternatives.

| Action | Product table | Headline and trend | Detail |
| --- | --- | --- | --- |
| Change month | New full population; reset search, sort and pagination | New month only after a coherent report response | Clear selection and reject late responses from previous month. |
| Search `Ürün ara` | Match safe name or exact/string ID with Turkish-aware case handling; reset page | Unchanged, still all products | Keep selection; show `Seçili ürün arama sonuçlarında yok` if hidden. |
| Sort | Full matched set, not just current page; reset page | Unchanged | Unchanged. |
| Page | At most 100 rows using existing bounds | Unchanged | Unchanged. |
| Select product | Mark selected stable identity | Unchanged, still all products | Load that product's evidence for the same report. |
| Open document | Unchanged | Unchanged | Show all document lines and mark selected-product matches; scope subtotal and full-document total are distinct. |
| Open newer revision | Reset page/selection and use new coherent report | Explicit new report | Old response cannot overwrite it. |
| Open saved v1 report | Existing v1 rendering | Original saved meanings | No synthetic v2 product section recomputed from current data. |
| Excel export / save | Export/accept the complete selected report, not search results | Same pinned monthly result | Include complete product/day/evidence population with its warnings. |

Default sort is covered profit descending, unavailable rows last, then Turkish display name and exact product ID as deterministic ties. Supported signed zero and negative values sort numerically. Other selectable sorts are name, net sales and cost coverage, ascending/descending, with the same stable ties. Search and sort are view state; they do not alter the saved financial scope. No category, sale-kind or day filter is added to this page in v1. Existing separate sales drill-down filters retain their current meaning.

Selecting a row preserves the table scroll and moves keyboard focus to the detail heading after load. `Ürün listesine dön` returns focus to the selected row or its visible table context. Keyboard selection, visible focus, one main landmark, bounded tables, 200% zoom and accessible chart data remain P05 acceptance requirements.

## Separate financial source scope

Approved planning decision P01-S01 defines a **separate minimal financial projection**. It preserves `sql-backup-preview-v1` and its existing SQL column allowlist unchanged. Raw rows remain raw records, without sales/cost/profit reinterpretation. `AGENTS.md` needs no amendment because the existing raw-preview path is not expanded. A later proposal to broaden that path requires its own explicit recorded approval.

The following is a purpose-limited logical projection for P02 review, not an executable SQL SELECT list or permission to inspect a source. Known raw candidates come only from the historical contract. Exact new column names, joins, bounded queries and value inspection scope must be recorded and approved before renewed inspection. Product-name metadata or value inspection is not implicitly authorized by this document.

| Logical facts | Needed for | Source-review boundary |
| --- | --- | --- |
| Lineage, snapshot, schema/mapping, extraction identity, cutoff, declared interval/capabilities | Pinning and honest coverage | Opaque references; no server locator, credential or backup path. |
| Document/line/product IDs and parent links | Stable identity and evidence | Historical candidates `FIS.ID`, `FIS_DETAY.ID`, `FIS_DETAY.FIS`, `FIS_DETAY.STOK`, `STOK.ID`; verify relationships and cardinality. |
| Document type/status, completion, event dates, conversion evidence, currency classification | Recognition, deduplication, period, TRY boundary | Existing raw fields are candidates only. Resolve type 11/35 and header-without-line exceptions. Dependencies may require earlier records. |
| Safe product display and unit | Human-readable row, unit-aware quantities | Exact product-label/unit columns not approved. Separately inspect and review minimal fields; allow label-free ID fallback. Reject unreviewed free text. |
| Quantity, multiplier, net/tax/discount/charge facts and header controls | Independent line/header reconciliation | Preserve decimal strings; candidate field names in existing contracts do not establish semantics. |
| Transaction-time cost, basis/unit/evidence and documented-zero status | Estimated historical cost | `FIS_DETAY.BELGE_TARIHINDEKI_SON_ALIS_FIYATI` is a historical candidate; never substitute a current price. Evidence status is derived from reviewed rules, not fabricated raw fields. |
| Original-sale line and related return/conversion dependencies | Return cost and duplicate prevention | Exact relationship sources remain P02 obligations; fetch only necessary related facts, even outside the month. |

Customer, employee, supplier and contact fields are unnecessary for this slice and remain excluded. No `CARI` data, POS identity/free text, raw change-log SQL, product-level supplier link or full table replication. Product display is permitted only after a reviewed non-identifying field contract, never merely hidden if unsafe. Financial packages reject unknown fields before persistence. Private rows and source evidence remain outside Git, logs, screenshots and release files. Public examples are synthetic.

P02 must record per-rule supported populations and exclusions. Missing essential identity, currency or date semantics block candidate activation for affected required records. Partially supported metrics need explicit capabilities and exposure, not a global `sourceReconciled=true` shortcut. Unsupported non-TRY amounts are never converted or added to TRY exposure. The projection cannot be promoted from raw-preview success or matching raw sums.

## Versioned report and interface delta

This is the planned contract, not TypeScript already present in the repository. Keep `monthly-report-v1` readable, accepted and exportable with original output. New reports use `monthly-report-v2` only after P04 implements the following additive semantics. Retain existing sales, purchasing, operating, app evidence and review content.

`MonthlyReportV2` adds `productProfit`, with contract version `monthly-product-profit-v1`. Its aggregate values come from the existing `calculateSales` and `estimateGrossResult` recognized components. No financial formula moves into React.

| Planned shape | Required fields / meaning |
| --- | --- |
| `productProfit` | `version`, `summary`, complete `products`, complete `daily`, excluded source populations and pinned line evidence. |
| `summary` | `status` (`empty`, `ready`, `unavailable`), `scope` (`market`, `covered`), `salesCoverage`, period coverage, metric fields from the dictionary, counts/exposures/reasons and warnings. `ready` means calculable, not complete or exact. |
| `products[]` | `productId`, stored `displayName`, `displayStatus` (`approved`, `fallback`), `quantities[]` (`unit`, sold/returned/net), validated net sales, covered sales/cost/profit/margin, cost coverage, counts/exposures/exclusions. Identity inherits report lineage. |
| `daily[]` | `date`, `status` (`empty`, `ready`, `unavailable`), same additive money and coverage fields, source-coverage marker. Every calendar day represented, unavailable outside the declared interval. |
| Line evidence | `documentId`, `lineId`, `productId`, business date, event kind, unit, original quantity/amount inputs, recognized net, historical unit/extended cost or null, inclusion/reason, original-sale reference, evidence reference. |

Unavailable money/ratio fields are null, never empty strings or zero substitutes. Quantity entries only exist for known units. Unsupported source populations retain their own counts, reasons and nullable measurable exposure. Existing `GrossResult.status` alone cannot decide emptiness or completeness; its empty sum can be zero even with no covered rows.

Retain `ReportContext` (session, dataset, app revision, sales calculation identity, period) and monthly `reportId`. The report stores mapping/lineage, all existing algorithm versions, new report-composition version `monthly-report-calc-v2`, artifact `esmer-market:monthly-v2`, rules, coverage, cutoff and immutable evidence. Reuse unchanged sales/cost version IDs only when their actual calculation behavior is unchanged. Any changed rule gets a new identity. Store the new contract/version even if aggregation reuses unchanged calculators.

Keep `openMonthly({period})`, `queryMonthly({context})`, `readReportVersion({reportId})`, acceptance/history/comparison and export operations. Extend `MonthlyDisplay` to a discriminated v1/v2 union that returns v2 summary, bounded daily points and product count without the complete product/evidence arrays. The service owns the complete artifact for acceptance and Excel.

Add one narrow named request `readReportProducts({reportId, search, sort, direction, offset})`. Allowed sorts are `profit`, `name`, `netSales`, `coverage`; direction is `asc` or `desc`. Search is trimmed and limited to 160 characters, offset is a nonnegative safe integer. The service fixes page size at 100 and returns `status: products`, `reportId`, `total` matched count, `offset` and `rows`. The full summary is never replaced by a matched-table total. Reject unknown keys and invalid sort/direction before querying.

Extend `readReportEvidence` with a `product-profit` section and optional exact string `productId`, retaining report identity, fixed bounds, search/offset and document detail. The evidence response echoes the report and selected product identity. Reuse named IPC validation and existing failure forms. Missing report, unsupported v1 section or expired context returns a defined unavailable result rather than recomputing another report. Use a specific v1-section message `Bu rapor sürümünde ürün kârlılığı ayrıntısı yok`.

Source/app refresh preserves the pinned candidate and marks it stale. Responses must match current month/report/product request state before display. Accepted artifacts use stored output for all sections and export, never active-data reconstruction. Extend runtime snapshot validation to both report formats before writing v2; preserve the current size limits and recovery round trips. Schema/package version changes belong to P03/P04 only when their concrete representation requires them. A documentation version does not increment SQLite by itself.

## Independent synthetic examples

All quantities are pieces unless stated otherwise; all prices/costs use the same validated KDV-exclusive unit basis. A return has original-sale evidence except where the example says otherwise. Dates are fictional date-only inputs. These expected results are hand-derived, not copied from the application. `null` means unavailable.

| ID | Inputs | Expected results |
| --- | --- | --- |
| E01 | A sells 2 × 100, historical cost 60 each; B sells 1 × 50, cost 30 | A sales/cost/profit = 200/120/80; B = 50/30/20; month = 250/150/100; margin 40%; cost coverage 100%. |
| E02 | E01 plus one A returned in the same month, net -100, original cost -60 | A = 100/60/40; B = 50/30/20; month = 150/90/60; sold 3, returned 1, net 2 pieces. Absolute exposure 350; coverage 100%. |
| E03 | E02 plus C sales 40 with missing cost | Net sales 190; covered sales/cost/profit = 150/90/60. Absolute covered/all exposure = 350/390; coverage 89.74%; covered margin 40%. Excluded sales +40; no whole-market profit. |
| E04 | January A sale 2 × 100, cost 60; February one A return at -100 and original cost -60 | January remains profit 80. February sales/cost/profit = -100/-60/-40, coverage 100%, margin null; no February sale quantity, returned 1, net -1. |
| E05 | E04 return has no original-sale cost attribution | February net sales -100; excluded return exposure -100; cost coverage 0%; displayed covered cost/profit/margin null; no zero-profit headline. |
| E06 | Sale 100, cost 100; separate case sale 100, cost 120 | First profit 0 and margin 0%; second profit -20 and margin -20%. Both coverage 100%. |
| E07 | X sells 1.250 kg × 80 less 10% line discount, cost 50/kg; Y sells 2 pieces × 20, cost 12/piece | X net 90, cost 62.5, profit 27.5; Y 40/24/16. Month 130/86.5/43.5, margin 33.46%. Quantities 1.250 kg and 2 pieces, never 3.250 units. |
| E08 | Two A sales at 100 each, first cost 60 and second cost 80 | A/month sales 200, cost 140, profit 60. Replacing both costs with either monthly price is wrong. |
| E09 | Two covered product lines each net 0.015, documented zero cost | Each profit displays 0,015 ₺, total 0,030 ₺ numerically; exact sum 0.030. Do not round each to 0.02 and claim total 0.03. Trailing source digits need not be invented after aggregation. |
| E10 | One free line, net 0, documented cost 0; separate case one zero-net line cost 5 | Profits 0 and -5 respectively; margin and monetary coverage null; covered count 1 in each, no missing-cost claim. |
| E11 | A sale +100 and evidenced return -100, costs +60/-60 | Net sales/cost/profit = 0/0/0; absolute exposure 200, coverage 100%, margin null. |
| E12 | E01 plus a zero-net line whose cost is missing | Monetary cost coverage still 100%; excluded count 1; covered profit 100; overall scope remains covered, not whole market. |

For E02 place both sales on day 1 and the return on day 2. Daily profit is +100 then -40, matching A +40 and B +20 and the monthly +60. Searching for A shows only A's +40 row while the headline/trend stay +60 and [+100, -40]. A separate day outside declared coverage is null, not zero. The [verification record](../evidence/issue-38-planning.md) contains a runnable independent arithmetic check.

## Existing modules to reuse

Inventory is pinned to base commit `11ed6e9`. The [report contract](reports.md) describes current behavior; the delta above is planned.

| Existing area | Reuse and required extension |
| --- | --- |
| `src/analytics/sales.ts`, `costs.ts` | Recognized sales and covered/excluded `CostRow` evidence. Join `CostRow` to recognized `SalesComponent` by pinned line identity for date/event kind. Cost rows do not currently carry those fields. Preserve cross-period originals/cumulative-return checks; do not rerun cost estimation against day-only data. |
| `src/reports/query.ts`, `contracts.ts`, `display.ts` | Pinned sessions, `MonthlyReport`, compact summary and paged evidence. Add versioned product/day contract and bounded product request. |
| `src/reports/versions.ts`, `export.ts` | Saved output, revision differences and same-artifact Excel. Extend discriminated versions, runtime format selectors in `store.ts`/`versions.ts`, revision comparisons and product/day sheets; preserve v1. |
| `src/ui/AppShell.tsx`, `overview/MonthlyWorkspace.tsx`, `overview/MonthlyOverview.tsx` | Navigation, one month selector, progress and report controls. Compose the agreed page from sections. |
| `src/ui/SalesWorkspace.tsx`, `overview/ReportEvidence.tsx`, `reports/ReportVersions.tsx` | Product/table/chart/detail patterns, bounded evidence and accepted history. Search must not replace the monthly report scope. |
| `src/ui/purchasing/PurchasingWorkspace.tsx` | Existing cost explanations; extract only the section needed, not the entire purchasing page. |
| `src/source/package.ts`, `sql-package.ts`, `src/store/store.ts`, `src/service/worker.ts` | Existing validation, import staging, activation and named worker operations. A preview remains separate from a financial dataset. |

## Bounded P03–P05 checklist

These are contracts for [P03 #40](https://github.com/AlesSystems/esmer-market-analytics/issues/40), [P04 #41](https://github.com/AlesSystems/esmer-market-analytics/issues/41) and [P05 #42](https://github.com/AlesSystems/esmer-market-analytics/issues/42), not authorization to implement in P01.

- **P03.** After reviewed P01 and evidenced P02, test real financial mapping acceptance and raw-preview rejection; implement only reviewed projections through existing normalization/staging/activation. Prove exact strings, bounded month plus dependencies, cancellation/failure, overlap/deletion, lineage rejection and preservation of app data, preview, accepted v1/v2 reports and recovery. Reuse `live-mapping`, `raw-report-readiness`, `analytics-package`, `import-activation`, `import-failures`, `store-ownership` and recovery tests. Real completion depends on P02 source evidence and independently reconciled inputs.
- **P04.** After reviewed P01, synthetic work may expose E01–E12 with focused failures, then add one versioned aggregation/report path. Test complete product/day sums, exclusions, unknown units, changed costs, return dependencies, search/paging invariance, concurrent refresh, immutable v1/v2 reopen/export and decimal strings. Reuse `cost-coverage`, `return-cost`, `decimal-boundaries`, `cost-provenance`, report display/revision and Excel tests. One new focused aggregation file is sufficient. Real completion also requires P03 and independent real comparisons.
- **P05.** After reviewed P01 and usable P04 contract, first expose the packaged journey. Compose existing sections; then refine layout. Test synthetic full/partial/empty/zero/loss/unsupported/stale states, Turkish search/sort, selection, late responses, focus/zoom and retained expense/import/history/recovery access. Reuse `monthly-overview`, `sales-drilldown`, `unavailable-states`, `source-workspace` and report pagination/version desktop checks. Working UI review precedes cosmetic refinement. Real readiness depends on P03/P04; P06 owns Windows/full-volume acceptance.

The P01 prerequisite is **satisfied by the user review on 2026-09-29**. P04 synthetic groundwork is ready for separate execution direction. P05 synthetic composition becomes ready after the usable P04 contract; P03 remains blocked on P02 source evidence. This does not authorize implementation in this task, pass P02, authorize renewed source access, remove completion dependencies or claim A01–A07/L01 acceptance. Track delivery in #36 and its issues; do not create a second roadmap.

## Selected detail projection, issue 67 S02

S02 adds three named report operations without changing stored `monthly-report-v2` output or the recorded-source estimate. `readReportProduct` accepts only a report ID and exact product ID. It copies that report's stored product summary and groups its stored recognized line outcomes into at most 31 calendar days. The projection supports the recorded v2 calculation identities and precision rules explicitly. Unsupported versions or missing required facts return unavailable. It never reads the active source or reruns sales recognition or cost attribution.

Daily amounts use the saved covered membership and exact signed line values. Empty observed days, unavailable days, null costs and nonpositive margin denominators retain v2 meanings. Stored monthly day coverage qualifies selected days conservatively. Unresolved source documents have no reliable product attribution; show that uncertainty separately with unknown exposure. A complete selected cost subtotal does not prove source completeness.

`readReportProductDependency` accepts report ID, product ID, selected return line ID and offset. Every request verifies the return belongs to that product in the report, then follows its retained original-sale reference. The response contains the pinned original header, original line and at most 100 document lines. It exposes recorded operands and historical-cost evidence, not a newly calculated original-sale result. Cross-month originals remain evidence only. Missing attribution or retained evidence stays unavailable. No arbitrary document selector or current-source fallback is accepted.

`exportReportProduct` accepts only report ID and product ID. Its workbook contains the same summary, all calendar days, all selected transaction outcomes and retained original-sale dependencies, independently of search or paging. Every sheet identifies the selected scope, report, source, calculation rules and synthetic assumptions. The existing monthly export keeps all products. Accepted reports, encrypted recovery and reopened details retain the same saved values.

Revision comparison includes stored product, day, line and exclusion changes. Equal monthly totals cannot hide offsetting changes. The owner sees selected sales, covered cost, signed gross result, margin, unit-separated quantities, exposure and daily rows together. The monthly summary and charts retain their all-products scope.

The authorized test seams are immutable report reads, validated desktop requests, complete workbook output, encrypted recovery and packaged owner interactions. Independent synthetic arithmetic covers profit, loss, zero, missing cost, returns, fractional units and exact decimals. S02 does not establish G01 real-source semantics or close issue 67. Windows testing is deferred under the user's 2026-10-06 instruction.

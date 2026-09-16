# Independent golden oracles

## Provenance and limits

These synthetic oracles implement the evidence portion of [issue #5](https://github.com/AlesSystems/esmer-market-analytics/issues/5), task 2.2. Their authority is the unchanged G01–G08 table in the [acceptance checklist](../superpowers/specs/2026-09-04-esmer-market-rebuild-acceptance.md#illustrative-synthetic-oracles-for-the-later-test-suite), not output copied from an application calculation engine. No such engine exists in Phase 2.

All records were authored for this repository. No source backup, customer record, employee record or private expense workbook was used. Every fixture identifies its synthetic lineage, mapping version, assumptions, coverage and literal expected result. The numeric examples do not assert legally applicable KDV rates.

Fixture files live in [golden](../../tests/fixtures/golden/), [source-contract](../../tests/fixtures/source-contract/), [source-a](../../tests/fixtures/source-a/) and [source-b](../../tests/fixtures/source-b/). The [fixture contract test](../../tests/integration/fixture-contract.test.ts) validates their integrity. The [local verification record](phase-2-local.md) records the tested commit, commands and limitations.

## G01–G08 independent working

| ID | Inputs and independent derivation | Literal expectation / boundary |
| --- | --- | --- |
| G01 | 2 × 100 × (1 − 10/100) = 180. Recorded KDV = 180 × 5/100 = 9. Gross = 180 + 9 = 189. Historical estimate = 2 × 70 = 140. Gross estimate = 180 − 140 = 40. | Net 180, KDV 9, gross 189, cost 140, gross estimate 40. Cost and price share unit/KDV basis by synthetic assumption. |
| G02 | Covered sale = 100. Covered cost = 60. Covered gross estimate = 100 − 60 = 40. Absolute-sales-value coverage = 100 / (100 + 100) × 100 = 50%. | Covered 100/60/40, coverage 50%. Full-population gross profit unavailable; 200 − 60 = 140 is not a permitted headline. |
| G03 | 3 × historical 10 = 30. Replacement A = 3 × 25 = 75. Replacement B = 3 × 50 = 150. | Historical cost stays 30 under either replacement price. Replacement comparisons change separately. |
| G04 | Original sale is two units at 100 net and cost 60 each. One attributed return gives −1 × 100 = −100 sales and −1 × 60 = −60 cost. | Linked return −100/−60. Unsupported linkage excludes returned-cost portion instead of using today's price. |
| G05 | One expense of 50 has January incurred date and February payment date. | January operating expense 50; February payment 50; no second operating expense. |
| G06 | Expense input/completeness is absent, independently of available sales/cost. | Eligible sales/gross estimates remain usable. Operating result is unavailable with `Faaliyet kârı hesaplanamıyor — gider verileri eksik.` |
| G07 | A synthetic validated dispatch/invoice pair describes one event. Counting the event once retains both document references. | Both purchase and supplier-return cases recognize one event. Conflict cases remain blocked. This does not prove actual source conversion timing. |
| G08 | Same-lineage A/B records identify insert, edit and deletion explicitly. The accepted report pins A and its app revision. | Candidate B changes current-source facts once; original accepted output and app-owned records remain. Missing adjustment targets require review. This is a future importer/report contract. |

The parent independently checked the G01–G04 numbers with Python's exact `fractions.Fraction`, without importing TypeScript or fixture outputs. It also checked 200 / 2 = 100 basket, 200 − 50 = 150 net sales, 200 − 50 = 150 eligible operating estimate, 40 / 100 × 100 = 40% covered margin, and 100 / (|100| + |−100|) × 100 = 50% coverage. The committed integration test provides the runnable independent checks against the literal fixture expectations.

## Initial-formula inventory

No calculation is released in this phase. This table prevents fixture coverage from being mistaken for permission to implement an unsupported real-source formula.

| Planned calculation / behavior | Oracle coverage | Remaining release obligation |
| --- | --- | --- |
| Discounted sales, recorded KDV and gross receipt | G01 and discount/KDV edge cases | Source discount order, KDV basis, charges and reconciliation. |
| Customer returns, sale count and average basket | G04 and basket/void/archive edge cases | Source completion and type-11/type-35 economic identity; test actual sales engine. |
| Historical estimate and replacement comparison | G01–G04, missing/zero/negative cost and unit edges | Source cost units/KDV, documented zero-cost evidence and historical snapshot meaning. |
| Covered gross estimate and gross margin | G01/G02 and nonpositive-denominator edges | Actual implementation with matching population, no full-population overclaim. |
| Cost coverage with returns | G02 and absolute-sales/return denominator edge | Signed exposure and included/excluded population must match actual source lines. |
| Quantity conversion and fractional precision | `fractional`, `unit-conversion`, unknown-unit and rounding cases | Source precision and multipliers. Synthetic rounding is scenario-local only. |
| Nominal period growth and partial-period comparison | Comparison-base/partial-period edges | Exact comparison-window policy and actual implementation tests before release. Missing/unsuitable bases remain unavailable. |
| Transaction growth and unit-specific volume growth | `positive-comparisons`: 2→3 transactions = 50%; 4→5 kg = 25% | Validate matched source populations; keep unlike units separate. |
| Product/supplier purchase-price changes | `positive-comparisons`: 10→15 per matching unit/KDV basis = 50%, tied to a purchasing supplier | Validate source units, KDV and supplier links; test the actual implementation. G03 covers replacement totals separately. |
| Purchase/supplier-return event recognition | G07 and conversion conflict edges | Source timing/value policy, reconciled links/flags and separate settlement evidence. |
| Incurred expenses, payment attribution and operating result | G05/G06 and expense classification edges | Expense import/classification/tax treatment, full supported cost and recorded owner completeness. |
| Source revisions, deleted targets and accepted reports | G08, A/B, reset and interruption cases | Phase 4/8 runtime failure-injection and immutable report tests. |
| Supplier credit/replacement settlement amounts | No source-supported oracle | Block until settlement semantics and independent examples are available. Physical return alone is insufficient. |
| Inventory valuation, loss completeness, inflation index | No approved complete oracle | No valuation/completeness/formal inflation claim. Additional policy/evidence required. |
| Weighted-average cost and statutory tax | Outside first-release contract | Separate scope and validation required. |

## Fixture validation evidence

The suite checks required G01–G08 identities, expected outputs, explicit synthetic provenance and lineage, mapping version and source-rule support claims. Negative mutations must reject missing outputs, missing lineage, unsupported rules relabelled supported and unexpected private fields. Strict output expectations prevent a nonempty but irrelevant expected object from passing.

A/B correspondence checks compare concrete identities and changed fields. App-owned expenses, adjustments, settings, audit history and accepted reports are separate from source changes. Interrupted publication and concurrent app-owned additions have explicit preservation expectations; the suite does not simulate a working importer and claim it proves atomic activation.

Privacy attack records contain only clearly labelled synthetic sentinel values. Their rejection proves fixture-boundary policy, not the future extractor's read/log/publication behavior. Source-backed fixtures remain uncreated because renewed source inspection is not authorized.

## Review and acceptance

Independent design review selected the static registry and test-local validation. It required strict nested fields, explicit policy/source separation, actual snapshot correspondence and this formula inventory. Implementation review and final test results are recorded in [local evidence](phase-2-local.md).

Task 2.2's synthetic evidence can be reviewed independently. Source revalidation portions of task 2.1, real reduced-fixture work, affected A02/A03/A05 gates and Windows checks remain open. No source-reconciled label, completed A04 importer gate or A07 Windows gate follows from these oracles.

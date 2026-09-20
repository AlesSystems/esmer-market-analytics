# Calculation policy and synthetic assumptions

## Evidence boundary

This contract records the approved calculation meanings for [issue #5](https://github.com/AlesSystems/esmer-market-analytics/issues/5). Phase 2 implements no financial engine. All numeric fixture inputs are synthetic, and none establishes source-field semantics, legal KDV rates or exact historical profit. The [source contract](source.md) lists unresolved source rules that block affected formulas.

The [golden oracle record](../evidence/golden-oracles.md) maps calculations to independent expected values. Future financial implementations must consume validated records and pass those oracles. Fixture validation alone is not a financial implementation test.

## Population and meaning

| Calculation | Contract |
| --- | --- |
| Net sales | Supported completed sales after applicable discounts, excluding recorded KDV, plus signed customer returns. Converted representations count once. Pre-completion voids and already absent archive records are not deducted again. |
| Sale-document count | Distinct validated completed sale IDs within source lineage and snapshot. Separately issued return documents do not increment or decrement this count. POS receipt fields are not identities. |
| Average basket | Discounted net value of completed sale documents, excluding separately issued returns, divided by completed sale-document count. Net sales still deduct returns. Zero count yields unavailable. |
| Historical estimated cost | Signed quantities multiplied by validated transaction-time historical last-purchase unit cost on the same unit/KDV basis. This remains an estimate, never weighted-average inventory valuation. |
| Covered gross estimate | Covered net sales minus covered historical estimated cost, using exactly the same line population. Missing costs never become zero. |
| Covered gross margin | Covered gross estimate divided by covered net sales. Zero/negative covered net sales yields unavailable, with counts and amounts retained. |
| Cost coverage | Included/excluded line IDs and counts, separate signed sales and return exposures, plus covered absolute net line amounts divided by total absolute net line amounts. Returns cannot cancel this denominator. Zero denominator yields unavailable percentage. |
| Replacement comparison | Latest validated purchase unit cost as of imported cutoff, shown separately from historical estimated cost. A price change does not rewrite accepted historical results. |
| Period comparisons | Explicit periods and coverage. Nonpositive/missing comparison base yields unavailable or an explicitly qualified result. Partial and complete months cannot silently become like-for-like. |
| Operating result | Eligible gross estimate minus classified incurred operating expenses/labour and losses not already counted. Full supported cost, reconciled sales, resolved expense treatment and owner-confirmed completeness are prerequisites. |
| Payment view | Payment-date attribution. It does not shift the expense's incurred period or duplicate the expense in operating results. |
| Supplier returns | Physical movement, requested recovery, recognized credit and replacement settlement are separate evidence states. A dispatch does not establish settled credit. |

The basket explanation is `Ortalama sepet, ayrı iade belgeleri hariç tamamlanmış satışların KDV hariç tutarının satış belgesi sayısına bölünmesidir.` A two-document sale total of 200 and separate return of 50 produce net sales 150, count 2, and basket 100.

An unavailable operating-profit headline due to missing expenses uses the exact approved text:

> Faaliyet kârı hesaplanamıyor — gider verileri eksik.

Unknown KDV treatment is not assumed recoverable or non-recoverable. A successful expense import does not establish completeness. Owner funds, loans, transfers and asset purchases are not silently classified as operating expenses. Labour is monthly aggregate only. No customer or employee identity is needed for these formulas.

## Decimal and unit policy

Money, quantity, multipliers, costs and source IDs are serialized as decimal/integer strings, without binary floating-point conversion. Retain original source precision. Financial arithmetic belongs outside the UI and must be deterministic for a pinned input and calculation version.

Source scale, intermediate precision, header/line rounding order, discount order and cost KDV basis remain **unresolved**. No global source precision or rounding policy is adopted in this phase. Any rounding/unit-conversion edge fixture declares a local synthetic assumption that applies only to that scenario. Display rounding must never alter stored source values. In particular, the audit's 0.01 comparison is an observed reconciliation check, not approval of a universal tolerance.

Kilograms and pieces remain separate measures. An unknown unit or multiplier cannot default to one. Missing historical cost, undocumented zero cost, negative cost and a documented genuine zero-cost item are distinct states. Only a documented zero-cost case can participate as zero. Unsupported returned-cost attribution remains excluded even when return sales are known.

## Dates and revisions

Fixtures use explicit date-only business dates. Their periods do not depend on the host timezone, current date or import timestamp. This is a synthetic convention; the actual market-local field and timezone interpretation still require authorized source examples.

A calculation version and source snapshot identify the inputs. An accepted report also pins its app revision and retained output. A newer source correction creates a candidate revision without altering the accepted report. G08 and paired snapshots specify this behavior for later persistence implementation; Phase 2 does not implement activation or report storage.

Historical estimates remain estimated after acceptance. Monthly `Açık / Geçici / Güvenilir` states cannot promote estimated profitability to exact or trusted profitability. Source reconciliation of sales does not certify real-world completeness.

## Formula release gate

No formula is newly released by this phase. Each later formula must have a named oracle, supported source rules for its population, and tests against its actual implementation. The [oracle inventory](../evidence/golden-oracles.md) distinguishes covered synthetic assumptions from unimplemented or unsupported calculations. Supplier settlement, complete real-source discount/rounding behavior, inventory valuation, statutory tax calculations and weighted-average cost remain blocked or outside the approved release scope.

## Phase 5 synthetic sales policy

Phase 5 implements the sales engine for `synthetic-sales-v1` only. The unresolved real-source rules above remain unchanged. Earlier statements that no engine exists describe Phase 2, not this implementation. A legacy relational package has insufficient meaning and returns unavailable sales, rather than fabricated zero metrics.

Synthetic line net is signed quantity magnitude multiplied by KDV-exclusive unit price and by `(1 - discountRate / 100)`. A separately issued customer return supplies the negative sign. Voids do not deduct again. Explicit converted representations are excluded from recognition while retaining their evidence. Unknown meanings or ambiguous ownership remain excluded and make coverage incomplete. The contract does not infer a type-11/type-35 relationship.

Use an isolated decimal.js configuration with precision 100. The synthetic quantity/price bounds and rate bounds permit exact intermediate net arithmetic and bounded summation without binary floating-point conversion. Preserve original serialized decimal strings in evidence. Round only the explicitly declared tax expectation, final averages and percentages. The UI preserves supplied decimal digits and pads money to at least two places; it does not round aggregation inputs. Tax expectation and final ratios use two decimal places with half-away-from-zero rounding. Recorded KDV is retained, and discrepancies must remain visible rather than being silently rewritten.

Header and line amounts reconcile exactly under this synthetic policy. The historical audit's 0.01 observation is not a universal tolerance. A discrepancy leaves the line-based report incomplete, with original header amounts and differences visible. Separate returns reduce net sales but neither the basket numerator nor completed-sale document count. Zero sale count yields unavailable average basket. Quantities remain separated by unit.

Reports carry an explicit business-date period, dataset/app revision and calculation version. Month/year comparisons disclose matched boundaries and coverage. Complete months compare complete calendar months. Partial months compare matching available day ranges, clamping both sides for shorter months. Basket percentage changes use unrounded numerator/count ratios. Missing coverage or a nonpositive comparison base yields unavailable percentages. Synthetic reconciliation is not source reconciliation or proof of actual market completeness.

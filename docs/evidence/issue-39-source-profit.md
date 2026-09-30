# Issue 39: monthly product-profit source evidence

Issue [#39](https://github.com/AlesSystems/esmer-market-analytics/issues/39), P02 of [#36](https://github.com/AlesSystems/esmer-market-analytics/issues/36). Status on 2026-09-30: **insufficient source evidence; real financial activation blocked**. This is the issue's insufficient-evidence exit. No source, backup, private artifact, database, credential or container was inspected for this task. No source projection, mapping, permission or calculation rule changed.

The approved [P01 product contract](../contracts/monthly-product-profit.md) defines the desired gross estimate and synthetic examples. It does not authorize renewed source inspection or approve a SQL projection. The current executable [source registry](../../src/source/contract.ts) still marks every real financial rule `unsupported` with `historical-audit-only` evidence. Thus the financially admitted real-source population is **none**. This is a capability state, not a measurement that the market had zero sales or profit.

## Evidence and count conventions

`H26` means the [issue 26 isolated inspection](issue-26-source-validation.md), private batch `67e45d4c-8d47-4f78-8eef-34e65b9aca7a`. It used a cold volume copy with legacy additions, not a pristine `.bak` restore. `R26` means the [bounded raw preview](real-sql-preview.md), private batch `e2731e28-d5b8-418f-b1fe-b955b1c9de5b`, covering source timestamps 2025-10-01 through 2025-10-12 inclusive. That interval is a partial, historical raw sample, not a validated business month. `P01` means the [approved synthetic examples E01–E12](../contracts/monthly-product-profit.md#independent-synthetic-examples). These sources have different populations and must not be added together.

Historical counts below describe recorded rows or catalog entries. They are **not** included or excluded financial counts. For every rule below, financially included real records are none because there is no implemented real financial mapping. Financially excluded counts and TRY exposure are unknown unless the row expressly supplies a supported measurement. The raw aggregate equality in R26 proves transport of four recorded fields only. It cannot classify a row as a sale, cost or profit.

| Rule | Existing evidence and known raw population | Missing independent proof and enforced result |
| --- | --- | --- |
| Authorization, backup, lineage, schema and cutoff | H26 found SQL Edge 15.0.2000.1574 and 471 user tables in the isolated copy; no original `.bak` hash, clean-schema comparison or permanent lineage. R26 records an opaque batch and partial source timestamp bounds. | Record new explicit source and field scope, isolated restored backup identity, engine/schema fingerprint, lineage and source cutoff before inspection. The registry keeps source identity and column mapping at `reject-import`. Complete financial population and exposure: unknown. |
| Reader permission and projection | H26 verified selected reads and denied customer column, write, DDL and impersonation attempts for its temporary account. R26 selected 5,508 headers and 18,858 lines with the [fixed preview projection](../contracts/privacy.md#isolated-backup-record-preview-allowlist). | Recheck restricted reader and fail-closed exact financial projection on an explicitly authorized isolated restore. The historical account test grants no future permission. No new field or SQL query is approved here. Preview rows remain raw, never financially admitted. |
| Completion, types 11 and 35, voids and deletions | H26 saw 529,001 all-type headers and 1,873,553 lines. It counted 100 type-11 and 2 type-35 headers without current lines across that historical copy. R26 found 3 no-line headers in its partial window, without validated financial type treatment. | Prove completed economic events, pre-completion voids, archive/deletion effects and correction handling from bounded records and independently expected cases. A no-line header is not a zero sale by default. Included/excluded financial counts and exposure: unknown. |
| Sale identity, exact joins and conversions | H26 counted 35,944 conversion links across purchase, supplier-return and customer-return pairs. It found no orphan header or product references in exploratory joins. R26 verified unique header/line IDs and matching type codes for its projected rows. | Prove source-line, document, product and economic identities, especially type-11/type-35 pairing and 4/8 or 1/5 and 3/7 conversions, without multiplying contributions. Fetch necessary dependencies outside the month as evidence only. An ID-only product fallback is planned; a display label requires separate approval. Link count is not event count. Financial counts and exposure: unknown. |
| Business date and month coverage | H26 raw timestamp bounds were 2005-01-20T18:02:44 to 2025-10-12T18:06:48. R26 selected 2025-10-01..12 by recorded timestamp. | Validate the actual completed-sale and recorded-return business timestamps and market-local timezone. Declare covered interval and partial final day. Machine, extraction and import time do not set the month. Financial counts and exposure: unknown. |
| TRY and non-TRY dependencies | H26 classified 528,997 TRY and 4 USD headers across all types. Two USD headers were purchase invoices and two supplier-return invoices. R26 classified all 5,508 selected headers as TRY. | Validate currency on every financial event and its original-sale, conversion and cost dependencies. Exclude unsupported non-TRY populations without conversion or a guessed TRY exposure. These all-type raw counts do not measure sales coverage. |
| Quantity unit and multiplier | H26 found recorded multiplier one on all 1,873,553 historical lines, with `decimal(18,3)` quantity storage. | Independently validate piece and kg meanings, conversion and cost-unit compatibility for each supported type. A recorded multiplier of one does not prove the unit. Unknown units keep raw evidence; the current synthetic sales calculator excludes their whole document. Financial counts and exposure: unknown. |
| Net, gross, KDV, discount and rounding | R26 exactly matched SQL and Python Decimal sums for four raw amount columns; H26 found two type-5 KDV differences above 0.01 and other gross-total exceptions. P01 E07 supplies a synthetic line-discount oracle. | Establish signed net-of-KDV sale/return meaning, line and header discount order and allocation, charge treatment, source rounding and per-line reconciliation with independent exact expected amounts. No universal 0.01 tolerance, raw-column-name inference or proportional allocation is approved. Affected record counts and exposure: unknown. |
| Historical cost | H26 observed selected `decimal(18,8)` cost storage and the historical cost column name. P01 E01, E06 and E08 test transaction-time estimates synthetically. | Validate last-purchase-at-transaction meaning, same product/unit/KDV basis, evidence reference and time ordering. Separately count missing, undocumented zero, genuine documented zero, negative, unknown-tax and contradictory costs; expose signed sale/return amounts where their net basis is independently known. No measured breakdown exists. A present purchase price cannot fill a gap. |
| Return sales and original-sale cost | H26 listed return type codes and 5 type-4/8 conversion links, but did not prove return attribution. P01 E04/E05 and G04 cover prior-month original sale and missing attribution synthetically. | Prove original-sale line identity, chronology, same product/unit/cost basis and cumulative returned quantity, including originals before the selected month. Unsupported return cost remains excluded while a separately validated return net may remain negative sales. Actual included/excluded counts and exposure: unknown. |

No real-source monthly sales, transaction count, product quantity, cost coverage, historical cost or gross-profit metric is enabled. Identity, date, currency and money-basis gaps block recognition. Unknown unit semantics block the whole affected document under the current synthetic policy. If sales meaning is separately established later, unsupported cost or return attribution can limit the gross estimate to an explicitly covered subset.

These rows can overlap. For example, a no-line header may also have an unresolved conversion or currency dependency. A future matrix must state the deduplication key and count each record once per reported population; it must not sum rule counts into a market total.

## Existing enforcement and synthetic arithmetic

The SQL reader selects only fixed columns in [`src/source/sql-server.ts`](../../src/source/sql-server.ts). [`src/source/sql-package.ts`](../../src/source/sql-package.ts) wraps them as `sql-backup-preview-v1`, with `sourceReconciled:false`. [`src/source/raw-package.ts`](../../src/source/raw-package.ts) rejects extra fields and malformed references. [`src/store/store.ts`](../../src/store/store.ts) writes that package to `source_preview`, apart from `active_dataset`. The analytics package reader in [`src/source/package.ts`](../../src/source/package.ts) accepts only synthetic provenance and mapping versions. [`SalesReports.open`](../../src/reports/query.ts) returns `UNSUPPORTED_MAPPING` when only raw preview records exist. Existing [live mapping](../../tests/integration/live-mapping.test.ts), [raw report readiness](../../tests/integration/raw-report-readiness.test.ts) and [raw preview](../../tests/integration/raw-preview.test.ts) tests exercise those boundaries. This is format and route separation; it is not independent proof of the origin of content labeled synthetic.

The independent checks below use invented values. They verify the P01 E07 fractional kg discount, E04 prior-month return, E03 missing-cost denominator and G01 tax arithmetic. They do not validate SQL semantics.

```sh
python3 - <<'PY'
from decimal import Decimal as D, ROUND_HALF_UP

line = D('1.250') * D('80') * (D('1') - D('10') / D('100'))
cost = D('1.250') * D('50')
assert (line, cost, line - cost) == (D('90'), D('62.500'), D('27.500'))
assert (D('2') * D('100') * D('0.9'), D('180') * D('0.05'), D('180') + D('9')) == (D('180.0'), D('9.00'), D('189'))
prior_month_return = (D('-100'), D('-60'))
assert prior_month_return[0] - prior_month_return[1] == D('-40')
covered_abs, excluded_abs = D('350'), D('40')
assert (covered_abs / (covered_abs + excluded_abs) * 100).quantize(D('0.01'), rounding=ROUND_HALF_UP) == D('89.74')
assert (D('150') - D('90'), D('150') + excluded_abs) == (D('60'), D('190'))
print('synthetic arithmetic: pass')
PY
```

## Next evidence contract and acceptance state

A future authorized P02 run must first record the exact restored backup, permitted tables and columns, purpose, date window and required out-of-window relationship evidence. It must approve fixed queries and a restricted reader before any renewed source read. Keep private row examples, exact-value expectations, credentials, locators and backup contents outside Git; use an opaque batch identity here. For each proposed financial rule, retain source identity, join/cardinality checks, a reduced representative example, an independently computed Decimal result, included/excluded IDs and counts, signed TRY exposure when supported, unknown exposure otherwise, and the stated effect on each metric. Review a rule before changing [`docs/contracts/source.md`](../contracts/source.md), [`docs/contracts/calculations.md`](../contracts/calculations.md), [`docs/contracts/privacy.md`](../contracts/privacy.md) or `src/source/contract.ts`. P03 real mapping and activation remain blocked until that review; the raw preview remains available.

| Gate | Contribution from this task | Open acceptance |
| --- | --- | --- |
| A01 | Existing preview projection, read restrictions and import separation are identified. | Fresh authorized isolated-read proof, source identity and safe failure evidence for the financial projection. |
| A02 | P01 synthetic sales, discount, quantity, cost and return oracles remain available. | Validated real sale, unit, tax, cost and return meanings with independent expected values. |
| A03 | The rule matrix distinguishes raw counts from admitted populations and unknown exposure. | Financially mapped product identities, complete row/day reconciliation, explicit coverage and traceable confidence. |
| A05 | Existing fixed projection, package rejection and privacy tests identify the current boundary. | Review of any new fields, logs, reduced examples and release artifact under fresh authorization. |
| P03, Windows, full volume, L01 | No implementation or acceptance claimed. | P03 source mapping; Windows package/desktop checks; full-population resource and reconciliation checks; owner acceptance and rollout direction. |

## Verification on this branch

Base `9923427`, branch `codex/issue-39-profit-evidence`; macOS 27.0 arm64, Node 24.15.0 and npm 11.12.1. Locked dependencies were installed with `npm ci --ignore-scripts`. The test run explicitly unset `ESMER_SQL_TEST_ADMIN`, `ESMER_SQL_TEST_CONFIG` and `ESMER_SQL_PREVIEW_PACKAGE`; it used no real SQL source or private preview input. Its ignored logs are under `work/poteto/issue-39/`.

| Procedure | Expected | Actual and limit |
| --- | --- | --- |
| Focused integration tests for live mapping, raw report readiness, raw preview, source evidence, source readonly and source privacy | Existing raw/financial separation and reader boundaries hold. | 28 passed in 6 files. Synthetic or mocked checks only. |
| Focused unit tests for sales, cost coverage, return cost, decimal boundaries and purchasing | P01-related arithmetic assumptions hold. | 20 passed in 5 files. Synthetic assumptions only. |
| `npm run typecheck` and `npm run lint` | Application types and lint pass. | Both passed. |
| `npm test` with this worktree's packaged Mac executable | Unit, integration and packaged desktop regressions pass. | Unit: 37 passed in 12 files. Integration: 281 passed and 5 skipped, with 43 passed files and 2 skipped files. Packaged Mac desktop: 33 passed and 7 skipped. The skipped SQL and conditional cases are not evidence. |
| `npm run build` and `npm run package:local` | Build and package the existing app. | Both passed. No runtime, test, tool, script or package file differs from base `9923427`. Mac results do not establish Windows acceptance. |

Earlier command counts in H26 and R26 belong to their original builds. Their private evidence retention was not rechecked in this task.

The synthetic inputs come from the checked-in tests and helpers at base `9923427`, including `rawSnapshot()` and `businessRecords()`. No reduced real fixture was created. The embedded Python Decimal check passed independently of the TypeScript calculators. Local links and anchors in all four changed documents and `git diff --check` passed. No behavioral change was made, so no missing-behavior failure is claimed.

Reproduce the focused checks from the repository root:

```sh
npm run test:integration -- tests/integration/live-mapping.test.ts tests/integration/raw-report-readiness.test.ts tests/integration/raw-preview.test.ts tests/integration/source-evidence.test.ts tests/integration/source-readonly.test.ts tests/integration/source-privacy.test.ts
npm run test:unit -- tests/unit/sales.test.ts tests/unit/cost-coverage.test.ts tests/unit/return-cost.test.ts tests/unit/decimal-boundaries.test.ts tests/unit/purchasing.test.ts
npm run typecheck
npm run lint
env -u ESMER_SQL_TEST_ADMIN -u ESMER_SQL_TEST_CONFIG -u ESMER_SQL_PREVIEW_PACKAGE ESMER_EXECUTABLE="$PWD/release/mac-arm64/Esmer Market Analytics.app/Contents/MacOS/Esmer Market Analytics" npm test
git diff --check
```

The full command is for this macOS arm64 host and packages the application before desktop tests. Its 5 integration skips require SQL configuration. Its 7 desktop skips cover 6 Windows checks and the private actual-backup preview. It does not run `package:win` or validate a market source. No source allowlist, SQLite schema, dependency, UI or deployment behavior changes in this workstream. The Prove It Works principle required direct packaged execution while keeping source meaning unproven.

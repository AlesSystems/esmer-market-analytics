# Recorded-source estimates for V1

Contract `source-estimate-v1`, authorized by the user on 2026-10-02. This is the explicit estimate-first extension to [monthly product profit](monthly-product-profit.md), [source](source.md) and the foundation requirements. It contributes to #39, #40, #41 and #43 without claiming their original verified-source gates complete.

## Capability and scope

The owner can view offline product/day/month estimates from a declared isolated backup window. Source meanings remain unverified. The quality is always `unverified-estimate`; reviewing, exporting or reconciling the arithmetic cannot promote it. Financial `SalesReports`, operating results and accepted monthly reports keep their existing contracts.

The new `sql-backup-estimate-v1` package has the same restricted raw fields as `sql-backup-preview-v1`, plus exactly `BELGE_TARIHINDEKI_SON_ALIS_FIYATI` on each line. Its value is a decimal string or null. The old package version rejects this extra field and remains readable unchanged. Both versions retain `isolated-sql-backup` provenance and `sourceReconciled:false`. No names, supplier/customer/employee fields or arbitrary evidence text are added.

The initial real package reuses the previously reconciled September 2025 private extraction. No renewed SQL read or grant change is necessary. The preparation step proves exact header/line identity and operand agreement with the retained preview before adding the cost candidate. An import validates canonical bytes, hashes, references, dates, row/byte bounds and exact columns before atomic replacement. Invalid imports preserve current data.

## Fixed population and formulas

The selected calendar month uses the recorded date substring from `FIS_TARIHI`. This is an assumption about business dates, not a timezone conversion or validated event timestamp. Only overlap with the declared extraction range is observable. Days outside that range are gaps. An empty observed day means no eligible recorded rows, not proof of no sales.

Sale candidates require header `FIS_TURU=11`, `CURRENCY=TRY`, `DURUM=1` and `AKTIF=1`. These flags select candidates but do not prove completed sales. Type 35 remains excluded because economic identity relative to type 11 is unproved. Other types, currencies and statuses are excluded and counted. Each excluded line receives one primary reason, in this order: type 35, other type, unsupported currency, unsupported status, missing/negative amount, unattributed return cost, invalid quantity, unsupported multiplier, missing cost, zero cost, negative cost. Covered lines have no exclusion reason. Counts partition the full period line population. Empty headers have a separate document count and unknown exposure; do not add document counts to line counts. No foreign-currency conversion occurs.

The revenue operand is nonnegative, nonnull `TOPLAM_KDV_MATRAHI`. It is an assumed recorded amount basis. Do not label it verified revenue or KDV-exclusive net sales. Do not allocate additional discounts or taxes. Invalid or missing amounts have unknown exposure, never zero exposure. Candidate sale and return amount totals are null when no valid known operands exist. If known and unknown operands coexist, display the known subtotal with the unknown-amount count. A known zero operand may produce a calculated zero. No candidate rows means unavailable amount, with the separate zero row count explaining why.

Cost-covered sale candidates additionally need positive `MIKTAR_FIS`, `CARPAN` numerically equal to one, and a strictly positive historical-cost candidate. Their candidate cost is quantity times that field. Their contribution is recorded amount minus candidate cost. These rules assume the operands share unit and tax basis; they do not prove transaction-time costing. Null, undocumented zero and negative cost are distinct exclusions. No current-price fallback occurs. Unknown/nonunit multiplier and invalid quantity exclude cost coverage.

Type 12 with the same currency/status/date selection contributes a separate nonpositive candidate return amount, subtracting a nonnegative recorded amount exactly once. Every return's cost and contribution remain excluded because original-sale attribution is unavailable. Returns are shown alongside the headline, with a warning that the covered contribution omits their economic effect and can overstate the result. Do not subtract return revenue from contribution while implicitly assigning zero cost.

The headline is covered sale contribution. It is null when no covered sale lines exist. A calculated zero or negative contribution remains a valid displayed amount. Candidate sale amounts, candidate return amounts, covered sale amounts, candidate costs and contribution remain distinct. The report never claims whole-market profit.

Product, day and monthly totals partition the same eligible recorded lines. Product identity remains its exact source ID and display falls back to `Ürün #<ID>`. No physical quantity total or piece/kg claim is displayed because the full extract lacks a unit dictionary. Costs can vary by line within a product. Product search/paging never changes summary or daily scope.

Use decimal precision 200 for this version. The raw operand bound is 40 integer and 30 fractional digits, so a product of two operands and at most 100,000 rows fits this precision. Money strings retain exact digits; no cent tolerance or raw-source rounding rule is invented. Percentages may round to two places for display and never feed amounts. Cost coverage uses absolute candidate sale plus return amount as denominator, covered sale amount as numerator, and null for a zero denominator. Unknown-amount rows remain explicit even when a displayed percentage reaches 100.

## Visible limits and provenance

The monthly view shows the estimated nature beside the headline, included and excluded counts, missing/zero/negative-cost reasons, return exposure and unknown amounts. Method details contain the fixed assumption version, source package hash, extraction window and date. All required assumptions remain available in Turkish. The user cannot turn off or edit the versioned formula through free-form package fields.

Every query and export pins source hash and period. A replaced package causes a stale response, never mixed months or old product detail under new totals. The service returns bounded product/evidence pages. The renderer performs no financial arithmetic. Raw document drilldown stays available.

Excel contains every product and day for the selected report, plus method, assumptions, scope and exclusions. Every sheet identifies the result as unverified and records the same source hash and calculation version. Values that Excel cannot represent exactly remain text. No spreadsheet formula recomputes profit.

V1 estimates are transient. They do not have accepted financial-report versions. The current source package survives restart and encrypted backup/recovery. Export preserves an estimate outside the app, while a later source import replaces the in-app estimate. Existing saved financial reports and app-owned expenses/settings remain unchanged.

## Acceptance

Independent synthetic golden amounts and a separate Python Decimal calculation over the retained real operands must match all product/day/month values and exclusions exactly. Real arithmetic reconciliation proves the declared formula, not the source assumptions. Private amounts and source IDs stay outside Git, logs and screenshots.

Checks cover old/new package validation, same/replacement/corrupt/cancelled import, stale requests, null/zero/loss/returns-only, exact decimal boundaries, full export beyond pagination, encrypted recovery, packaged import/reopen/drilldown/export, keyboard and zoom. Relevant full suites, lint, typecheck and build run before publication. Windows checks remain the user's responsibility. Production POS access and owner installation are separate.

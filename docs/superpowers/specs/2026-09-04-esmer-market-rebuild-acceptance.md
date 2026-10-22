# Esmer Market rebuild — release acceptance and proof checklist

- Date: 2026-09-04.
- Status: Approved release proof requirements. Checkboxes retain the original checklist; current build-specific results and open gates are in [the evidence index](../../evidence/index.md). Re-baselined for v1 on 2026-10-22 by [#98](https://github.com/AlesSystems/esmer-market-analytics/issues/98) ([decision record](../../decisions/issue-98-profit-first-estimate-edition.md)); the original checkboxes are preserved and none is passed by this change.
- Related: [Foundation specification](2026-09-04-esmer-market-rebuild-design.md) · [Source audit](2026-09-04-esmer-market-rebuild-audit.md).

## 1. Release rule

The surprise release is ready only when each applicable first-release gate has recorded evidence, with no unresolved source-write/privacy/data-loss failure. Writing this checklist or passing source `DBCC CHECKDB` does not pass application acceptance.

Historical profit may remain honestly estimated. It may not be displayed as verified or conceal excluded costs/expenses. Later live integration has its own additional gate and is not needed for the reveal.

Since 2026-10-22, the v1 gates follow the [#98 re-baseline](../../decisions/issue-98-profit-first-estimate-edition.md); the v1 status notes in A02, A03, A06, A07 and L01 below say which original items are post-v1.

Use small coherent test/implementation/documentation changes in this independent repository. Tests precede financial implementation, and higher-risk changes retain their acceptance evidence. The original planning transfer introduced no test suite. Later implementation evidence is recorded separately.

For every gate, retain the tested build/commit, fixture or private source-batch identity, environment, command or manual procedure, expected result, actual result and evidence location. Do not put private source backups, credentials or customer records in the evidence repository.

## 2. A01 — Source safety

- [ ] The complete ingestion workflow succeeds with a dedicated account restricted to approved read access, including startup, retry and failure paths.
- [ ] Application code and dependency initialization contain no POS-targeted migrations, DML, DDL, index/statistics changes, triggers or configuration changes.
- [ ] Isolated-test permission checks demonstrate that forbidden write/administrative actions are refused. No negative write tests run against the live market database.
- [ ] The UI cannot supply arbitrary SQL, source table names or credentials; requests are validated at the privileged local boundary.
- [ ] Queries have bounded batches, parameterized inputs and timeouts; failure/cancellation releases resources.
- [ ] Backup restoration/preparation is explicitly isolated from the market system; the desktop app never restores over or administrates the source.

Evidence: scoped review, permission report from the isolated test instance, query/workflow traces without sensitive values, and successful read-only extraction. A string search alone is not sufficient proof.

## 3. A02 — Calculation correctness and golden scenarios

**v1 status (2026-10-22, #98).** Verified real-source semantics ("trusted" profit) move out of v1. For v1, the estimate's acceptance in [recorded-source estimates](../../contracts/recorded-estimates.md) applies: independent synthetic golden amounts and a separate Python Decimal reconciliation. Missing or invalid cost is never zero, and decimal determinism still applies. Items that depend on verified source semantics (discounts, KDV, conversions, unit conversion, return attribution) are post-v1; the rest apply to the estimate edition.

Approve an explicit source-to-domain contract before implementing affected formulas. Establish units and multipliers, KDV inclusion/exclusion in cost, header/line discounts, return attribution, business dates, decimal precision and rounding. Unknown semantics must be represented as unsupported/missing, not resolved by guessing.

- [ ] Golden scenarios have independently checked expected outputs, not outputs copied from the implementation being tested.
- [ ] Sales discounts, cancellations, customer returns and supplier returns remain separate cases.
- [ ] Invoice/dispatch conversions do not double count financial or quantity effects.
- [ ] Fractional quantities and unit conversions retain correct units/precision.
- [ ] KDV follows the validated recorded values; anomaly rules do not rewrite source facts.
- [ ] Historical estimates never use current replacement prices as a silent fallback.
- [ ] Missing/invalid cost is not zero; covered sales and covered costs refer to the same population.
- [ ] Zero or unsuitable comparison denominators produce a defined unavailable/qualified result rather than infinity or a misleading percentage.
- [ ] Incurred versus payment dates and non-operating classifications do not double count expenses or treat every cash movement as a cost.
- [ ] The same data and calculation version produce identical results regardless of current machine date, UI route or import order.

### Illustrative synthetic oracles for the later test suite

These examples make the intended behavioural boundaries concrete. They are not market transactions or a statement of legally applicable tax rates. Numeric assumptions are deliberately explicit; source-backed variants must be validated before use on actual records.

| Scenario | Synthetic inputs | Expected behaviour |
| --- | --- | --- |
| G01 — Discount and recorded KDV | Two units at TRY 100 each before KDV; 10% line discount; recorded 5% KDV; historical cost TRY 70 per unit on the same unit/tax basis | Net sales 180; KDV 9; gross receipt 189; estimated cost 140; estimated gross profit 40. Method remains an estimate. |
| G02 — Missing cost | Two sales of TRY 100 net each; only the first has cost evidence of TRY 60 | Covered sales 100, covered cost 60, covered estimated gross profit 40; sales-value cost coverage 50%. Never show 140 as full-population gross profit. |
| G03 — Replacement price changes | Three sold units with historical unit-cost snapshot 10; latest unit purchase price 25, later changed to 50 | Historical estimated cost stays 30; replacement-cost comparison changes from 75 to 150. No silent history rewrite. |
| G04 — Linked customer return | Original two-unit sale at 100 net and cost 60 per unit; one unit returned with a validated original-sale link and matching unit/tax basis | Return contributes net sales -100 and historical cost -60; do not substitute today's price. Without adequate attribution, flag/exclude the unsupported cost portion. |
| G05 — Expense timing | Expense 50 incurred in January, paid in February | Operating-expense attribution is January; any payment view uses February. Never count the expense twice. |
| G06 — No expense evidence | Sales/cost information exists, but no expense import or completeness confirmation | Show sales and eligible estimated gross profit; withhold operating-profit headline with the Turkish missing-expenses explanation. |
| G07 — Converted purchase/return | Linked dispatch and later invoice describe the same validated event | Recognize the event once under the approved timing/value contract; retain both documents for traceability. Missing or conflicting links/flags cause a warning or blocked metric, not silent double counting. |
| G08 — Newer source correction | Same source lineage and document ID appear in two snapshots with different values or deleted state | Candidate current-source dataset reflects the correction exactly once; preserve the old accepted report and app-owned adjustments for review. |

These examples supplement, not replace, cases for fractional weights, precision boundaries, late source corrections, partial months, supplier replacement uncertainty, and rare document/rate types. A future weighted-average method requires a separate suite including opening quantity/value and chronology; it must not reuse a last-purchase estimator and merely change its label.

Evidence: approved oracle table, unit/property tests where useful, integration reconciliation, and passing regression results linked to the relevant calculation version.

## 4. A03 — Reconciliation, confidence and traceability

**v1 status (2026-10-22, #98).** "Trusted" profitability, real-source reconciliation and market-local business-date validation are out of v1. v1 discloses the estimate state once per page through a trust chip, with method, coverage and exclusions available in Rapor. Incomplete expenses are still not zero, and accepted reports are still not overwritten. Items that depend on verified real-source semantics (header/line reconciliation, source-reconciled status, trusted profitability, market-local business dates) are post-v1. The other items apply to the estimate edition.

- [ ] Summary → breakdown → transaction/line → source ID/batch/method traceability works for every released KPI, including exports.
- [ ] Header and line totals reconcile under documented rules; unexplained differences are visible and cannot receive source-reconciled status.
- [ ] Source-reconciled means agreement with the source population, not certification that the real-world books are complete.
- [ ] Each estimated metric displays method and coverage. Cost coverage includes monetary exposure and excluded population, not just a percentage of rows.
- [ ] Incomplete expenses are not zero, and a technically successful expense import does not automatically certify completeness.
- [ ] Trusted profitability cannot be assigned while historical cost remains estimated or expense coverage is unresolved.
- [ ] Partial months, older backups and missing comparative periods are labelled accurately. No stale historical data is shown as today's activity.
- [ ] Business-date interpretation is checked against market-local examples, independently of the developer's timezone.
- [ ] New source/formula/expense revisions do not overwrite accepted reports silently. Differences and prior accepted explanations remain retrievable.
- [ ] The Turkish vocabulary distinguishes customer return, supplier return/claim, waste, net sales, estimated gross profit, management operating profit and cash movement.

Evidence: golden report comparisons, representative Turkish UI/export screenshots, drill-down walkthrough and revision-history test.

## 5. A04 — Import and app-owned data preservation

- [ ] Reimporting an identical package is idempotent; overlapping newer snapshots do not append duplicate sales.
- [ ] Source IDs are namespaced by lineage, and a changed/reset source cannot silently collide with another source.
- [ ] An incomplete or invalid candidate never becomes the active dataset.
- [ ] Interrupted extraction, calculation, import or activation leaves the last complete dataset usable.
- [ ] Disk-space failure and corrupt input produce a useful error without destroying the working state.
- [ ] An app-owned expense/adjustment created during an import is present after activation.
- [ ] Expense corrections preserve original import provenance; spreadsheet duplicates are detected without rejecting legitimate repeated expenses solely on matching date/amount.
- [ ] Source corrections/deletions preserve expenses, settings, audit history and trusted report versions; dependent adjustments are flagged for review where necessary.
- [ ] Essential schema/type/reference errors block the affected import; allowed incompleteness remains explicit in metric coverage.
- [ ] Data retention and rollback preserve accepted-report reproducibility without unbounded accumulation of unnecessary full-source copies.

Evidence: failure-injection tests at import boundaries, before/after state comparisons, duplicate/overlap tests and a multi-snapshot test fixture. A second real backup is helpful but not a substitute for deliberately constructed edge cases.

## 6. A05 — Privacy and local application boundaries

- [ ] The source extractor uses a reviewed column allowlist. Identifiable customer fields never enter the generated analytics package, even if hidden in the UI.
- [ ] Customer contacts, addresses, tax/identity numbers, loyalty identifiers and identifying free text are absent from source-derived analytics records, logs and fixtures.
- [ ] Raw source change-log SQL is not copied into analytics/log output; it can contain sensitive values.
- [ ] Supplier data is restricted to the approved purchasing use case; shared counterparty tables are not replicated wholesale.
- [ ] Only aggregated monthly labour data is accepted; no employee-level payroll import is included.
- [ ] Source credentials are protected outside the renderer, repository, analytics exports and plaintext backups.
- [ ] Application privileges are mediated through a narrow validated desktop boundary; no app login is added as a substitute for safe internal boundaries.
- [ ] Installer, portable package and Git changes contain no original backup, legacy local database, credential file or unreviewed private test data.

Evidence: schema/package inspections, generated-output privacy tests using synthetic sentinel values, dependency/boundary review and release-content inventory. No sensitive production values should be copied into test logs to prove a filter works.

## 7. A06 — Backup and recovery

**v1 status (2026-10-22, #98).** The v1 gate is an encrypted backup file plus a documented restore. The remaining items, including the clean-machine loss exercise, are post-v1.

- [ ] Automatic encrypted backups capture a consistent state including expenses, adjustments, accepted reports and their required provenance/data.
- [ ] Recovery works on a clean installation after simulated loss of the original computer, using a separately retained recovery secret/key.
- [ ] Losing the original OS credential store does not make every backup permanently unusable.
- [ ] Incorrect key, corrupted/incomplete backup and unsupported schema version fail safely before replacing a working installation.
- [ ] The restored UI/export values match the backed-up report versions and app-owned record counts.
- [ ] Restore failure leaves the current working data usable; successful restore is explicit and auditable.
- [ ] Recovery instructions and the retention/storage policy are reviewed before release. No daily login/PIN workflow is introduced.

Evidence: recorded backup → simulated machine loss → clean restore exercise; comparisons of restored records and financial outputs; Turkish recovery instructions. Creating an encrypted file without demonstrating restore does not pass this gate.

## 8. A07 — Windows packaging, usability and performance

**v1 status (2026-10-22, #98).** The v1 gate is one Windows smoke test, deferred to [#109](https://github.com/AlesSystems/esmer-market-analytics/issues/109). The two-second benchmark items are dropped unless prepared packages exceed 100,000 rows. The other Windows-specific items are post-v1. Items that are not Windows-specific (offline use without POS access, unavailable-profit states, Excel matching the display, licence review) still apply.

- [ ] Installer and portable distribution are tested on the supported Windows configuration; no separately installed developer runtime is needed to view/import the prepared analytics dataset.
- [ ] Installation, startup, restart, upgrade and uninstall behaviour preserve app-owned data as documented; upgrade never drops expenses or accepted reports.
- [ ] The surprise build does not contact or require live POS access, and the last imported dataset remains usable offline.
- [ ] Turkish text, sorting/search behaviour, date/number presentation and Excel round-trips are checked, including Turkish characters and fractional values.
- [ ] Ordinary dashboard and representative drill-down interactions meet the agreed two-second target on a documented Windows test computer with the full imported dataset.
- [ ] The test report states hardware, OS, build, dataset identity/size, query/filter set, cold/warm conditions and repeated timings; one favourable cache hit is not a performance claim.
- [ ] Imports/calculations show progress and remain cancellable/responsive without freezing navigation. Report load time separately from import duration.
- [ ] Empty, loading, stale-data, warning, failure and unavailable-profit states are tested; no invented demo financial values appear as real results.
- [ ] Excel values, filters, cutoff, warnings, confidence and calculation/report version match the displayed report.
- [ ] Dependency licences and packaging requirements are reviewed. Publisher warnings for an unsigned build are documented; no paid signing/service requirement is silently introduced.

Evidence: clean-Windows installation walkthrough, screenshots where useful, benchmark report, Excel checks and package/license inventory. The audit dataset's size does not by itself prove SQLite/UI performance.

## 9. L01 — Additional gate for later live integration

Not required for the surprise release and not authorized by this checklist.

**v1 status (2026-10-22, #98).** L01 is explicitly out of v1.

- [ ] Eralp has accepted the product and explicitly authorized access to the specific production source.
- [ ] A restricted read-only account and protected credential handling are verified; no administrative credential or new source schema/configuration dependency is introduced.
- [ ] Insert, update, deletion, backdating, incomplete transaction, source reset and reconnect cases have passed on an isolated representative source.
- [ ] Existing change-log/archive coverage is characterized; incomplete logs are supplemented by a proven reconciliation strategy.
- [ ] New rows are not missed because IDs are allocated before commits or headers/lines become visible at different times.
- [ ] Extraction publishes a coherent candidate; dirty reads are not accepted as a shortcut to low source load.
- [ ] The target 5–15 minute delay is measured under realistic activity and reconciliation, with bounded queries/timeouts and acceptable observed source impact.
- [ ] Failed or delayed synchronization keeps the last successful local dataset usable and visibly stale, rather than inventing current data.
- [ ] Full/recent reconciliation detects intentionally introduced gaps and corrections; repeated polling does not duplicate financial events.

Evidence: permission and load reports, concurrency/reconciliation tests, measured freshness and an explicitly approved rollout procedure. The current single-backup audit passes none of these production gates by itself.

## 10. Present status and next boundary

The original planning transfer passed no application gate. Later synthetic, isolated-source and packaged checks are recorded in [the evidence index](../../evidence/index.md). Consult each receipt for its exact build, platform, population and limitations. Closed tracker issues do not establish that A01–A07 or L01 passed.

[Recorded-source estimates](../../contracts/recorded-estimates.md) have independent arithmetic evidence for their declared assumptions. They do not validate source semantics or close the original verified-financial requirements. Current Windows, independent recovery, real-source financial acceptance and production rollout require their specified evidence and authorization. The 2026-10-22 [#98 re-baseline](../../decisions/issue-98-profit-first-estimate-edition.md) narrows the v1 gates as noted in each section; it passes no gate.

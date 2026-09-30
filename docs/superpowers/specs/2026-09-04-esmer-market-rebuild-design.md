# Esmer Market analytics rebuild — foundation specification

- Date: 2026-09-04.
- Status: Written specification approved by the user; application acceptance remains pending.
- Owner and sole intended user: Eralp Esmer.
- Scope of this change: Approved planning documents transferred into the user-authorized independent repository. Application implementation, database access, deployment and live connection remain outside this documentation change.

## 1. Purpose and reading order

Build an independent, private desktop application that helps Eralp understand Esmer Market's sales, growth, purchasing costs, supplier returns, and expenses. Deliver it as a free surprise gift. It is management analytics, not a POS replacement, statutory accounting system, payroll processor, or tax-filing product.

Read this specification first, followed by:

- [Database audit and evidence limitations](2026-09-04-esmer-market-rebuild-audit.md).
- [Release acceptance criteria and required evidence](2026-09-04-esmer-market-rebuild-acceptance.md).

This specification governs the independent rebuild. Historical documents in the separate legacy repository are not authoritative for this product. Their claims of implemented or trustworthy calculations must not be copied into the new product without evidence.

The user approved the written foundation, requested the phased implementation plan and authorized creation of this independent repository. The [implementation plan](../plans/esmer-market-implementation-plan.md) organizes the remaining work. Application implementation has not begun.

## 2. Approved constraints

| ID | Decision |
| --- | --- |
| D01 | One store, one owner, one trusted local computer. The approved deployment target is Windows; exact supported OS versions and hardware must be verified before packaging acceptance. |
| D02 | Turkish-only interface and Turkish presentation conventions; English internal code/domain identifiers. TRY only. |
| D03 | The business is in the TRNC/KKTC, not southern Cyprus or mainland Turkey. No tax rules may be assumed from those jurisdictions. |
| D04 | The market database and operational system remain strictly read-only to the application, permanently. |
| D05 | Development uses isolated restored backups. A newer backup may be supplied during development and should be used for the reveal when available. |
| D06 | Live integration is a planned later release, conditional on Eralp liking the application and explicitly authorizing access. A 5–15 minute refresh delay is acceptable; instantaneous streaming is not required. |
| D07 | All dashboards read a separate local analytics store. The source database is an ingestion source, never a dashboard dependency. |
| D08 | No application login, PIN, roles, or multi-user management. Physical-access risk on the trusted PC is accepted. This does not remove the requirement for restricted database credentials or safe desktop boundaries. |
| D09 | Analytics backups are encrypted and must be recoverable after loss of the original computer. No daily authentication workflow is introduced by backup encryption. |
| D10 | Do not import identifiable customer information. No employee-level payroll or employee identifiers; aggregated monthly labour cost is sufficient. |
| D11 | Spreadsheet expense import is essential. Manual entry is not the primary workflow; corrections and explicit analytics-only adjustments are supported. |
| D12 | Supplier returns are important in the first release when supported by source records. Manual supplier-claim processing is deferred. |
| D13 | Historical cost and current replacement cost are separate concepts. Missing cost is never zero. |
| D14 | Profitability uses incurred periods; any payment/cash analysis uses payment dates. Owner funds, loans, transfers and asset purchases must not be silently classified as operating expenses. |
| D15 | Every KPI must be traceable to components, source records, import batches, calculation versions and relevant adjustments. |
| D16 | Incomplete periods remain visible with coverage warnings. Trusted report versions cannot change silently when new data or formulas arrive. |
| D17 | Excel export is required. PDF export, forecasts/AI, multi-store, multi-currency, customer analytics, and statutory declarations are excluded from the first release. |
| D18 | Target ordinary dashboard/drill-down responses below two seconds using the full imported dataset; performance must be measured on a documented Windows test computer. |
| D19 | Electron, TypeScript, React, a local Node service and SQLite are the approved technical foundation. No paid cloud service or subscription is required. |
| D20 | Rebuild in a new independent repository. Do not merge Git histories, copy legacy application code/migrations, or depend on the old application at runtime. |

## 3. What supersedes earlier proposals

### 3.1 Initial COGS method

Perpetual moving weighted-average cost was the original preferred policy. The audit did not establish a defensible opening inventory valuation, and the owner is not expected to supply one before the surprise.

The approved first-release policy therefore uses validated, transaction-time historical last-purchase prices as an explicitly labelled cost estimate. It must not be called weighted-average cost. Weighted-average costing remains a separate future method requiring sufficient opening quantities/values, chronological movement evidence, and its own approved tests. A live connection alone does not resolve historical cost uncertainty.

### 3.2 Source refresh, not whole-database replacement

An earlier proposal described replacing the entire SQLite database after a successful rebuild. That would risk deleting app-owned expenses, settings, adjustments and history, so it is superseded.

Only source-derived datasets are replaced or activated. App-owned records and trusted report versions remain durable. The implementation must stage and validate a candidate dataset, then activate it atomically without losing concurrent app-owned changes. This is a behavioural requirement; the exact SQLite table/file layout is an implementation-plan decision.

### 3.3 Backup phase versus live phase

Backups are the development and reveal path. There is no commitment that Eralp or the developer will operate a permanent monthly manual-import service. Live integration follows only after acceptance and permission; newer backups remain a supported interim input.

### 3.4 Confidence is not a single monthly badge

A month can have source-reconciled sales and estimated or unavailable profit. Monthly status must never imply that every metric is equally trustworthy. Estimated costs and unresolved expense completeness prevent trusted profitability, regardless of elapsed time.

## 4. First-release experience and scope

### 4.1 Main surface: Aylık Market Özeti

**P01 focus delta, 2026-09-29:** The user confirmed estimated gross product profit before operating expenses and returns in their recorded month. The [monthly product-profit contract](../../contracts/monthly-product-profit.md) records the approved primary product-profit page while retaining this overview, expenses and operating results as accessible existing functionality. The user approved its scope, interface and composition on the same date. This delta does not change D01–D20, existing saved reports or raw-preview permissions.

The primary view is a monthly market overview, with drill-down rather than disconnected dashboards containing different formulas. It includes:

- Net sales excluding recorded KDV, completed sales transaction count, average basket and interpretable quantity measures.
- Previous-month and previous-year comparisons, with partial-period and missing-coverage indicators.
- Estimated COGS, estimated gross profit and estimated gross margin only for their explicitly covered population.
- Operating-expense totals and aggregated labour cost when supplied.
- Estimated management operating profit only when the prerequisite cost and expense coverage rules permit it; never a statutory net-profit label.
- Source-data cutoff, last successful import, calculation method/version, and data-quality warnings.

A current-period view may be shown, but a historical backup must never be presented as live data or today's activity. If the source ends in October 2025, the application says so even when opened in a later year.

### 4.2 Sales, products and categories

Support month → category/product → transaction → source-line drill-down. Separate nominal monetary growth from volume/transaction growth. Do not describe higher revenue alone as real growth or increased profitability. Product-level quantities retain their units; unlike units such as kilograms and pieces must not be combined and labelled as a meaningful physical volume without an explicit convention.

Recorded customer returns reduce sales according to the validated source mapping. Voided/pre-completion POS records are not automatically additional deductions from completed sales. Missing or unknown document types are flagged rather than silently assigned a financial meaning.

### 4.3 Purchasing, inflation and supplier returns

Show purchase history, product/supplier purchase-price changes, and historical cost versus current replacement-cost analysis. A replacement-cost comparison is not an official inflation index or automatically an inflation-adjusted growth measure. A formal inflation-adjusted metric requires a separately defined method and is not promised by the first release.

Show supplier-return invoices and dispatch records, using validated links/statuses to avoid double counting. Distinguish a physical return, a requested recovery, and recognized supplier credit. Do not claim settlement by credit or replacement when source evidence does not establish it. Supplier relationships come from validated purchasing documents, not the unreliable product-level supplier field identified in the audit.

Inventory views are analysis only. Source waste/write-off records can be displayed with completeness warnings; sparse records do not prove that no losses occurred. No stock corrections, goods movements, return submissions, invoices or operational actions are sent to the POS.

### 4.4 Expenses and adjustments

Provide a canonical Excel template and preview → validate → confirm import workflow. Preserve the import batch and provenance. Duplicate detection must not mistake repeated legitimate expenses for duplicates merely because their dates and amounts match.

Expense records carry incurred date, payment date where available, category, net/KDV/gross amounts, KDV treatment/recoverability evidence, and source reference. Unknown treatment remains unknown; it is not silently inferred as recoverable or non-recoverable. Employee names, identity numbers, salaries by person and payslips are out of scope. Monthly labour totals are sufficient.

Classifications distinguish operating expense, labour, inventory loss, asset purchase, taxes, financing/loan, owner contribution/withdrawal, transfer and unclassified items. Classification determines whether a record contributes to management operating profit; cash movement is not itself proof of an expense.

Manual corrections preserve original imported records. Analytics-only adjustments require a reason, linkage to their affected data/period, and reversible audit history. They do not change the source database. A source refresh that removes or changes a referenced record flags the adjustment for review rather than silently deleting or reapplying it to a different record.

The reveal may have no expense spreadsheet. Show other useful analytics without inventing expenses or operating profit. Real spreadsheet samples, if later available, inform mapping tests; their absence does not authorize invented business data.

### 4.5 Export and local operations

Excel exports include the report period, data cutoff, method, confidence/coverage and visible warnings, not just numbers. Exported figures must reconcile with the corresponding UI/report version. Provide encrypted backup and restore, import history, and useful Turkish error messages.

Backup preparation may use an isolated SQL Server restore on the developer's machine and produce a minimal analytics package. The initial desktop release should not require Eralp to install a development environment or restore the full POS database. The desktop app never restores, migrates, or administrates the market database. Final import-package format and preparation tooling are implementation details, not a promised ongoing manual service.

## 5. Financial meaning and confidence contract

These are product calculation requirements, not legal or tax advice. This specification does not certify current KKTC tax rates, deductibility rules or filing obligations. Preserve recorded source KDV and verify its meaning; effective-dated configuration may validate anomalies but must not silently overwrite transactions.

### 5.1 Conceptual formulas and data populations

| Metric | Required meaning |
| --- | --- |
| Net sales | Completed, validated sales net of applicable discounts, KDV and customer returns; no duplicate document conversions or double subtraction of voids. |
| Completed transaction count | Count validated completed sale documents by stable source ID, not reused POS receipt-number fields. Returns are separately visible; the final average-basket numerator/denominator convention must be explicit and tested. |
| Historical estimated COGS | Signed sold/returned quantities multiplied by validated historical cost evidence for the corresponding covered population; no fallback to today's purchase price. |
| Covered estimated gross profit | Covered net sales minus covered estimated COGS. Never total sales minus costs from only some sales. |
| Covered estimated gross margin | Covered estimated gross profit divided by the corresponding covered net sales; zero/negative denominator cases must not produce an invented percentage. |
| Management operating profit | Eligible period gross profit less classified operating expenses/labour and separately recognized operating losses not already included elsewhere. Withhold the headline if prerequisites or expense completeness are unresolved. |
| Replacement-cost analysis | Separately labelled estimate using the latest validated cost available as of the imported dataset; never a rewrite of historical COGS. |

The detailed source-to-formula contract must establish unit conversion, KDV inclusion/exclusion in cost fields, line/header discount reconciliation, return-cost attribution, zero-value transactions, and rounding before a formula is implemented. This is a bounded validation obligation, not permission to choose arbitrary fallbacks. If evidence is insufficient, the affected metric is unavailable or limited to a clearly identified covered population.

### 5.2 Cost, missing values and period comparisons

- First-release historical cost is a last-purchase estimate after field semantics are validated. It is not an inventory valuation assertion.
- Unknown/invalid cost remains missing, not zero. A source zero must be distinguished from a genuinely documented zero-cost item before financial use.
- Cost coverage reports the included/excluded transaction population, line counts and covered sales amount. Counts alone are insufficient to describe monetary exposure.
- A missing purchase date, contradictory unit conversion, negative-stock anomaly or unexplained return-cost treatment is recorded as evidence affecting the relevant metric. Negative stock is not automatically corrected in the POS or treated as proof of a specific loss.
- Partial months remain visible. Full-month comparisons must not be labelled like-for-like when one side is partial. A matched elapsed-period comparison, if offered, states its actual boundaries.
- Transaction business dates are distinct from import timestamps. Interpret source dates in the market's local business-time convention, verified against sample records; never inherit the developer computer's timezone.
- Use explicit decimal arithmetic/precision for money and costs and preserve source quantity precision. Display rounding must not determine stored financial calculation precision.

### 5.3 Metric confidence and period state

Each metric carries its own evidence status:

- **Source-reconciled:** matches the validated source population and reconciliation rules. This does not certify that the POS captured every real-world event.
- **Estimated:** uses an explicitly disclosed estimation method with coverage and limitations.
- **Unavailable/incomplete:** prerequisites are missing or unresolved; explain the missing input rather than showing a plausible default.

Monthly states remain `Açık / Geçici / Güvenilir`. A closed historical month is not automatically trustworthy. Trusted profitability requires resolved cost evidence, reconciled inputs and confirmed expense coverage; the historical-estimate method cannot be promoted to exact cost merely by user acknowledgement. Source-reconciled sales may be usable while monthly profitability remains provisional.

When expenses are missing or incomplete, the operating-profit headline reads:

> Faaliyet kârı hesaplanamıyor — gider verileri eksik.

Confidence appears in drill-downs and exports as well as the main view. An expense import's technical success is not evidence that all monthly expenses were supplied. Expense completeness requires a recorded owner confirmation after review; before the reveal, lack of that confirmation must not be fabricated.

### 5.4 Revisions and traceability

Every displayed/reportable value must retain enough provenance to explain and reproduce it: source identity, source document/line IDs, import batch and cutoff, included/excluded population, normalization and calculation version, confidence, and applicable adjustment IDs.

Trusted report versions are immutable. New source corrections, deletions, expense changes or formula upgrades create a candidate revision with a visible difference and review history. The prior report and its explanations remain recoverable. Recalculation is permitted; silent replacement of an accepted historical report is not.

## 6. Architecture and responsibilities

Use one local application with clear modules, not independent network services. The approved stack does not require copying the legacy Electron/Express architecture or exposing a public HTTP API.

| Component | Owns | Must not own |
| --- | --- | --- |
| Electron desktop shell | Window/lifecycle, local integration, controlled communication with the service | Financial formulas, privileged database access from the renderer, arbitrary SQL supplied by UI |
| React Turkish UI | Navigation, presentation, filters, import preview, explanations | Its own competing KPI calculations, direct source/SQLite access, database credentials |
| Local Node service | Application operations and orchestration; background import/calculation work | Source administration or POS write-back |
| Source adapter | Approved parameterized reads and source schema mapping; minimal data extraction | DDL/DML, source optimization, broad customer-table replication, unchecked stored-procedure execution |
| Normalization/import module | Stable identities, versioned batches, source validation, candidate activation | Implicit guesses that turn unknown records into financial facts |
| Calculation engine | Deterministic decimal calculations and versioned evidence/confidence | Dependency on UI, wall-clock defaults, live-source availability or mutable current prices for historical cost |
| SQLite persistence | Source-derived datasets, app-owned records, provenance and accepted report versions | Modification of the market database |
| Export/recovery module | Consistent Excel exports and encrypted backups/restores | Plaintext credentials or customer PII in generated output |

SQLite performance and deployment suitability are acceptance targets to prove, not an already measured guarantee. Indexes, normalized facts and precomputed summaries may be created in the analytics store only. Keep heavy import/calculation work off the UI thread and avoid long blocking operations that freeze the desktop.

The app has no login, but its renderer is not granted unrestricted Node/database powers. Privileged operations are validated at a narrow desktop boundary. Credentials are stored through an appropriate OS-protected mechanism, never in source control, renderer state or plaintext exports. No remote web content needs privileged access.

## 7. Import lifecycle, ownership and failures

### 7.1 Separate source-derived and app-owned data

Source-derived records include sanitized products/categories, document headers/lines, supported conversion links and relevant source events. App-owned records include expenses, labour aggregates, classifications, adjustments, settings, completeness confirmations, audit history and accepted report versions.

Never use source-refresh deletion to delete app-owned data. Original source facts are immutable within their import version; corrections produce another source version. Do not duplicate an entire sensitive source schema merely for convenience.

### 7.2 Candidate import and atomic activation

1. Identify the source lineage, package/backup identity, schema version, extraction time, business-data cutoff and covered population.
2. Stage a candidate source dataset without changing the active dataset.
3. Validate types, IDs, references, conversions, totals, privacy allowlist and reproducibility information.
4. Compute normalized facts, summaries and metric-level coverage against the candidate.
5. Report blocking errors and non-blocking data-quality warnings separately.
6. Activate a coherent candidate only after required checks succeed, preserving app-owned changes and trusted report versions.
7. Record completion and retain the evidence needed for rollback, comparison and traceability according to an explicit retention policy established before release.

The same package is idempotent. An overlapping newer backup replaces the relevant source snapshot rather than appending another copy of all sales. Stable source IDs are namespaced by source lineage; a database change/reset must not accidentally collide with a different source.

Unknown schema changes, broken essential relationships, or inconsistent candidate activation block the import. Missing costs and sparse expense/waste records can be non-blocking warnings because their affected metrics remain provisional/unavailable. No warning may be silently converted into an accepted number.

On interruption, malformed input, unavailable source, failed validation or insufficient disk space, retain the last successful active dataset and display a useful error. Do not publish a partial batch as a complete period. On a first-ever failed import, show an honest empty/error state rather than a sample financial dashboard masquerading as real data.

### 7.3 Backups and recovery

Back up a consistent state containing app-owned records, source/calculation provenance, accepted report versions and the data required to reproduce/restore them. A raw file copy taken during an inconsistent database write is not an acceptable recovery strategy.

Encrypted backups must be authenticated/validated before restore and must not overwrite the working installation until the candidate restore is verified. Demonstrate recovery after simulated loss of the original computer. The recovery design must therefore include a recovery secret/key held separately from that computer; the exact mechanism and retention schedule require review in the implementation plan. This is backup recovery, not an application login requirement.

## 8. Later live integration

Live access is not enabled for the surprise release. After Eralp's acceptance and explicit permission:

- Obtain a dedicated account restricted to approved reads; do not use an administrator account as the application credential.
- No inserts, updates, deletes, migrations, schema/index/trigger creation, source configuration changes or source optimization. Do not enable CDC/change tracking as an assumed setup step.
- Apply bounded indexed reads where the existing schema permits, timeouts and controlled frequency. Read-only queries can still impose load; performance/safety must be observed before rollout.
- Preserve the 5–15 minute acceptable-delay goal without claiming zero latency or that the POS is unaffected by all reads.
- Feed the same normalization/calculation contracts as backup ingestion. Dashboards remain available from the last successful local dataset when the source is unavailable.

The audit supports investigating increasing IDs for new records, the existing change log/archive for updates/deletions, and periodic reconciliation. It does not prove a complete incremental protocol. The source change log misses many POS insert events, business dates are backdated, and stable IDs alone do not detect updates/deletions. Transaction completion, concurrent extraction consistency, late changes, deletes and gaps must be tested before enabling live synchronization. Do not use dirty-read hints as a substitute for a verified consistency strategy.

Routine synchronization writes only to the application-owned store. Tests that attempt forbidden SQL writes for permission verification run exclusively on an isolated test database, never against the market's live database.

## 9. Release and repository boundaries

The reveal is a functioning local application using the newest available prepared backup data, with visible limitations. It does not depend on Eralp answering questions or supplying historical stock valuation before the reveal. Do not contact him, install software on his computer or connect to the live system as an unapproved side effect of development.

Target free/open-source dependencies and no required subscription or paid cloud infrastructure. Validate dependency licences and packaging support during implementation. An unsigned Windows installer/portable executable may show publisher warnings; do not promise a signed release or an absence of warnings at zero cost.

The [phased implementation plan](../plans/esmer-market-implementation-plan.md) covers verified source contract/test data, reliable import and persistence, calculation/confidence, the Turkish desktop experience/expense workflow, and packaging/recovery/acceptance. These are planning areas, not independently deployable services or authorization to start implementation.

The independent repository was created with the user's direction. Preserve the separate legacy repository as reference; only approved planning documents are transferred here. Do not copy legacy runtime code or migrations, original backups, credentials, customer/employee data, legacy local databases or unreviewed generated code. A sanitized reduced fixture is required, but creating it is implementation/audit work still to be done.

## 10. Evidence obligations before implementation/release

The following are explicit unresolved evidence obligations, not assumed successes:

| Evidence obligation | Current state | Required consequence |
| --- | --- | --- |
| Historical cost field unit/KDV meaning and return attribution | Snapshot coverage is high; exact semantics are not fully validated | Validate with documented examples before calculating the estimate; exclude unsupported cases. |
| Opening stock valuation / true weighted-average history | Not available; no pre-reveal request to Eralp | No trusted historical weighted-average profit claim; first release remains last-purchase-estimate based. |
| Sale/invoice conversion and stable business identity | Header IDs stable; POS receipt fields reused; no conclusive proof that every type 11/35 pair is independent | Establish document inclusion/deduplication examples; do not treat absence of exact matches as proof. |
| Supplier credit versus replacement settlement | Invoice/dispatch linkage exists; settlement semantics incomplete | Show only evidenced states, not invented recovered amounts. |
| Line/header net totals, discounts and rounding | KDV largely reconciles; some other totals differ | Explain reconciliation differences in the source contract before trusting derived breakdowns. |
| Expenses and labour | Custom source tables empty; no real spreadsheet supplied | Validate the canonical template with synthetic examples; withhold operating-profit headline until actual completeness is confirmed. |
| Stock/waste completeness | Negative stock and sparse waste records observed | Flag inventory-derived claims; never equate unrecorded waste with no waste. |
| Source baseline purity | Restored schema contains old-app additions | Revalidate a clean/newer backup if supplied; never run legacy cleanup/migrations on the source. |
| Live synchronization completeness | No complete built-in change feed demonstrated | Keep live disabled until insert/update/delete/concurrency/reconciliation tests pass with approved access. |
| Windows/SQLite performance, installer and recovery | Technology approved, benchmark/build/restore not performed | Prove on a documented clean Windows test environment before release. |
| Tax law and recovery rules | Only stored-source values profiled | No statutory claim; separately verify authoritative KKTC rules before any law-dependent feature. |

See the linked acceptance checklist for the required proof. No item above authorizes changing business policy silently to make a test pass.

## 11. Document approval and implementation boundary

The user approved this written specification and its two supporting documents, then requested the phased implementation plan. This repository records that approved foundation. Approval of the documents does not pass any application acceptance gate.

The current change adds documentation only. Application implementation requires subsequent direction; renewed source access and later live integration retain their explicit gates.

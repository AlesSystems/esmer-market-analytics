# Monthly report versions and Excel

Phase 8 implements [issue #11](https://github.com/AlesSystems/esmer-market-analytics/issues/11). The foundation specification and acceptance checklist remain authoritative. Supported calculations still use the synthetic mappings established in earlier phases; this feature does not authorize source access or validate market-source semantics.

## One selected monthly report

A monthly report binds a source dataset, app revision, calendar period, all-products/all-kinds filters, and the sales, cost, purchasing, operating and report-composition versions. It contains the calculated values and their explanations. The renderer formats those values. Excel consumes the selected report directly and does not query current data while generating individual sheets.

The monthly scope stays all products. Category/product/search filters in the sales drill-down do not silently narrow the monthly cost/expense denominator or the exported report. The export action identifies the selected monthly report.

Per-metric evidence remains separate from the period state and acceptance. A partial period is open; a completed historical estimate is provisional. No first-release historical estimate becomes trusted exact profit. Saving records review and preserves the output. It is not an expense-completeness confirmation.

## Immutable review history

Acceptance retains the serialized report and reason, acceptance time, predecessor, original dataset and app revision. Source refreshes, expense corrections and new calculation identities create candidate differences; they do not rewrite accepted records. Earlier facts remain retained by the store's report references. Historical display/export uses stored output, including old explanations, without running the newest calculators against it.

The retained rule manifest records the calculation identities and decimal conventions. The artifact identity `esmer-market:monthly-v1` is bound to the implementation commit/build in the local evidence. Historical executable replay requires that matching versioned code artifact; the application does not execute arbitrary code from saved reports. Retained output remains readable independently of replay.

## Spreadsheet values

Snapshots are limited to 256 MiB of serialized output and fail explicitly above that bound. This engineering ceiling has not been validated against the full dataset on Windows. Evidence, differences, sales and purchasing tables show at most 100 rows per page. The complete selected artifact remains the input to acceptance and export.

Ordinary representable amounts and counts use Excel numeric cells. Identifiers, dates, labels and formula-like strings use text cells. Unavailable results remain unavailable instead of zero. Values beyond Excel's safe decimal precision retain exact decimal text; the workbook identifies that precision rule. It contains calculated values, not spreadsheet formulas.

Every worksheet identifies the selected report. The workbook carries period, filters, cutoff, import provenance, method/version, confidence, coverage, warnings, and the relevant financial and source detail. Synthetic reports remain labelled synthetic. The export does not certify completeness or tax treatment.

## Desktop boundary and cancellation

Named requests validate the sender, exact payload and report identity. The renderer supplies neither output values nor filesystem paths. Native file selection and writes remain privileged desktop operations.

Monthly display requests return summary values and counts, without the large sales and source-evidence arrays. `readReportEvidence` reads at most 100 rows from the selected report identity, with validated section, offset, search, comparison range and optional document identity. The page size is fixed by the service. Historical reads use the retained accepted artifact. `readReportPurchasing` loads the selected report's complete purchasing view only when its evidence is opened; its tables render in pages. Neither operation rebuilds an accepted report from the current dataset.

Calculation reuse lives only inside the existing pinned sales session. Exact date ranges key sales calculations; the session binds source dataset, app revision, period and calculation version. Reopening creates a new session and discards that cache. A pinned session can still explain its older source/expense state, with stale flags when the active revision changes. The compiled calculation versions govern the other algorithms. The monthly candidate keeps its identity on repeated reads, and an accepted candidate keeps its review state. Public full-artifact reads and compact/page responses isolate mutations; the worker's internal candidate remains owned by the service. No persistent cache, schema change or financial-rule change is introduced.

Background import and monthly report work expose phase/count progress. Cancellation uses shared memory so a busy service does not need to process a queued cancellation message. Imports check cancellation during staging and before atomic activation. Cancellation leaves the prior active dataset, expenses and accepted reports intact; completion wins after the commit. Monthly calculation checks cancellation between calculation sections. A single section or input parse can delay cancellation, so the Windows handoff measures latency and navigation responsiveness on representative data.

See [local evidence](../evidence/phase-8-local.md) for verified cases, limits and remaining acceptance gates.

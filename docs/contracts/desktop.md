# Desktop request contract

The renderer reaches the local service only through named methods on `window.esmer`. [`src/desktop/preload.ts`](../../src/desktop/preload.ts) is the inventory. [`src/domain/contracts.ts`](../../src/domain/contracts.ts) types those methods. The local service owns the persistent SQLite store. No method connects to production or accepts SQL, a path, or a credential from the renderer.

Availability, package import and sales reads are specified below. Expense, monthly report, recovery, isolated test connection and raw preview methods are listed under [Later named requests](#later-named-requests).

## Request validation

The preload sends fixed operation names. Availability and import take a `null` payload. Sales operations take exact typed payloads for period, report context, filters and document ID. No operation accepts a channel, SQL, path, credential or arbitrary operation argument from the renderer.

The main process verifies the requesting WebContents, main-frame identity and exact application URL before invoking service work or a file dialog. Unknown operations and payloads that do not match the named operation are rejected. A detached or unrelated frame is untrusted. Rejection tests assert that neither service work nor file selection occurs.

The application takes Electron's single-instance lock before opening the store. One service worker owns `analytics.sqlite` under the main process's `userData` directory. Requests have IDs so each response reaches its original caller. Worker exit/error resolves pending requests with safe failures.

## Availability

`getAvailability()` takes a `null` payload and reads the current store. An empty store returns:

```json
{"status":"ready","store":"empty","liveConnection":"disabled"}
```

A loaded store returns `store: "loaded"` and bounded dataset metadata. This includes the dataset identity, cutoff, package preparation timestamp, document/line/supplier counts and warning codes. It exposes no database path, source credentials or financial calculation. Availability reads metadata from the current store instead of caching an initial empty result. An optional `lastImportError` contains the newest relevant persisted failure code, including interruption recovery. The empty or loaded screen displays a Turkish warning after restart. Successful activation or a successful retry of the current package clears that warning. Cancellation and historical-package selection do not erase it.

The UI labels synthetic data, missing cost and partial coverage. Historical cutoff dates are not presented as current activity. No login or invented profitability value is added.

## Package import

`importPackage()` opens a native file picker in the main process. The renderer never supplies a path. File selection is consumed inside this request, so there is no renderer-visible file handle to reuse.

The main process reads only a regular file and enforces the package byte limit while reading. It closes the file handle on success and failure. The worker receives bounded bytes, invokes the existing package validator, and performs the [durable import protocol](persistence.md).

The result distinguishes a newly active package, unchanged active content, previously imported historical content, cancellation and failure. Reimporting a historical package cannot silently roll back the selected dataset. The UI refreshes availability after an import attempt, while the last complete source dataset remains usable after failure. Native-dialog cancellation does not change the store.

The Phase 4 screen offered selection and import status. Expense import, report review and raw preview now use the named requests below. The renderer still receives no database handle and no arbitrary query operation.

## Safe errors

Failures contain a status, stable code and Turkish message. They never echo request bodies, exceptions, stack traces, credentials or filesystem paths.

| Code | Meaning |
| --- | --- |
| `UNTRUSTED_SENDER` | The sender is not the application's trusted main frame |
| `UNKNOWN_OPERATION` | The named operation is not implemented |
| `INVALID_PAYLOAD` | The payload does not match the named operation |
| `SERVICE_UNAVAILABLE` | The local service cannot provide the requested operation |
| `INVALID_PACKAGE` | The selected file cannot be read safely or fails package validation |
| `STORAGE_FULL` | SQLite cannot allocate required storage |
| `IMPORT_FAILED` | Candidate work failed and did not replace active data |
| `INVALID_CANDIDATE` | The candidate is not eligible for activation |
| `INTERRUPTED` | A nonterminal candidate was left by an interrupted service |

An import error does not replace a working database file. A failed first import leaves an empty store with an error message.

## Renderer restrictions and verification

The window uses context isolation and the Chromium sandbox, with Node integration and webviews disabled. Preload exposes only the named methods above. Raw IPC, database handles, native modules and filesystem paths remain unavailable to the renderer.

The `esmer://app` protocol serves bundled, allowlisted UI assets. Network requests, navigation, new windows and permissions remain restricted. The content security policy permits local scripts/styles while denying connections, frames, objects, forms and arbitrary resource origins.

Desktop tests launch the actual packaged application. The import test substitutes the native dialog's selected path inside Electron's main process, then exercises the normal preload, validated IPC, bounded file read, worker and SQLite path. This substitution does not expose a test-only production API. Separate real native-dialog and package lifecycle checks are recorded in the [Windows evidence](../evidence/windows-phase-4.md), with limitations and remaining checks. The [Windows handoff](../operations/windows-phase-4-handoff.md) remains the procedure.

## Sales report requests

`openSales` starts an explicitly requested report period, or the latest imported period when no month is selected. The worker holds one immutable snapshot and returns a report context. `querySales` takes that context and category/product/search/type filters. `inspectSales` takes the same context and filters plus a document ID. It returns full-document evidence and the selected scope's contribution.

The request guard validates exact keys, bounded identifiers and search text, date/month shape and the version context. The worker rejects a stale context instead of falling back to current data. A new report replaces the previous session. Imports update availability while navigation continues on its existing context until explicit refresh.

Report results contain projected metrics and evidence only. They contain no database path, private app-owned records or raw snapshot. Calculations run in the service worker. Legacy sparse mappings return an explanation that sales semantics are unavailable; synthetic sales results remain visibly synthetic. Report errors are safe Turkish messages, including empty/unsupported data, stale contexts and unavailable service.

## Phase 6 purchasing read

`queryPurchasing({ context })` reads costs, purchases, supplier returns, and supported inventory observations from the existing pinned sales session. It validates the trusted sender and exact context shape before service invocation. The renderer cannot submit paths, SQL, table names, credentials, or operational transactions. A stale or altered session context is rejected.

The result carries the dataset/app revision, cutoff, mapping, separate cost and purchasing calculation versions, coverage, warnings, and source evidence for displayed contributions. All financial calculations remain in the service. Supplier/product controls filter display rows without recomputing amounts. Explicit refresh replaces the session; imports alone cannot change an open report's historical cost or replacement price.

## Later named requests

These methods use the same sender, payload and preload rules as the requests above.

- Expenses use `saveExpenseTemplate`, `previewExpenses`, `confirmExpenses`, `queryExpenses`, `correctExpense`, `restoreExpense`, `confirmExpenseCompleteness` and `queryOperating`. See the [expense contract](expense-completeness.md).
- Monthly reports use `queryMonthly`, `listReportVersions`, `readReportVersion`, `compareReportVersion`, `acceptReportVersion`, `exportReportVersion`, `readReportEvidence`, `readReportPurchasing`, `cancelOperation` and `getOperationStatus`. See the [report contract](reports.md).
- Recovery uses `getRecoveryStatus`, `setupRecovery`, `backupNow`, `pinBackup`, `prepareRestore`, `confirmRestore` and `cancelRestore`. See the [recovery decision](../decisions/phase-9-recovery.md).
- The isolated test connection uses `getLiveStatus`, `configureLiveSource`, `setLiveEnabled` and `refreshLiveSource`. Configuration defaults to disabled. See the [live-sync contract](live-sync.md).
- Raw preview uses `querySourceWorkspace` and `readSourcePreview`. See the [source contract](source.md).

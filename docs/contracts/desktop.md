# Desktop request contract

The renderer has two named capabilities, `window.esmer.getAvailability()` and `window.esmer.importPackage()`. Their TypeScript contracts are in `src/domain/contracts.ts`. The local service owns the persistent SQLite store. Neither operation connects to the market system.

## Request validation

The preload sends a fixed operation with a `null` payload. It accepts no channel, SQL, path, credential or arbitrary operation argument from the renderer.

The main process verifies the requesting WebContents, main-frame identity and exact application URL before invoking service work or a file dialog. Unknown operations and all non-null payloads are rejected. A detached or unrelated frame is untrusted. Rejection tests assert that neither service work nor file selection occurs.

The application takes Electron's single-instance lock before opening the store. One service worker owns `analytics.sqlite` under the main process's `userData` directory. Requests have IDs so each response reaches its original caller. Worker exit/error resolves pending requests with safe failures.

## Availability

An empty store returns:

```json
{"status":"ready","store":"empty","liveConnection":"disabled"}
```

A loaded store returns `store: "loaded"` and bounded dataset metadata. This includes the dataset identity, cutoff, package preparation timestamp, document/line/supplier counts and warning codes. It exposes no database path, source credentials or financial calculation. Availability reads metadata from the current store instead of caching an initial empty result. An optional `lastImportError` contains the newest relevant persisted failure code, including interruption recovery. The empty or loaded screen displays a Turkish warning after restart. Successful activation or a successful retry of the current package clears that warning. Cancellation and historical-package selection do not erase it.

The UI labels synthetic data, missing cost and partial coverage. Historical cutoff dates are not presented as current activity. No login or invented profitability value is added.

## Package import

`importPackage()` opens a native file picker in the main process. The renderer never supplies a path. File selection is consumed inside this request, so there is no renderer-visible file handle to reuse.

The main process reads only a regular file and enforces the package byte limit while reading. It closes the file handle on success and failure. The worker receives bounded bytes, invokes the existing package validator, and performs the [durable import protocol](persistence.md).

The result distinguishes a newly active package, unchanged active content, previously imported historical content, cancellation and failure. Reimporting a historical package cannot silently roll back the selected dataset. The UI refreshes availability after an import attempt, while the last complete source dataset remains usable after failure. Native-dialog cancellation does not change the store.

The Phase 4 screen offers selection and import status. Full preview/review screens and expense spreadsheet workflows remain later-phase work. No app-owned authoring or arbitrary report operation is exposed to the renderer.

## Safe errors

Failures contain a status, stable code and Turkish message. They never echo request bodies, exceptions, stack traces, credentials or filesystem paths.

| Code | Meaning |
| --- | --- |
| `UNTRUSTED_SENDER` | The sender is not the application's trusted main frame |
| `UNKNOWN_OPERATION` | The named operation is not implemented |
| `INVALID_PAYLOAD` | The operation payload is not `null` |
| `SERVICE_UNAVAILABLE` | The local service cannot provide the requested operation |
| `INVALID_PACKAGE` | The selected file cannot be read safely or fails package validation |
| `STORAGE_FULL` | SQLite cannot allocate required storage |
| `IMPORT_FAILED` | Candidate work failed and did not replace active data |
| `INVALID_CANDIDATE` | The candidate is not eligible for activation |
| `INTERRUPTED` | A nonterminal candidate was left by an interrupted service |

An import error does not replace a working database file. A failed first import leaves an empty store with an error message.

## Renderer restrictions and verification

The window uses context isolation and the Chromium sandbox, with Node integration and webviews disabled. Preload exposes only the two named methods. Raw IPC, database handles, native modules and filesystem paths remain unavailable to the renderer.

The `esmer://app` protocol serves bundled, allowlisted UI assets. Network requests, navigation, new windows and permissions remain restricted. The content security policy permits local scripts/styles while denying connections, frames, objects, forms and arbitrary resource origins.

Desktop tests launch the actual packaged application. The import test substitutes the native dialog's selected path inside Electron's main process, then exercises the normal preload, validated IPC, bounded file read, worker and SQLite path. This substitution does not expose a test-only production API. Windows native-dialog and package lifecycle checks remain in the [Windows handoff](../operations/windows-phase-4-handoff.md).

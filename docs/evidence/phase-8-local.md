# Phase 8 local evidence

Tracks [issue #11](https://github.com/AlesSystems/esmer-market-analytics/issues/11), Tasks 8.1 and 8.2 of the [roadmap](../superpowers/plans/esmer-market-implementation-plan.md#phase-8--complete-turkish-reporting-report-revisions-and-excel-export). The user authorized implementation, a PR and a Windows-agent prompt, with execution stopping before Windows work.

## Environment and boundary

Branch `codex/phase-8-reporting` starts at `6e0a478`. The implementation host is macOS 27.0 build 26A428, arm64, with Node 24.15.0 and npm 11.12.1. All fixtures and screenshots are synthetic. No source backup, private workbook, owner contact or production connection was used. No Windows package or test command ran here.

The user confirmed an extension to the existing Turkish desktop design. The first populated view becomes Aylık Market Özeti; existing drill-downs remain accessible. Immutable accepted output and its source/app/rule identities supply historical display and Excel export. Saving a reviewed estimate does not certify exact profit.

## Observed contract failures

- Baseline typecheck and 14 focused integration tests passed before implementation.
- `fac0296` adds the first monthly/revision/export contracts. The monthly desktop test ran against the existing packaged application and failed on the absent Aylık Market Özeti heading. The integration suites failed to import the not-yet-created report modules and executed zero tests. Those import failures are not evidence of failed arithmetic.
- `47f43c3` adds job and export-boundary contracts. The existing request handler returned `UNKNOWN_OPERATION` instead of report history. The job tests initially failed to import the missing implementation.

## Implementation and reproducibility

The versioned `esmer-market:monthly-v1` rule artifact is the repository source at `534c091` (including backend `4ddc8e9` and export correction `c5e460f`), together with the locked dependencies. Calculation identities and decimal conventions are retained in each snapshot. The archived-rule test preserves explicitly different synthetic v0 output; it does not execute a historical engine. Source history plus app revisions and accepted output remain retained for matching-artifact replay and direct historical display/export.

| Commit | Coherent change |
| --- | --- |
| `fac0296`, `47f43c3` | First failing report/export and desktop/job contracts |
| `4ddc8e9` | Monthly composition, immutable versions and Excel |
| `6b4e06c` | Validated IPC, worker jobs and atomic export |
| `10b8d39` | Turkish monthly overview and report review |
| `add17a4` | Revision, precision, cancellation and packaged regressions |
| `c104339`, `c5e460f` | Observed null-versus-50 export failure, then per-metric coverage fix |
| `534c091` | Readable report-history screenshot capture |

No schema migration, dependency change, public HTTP API or live-source capability was added. Privileged export accepts a report identity, freezes bytes before the native dialog and writes through a sibling temporary file. The renderer cannot choose a path or supply workbook values. Existing destination preservation after a partial write failure has a focused regression.

## Verification ledger

Final results below use the implementation source at `534c091` (the earlier 20-test desktop pass preceded the export-only correction), macOS environment above and disposable synthetic profiles. `tests/helpers/business-fixtures.ts` defines `business-fixture` / `business-1` and correction/deletion variants; SHA-256 `283af17c152434020cb749ffbe6721b38400f4f39120aa3f415b612a708d0632`. The expense workbook generator is `tests/helpers/expense-fixtures.ts`, SHA-256 `bb794d71bbdad93b55cf66e076ea65868ff6efd4e15d37d157974abc9460d006`. Literal independent oracles include sales 200, covered sales 100, cost 60, gross estimate 40, coverage 50%; one covered sale less expense 50 yields estimated operating result −10 only after the synthetic completeness confirmation.

| Task/gate | Procedure and expected result | Actual result / retained evidence |
| --- | --- | --- |
| 8.1 / A02–A03 | `npm run test:unit`; preserve independent financial oracles | 29 tests passed |
| 8.1–8.2 / A03–A05 | `npm run test:integration`; preserve accepted data across correction/deletion/reopen, reject stale reviews/spoofed IPC, reconcile Excel and cancellation | 175 tests passed; named contracts in `report-revisions.test.ts`, `excel-report.test.ts`, `report-jobs.test.ts`, `desktop-boundary.test.ts` |
| 8.1–8.2 / A07 local subset | `npm run test:desktop`; actual packaged Electron journeys for monthly/revisions/export/keyboard/empty/retry/cancel and previous screens | Earlier full run: 20 passed. Final build: 19 passed and one 30-second expense-journey timeout; traced investigation below. Screenshots linked below; macOS only |
| Application consistency | `npm run typecheck`, `npm run lint`, build through `test:desktop` | Passed |
| Packaging/privacy local subset | `node scripts/verify-package.mjs release/mac-arm64/Esmer\ Market\ Analytics.app/Contents/Resources/app.asar` | `PACKAGE_NOTICES_OK 7 dependencies`; no new dependencies |

The desktop cancellation case uses 25,000 documents plus 25,000 lines, observes progress, cancels, navigates and confirms the old report remains usable. It is a cancellation contract, not a full-volume performance benchmark. Workbook checks inspect actual spreadsheet cell types and formulas, preserve unsafe decimals as exact text, verify each sheet's selected-report identity, and reject unsupported Excel cell size rather than truncate.

A final desktop rerun at the corrected export build passed 19 tests but timed out the expense correction journey. A traced five-test rerun passed that journey in 2.0 seconds and passed four of five tests overall; a different existing operating-pinning test then timed out. Its trace shows every assertion, including operating result 30 and covered gross 40, and the screenshot completed before `app.close()` stalled (Close context began at 10,382.650 ms, with no completion before the 39,595 ms timeout). The subsequent expense retry test also spent 15.914 seconds closing. Host load at 11:28 was 81.13/51.89/27.44; contention is a plausible inference, not a proven cause. No financial-behavior failure was observed in that traced test, and no production timeout or test setting was changed. A targeted diagnostic with `npm run test:desktop -- tests/desktop/expenses.test.ts --grep 'operating report stays pinned' --trace on --timeout 120000` passed in 32.9 seconds. This CLI-only extension demonstrates eventual completion, not satisfaction of the normal 30-second test deadline or the two-second dashboard target. The Windows agent must rerun packaged lifecycle checks on its host.

The first history/export journey completed export but failed because a test locator matched two status messages. Tightening the success-text locator fixed the test; this was not an export failure. Independent review then found a real defect: unavailable source coverage blanked independently recorded expenses/payments. Regression `c104339` observed null instead of 50; `c5e460f` restored those values while keeping unavailable sales blank. The four Excel tests pass.

## Visual and independent review evidence

- [Monthly overview](phase-8-monthly-overview.png), [680px desktop window](phase-8-monthly-small.png), [report history and export](phase-8-report-history.png), [unavailable period](phase-8-unavailable.png), [cancelled import](phase-8-cancelled.png). All data is synthetic. The history image is a viewport capture; the others are full-page captures.
- [Confirmed direction](phase-8-design-direction.md) and [independent Impeccable review](phase-8-design-review.md): disposition **ship** for the supplied macOS screens. A fresh reviewer substituted for the unavailable specialized role. The detector ran once on changed UI targets and returned `[]`.
- [Standards review](phase-8-standards-review.md) and [specification review](phase-8-spec-review.md) independently identified the same export defect; the fix and regression resolve it. [Comment review](phase-8-comment-review.md) removed eight redundant comments without logic changes.

The final packaged `app.asar` SHA-256 is `8efb2bbbe738d8ed152f94d73855890648da774d53861807c660e753554b2754`. The archive was built from application source at `534c091`; screenshots reviewed before the export-only correction show the identical UI implementation. The [design preservation check](phase-8-design-preservation.md) confirms no incumbent system change.

## Remaining acceptance boundary

Synthetic verification can establish the implemented report preservation and export contracts relevant to A03/A04/A05/A07. It cannot validate real-source semantics, actual expense completeness or Windows acceptance. Historical cost and eligible operating results remain estimates. Without sufficient cost or expense evidence the operating headline stays unavailable.

Windows packaging, native dialogs, spreadsheet application compatibility, OS scaling, lifecycle and physical-offline checks require the [Windows continuation](../operations/windows-phase-8-handoff.md). Full-volume Windows performance remains unmeasured. Phase 9 recovery, Phase 10 reveal, installation on Eralp's computer, production rollout and L01 are outside this work.

The [copyable Windows-agent prompt](../operations/windows-phase-8-prompt.md) continues on the same branch and PR.

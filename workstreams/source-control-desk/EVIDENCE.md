# Source control desk evidence

## S1 missing contract

- Baseline 22387f5. Test commit 875d01e.
- macOS arm64, Node 24.15.0, Electron 44.3.0.
- Synthetic raw fixture source-desk-1. Three headers, two lines, two product IDs, one empty header. Recorded days are October 1 and October 3, 2025.
- `npm run test:desktop -- tests/desktop/source-control-desk.test.ts` built the baseline packaged app. The initial test setup used the wrong import status, then was corrected to the actual `preview-imported` result. That setup failure was not application evidence.
- `npm exec -- playwright test tests/desktop/source-control-desk.test.ts` then launched the baseline package. The heading was visible. The test failed because `Kaynak kayıt göstergeleri` was absent, at line 23, after 5 seconds. This is the intended missing presentation contract.

Windows and real-source acceptance remain open. Only synthetic fixture media belongs in this directory.

## S3 packaged integration

- Head 9671cad. Feature commit 084e029. Boundary test commit 9671cad.
- `npm run typecheck`, `npm run lint`, and `git diff --check` passed.
- Focused `npm run test:desktop -- tests/desktop/source-control-desk.test.ts tests/desktop/source-workspace.test.ts tests/desktop/source-estimate.test.ts tests/desktop/ozet-control-desk.test.ts` passed eight cases with one private-source opt-in skipped.
- Full `npm test` used `ESMER_EXECUTABLE` set to this worktree's packaged macOS arm64 executable. It passed 49 unit tests, 305 integration tests, and 55 desktop tests. Five integration and eight desktop opt-in or platform cases were skipped. The executable override routes four existing Windows-default test files to the host package.
- `test:desktop` built and packaged the actual Electron app. Expected synthetic source counts were three documents, two rows, two product IDs and one empty document. All matched. October 1 and October 3 were the only drawn dates and matched their exact table counts. Product and type keyboard drilldowns worked.
- No document or metric overflow at 1440, 1120, 680, or 390 pixels. Source warnings, unknown type 999, optional estimate absence, preserved reports, source-change retry, and estimate export remained usable.
- The boundary fixture source-desk-types-1 had 51 type codes. The screen disclosed 50 displayed and omitted types. A zero-record month inside the package window stayed distinct from an outside month, whose four cards said `Kapsam dışında`.
- Financial control desk cases, including offline branding, navigation, large figures, WebGL fallback and retry, passed unchanged.
- Full-page synthetic captures are `screenshots/desktop.png` and `screenshots/narrow.png`. The fixed sidebar position in a full-page capture does not represent viewport placement. Independent review captures use viewport screenshots.
- The existing estimate test rewrote its tracked screenshot. That generated unrelated change was restored after the run.

## Comment review

Independent reviewer comment_review inspected the scoped application and test diff. Zero comments, suppressions, flags, deletions or open issues. No files changed.

## Limitations

Windows runtime acceptance and real-source semantics remain open. No source connection or backup reinspection occurred. No new financial interpretation, schema, IPC operation, or dependency was added. The dependency audit reported eight existing high-severity advisories during locked installation. This presentation patch does not change the lockfile or dependencies.

## S4 Standards review

Reviewer standards_review returned PASS for 22387f5...9671cad. It found zero documented-standard violations and zero actionable code smells. It read the diff and supplied test evidence, without rerunning tests. No files changed.

## S5 Spec and independent runtime review

Reviewer spec_runtime_review returned PASS+NOTES for 22387f5...9671cad. Zero actionable Spec gaps. Notes retain Windows, full-volume and real-source limitations.

The reviewer ran `npm exec -- playwright test tests/desktop/source-control-desk.test.ts --output=/tmp/esmer-source-independent-results`. Both cases passed in 1.9 seconds. A separate baseline, head, baseline probe seeded disposable profiles with the same source-desk-1 fixture. All retained three documents, two lines, two product IDs and one empty document. Enter navigation to product IDs and unknown type 999 returned the expected records. No renderer errors occurred.

| Probe | Launch to overview | Overview to source table |
| --- | --- | --- |
| Baseline before | 700 ms | 41 ms |
| Head | 442 ms | 24 ms |
| Baseline after | 409 ms | 29 ms |

These individual synthetic observations are a regression smoke check, not a full-volume benchmark. Raw results are in `runtime-comparison.json`. The independently inspected viewport captures are `screenshots/review-desktop.png` and `screenshots/review-narrow.png`. Both contain synthetic records only.

Packaged archive identities are baseline `cd35048475516898d8e7d0220e68f1d4ea21227ba9ab4eeaad0b1f2e5309c4ed` and head `60eec6ef7d786bb76cf8530bc42588ab06b59104b63e853296566251e85f1da3`. Reviewed application and test patch identity is `e02d7ec65a30db40c40fee3d30955ef75fef30d2`. Evidence files are added after this code review and do not change the packaged application.

## S7 and S8 continuation

The owner authorized PR creation, merge, and local relaunch. Create the PR against main after this evidence commit. Confirm its current head, mergeability, checks and the unchanged reviewed application patch before merge. Preserve the ordered workstream commits. Pull the merge into the original checkout, run `npm run package:local`, quit the previous app, and open the newly built bundle. Retain the existing user profile. These shipping states are recorded separately in ignored `work/source-control-desk-status.json` after execution.

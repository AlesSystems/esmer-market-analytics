# Phase 8 comment review

Reviewed on 2026-09-22. Branch `codex/phase-8-reporting`, HEAD `47f43c34237ec88b3be5cc86c021cf62c8a45872`, with working-tree changes against `6e0a4782e0df92c80bc6d9ccad32f7dda5e6809e` and untracked source files.

Scope covers new or changed comments in `src/**` and `tests/**`. This independent review used the pinned Comment Sicko prompt through the Poteto Codex adapter. It made no application or test edits.

## Recommended removals

Eight comment lines across six files describe behavior already expressed by the surrounding code. These are comment-policy findings, not demonstrated application defects.

| Location at review | Comment | Evidence |
| --- | --- | --- |
| `src/reports/query.ts:57` | Keep prior-period and original-sale facts | `SalesReports.monthly` retains the full `snapshot.records.documents` and `snapshot.records.lines` alongside calculated components. |
| `src/store/store.ts:184-185` | Package cap and explicit oversized-output rejection | `acceptReport` measures serialized bytes and throws `REPORT_TOO_LARGE`. Both limits are owned by this repository. |
| `tests/integration/report-revisions.test.ts:80` | Archive an explicitly different prior rule | The fixture sets prior calculation identifiers and a literal result of `90`; assertions compare and reload that exact snapshot. |
| `src/ui/OperationProgress.tsx:6` | Request screens show failures; polling preserves content | `poll` leaves state unchanged on rejection and schedules another poll in `finally`. Request screens contain their own failure handling. |
| `src/reports/versions.ts:24` | Accepted data wins | `selected` reads persisted output before falling back to the candidate. |
| `src/reports/versions.ts:75` | Session IDs and stale flags are not financial changes | `compare` explicitly selects compared fields and omits context and stale flags. |
| `src/reports/export.ts:92` | No store access after snapshot capture | `excelReport` takes only a report value, clones it, and passes prepared sheets to the writer. |

## Exceptions and suppressions

No new legal headers, external-platform constraints, public API doc contracts, or issue-link exceptions were found. No new `eslint-disable`, `@ts-ignore`, `@ts-expect-error`, or `prettier-ignore` directives were found.

The polling catch comment is not an active lint suppression. The effective ESLint configuration has no `no-empty` rule. An in-memory ESLint check returned zero messages both before and after removing that comment. No real suppression defect or `MUST KILL` code target was established.

## Verification and limits

Inspected added lines with `git diff --unified=0 6e0a478 -- src tests`, inventoried untracked files with `git ls-files --others --exclude-standard src tests`, and read surrounding implementations and assertions. Checked ESLint's installed rule and effective configuration through its Node API. No application tests were run because this assignment changes only the review document. Existing comments outside the diff and broader implementation correctness remain outside this review. Actual source deletion count is zero; the root agent owns the eight proposed removals.

Root disposition: removed all eight reviewed comment lines. No application logic, public contract or external constraint changed. No suppression removal or architecture rewrite was needed.

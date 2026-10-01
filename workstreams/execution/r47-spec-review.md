# R47 Spec review

Verdict ISSUES. One reproduced P2 correctness finding. Review date 2026-10-01. Standards was not reviewed and the sibling Standards result was not read.

| Identity | Reviewed value |
| --- | --- |
| Branch and worktree | `codex/product-profit-reports`, `/Users/altanesmer/.codex/worktrees/profit-source-evidence/esmer-market-analytics` |
| Final HEAD | `9ba93b37f3346d912aca792224979a259938dc0d` |
| Base | `1ed1824ec5ee448cf880d20e89d74d1d67d08486` |
| Stable patchID | `513ffd76d2b1020227493668b4d3a29882d57116` |
| Tested application identity | `625661b29108e053cbfabc7f72613e88169c23d6`. Final-head diff changes only the evidence document. |

## Finding

### P2. Validate the saved daily trend against its covered contribution

The approved contract requires "All graphs use the same pinned monthly report" and "An uncovered/unsupported day is a gap, never a zero or interpolated point." Issue #41 requires "Line evidence → product → daily/monthly total → pinned report → Excel reconcile" and protected recovery behavior.

`src/recovery/validate.ts:53` checks only that `daily.trend` is null or a decimal string. Lines 78-81 reconcile daily aggregate amounts, but never compare the trend with that day's covered profit or required empty/gap result. `src/reports/display.ts:39` forwards the stored trend, and `src/reports/export.ts:93` exports it.

The reviewer reproduced this at the final head using a disposable synthetic SQLite snapshot. Import `businessPackage()`, open September, accept the resulting v2 report and close the store. The first day has covered profit `40` and trend `40`; `validateSnapshot` reports one valid report. Replace only the same-length stored bytes `"trend":"40"` with `"trend":"90"`. `validateSnapshot` still accepts the report, with generation 3 and unchanged source facts. This admits contradictory persisted financial output despite unchanged line and aggregate evidence. The probe built its imports in memory with existing esbuild, cleaned its temporary directory and changed no repository file.

Add a focused failing recovery corruption case, then validate the exact trend against the day's pinned covered contribution, retaining zero for complete empty days and null for unavailable gaps. Re-run recovery equivalence and export checks. The original full suites do not cover this case. The evidence/PR statement that no demonstrated code gap remains must be updated after this finding is handled.

No other actionable Spec finding was established. E01-E12 literal expectations agree with same-population aggregation, signed returns, cost exclusions, mixed units and precision. Product search/page requests preserve complete summary scope. Named IPC rejects unapproved selectors and unsafe bounds. Stored v1 and v2 output, complete exports and source/app pinning remain covered. Primary UI composition belongs to #42.

## Verification metadata

- Read the assigned brief, complete preferences, AGENTS, approved contract, saved issue #41, PR #47 body/comments, changed calculation/report/IPC/recovery paths and focused tests. Read relevant foundation requirements and acceptance gates. The Poteto wrapper, adapter and code-review leaf were already read in this session. No nested agent was used.
- Actually ran `npx vitest run tests/unit/product-profit.test.ts tests/integration/report-display.test.ts tests/integration/report-revisions.test.ts tests/integration/excel-report.test.ts tests/integration/recovery-equivalence.test.ts`. Five files and 33 tests passed. The separate synthetic trend probe produced the acceptance failure above. `git diff --check` passed.
- Inspected `live.json`, `compatibility.json` and `performance.json` under `/tmp/esmer-market-r47-evidence-20261001`, plus the final evidence document. Ten lane identities cover E01-E12, 101-product bounds, pinning, full-document scope, protected requests and genuine trunk-created synthetic v1/v2 restart/export/restore. Five interleaved baseline/head samples are present. Head median aggregation is 239.2 ms and product page is 1.8 ms; fresh v2 request is 27.8% above v1. These receipts passed their proposed local ceilings and do not exercise the corruption case.
- Full counts of 44 unit, 289 integration with 5 skips, and 34 packaged Mac desktop with 7 skips, plus typecheck/lint/build, were inspected as author evidence, not rerun by this reviewer. Test fixtures are synthetic; same-host dialog/safeStorage stubs and unavailable production v1 artifacts limit the receipts.
- Head/base resolution, final documentation-only delta and stable patchID were generated locally. No source connection, source SQL, private data, container or GitHub write occurred. Only this assigned report changed.

Windows packaging/execution and owner acceptance remain user-run gates. Real financial mapping, independent real-population comparisons and issue #41 completion remain open. Coordinator owns the repair and integration. This verdict is valid only for the immutable head above.

# R47 independent standards review

ISSUES. One actionable recovery-validation finding blocks the standards merge verdict for the reviewed head. This is a merge review, not application release acceptance.

## Finding

**P2. Reject contradictory retained product-profit scope and trend during restore.** [src/recovery/validate.ts:38](/Users/altanesmer/.codex/worktrees/profit-source-evidence/esmer-market-analytics/src/recovery/validate.ts:38) accepts either scope without relating it to covered/excluded populations. Line 53 accepts any decimal trend. The arithmetic checks at lines 70–81 never reconcile these derived presentation fields with the pinned evidence.

Measured on the repository's disposable synthetic `businessPackage()` fixture. An accepted September v2 report has `summary.scope="covered"`, `excludedCount=1`, and a daily profit/trend of `40`. After closing the store, independently changing only serialized `"scope":"covered"` to `"scope":"market" ` or `"trend":"40"` to `"trend":"99"` preserves byte length and database structure. `validateSnapshot(path)` accepts both mutated snapshots with `{generation:3, cutoff:"2025-09-30", revisions:0, reports:1}`. The unmodified snapshot passes as the control.

Foundation D15 requires "Every KPI must be traceable to components, source records, import batches, calculation versions and relevant adjustments." D16 requires "Incomplete periods remain visible with coverage warnings." The report contract requires retained "calculated values and their explanations." Accepting a full-market scope despite excluded cost or a trend that disagrees with its retained amount violates that evidence contract. Restored display/export retains these contradictions. This demonstrates an invalid snapshot passing validation, not an encryption bypass or a production exploit.

Require coverage/state/trend consistency against the pinned artifact and source metadata, with focused mutation regressions. Preserve historical version semantics. No speculative cleanup or code-smell finding is requested.

## Verification metadata

- Worktree `/Users/altanesmer/.codex/worktrees/profit-source-evidence/esmer-market-analytics`, branch `codex/product-profit-reports`.
- Base `1ed1824ec5ee448cf880d20e89d74d1d67d08486`; reviewed HEAD `9ba93b37f3346d912aca792224979a259938dc0d`; tested application code `625661b29108e053cbfabc7f72613e88169c23d6`.
- Diff `git diff <base>...HEAD`; stable patch ID `513ffd76d2b1020227493668b4d3a29882d57116`. HEAD changes only evidence documentation after tested code. `git diff --check` passed.
- Actually run `npm run test:unit -- tests/unit/product-profit.test.ts`, 7 passed. `npm run test:integration -- tests/integration/recovery-equivalence.test.ts tests/integration/report-display.test.ts tests/integration/report-revisions.test.ts tests/integration/excel-report.test.ts`, 26 passed.
- Actually run the disposable snapshot probe described above through installed esbuild in-memory bundling. Temporary synthetic data was removed. The first exploratory SQL UPDATE was blocked by `IMMUTABLE_REPORT`; the subsequent raw snapshot mutations proved the validator gap.
- Inspected source/test diff, repository rules, foundation documents, calculation/report/privacy/desktop contracts, issue #41 and PR #47 body/comments, final evidence record, and `/tmp/esmer-market-r47-evidence-20261001/{live,compatibility,performance}.json`. Full 44-unit/289-integration/34-desktop and typecheck/lint/build results are inspected receipts, not reviewer reruns.
- Windows, real mapping, production v1 artifacts, independent-machine recovery, and owner acceptance remain open. No source/private records, keys, profiles, nested agents, GitHub writes, or application changes. Only this report is owned.
- Poteto wrapper and Codex adapter applied. Prove It Works changed the decision from trusting green receipts to directly testing retained-output validation. Nested review steps were skipped under the explicit assignment.

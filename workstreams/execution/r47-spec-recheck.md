# R47 Spec repair recheck

Verdict PASS on 2026-10-01. The reproduced P2 finding in `r47-spec-review.md` is resolved. That initial failed report is preserved. This recheck covers the repair and relevant regressions only. The sibling Standards report was not read.

| Identity | Reviewed value |
| --- | --- |
| Final HEAD | `328453e1dafc0a5fc8aba72ccc62ffbcafef72e1` |
| Original base | `1ed1824ec5ee448cf880d20e89d74d1d67d08486` |
| Stable whole-patch ID | `659c4e02b9bfbbeafd9bfb9c1be790416ace9483` |
| Application repair head | `ad4bc3da26e398773e9eb86d8700fc72cfb7ed90` |
| Repair range | `9ba93b37f3346d912aca792224979a259938dc0d..ad4bc3da26e398773e9eb86d8700fc72cfb7ed90` |
| Worktree | `/Users/altanesmer/.codex/worktrees/profit-source-evidence/esmer-market-analytics`, branch `codex/product-profit-reports` |
| Verified packaged app.asar SHA-256 | `c7220ece53cea49594d264ce73e2368fef84ef8bffcb2b80e7c7daa73fb750fe` |

## Finding resolution

The contract requires all graphs to use the same pinned report, with complete empty days at zero and unsupported days as gaps. `src/recovery/validate.ts:87` now derives daily coverage, status and trend from pinned coverage and line membership. Line 92 rejects a stored trend that differs from the covered contribution or required zero/null result. Existing scope-to-line reconciliation still verifies the money fields. Summary coverage, scope/status, warnings and source exclusions now receive corresponding checks against pinned metadata and saved evidence. These related checks protect the same persisted reporting contract and introduce no new product behavior.

The repair preserves v1 handling. It validates the saved v2 artifact rather than silently regenerating it against active data. Existing report, export and recovery interfaces remain unchanged.

No actionable Spec finding remains in this bounded repair. The mutation test fails on the original validator and passes after the repair. Six altered fields are rejected, including trend, scope and coverage. Valid complete-empty, partial/gap and unresolved-document reports still validate. Current packaged compatibility preserves accepted v1/v2 values and every workbook sheet after restart, original-profile loss and encrypted restore.

## Verification metadata

- Actually ran `npx vitest run tests/unit/product-profit.test.ts tests/integration/report-display.test.ts tests/integration/report-revisions.test.ts tests/integration/excel-report.test.ts tests/integration/recovery-equivalence.test.ts` at the repaired application head. Five files and 35 tests passed. This includes the reproduced mutation contract and valid-state boundaries.
- Inspected `review-red.log`, `review-green.log` and `review-boundaries.log`. They record the observed application-contract failure, six-test green result and seven-test boundary result. The failure was an accepted corrupted snapshot, not a toolchain error.
- Inspected current `repaired-unit.log`, `repaired-integration.log`, `repaired-desktop.log`, static-check receipts and final evidence document. Author checks record 44 unit tests, 291 integration tests with 5 skips, typecheck/lint/build, and 34 packaged Mac desktop checks with 7 skips. These full suites were not rerun by this reviewer.
- Inspected `repaired-compatibility.json` and its exact complete-workbook v1/v2 equivalence results. Inspected all five `repaired-v2-recovery-performance.json` samples on the synthetic 25,000-document fixture. Restore median is 6025.2 ms and maximum 6188.0 ms. These larger v2 restores are not an equivalent-work comparison with earlier v1 restore measurements. The receipt accurately retains that limit.
- Independently computed the packaged archive SHA-256 above. Confirmed the final commit changes only `docs/evidence/issue-41-synthetic-product-profit.md`, with no application delta after the tested repair head. `git diff --check` passed. The reviewed worktree is clean. PatchID was generated from the original base to final HEAD with `git patch-id --stable`.

Only this assigned report changed. No source connection, private data, credentials, source SQL, container or GitHub write occurred. No nested reviewer was used. Windows, owner acceptance, independent-machine recovery, real financial mapping, real-population comparisons and issue #41 completion remain open. Earlier calculator/paging/IPC performance receipts retain their earlier application identities; this PASS does not relabel them as current-package runs. Coordinator owns integration.

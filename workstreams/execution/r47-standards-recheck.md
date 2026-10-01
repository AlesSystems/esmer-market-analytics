# R47 independent standards recheck

PASS for the assigned repair and its regressions at final HEAD `328453e1dafc0a5fc8aba72ccc62ffbcafef72e1`. The initial failed review remains preserved in [r47-standards-review.md](r47-standards-review.md). This is a standards merge verdict, not Windows, source-mapping, or release acceptance.

The P2 recovery finding is resolved. The validator now checks summary scope/status/coverage/warnings against retained recognized and excluded populations. Period coverage comes from the hash-validated pinned package. Daily coverage/status/trend must agree with pinned date coverage and retained amounts. Source exclusions must match the saved report's exclusions. These checks enforce D15 traceability and D16 honest coverage without invoking current sales or cost calculators to rewrite saved historical output. The v1 validation branch remains unchanged.

The observed-red receipt records the corrupted trend being accepted before the repair. The committed regression now rejects six independent snapshot mutations, including both original scope and trend reproductions. Valid empty, partial-period/gap, and unresolved-document reports remain recoverable. My focused run passed all 38 recovery tests. No actionable standards or regression finding remains within this recheck scope.

## Verification metadata

- Branch `codex/product-profit-reports`; worktree `/Users/altanesmer/.codex/worktrees/profit-source-evidence/esmer-market-analytics`, observed clean.
- Original review head `9ba93b37f3346d912aca792224979a259938dc0d`; repair code head `ad4bc3da26e398773e9eb86d8700fc72cfb7ed90`; final head `328453e1dafc0a5fc8aba72ccc62ffbcafef72e1`.
- Repair commits `a37d272`, `d5f74c7`, `ad4bc3d`. Inspected source/test repair diff. Final-head delta from repair code is solely the evidence document. `git diff --check` passed.
- Fixed base `1ed1824ec5ee448cf880d20e89d74d1d67d08486`; final three-dot stable patch ID `659c4e02b9bfbbeafd9bfb9c1be790416ace9483`; repair source/test patch ID `e9c397373ff5035a1be5a3362e0a82c16e5197e5`.
- Actually run `npm run test:integration -- tests/integration/recovery-equivalence.test.ts tests/integration/restore-failures.test.ts tests/integration/encrypted-backup.test.ts`. Result 38 passed across three files.
- Inspected `review-red.log`, `review-green.log`, `review-boundaries.log`, repaired unit/integration/typecheck/lint/desktop logs, `repaired-compatibility.json`, `repaired-v2-recovery-performance.json`, and the final evidence-only diff. Full receipts record 44 unit, 291 integration with 5 skips, and 34 packaged macOS checks with 7 skips. These full runs were not reviewer reruns.
- Packaged receipts retain both v1/v2 reports after restart and original-profile loss, encrypted restore, and exact full-workbook comparison. Five current synthetic v2 restore samples passed. Median 6025.2 ms, maximum 6188.0 ms. Earlier v1 timing is not an equivalent-work baseline.
- Direct `shasum -a 256` confirmed current `app.asar` identity `c7220ece53cea49594d264ce73e2368fef84ef8bffcb2b80e7c7daa73fb750fe`.
- Windows, real source semantics/data, production v1 artifacts, OS credential wrapping, independent-machine recovery, and owner acceptance remain open. No source/private records, keys, profiles, sibling verdict, nested agents, GitHub writes, or application changes were accessed or performed. Only this assigned report was written.

# Estimated V1 evidence

Gate EV1-REAL / EV1-RETEST, 2026-10-02. Branch `codex/source-inspection-resume`, baseline `f705ec1a6e3b365b6e4e0a709a7b405aca416959`. Behavior commit `aa069d5`; boundary tests `a9edb9b`, API inventory repair `273ff1e`, private native workflow `3bd90efff66651ab7c2ec9059459dd23ba7dfbde`. This verifies the [declared estimate contract](../../docs/contracts/recorded-estimates.md), not previously unproved POS meanings.

## Real input and independent reconciliation

Opaque isolated batch `3824ff83-6d2f-47b7-9b74-02d7334d6cd4`, September 2025, 15,880 headers /54,965 lines. No SQL query, Docker action, privilege change or production connection occurred in this workstream. Retained authorized extraction fields were compared exactly by header/line identity with the retained raw preview before adding the historical-cost candidate.

| Private artifact | SHA-256 |
| --- | --- |
| Retained preview | `9476db18e20742f304749e86798ff5b0dae9561b1caeff9d0bb9bc0e5e360b6e` |
| Retained extraction with cost candidate | `dc565a71eb0fa2f5019d979262917d3d80f6e8f8f58854fafb13dc591bfebb40` |
| Independent expectations, fixed before application comparison | `1c63c19986198c37959f68d7db7680a895a1ef0757e31fe6a516fa3568436b41` |
| Import-ready estimate package (19,947,963 bytes) | `eacb202c0485e0785c6c4afa904d28c0a36c43f2a227864ed88de4d44a94805e` |
| Application full report | `7829f028bf31d707366fc5425c22b49f39736dee6fa6e48f4277c37d0a2a08a4` |
| Packaged app Excel export | `ae9262dbb1cd674c775e49159c60f1c793e036a8612136a9f2330c23f09710e1` |

Private artifacts remain in the owner's restricted evidence store, not the repository. [reconcile.py](reconcile.py) independently computes Decimal expectations without importing app code. Its self-check detects omitted/doubled/miscosted rows and omitted workbook products and exercises null, zero, loss and >100-digit precision. All 54,965 lines, 3,529 products and 30 days match exactly, including operands, nulls, counts and primary exclusion reasons. The source hash matches the imported package. Full workbook XML was independently checked for every product/day/summary/scope cell, exact text values, no formulas and provenance/assumptions on every sheet.

Covered lines: 50,043. Excluded: 4,922, comprising 4,675 other types, 17 return-cost exclusions, 47 type-35 exclusions and 183 undocumented zero-cost lines. Empty headers: zero. These counts establish only the declared candidate population; completion, physical units, tax basis, historical-cost meaning and return attribution remain assumptions.

Rerun on privately supplied paths:

```sh
python3 workstreams/estimated-v1/reconcile.py --self-check
python3 workstreams/estimated-v1/reconcile.py --expected PRIVATE_EXPECTED --actual PRIVATE_REPORT --workbook PRIVATE_WORKBOOK
```

Expected and actual outcome: `PASS_WORKBOOK_RECONCILIATION`. No private monetary values or source IDs are printed.

## Packaged and regression checks

Environment: Darwin 27.0.0 arm64; Node 24.15.0; npm 11.12.1; Electron 44.3.0. Unsigned packaged Mac application. Initial build archive SHA-256 `bb9fde5999ec17fd26c75d2bffeb073fd220cbe4d979c7e69db4ad0b0b534d4c`; launcher SHA-256 `588478afc5f2bc73b6433d6e565a214dc830144be39a3d79805723292754ccd8`.

| Procedure | Expected and actual |
| --- | --- |
| `npm run typecheck`, `npm run lint`, `git diff --check` | Passed |
| Full unit suite | 49 passed |
| Full integration suite | 299 passed, 5 source-dependent skips |
| `npm run package:local` (includes build) | Passed; package notice inspection passed for 10 dependencies |
| Initial desktop run | 42 passed, 8 skipped, 6 failed: four old Windows-default launch paths on Mac, two stale exact IPC inventories |
| Corrected full packaged desktop run with explicit Mac executable | 48 passed, 8 skipped; Windows and private-source requirements were not silently counted as passes |
| Private opt-in packaged test | 1 passed: real package through the packaged import/export dialog boundary with scripted file choices, headline comparison and same-profile restart |
| Private encrypted backup and clean-profile restore | Passed; complete restored report digest identical to the original |

First red contract test failed to collect because the new estimate module did not exist; it was an absent capability, not a failed business assertion. Repairs changed the two API expectation lists and selected the existing explicit Mac executable override. Application logic was unchanged by those repairs.

OS dialog interaction was not automated: the packaged test supplies dialog file choices. Manual native dialogs remain in the Windows checklist.

Full test logs are retained in the task verification directory; private packaged log, exact report, expected result, package, workbook and recovery receipt stay in restricted evidence storage. Private Playwright runs disable screenshots/video/traces and use temporary output. The [public screenshot](evidence/source-estimate.png) uses a synthetic fixture only. It shows loss, return exclusion and covered-line counts at normal zoom. Zoom behavior is checked separately at 125 and 200 percent. Package dependencies were reused through the existing worktree's local node_modules symlink; packaging emitted path warnings but built and passed actual packaged tests. Windows must install the locked dependencies cleanly.

Single-run Mac observations on the real window: import 494 ms, full calculation 619 ms, product page 613 ms, workbook generation 354 ms, encrypted backup 887 ms, restore 1,626 ms. These are observations, not repeated Windows performance acceptance. The packaged private import/export/restart test completed in 6.6 seconds overall.

## Review repair and final build

Independent review found one minor layout defect: the 64-character source reference overflowed the minimum-width window by 13px at 125 percent zoom. Regression commit `6a64159` reproduced the failure. Fix `c7f7a646b1dc01745dbc8420726fbf9609a6e320` applies the existing wrapping class; no calculation or source logic changed. The focused packaged workflow passed with method details expanded at 125 and 200 percent, with export reachable and no document overflow. The public screenshot now captures the normal-zoom viewport; the former full-page image had a zoom capture artifact.

Final rebuilt archive SHA-256: `1965247871e0d33f4d81b7bb5f55e4b786f6a8cf9b9eafc35cc5a5f637e67ccb`; launcher digest unchanged. Build, typecheck, lint and package notice inspection passed. Final packaged synthetic and private real workflows each passed. The final private workbook independently matches all rows/cells and has SHA-256 `564b5ee7f6ffc6f7030763d66b7fbe94d3bd9273a363697f3b043fb44c2a2294`. Earlier full-suite and encrypted-recovery receipts remain applicable to unchanged calculation/storage code; they are not presented as a second full-suite run on the layout repair.

See [independent review](review.md). GitHub is the repository's required forge; the installed Origin CLI could not resolve this repository, so publication uses `gh`. Detailed commits are preserved by merge commit as required by this repository.

## Remaining acceptance at this recorded boundary

Later tracker closure does not supply new source or Windows proof. Use [the current evidence index](../../docs/evidence/index.md) and issue #67 for the continuing real-financial work.

[Windows handoff](windows-handoff.md) remains user-run. Original #39 source semantics and #40 validated financial import are not declared complete; #41 has real estimate arithmetic evidence, not validated whole-market profit. #43 remains open for integrated Windows/distribution/recovery/performance acceptance. No production rollout occurred. Return economic effects and unsupported costs are excluded visibly. Estimates are transient and change with the source package; exported workbooks preserve an external copy. Existing accepted financial reports remain governed by their prior contract.

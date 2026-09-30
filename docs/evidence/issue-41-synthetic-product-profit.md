# P04 synthetic product-profit reporting

Issue: [P04 / #41](https://github.com/AlesSystems/esmer-market-analytics/issues/41). Contract: [monthly-product-profit-v1](../contracts/monthly-product-profit.md), approved under [P01 / #38](https://github.com/AlesSystems/esmer-market-analytics/issues/38).

## Scope and acceptance boundary

This change implements the synthetic reporting path. It does not complete P04's real-source integration gate, approve a SQL financial mapping or close #41. P03 / #40 and independent real-data comparisons remain prerequisites for real financial activation. P05 / #42 owns the primary product-profit page composition.

The user assigned Windows verification and owner acceptance to themselves on 2026-09-30. Those are handoff checks, not outstanding requests for permission. macOS packaged checks cannot satisfy Windows acceptance.

Source transport evidence from P02 / #39 does not establish completed-sale classification, conversion/return relationships, normalized units, KDV basis or historical-cost meaning. Arithmetic equality alone cannot establish those meanings. The TRNC/KKTC location and Aladağ vendor clue do not approve a tax rule or identify the installed product/version.

## Verification record

Environment: macOS ARM64, Node 24.15.0, npm 11.12.1. Fixture identity: repository synthetic business fixtures and P01 E01–E12; no private source rows.

Initial commits: `8be4364`, `5331091`, `bbecf9d`, `6233bb0`, `73b8ca4`. Review repairs: `7c0bcb6`, `4b3a73f`, `e6acd32`, `6a6ad0a`, `e748961`, `9d9d356`. The final full suites and packaged application were verified at `9d9d356`.

| Gate | Procedure | Expected / actual |
| --- | --- | --- |
| P04 synthetic arithmetic | `npm run test:unit` | 44 passed. E01–E12 cover exact product/day/month partitions, returns, missing cost, mixed units, zero/loss, tiny values and coverage. Real calculator paths additionally exercise cross-month returns, over-returns and whole-document unknown-unit exclusion. |
| P04 persistence/API/export/recovery | `npm run test:integration` | 289 passed, 5 skipped. Bounded paging, Turkish search, pinned artifacts, version comparisons, v1 compatibility, v2 Excel and encrypted recovery covered. |
| Static checks | `npm run typecheck`; `npm run lint`; `git diff --check` | Passed. |
| Packaged macOS | `ESMER_EXECUTABLE="$PWD/release/mac-arm64/Esmer Market Analytics.app/Contents/MacOS/Esmer Market Analytics" npm run test:desktop` (includes build and local packaging) | Final full run: 34 applicable checks passed, 7 skipped. An earlier run had four ENOENT failures for Windows-default executable paths; setting the supported executable override resolved those launcher errors. |
| New packaged P04 path | `tests/desktop/product-profit.test.ts` | 101 products reached in fixed 100-row pages; compact summary unchanged by search; exact product evidence; extra request key rejected; accepted report and product page identical after restart. |
| Independent final reviews | Sol high spec and standards reviews | Passed after repairs. Standards confirmed the raw request bound and bounded comparisons; Spec confirmed unavailable-day behavior, aggregate-to-line reconciliation and exact product membership with linear grouping. No unresolved review findings. |

Local harness logs are under ignored `work/poteto/issue-41/`. Commands and runnable synthetic cases remain in Git; no private database, credentials or source rows were used for this slice.

The initial behavioral contract failed because the application returned v1 instead of v2. The fixture's correct covered-profit oracle is 40 (its second sale lacks cost). The new packaged test initially omitted a required synthetic document field and then raced initial UI candidate creation; both test setup errors were corrected before the passing run.

Compatibility limitation: v1 checks use a saved synthetic v1-shaped artifact. Historical production v1 report bytes were unavailable; those were not tested. The 5 integration and 7 desktop skips remain unperformed checks, not passes. Windows packaging, Windows execution, full real-data comparisons and owner acceptance are not claimed here.

## Change and risk

New reports add a versioned product/day aggregate from existing recognized sales and historical-cost results. Saved v1 output remains readable and exportable. The renderer receives a compact monthly payload plus named, validated, fixed-size product/evidence requests; complete evidence remains in the selected service-side artifact. Export and recovery use that artifact.

No SQLite migration, source mapping, dependency change, live activation or primary UI redesign is included. Financial and recovery behavior make this a material reporting change; real-data activation remains gated separately.

## Windows and owner handoff

Continue on `codex/product-profit-reports` at the final PR head, with a clean checkout and Node satisfying `package.json`.

1. Run `npm ci`, `npm run typecheck`, `npm run lint`, `npm run test:unit` and `npm run test:integration`.
2. Run `npm run package:win`, then `npm run test:desktop` against the packaged Windows executable. Retain the release inventory and test output with the tested commit and Windows version.
3. Confirm saved reports reopen and export the same values after restart. Keep synthetic acceptance separate from real-source financial comparisons.
4. Record owner acceptance against the actual installed build and approved product behavior. The new primary product-profit UI remains P05 work.

Do not enable financial mapping merely because Windows or owner checks pass. Real activation additionally needs reviewed P02 semantics, P03 normalization and independent comparisons required by P04/P06.

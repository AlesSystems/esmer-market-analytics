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

## R47 pre-review verification, 2026-10-01

The initial R47-IMPL audit found no demonstrated gap in E01 through E12. Independent review subsequently exposed the recovery semantic-validation gap recorded below; this section is historical evidence for the pre-repair build. The approved documentation-only base was integrated with a merge, preserving branch history.

- Branch `codex/product-profit-reports`.
- Tested code and integration merge `625661b29108e053cbfabc7f72613e88169c23d6`.
- Baseline `origin/main` at `1ed1824ec5ee448cf880d20e89d74d1d67d08486`, containing the evidence-only #46 merge.
- Environment macOS 27.0.0 ARM64, Apple M4 Pro, 12 logical CPUs, 24 GiB RAM, Node 24.15.0, npm 11.12.1.
- Receipt identity `r47-synthetic-20261001`. Local receipts and exploratory probe source are under `/tmp/esmer-market-r47-evidence-20261001/`. They are task-local artifacts, not committed application tests.

The tested executable is `release/mac-arm64/Esmer Market Analytics.app/Contents/MacOS/Esmer Market Analytics`. Its SHA-256 is `588478afc5f2bc73b6433d6e565a214dc830144be39a3d79805723292754ccd8`. The tested `Contents/Resources/app.asar` SHA-256 is `e336ff347cc90d642d5f504a86cc721b3bf2c59597b144e20f390a77c15a4474`. The baseline archive SHA-256 is `ca192d91b3e030d926399581fadf0e1b2ba543dccb5ebb8145d4c95b7459f790`. The identical executable hash identifies the Electron launcher. The differing archive hashes identify application code. Hashes were read after `test:desktop` rebuilt the package. The later evidence commit changes documentation only.

### Repository checks

| Procedure | Actual result |
| --- | --- |
| Focused unit product-profit, cost-coverage, return-cost, decimal-boundaries | 17 passed |
| Focused integration report-display, report-revisions, excel-report, cost-provenance, recovery-equivalence | 28 passed |
| `npm run test:unit` | 44 passed |
| `npm run test:integration` | 289 passed, 5 skipped |
| `npm run typecheck`, `npm run lint`, `git diff --check` | Passed |
| `ESMER_EXECUTABLE="$PWD/release/mac-arm64/Esmer Market Analytics.app/Contents/MacOS/Esmer Market Analytics" npm run test:desktop` | Build and local packaging passed, 34 desktop checks passed, 7 skipped |

The five integration skips require separately configured isolated SQL access. The seven desktop skips comprise Windows full-dataset, lifecycle, pagination, three visual checks, and the private prepared SQL preview. No skipped check is a pass. The source was not accessed.

### Packaged scenario receipts

The task-local probes use the installed Playwright Electron controls, existing fixture helpers, and actual packaged IPC. Native dialog choices are stubbed as in repository tests. Screenshots show existing owner workflows; diagnostic product-profit requests supplement them. The primary one-page product-profit UI remains #42.

| R47 lane | Expected and observed result | Receipt |
| --- | --- | --- |
| 1 | A genuine synthetic v1 artifact created by trunk reopens with its original meanings on trunk and head. Every exported workbook sheet matches. | `compatibility.json`, `lane-01-baseline.png`, `lane-01-head.png` |
| 2 | E01, E02, E03 profits are 100, 60, 60. E03 retains missing-cost exposure and 89.74% coverage. | `live.json`, `lane-02.png` |
| 3 | E04 leaves the original month at 80 and return month at -40. E05 retains negative sales with null covered cost and profit. | `live.json`, `lane-03.png` |
| 4 | Exact zero, loss, zero-net cost, nonpositive margins, and zero-value exclusions match E06 and E10 through E12. | `live.json`, `lane-04.png` |
| 5 | E07 keeps kg and pieces separate with profit 43.5. E08 uses both transaction costs. E09 keeps exact 0.015 contributions and total 0.03. | `live.json`, `lane-05.png` |
| 6 | 101 products occupy 100 and 1 row pages. Search and sort leave the complete summary and daily population unchanged. | `live.json`, `lane-06.png` |
| 7 | Source refresh and an app revision leave pinned values unchanged and mark the report stale. | `live.json`, `lane-07.png` |
| 8 | Selected A contributes 200 while the full document contributes 250 and retains both product lines. The owner detail labels both scopes. | `live.json`, `lane-08.png` |
| 9 | Accepted v1 and v2 survive restart and encrypted restore after removal of the original disposable profile. Every sheet matches the pre-restore exports. | `compatibility.json`, `lane-09.png` |
| 10 | Unknown keys, invalid sort/direction, oversized search, negative/fractional offsets, invalid evidence range/product, and expired report ID fail at the protected boundary. | `live.json`, `lane-10.png` |

The standalone compatibility probe additionally compares all workbook sheets. Recovery uses disposable same-host profiles and the repository's macOS `safeStorage` stub. The synthetic local credential wrapper is removed before restart because it is not real Keychain ciphertext. This does not prove OS credential encryption, Windows recovery, or independent-machine recovery. Production v1 artifacts remain unavailable.

Initial exploratory probes failed on probe setup. Corrections used percentage discount `10`, opened the product subview before selecting A, avoided invalidating UI context with a diagnostic report open, reopened candidates after recovery setup rebuilt services, and selected the newest backup by recorded creation time rather than random filename order. These failures did not establish application defects.

### Five baseline and head performance observations

Fixture `phase-10-complete-synthetic` uses the unchanged construction from `tests/desktop/full-dataset.test.ts`, with 25,000 documents, 25,000 lines, and one product. Package size is 16,442,402 bytes. Package SHA-256 is `8966544a2aeb51bef3facad8716dc71d56602be5a7d3dda1e01d5aa900f2928b`. All inputs are synthetic.

Each baseline/head pair runs on the same host with a fresh disposable profile and process. OS caches are not cleared. Cold timing includes launch to coherent visible monthly content. Fresh monthly-request timing starts after startup. Shared export and restore use accepted v1 artifacts on both branches. Head v2 export is separate. Added aggregation uses precomputed sales and cost inputs from the same fixture, outside IPC. Trunk has no product-profit aggregation or product page.

| Operation | Baseline median / maximum ms | Head median / maximum ms |
| --- | --- | --- |
| Cold coherent monthly view | 1608.5 / 1831.6 | 1721.9 / 1807.9 |
| Fresh monthly request, v1 versus v2 | 775.6 / 812.5 | 991.2 / 1051.7 |
| Shared component evidence page | 144.0 / 148.8 | 127.5 / 133.6 |
| Shared accepted v1 export | 2706.6 / 2807.0 | 2626.1 / 2743.5 |
| Shared accepted v1 restore | 4468.0 / 4523.4 | 4495.4 / 4730.0 |
| Added `buildProductProfit` | Unavailable | 239.2 / 250.1 |
| Added product page | Unavailable | 1.8 / 2.2 |
| Added v2 export | Unavailable | 3462.5 / 3504.0 |

All five local samples satisfy the proposed R47 ceilings of 5000 ms aggregation, 60000 ms cold coherent monthly view, and 2000 ms product/evidence pages. Shared v1 operations show no median regression over 20%. The v2 monthly request median increases 27.8%, or 215.6 ms. The separately measured 239.2 ms aggregation is consistent with that additional work. The v2 workbook adds five product-profit sheets, so its export timing is not an unchanged-work regression. These are local synthetic results, not Windows or full-market capacity evidence.

A separate packaged request on this 25,000-document fixture observed the active job, cancelled it in 414.9 ms, read operation status in 0.2 ms, preserved the loaded dataset, and successfully retried to profit 1000000. Raw samples, identity, conditions, and this check are in `performance.json` and `responsiveness.json`.

Replay the task-local probes from the owned worktree with `node work/poteto/r47/probe.mjs`, `node work/poteto/r47/lane7-app.mjs`, `node work/poteto/r47/compatibility.mjs`, `node work/poteto/r47/perf.mjs`, and `node work/poteto/r47/responsive.mjs`. The restricted receipt directory retains source copies and build/replay instructions. The repository tests listed above remain the portable, committed regression checks.

### Windows continuation and remaining gates

The user runs Windows acceptance personally on the same branch at its final reviewed head. Run `npm ci`, `npm run typecheck`, `npm run lint`, `npm run test:unit`, `npm run test:integration`, and `npm run package:win`. Set PowerShell `$env:ESMER_EXECUTABLE = (Resolve-Path 'release/win-unpacked/Esmer Market Analytics.exe').Path`, then run `npm run test:desktop`. The wrapper rebuilds the package, so retain hashes after it completes. Record Windows version, CPU, RAM, Node/npm versions, full commit, package inventory, every skip, and actual executable/archive hashes.

Then run `npm run test:desktop -- tests/desktop/full-dataset.test.ts tests/desktop/product-profit.test.ts tests/desktop/clean-install-restore.test.ts tests/desktop/report-version-comparison.test.ts tests/desktop/monthly-overview.test.ts`. Preserve screenshots and literal results. Recheck hashes after this rebuild. NSIS and portable installation/lifecycle, scaling, physical offline startup, OS-protected credentials, and independent-machine recovery remain owner acceptance checks.

Expanded R47 E01 through E12 and five baseline/head aggregation/export/restore probes are currently task-local macOS scripts. A Windows adaptation of these probes and its recorded results remain open. Do not count the existing Windows-only full-dataset test alone as proof of added aggregation ceilings. Real financial mapping, approved real-population comparisons, #41 completion, Windows acceptance, and broader release gates remain open.

## R47 review repair, 2026-10-01

Independent Standards and Spec review found that same-length raw snapshot mutations of v2 daily trend and summary scope passed recovery validation. SQL updates remain blocked by immutable-report triggers; the defect was incomplete semantic validation of persisted JSON.

- `a37d272` exposes six mutations: daily trend, daily state, scope, daily source coverage, summary unresolved count, and summary period coverage. The focused red run failed because the first corrupted snapshot was accepted.
- `d5f74c7` validates saved v2 scope, coverage, daily state/trend, warnings, and source exclusions against pinned lines, saved document evidence, and pinned metadata. It does not recalculate saved reports with the newest calculator. The v1 validation path remains unchanged.
- `ad4bc3da26e398773e9eb86d8700fc72cfb7ed90` adds valid empty, partial-period/gap, and unresolved-document recovery boundaries. Focused recovery checks passed 7 tests.

At that code head, `npm run test:unit` passed 44; `npm run test:integration` passed 291 with 5 skips; `npm run typecheck` and `npm run lint` passed. Packaged `test:desktop` rebuilt successfully and passed 34 checks with 7 skips. The same skip and platform limitations above apply. Logs use the `repaired-` prefix in the restricted receipt directory; the behavioral red/green receipts are `review-red.log`, `review-green.log`, and `review-boundaries.log`.

The repaired `app.asar` SHA-256 is `c7220ece53cea49594d264ce73e2368fef84ef8bffcb2b80e7c7daa73fb750fe`; the Electron executable SHA-256 remains `588478afc5f2bc73b6433d6e565a214dc830144be39a3d79805723292754ccd8`. Baseline and environment identities remain those recorded above. Subsequent documentation changes do not alter executable or application archive bytes.

`repaired-compatibility.json` records current packaged lanes 1 and 9 passing: genuine synthetic trunk v1 compatibility, accepted v1/v2 restart, loss of the original disposable profile, encrypted restore of both reports, and exact complete workbook equality. The first task-local rerun selected the setup checkpoint by UUID filename and observed one report instead of two; correcting the probe to use the first catalogue entry returned by `backupNow` selected its newly published checkpoint. A follow-up probe typo used a nonexistent path field and returned `recovery-failed`; the corrected path is `<destination>/<entry.id>.esmerbackup`. Neither harness error was an application regression. The successful preview asserted two reports before restore confirmation. Native dialogs and credential wrapping remain stubbed as described above.

Unchanged calculator, paging, IPC, and responsiveness lanes retain their pre-review exact-build evidence; their receipts are not relabelled as current-package measurements. Current repository checks and packaged compatibility exercise the repaired recovery code. Replay current recovery probes with `node work/poteto/r47/compatibility.mjs` and `node work/poteto/r47/restore-perf.mjs`; source copies and build instructions remain task-local. Windows, owner, real-source and independent-machine gates remain open.

Five fresh repaired-package v2 recovery samples on the same 25,000-document fixture passed with saved sales and product-profit values unchanged. `repaired-v2-recovery-performance.json` records restore median 6025.2 ms / maximum 6188.0 ms, cold coherent monthly view 1447.4 / 1885.2 ms, evidence page 124.8 / 144.9 ms, product page 1.6 / 1.7 ms, and v2 export 3249.1 / 3365.4 ms. These current v2 restores include the larger saved artifact and additional validation; the pre-review shared v1 timings are not an equivalent-work baseline. No v2 before/after latency comparison or Windows capacity claim is made. All five local aggregation/startup/page samples remained within the proposed ceilings.

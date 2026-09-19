# Phase 5 Windows verification

Date: 2026-09-19. Issue [#8](https://github.com/AlesSystems/esmer-market-analytics/issues/8), existing PR [#19](https://github.com/AlesSystems/esmer-market-analytics/pull/19), branch `codex/phase-5-sales-analytics`. The user authorized this Windows continuation of Option A. The automated synthetic checks below passed. Physical-disconnect testing, actual Windows scaling changes and source-dependent acceptance remain open. This record does not complete A02, A03 or A07.

## Revision and scope

- Entry: clean `codex/phase-4-durable-imports` at `eb019901cbdffab25a853e9f3f0b1b2e4b458707`, one worktree. Fetched origin, switched to the existing Phase 5 branch and fast-forwarded safely. No unrelated changes were overwritten.
- Fetched Phase 5 tip: `d145a1135050a9485418e1cd27a602c73d6875ac`. The earlier locally verified application revision was `7ea6e64ec2abdc6511cfce21299a57bd077822aa`; the latest fetched handoff was used.
- Final application/test revision: `5b21538813672e935bb9d7e8b27546ff408b55bd`. Subsequent evidence commits do not change application code or these builds.
- Read issue #8 and its comments/labels, PR #19 and comments, and dependencies #5/#7. Both dependencies were closed; #8 was open with `enhancement`. Read repository instructions, foundation specification/audit/acceptance, shared and Phase 5 plan, PRODUCT, Option A design, decisions, contracts and prior evidence before changing code.
- No source inspection, private backup, credential, real customer/payroll record, source container, Eralp contact or production installation was used. Fixtures/profiles were disposable and synthetic. No dependency or lockfile changed. No Phase 6 work, merge, issue closure or deployment is included.

## Environment and build

The [runtime record](windows-phase-5-runtime.json) records Windows 11 Pro 25H2, build **26200.9457**, x64; HP ZBook Studio 16 G9; Intel i9-12900H, 14 cores/20 logical processors; 33,974,288,384 bytes RAM. PowerShell 7.6.6. Development Node **24.15.0**, npm **11.12.1**, satisfying the declared Node 24 range. The packaged runtime is Electron **44.3.0**, Node **24.20.0**, SQLite **3.53.4**. Display: 2560×1440, native scale **100%**, work area 2560×1392, Turkish application locale.

The default window is 1120×760 and minimum 680×520 outer pixels. Actual native content sizes were 1104×721 and 664×481. Additional 125%, 150% and 200% Chromium device-scale probes are recorded separately from OS scaling.

| Final artifact | SHA256 |
| --- | --- |
| `release/win-unpacked/resources/app.asar` | `e919c3942792516715eb8c83a4c111d990eb114a42493a470b6a0e5c413c0e58` |
| `release/win-unpacked/Esmer Market Analytics.exe` | `c4b77c9eb1f6e2e2253b78299d41a2b542ea06dfedcfd426bba9b3f96b2ab9a4` |
| `release/Esmer Market Analytics Setup 0.1.0.exe` | `78ad3f71706ac2c6f77c298bcbe6ccf4ae5c6022ddd3823f952de0e4d7911c30` |
| `release/Esmer Market Analytics 0.1.0.exe` | `89631f9b51bafbf953182de921fbdba92782b4235790391a3a98394f7d03401d` |

The [safe inventory](windows-phase-5-package-inventory.json) enumerates 349 archive entries (301 files), application bundles and 79 release files with sizes/hashes. Archive paths, bundled sources and surrounding distribution were checked for private backups, credentials, databases, extraction tools, tests, fixtures and source maps. No forbidden entries or known private/source markers were found. Installed and portable runtime inventories also matched the final archive. This bounded inspection cannot prove absence of every unknown secret. Six shipped dependency notices passed verification. Neither a fixture nor a database is bundled.

Both distribution executables have Authenticode status `NotSigned`. The build uses the default Electron icon. Silent install success does not verify the appearance or dismissal of SmartScreen/unknown-publisher warnings; interactive warning review remains open. No signing service was added.

## Commands and regression result

Commands ran individually in PowerShell, checking each exit code before proceeding. `package.json` was inspected first. The shell's initial Node 22/npm 10 was not used for testing. Each npm shell selected the existing local runtime and Windows npm script shell:

```powershell
$env:PATH = "$PWD\work\windows-phase-1\node-v24.15.0-win-x64;$env:PATH"
$env:npm_config_script_shell = $env:ComSpec
```

| Command/procedure | Expected and observed result |
| --- | --- |
| `git status --short --branch`; `git rev-parse HEAD` | Clean entry, fetched branch and code revisions recorded above; exit 0 |
| `node --version`; `npm --version` | v24.15.0 / 11.12.1; exit 0 |
| `npm ci` | Locked install succeeded, 410 packages added, zero reported advisories; exit 0 |
| `npm run test:unit -- tests/unit/sales.test.ts` | 7 passed; exit 0 |
| `npm run test:unit -- tests/unit/decimal-boundaries.test.ts` | 3 passed; exit 0 |
| `npm run test:integration -- tests/integration/sales-reconciliation.test.ts` | Initially 8 passed; final 10 passed after the two new regression cases; exit 0 |
| `npm run typecheck`; `npm run lint` | Both passed before and after the fix; exit 0 each |
| `npm run build`; `npm run package:win` | Final build, x64 NSIS and portable packaging, six dependency notices passed; exit 0 each |
| `npm run test:desktop -- tests/desktop/sales-drilldown.test.ts` | Final two packaged sales journeys passed; exit 0 |
| `npm test` | Final **12 unit, 133 integration, 7 desktop tests passed**; exit 0 |

The desktop runner rebuilt the directory package and launched the actual `release/win-unpacked/Esmer Market Analytics.exe`. Its archive matched the installers above. It did not substitute a development Electron executable. Existing npm transitive deprecation notices, a test-runner `DEP0190` warning and color-environment warning did not fail the checks. Local logs are under ignored `work/windows-phase-5/`, notably `final-full-suite.log`, `final-package-win.log`, `final-typecheck.log` and `final-lint.log`.

Additional local observation helpers are retained under ignored `work/windows-phase-5/`: `prepare.mjs` seeds the synthetic profiles; `lifecycle-proof.mjs baseline`, `lifecycle-proof.mjs upgraded` and `lifecycle-proof.mjs portable` verify the respective already-installed artifacts; `sales-proof.mjs`, `turkish-proof.mjs` and `native-restart.mjs` produce the committed JSON observations; `inspect-release.mjs release work/windows-phase-5/package-inventory.json` inventories the release. Each was invoked with `node` under the runtime above. These helpers are local evidence tooling, unavailable on a clean checkout; the committed tests, fixture generator and procedures below are the repeatable repository checks. Do not rerun the seeder over retained profiles.

## Defect, focused failure and independent review

Review found that included lines retained recorded money strings but lost the original quantity string in report evidence. A source `1.2300` became calculated `1.23`; a return's signed `-1.23` could not disclose its original positive magnitude. The existing contracts require original decimal precision to remain inspectable.

1. `2a1c7f6` (`test(reports)`): sale and return tests failed because `recorded.quantity` was absent, including after replacement imports/pruning. Observed **2 failed, 8 passed**, exit 1, in `quantity-red.log`.
2. `6ca4b4e` (`test(desktop)`): the packaged source panel failed the visible `3,000 / adet` assertion, exit 1, in `quantity-ui-red.log`.
3. `5b21538` (`fix(sales)`): preserve original `line.quantity` in `recorded.quantity` and expose recorded quantity/unit and product/category IDs in technical source details. Calculated signed amounts stay separate. The focused tests and full final suite passed.

No schema, formula, tax mapping, privilege boundary or import behavior changed in this fix. Two independent read-only Standards and Spec reviewers reviewed the Phase 5 changes and the final fix, with no remaining findings. Both used the same model family, so this is independent-context review, not model diversity. The comment review's suggestion to remove the non-obvious precision rationale was declined to preserve useful reasoning and avoid unrelated cleanup.

A final independent evidence review matched the recorded hashes, runtime, fixture, timings and lifecycle outcomes to the JSON and local procedures, finding no actionable overclaims or scope violations. It did not rerun tests.

## Task and gate evidence

All rows use the final application revision/build above and the host above. Expected figures are literal test oracles, not output copied back into an expectation. Links to tests identify reproducible procedures; supporting observations are retained in the JSON and screenshots below.

| Task / gate contribution | Procedure, fixture and expected result | Actual result / limitation |
| --- | --- | --- |
| 5.1 / A02, G01 | [sales tests](../../tests/unit/sales.test.ts): 2×100 less 10% = 180 net, 9 recorded tax, 189 gross; two sales totaling 200 and separate return 50 = net 150, count 2, basket 100 | Passed. Synthetic conventions only; no KKTC tax rule inferred. Recorded tax discrepancy, conversions, voids, unknown meanings and units remain explicit. |
| 5.1 / A02 precision | [decimal tests](../../tests/unit/decimal-boundaries.test.ts), [reconciliation tests](../../tests/integration/sales-reconciliation.test.ts) | Fractional units, large totals/tiny cancellation, explicit rounding and original sale/return quantity strings passed. Piece/kg totals remain separate. |
| 5.2 / A02–A03 | `sales-fixture/sales-1`, September 1–3: net **365**, sale documents **3**, basket **133.33** from 400/3 excluding separately issued -35 return; **11 pieces, 2 kg** | Passed in service, packaged UI and real native-file import. Partial-month coverage disclosed. Water total 100; S002 selected water contribution **60**, whole-document net **130**. |
| 5.2 / A03, A07 | [packaged journeys](../../tests/desktop/sales-drilldown.test.ts): overview → category → product → transaction → receipt → source | Passed; date cutoff, import state, batch, IDs, method and dataset/report context retained. Source identifies synthetic-only evidence. Receipt shows matching and other lines. |
| 5.2 / A03 exclusions | Change S002 header net to 132 while lines total 130; mark S003 line meaning unknown | Passed: discrepancy remains incomplete; excluded contribution is unknown, not zero. Original excluded line amounts remain visible. |
| 5.2 / A03 pinning | [sales proof](windows-phase-5-sales-proof.json): import three changed snapshots while old session remains open, inspect S002 after physical pruning of old source rows | Old context retained net365, selected60, whole130 and batch sales-1. Explicit refresh gave net395, old requests rejected `STALE_CONTEXT`; restart loaded395. DB query found zero old source rows and zero owner-accepted reports created by browsing. |
| 5.2 / A02 coverage | Reconciliation tests: partial previous month/year, absent periods, leap/non-leap February, late-month clamping, full short month, unrounded basket comparisons; unit comparison tests cover nonpositive bases | Passed. Missing coverage is unavailable; valid covered zero remains distinct. Invalid/nonpositive comparison bases do not invent a percentage. |
| Shared / A01, A04, A05, A07 | [startup tests](../../tests/desktop/startup.test.ts), integration boundary/persistence tests | Empty startup, legacy analytics unavailable, import/failure/restart, cancelled/historical outcomes, durable interrupted warnings, migrations and accepted pins passed. Sandbox/context isolation, fixed named operations, no renderer Node, wrong sender/unknown fields/SQL/path rejection preserved. |
| 5.2 / A07 usability | Packaged journeys plus [Turkish search proof](windows-phase-5-turkish-proof.json), actual minimum window and [scale observations](windows-phase-5-sales-proof.json) | `İÇME` matches İçme suyu; `ISLAK` and `ıslak` match Islak mendil, `İSLAK` does not. TRY formatting, keyboard entry/focus restoration, back/close, receipt/source scrolling and blue/green/red presentation checked. No document horizontal overflow in measured sizes. |

## Native picker and lifecycle

The required generator was run with an absent output path after creating its empty parent:

```powershell
node scripts/create-sales-fixture.mjs "$env:TEMP\phase-5-sales-new\.json"
```

Identity `sales-fixture/sales-1`, mapping `synthetic-sales-v1`, 4 documents/7 lines, 3,292 bytes, SHA256 **`bfa0d96459b702013c40b51b4b749a415f7c3d901b7ebabbdbec03df3adcffe2`**. Cutoff 2025-09-03, preparation 2025-09-04, coverage 2025-09-01–03. The primary automated UI fixture differs only by L003 quantity spelling `3.000`; its screenshot dataset ID is `4977a45e4d8ec81118d747a787f64792d78d5894bb1a76ed2c85487a9b75b211`. Warning and replacement fixtures are explicit synthetic mutations in the linked tests.

Real Windows file selection was exercised on the final installed executable, using native automation rather than replacing `dialog.showOpenDialog`: select the generated `.json`, select an invalid synthetic file, then cancel another picker with Escape. Success showed 365/3/133.33. Failure retained365 with `INVALID_PACKAGE`; cancellation retained365 and the unresolved prior-import warning. Two later installed launches and browser-offline reloads retained the same dataset and warning. Automated dialog substitution is additionally used by the repeatable desktop tests; it is not presented as the real-picker proof.

The [lifecycle record](windows-phase-5-lifecycle.json) contains measured outcomes and hashes:

- Installed the retained prior Phase 4 NSIS build into `work/windows-phase-5/nsis-app`, with isolated installer APPDATA. Its installer SHA256 was `fb99997aecd2e91d334d7db5fe19eccd1bfa73be6556ee3eca62b9c175943d9c`; archive `ced2a5d0e57cb1ed1c0d2739a0a8654db13246a6296abc62c9eedae6879d4e14`. Launched twice against a synthetic schema-2 store.
- Seeded one legacy source document/line, exact decimal strings, four app revisions (original/corrected expense, setting, incomplete confirmation), evidence and an accepted report pinned to the original revision. Installed the final NSIS build over it; two launches migrated to schema3 and preserved current and accepted snapshots/output exactly. Legacy sales semantics stayed unavailable. The full suite separately checks adjustment preservation and schema1 migration.
- Launched the actual portable distribution twice against a separate equivalent schema2 profile. Both launches preserved state and accepted output after migration. Process ancestry and running archive hashes were checked. Developer Node/npm were excluded from the child PATH. SQLite integrity was `ok`; databases could be renamed and restored after shutdown.
- Final silent uninstall exited0 and removed the isolated installed executable. Before/after SHA256 hashes of all three closed synthetic profile databases were identical. The profiles were retained. No personal database was removed or tested.

Both builds remain version **0.1.0**: this is a same-version code upgrade on the development host, not a version-number upgrade or clean-machine acceptance. Baseline launch plus upgrade and a later fresh final installation were exercised. Portable software has no installer/uninstaller; its extracted process shutdown was checked and its standalone artifact/profile retained.

The database is `analytics.sqlite` under Electron `app.getPath("userData")`, normally `%APPDATA%/esmer-market-analytics` for both variants; portable does not imply storage beside the executable. These checks explicitly passed `--user-data-dir` for `installed-profile`, `portable-profile` and `native-profile` under `work/windows-phase-5`. Installer APPDATA was separately isolated under `installer-appdata`.

Proof-tool limitations were recorded separately: an initial fixture bundling path and an array-shape assertion were corrected before successful runs; these were not application failures. A native automation call timed out during restart work. An initial uninstall hash comparison had a locked native DB and is inconclusive (`uninstall-inconclusive.json` locally). After confirming all test processes exited, the final installer was reinstalled, both native restarts passed, and uninstall was repeated with stop-on-error hashing; the committed lifecycle result is that successful repeat.

## Windows screenshots

All screenshots show synthetic records from the final packaged Windows executable. Native-dialog screenshots containing unrelated personal file listings were not retained in Git. Images were visually inspected; source panels intentionally scroll.

| State | Evidence |
| --- | --- |
| Monthly overview | [Overview](windows-phase-5-overview.png) |
| Scoped transactions and receipt, 60 versus130 | [Receipt](windows-phase-5-receipt.png) |
| Source IDs, batch, cutoff, method and dataset | [Source](windows-phase-5-source.png) |
| Signed return -35 | [Returns](windows-phase-5-return.png) |
| Header132 / lines130 discrepancy | [Discrepancy](windows-phase-5-discrepancy.png) |
| Excluded source contribution | [Excluded source](windows-phase-5-excluded-source.png) |
| Real native import / cancellation warning | [Imported](windows-phase-5-native-imported.png), [cancelled](windows-phase-5-native-cancelled.png) |
| Actual 680×520 outer window, 100% host scale | [Minimum source panel](windows-phase-5-native-minimum-source.png) |
| Minimum window, forced Chromium150% | [Scale probe](windows-phase-5-scale-1.5-680.png) |

## Performance observations / D18, A07

Same final archive/hardware, September2025, fixture above (3,292 bytes), no search, category `drinks`, product `water`, document `S002`. [Raw observations](windows-phase-5-sales-proof.json) include three fresh process launches and five repeated service round trips per launch. The initial automatic report was visible before the explicitly timed service calls.

| Measurement | Observations | Minimum / median / maximum, ms |
| --- | --- | --- |
| Fresh process launch → visible365 report | 3 | 1384.2 / 1417.3 / 1443.0 |
| Warm open report, renderer IPC await | 15 | 1.2 / 1.7 / 3.7 |
| Warm category query | 15 | 0.8 / 1.2 / 2.7 |
| Warm product query | 15 | 0.7 / 1.1 / 1.7 |
| Warm receipt/source-data query | 15 | 0.4 / 0.6 / 1.2 |

The [rendered journey observations](windows-phase-5-turkish-proof.json) repeat three UI journeys on the same fixture with only the water name changed to `Islak mendil`: category click→visible heading 26.6–56.1ms; product22.8–24.3ms; receipt24.6–33.5ms; source22.5–23.2ms. These include automation scheduling and visibility assertions, not a paint-level benchmark. Service timing excludes rendering. Fresh process does not mean disk-cache-cold; no OS cache flush or reboot was used. **This tiny synthetic sample cannot pass the full imported-data two-second target.** Real/full-volume performance remains open.

## Remaining handoff

Continue on the same branch and PR. All automated evidence is bounded to synthetic data. The Phase5 exit gate remains open for source semantics/reconciliation and the remaining Windows human checks. No broader A02/A03/A07 gate is marked complete.

1. Human physical-disconnect cold launch and same-profile restart for this final Phase5 build remain unperformed. Browser-context offline emulation passed, but networking on the host was not physically disconnected. Prior-phase human reports do not establish this build's result.
2. Actual Windows Settings scale changes (125%/150%, minimum/default window), interactive unsigned-publisher/SmartScreen behavior and subjective usability need a human report. Native100% and forced Chromium100/125/150/200% passed automated probes; forced scale does not verify Windows DPI transitions.
3. On this checkout, disconnect networking and launch the portable with `--user-data-dir="<repo>\work\windows-phase-5\native-profile"`. Expect365/3/133.33 and the retained import-failure warning, then close/reopen. Check category/product→receipt/source and resizing. Reconnect and attribute the result to the person/procedure/build hash above. Do not use a personal profile. The real-picker fixture remains at the TEMP path above and can be selected to clear the warning.
4. Clean-machine/versioned/failed-upgrade, physical power/disk-failure and full release acceptance remain later evidence. Real-source mapping, source-reconciled market figures and full-volume performance require separate authorization/evidence. Costs/profit, expenses UI, Excel, accepted-report review UI, backup/recovery and live integration remain later phases.

The existing [Windows continuation prompt](../operations/windows-phase-5-handoff.md) remains the requested procedure. This record governs what was actually performed. Stop without merging or starting Phase6.

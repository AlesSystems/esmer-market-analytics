# Phase 6 Windows verification

Issue [#9](https://github.com/AlesSystems/esmer-market-analytics/issues/9), existing PR [#20](https://github.com/AlesSystems/esmer-market-analytics/pull/20), branch `codex/phase-6-costs-purchasing`. On 2026-09-20 the user explicitly authorized the Windows continuation, superseding the earlier stop-before-Windows handoff. Stop before merge and Phase 7.

## Starting state and scope

The checkout was clean on `main` at `035dd9734ca0d3aebb3ba3b996fd9d8f6f88ed7e`, with one worktree. `git fetch origin` succeeded. The fetched Phase 6 tip was `014281c11d07752e5dcfedb88bb7945a3b4968e0`; the agent switched to that same branch without overwriting local changes. This includes the macOS-verified application revision `7fe3d69687bc6d48c642adf4cd70141579b7dfd9` and later documentation/fixture-generator commits. PR #20 was open with no comments or reviews. Dependencies #5, #7, and #8 were closed; their outstanding source and acceptance limitations still apply.

All inputs below are generated synthetic records. No source container, private backup, credential, production connection, owner contact, or installation on Eralp's computer was used. Synthetic accepted-report records are migration/provenance sentinels, not owner acceptance or expense-completeness confirmation. Historical last-purchase cost remains estimated.

## Environment and toolchain

Windows 11 Pro 25H2, build 26200.9457, x64, on an HP ZBook Studio 16 inch G9 Mobile Workstation PC. CPU Intel Core i9-12900H, 14 cores and 20 logical processors; RAM 33,974,288,384 bytes. PowerShell 7.6.6.

The default Node was 22.19.0, outside the manifest range `>=24.15.0 <25`. Verification uses the existing bundled Node 24.19.0 with npm 10.9.3. A task-local npm wrapper selects that runtime for npm and child scripts. No dependency or lockfile change was needed. `npm ci` installed 410 packages, audited 411, and reported zero vulnerabilities. Transitive deprecation warnings were retained as tool output.

The first build exited 1 before application compilation because the host npm configuration selected Windows PowerShell 5, which rejected the script's `&&`. Setting process-local `npm_config_script_shell` to `C:\Windows\System32\cmd.exe` resolved this toolchain failure. No application behavior failure is inferred from it.

## Regressions found during verification

Independent review found two provenance navigation gaps. An August report could use a September replacement invoice while omitting its linked dispatch from retained report evidence. A customer-return source panel displayed an original-sale line ID without navigation to the original sale in an earlier month.

Contract commit `df8aeea` adds integration and packaged desktop regressions. The focused integration run produced one failed and four passed tests because evidence contained `P1,S1,S2` but omitted `D1`. Both packaged desktop regressions timed out before the fix. A debug replay confirmed successful application launch, import, and opening `C1`, followed by waiting for the absent original-sale `S1` button. These are application traceability failures, separate from the shell failure above.

Fix commit `bb74a3fb0a1a081784c0ad21527fbd28d0f5fc8d` carries both dispatch/invoice IDs with replacement evidence and makes reverse invoice links and original-sale links navigable within the pinned source panel. Closing a linked panel restores focus to the original opener. Calculations remain in the service. This adds no formula, schema, method-version or dependency change, and no new component or visual-system change. Focused regression reruns passed, followed by the complete suite.

## Build and commands

The final application revision is `bb74a3fb0a1a081784c0ad21527fbd28d0f5fc8d`, version 0.1.0, Windows x64. Subsequent evidence commits do not change application code. The unpacked, installed, and portable processes used the same archive SHA256 below. The final full-suite directory rebuild retained that archive hash.

Each requested command ran separately in PowerShell. Exit codes were checked. The process-local runtime selection described above applies to npm commands. No global Node or npm configuration was changed.

| Command | Exit / actual outcome |
| --- | --- |
| `git status --short --branch` | 0; initially clean `main`, then the requested tracking branch; final application revision ahead by the two regression/fix commits |
| `git rev-parse HEAD` | 0; initial and final application SHAs recorded above |
| `node --version` | 0; default 22.19.0 rejected for verification; selected runtime 24.19.0 |
| `npm --version` | 0; 10.9.3 |
| `npm ci` | 0; locked install, zero reported vulnerabilities |
| `npm run test:unit -- tests/unit/cost-coverage.test.ts tests/unit/return-cost.test.ts tests/unit/purchasing.test.ts` | 0; 10 passed |
| `npm run test:integration -- tests/integration/cost-provenance.test.ts tests/integration/supplier-return.test.ts tests/integration/purchasing-report.test.ts` | 0; 15 passed after the fix |
| `npm run typecheck` | 0 |
| `npm run lint` | 0 |
| `npm run build` | 0 after the shell correction; repeated successfully after the fix |
| `npm run package:win` | 0; portable and NSIS artifacts built |
| `npm test` | 0 at final application revision; 22 unit, 148 integration, 11 packaged Windows desktop tests |

The desktop suite launched `release/win-unpacked/Esmer Market Analytics.exe`. It did not use an Electron development entry point or macOS results. The complete suite includes empty states, unsupported/legacy semantics, narrow IPC sender/payload validation, failed/interrupted imports, precision, migrations, pinned reports, and keyboard source navigation. The desktop dialog-substitution tests are separate from the real picker observations below. Node experimental SQLite/deprecation and colour-environment warnings did not fail the checks.

Packaged runtime observations are Electron 44.3.0, Chromium 152.0.7977.78, Node 24.20.0, SQLite 3.53.4, x64. Development Node 24.19.0 is distinct from the embedded runtime. See [environment](windows-phase-6-environment.json), [packaged observations](windows-phase-6-business-proof.json), and [native observations](windows-phase-6-native-proof.json).

| Final release file | Bytes | SHA256 |
| --- | ---: | --- |
| `Esmer Market Analytics 0.1.0.exe` | 112644615 | `4c02ccd8246934665935e90d266dcbc73d2826e2e36c506c0d98a8d9cf9c6f46` |
| `Esmer Market Analytics Setup 0.1.0.exe` | 112811914 | `dd4d7e2b15f05e1b2f604e31565a685d5dad2348c298a290f7c06fdd92bf7433` |
| `win-unpacked/Esmer Market Analytics.exe` | 246070272 | `f1dcf620565d74405fc49a8d67ca1a0d172da64d0c2173407e529cd850e02787` |
| `win-unpacked/resources/app.asar` | 10366944 | `bab372e4d8cfef9fa869c7ecf564504aab1fb62aebf38721b7f7dd086696bd0d` |

## Tasks 6.1/6.2 and golden cases

The [rerunnable proof procedures](windows-phase-6-tools/README.md) retain the scripts used for this verification. The [golden record](windows-phase-6-golden-proof.json) contains 100 literal expected/actual assertions over 31 canonical synthetic fixture variants, identities, sizes, hashes, method versions, and source hashes. All assertions passed under Windows Node24. These support the synthetic implementation checks, not real-market mappings or owner acceptance.

| Gate | Expected and observed |
| --- | --- |
| G02 / A02 | `L1/S1` covered, `L2/S2` excluded, one each. Sales 100 + 100 give covered sales 100, cost 60, estimated gross 40, margin 40%, absolute-exposure coverage 50%. Excluded cost remains null with `MISSING_COST`; gross 140 is absent. Signed covered/excluded sales and returns remain separate. |
| G02 boundaries / A02 | Invalid zero, unknown/mismatched unit, unknown KDV, negative/missing cost and missing validation exclude unsupported cost. Documented zero participates distinctly. Sale/return cancellation retains covered absolute exposure 200 and total exposure 300 (including the excluded sale), giving 66.67% coverage despite covered net zero. All-zero exposure has no coverage percentage; nonpositive covered sales has no margin. Counts and reasons remain available. |
| G03 / A02 | Three units at historical unit cost 10 retain total 30 when replacement unit price changes 25 to 50; replacement totals change 75 to 150. Units remain explicit, cutoff excludes later prices, and nominal change from 10 to 25 is 150%. Historical correction to 12 stages a new candidate, preserves the active dataset until activation, then produces a new dataset and cost 36. The synthetic accepted output/evidence hash and pinned cost 30 remain unchanged. Confidence stays estimated with the historical-last-purchase method. |
| G04 / A03 | Supported September customer return linked to August sale contributes sales -100 and cost -60. Missing, wrong-product, wrong-unit, wrong-cost, and ambiguous over-return attribution exclude cost, with no latest-purchase fallback. The packaged UI opens the prior-month sale and restores keyboard focus. Customer returns remain separate from supplier returns. |
| G07 / A03 | Linked dispatch/invoice recognize one purchase or supplier-return event using the documented synthetic convention: matching supplier/product/unit/quantity, invoice value and invoice date. Both document IDs remain inspectable, including an out-of-report-period replacement source. Dispatch date alone does not recognize that event. Conflicting flags, missing target, duplicate ownership, mismatched supplier/product/unit/quantity, and missing evidence block or warn the affected population. Physical return alone leaves credit, requested recovery and replacement settlement unknown. Credit without settlement evidence is rejected. |

The packaged [business record](windows-phase-6-business-proof.json) checks product/supplier filtering, historical/replacement labels and scope, negative stock -2, recorded waste 0 with incomplete evidence, and sparse/absent-waste warnings. No stock correction or inference of zero losses occurs. A replacement row spanning an unsupported historical-cost population correctly shows historical cost and nominal comparison unavailable even when its replacement amount is known.

## Dataset pinning, native selection, and presentation

The requested generator ran only after `Test-Path "$env:TEMP\phase-6-business-new.json"` returned false:

```powershell
node scripts/create-business-fixture.mjs "$env:TEMP\phase-6-business-new.json"
```

It exited 0. Identity `business-fixture/business-1`, mapping `synthetic-business-v1`, cutoff 2025-09-30, 4194 bytes, five documents, five lines, one supplier. SHA256 `3499516f34f9ff87b22454bf4412a5b306df01ad04cc27a33135ddd6e360b99b`.

An automated second package changed sale 100 to 110 and purchase price 25 to 50. Both report tabs and source evidence retained the original dataset and method versions while showing the stale-report notice. Explicit refresh changed sales 200 to 210 and covered gross 40 to 50. New context rejected stale sales, purchasing, and evidence requests with `STALE_CONTEXT`. Restart loaded the active new dataset. Browsing created zero accepted reports. Legacy relational and sales packages remained importable; missing Phase 6 semantics stayed unavailable.

The actual installed executable opened the real Windows file chooser, with no `showOpenDialog` substitution. Typing the exact generated temporary path and pressing Enter imported the fixture. Reopening and pressing Escape showed the cancellation notice and retained gross 40. Selecting a fresh invalid synthetic JSON showed “Veri paketi geçersiz. Son geçerli veriler korundu.” and retained the same report. Closing and restarting the installed application retained active sales 200 and gross 40. The [native record](windows-phase-6-native-proof.json) distinguishes these actions from automated dialog substitution. Picker screenshots containing unrelated directory entries were not committed.

Turkish TRY/date presentation, explicit adet/kg units, precision, Enter/Escape navigation, source heading focus, and opener focus restoration passed the packaged checks. Option A colours and components were retained. Host display was 2560×1440 at actual Windows 100%. BrowserWindow minimum is 680×520. Forced Chromium factors 1, 1.25 and 1.5 passed minimum-window geometry and keyboard probes. Fractional-scale Windows rounding produced slightly larger reported window dimensions, recorded in JSON. Tables fitted these fixtures, so horizontal overflow and horizontal scrolling were not exercised. Scroll containers and source panels remained accessible; broader long-content table scrolling remains open.

Actual Windows 125%/150% settings were not changed. The Settings app did not expose a targetable window through the native tool. Forced Chromium factors are not a substitute for those OS checks. Harness attempts initially required overflow on tables that fitted, then required exact window sizes despite fractional rounding. Those assertions were corrected against observed geometry; no app layout defect was established. Native automation also needed keyboard entry after unavailable UIA setters and corrections to two guessed locator names. The successful final observations above supersede those harness failures.

Synthetic screenshots, inspected before commit:

- [Estimates, purchase history, supplier returns, stock and waste warnings](windows-phase-6-business-1-estimates-history-returns-warnings.png).
- [Linked dispatch at minimum size](windows-phase-6-business-1-minimum-source-dispatch.png) and [invoice at forced 125%](windows-phase-6-business-1.25-minimum-source-invoice.png).
- [Forced 150% presentation](windows-phase-6-business-1.5-estimates-history-returns-warnings.png).
- [Stale report](windows-phase-6-business-stale-report.png).
- [Real picker invalid-import result](windows-phase-6-native-failed-import.jpg) and [installed restart](windows-phase-6-native-restart.png).

## Packaging, migration and offline limits

All profiles and installation directories were fresh disposable TEMP paths. The lifecycle root was `%TEMP%\phase-6-lifecycle-5DfP5p`, installation `nsis-app`, profiles `installed-profile` and `portable-profile`. Native selection used `%TEMP%\phase-6-native-VssATn`. Each profile stores `analytics.sqlite`; normal app data is `%APPDATA%\esmer-market-analytics`. The portable executable does not promise storage beside itself. No personal profile or database was removed.

The prior Phase 5 artifact's archive was `e919c3942792516715eb8c83a4c111d990eb114a42493a470b6a0e5c413c0e58`. Its installer SHA256 was `78ad3f71706ac2c6f77c298bcbe6ccf4ae5c6022ddd3823f952de0e4d7911c30`, portable `89631f9b51bafbf953182de921fbdba92782b4235790391a3a98394f7d03401d`. The isolated prior NSIS install started twice. Installing the final NSIS artifact over it exited 0 and started twice. The final portable artifact also started twice, with process ancestry and actual extracted archive verified.

Schema 3 seed data contained source rows, a setting revision, an active adjustment of `0.125000000000000001`, a synthetic accepted-report sentinel, and a later setting revision. Both final artifacts migrated to schema 4, passed SQLite integrity/foreign-key checks and preserved every original-column table hash, source/app history, accepted output/evidence, pins and revisions. New nullable source fields remained null. The active adjustment correctly kept unsupported reporting unavailable. Database rename after shutdown confirmed released file handles. See [seed state and hashes](windows-phase-6-installed-profile-expected.json), [baseline](windows-phase-6-baseline-results.json), [upgrade](windows-phase-6-upgraded-results.json), and [portable](windows-phase-6-portable-results.json).

Silent NSIS uninstall exited 0 and removed the installed executable. The installed, portable, and native-picker databases remained byte-for-byte unchanged, with all three disposable profiles retained. See [uninstall hashes](windows-phase-6-uninstall-proof.json). This proves a same-version 0.1.0 code upgrade and isolated uninstall, not a clean-VM installation, version-number upgrade, failed-upgrade recovery, physical power loss, or disk exhaustion.

Launch/restart and synthetic import ran with child PATH restricted to Windows system directories and no developer Node settings. The Electron artifact supplies its own runtime. Browser-offline reload probes passed, but the host remained physically connected. No Phase 6 physical-disconnect evidence is claimed or inherited from the user's earlier Phase 5 report.

The [release inventory](windows-phase-6-package-inventory.json) covers all 79 current release files and 349 archive entries (301 files), including hashes. The [installed](windows-phase-6-upgraded-inventory.json) and [portable](windows-phase-6-portable-inventory.json) inventories inspect actual runtime payloads. Archive path/content inspection found no private-data sentinels, credentials, source backups, SQLite fixtures, extraction tools, application tests, or source-reader bundles. Third-party React test-utility modules remain within packaged dependencies; this is not a claim that every filename containing test is absent. This is bounded static inspection, not a proof of absence of every possible secret. Financial arithmetic stays in the worker/service; the renderer bundle and tests retain sandbox/context isolation and exact named-operation sender/payload checks. No new dependency or lockfile change, and therefore no new dependency licence obligation. Bundled Electron/Chromium notices remain inventoried. The final command `node scripts/verify-package.mjs release/win-unpacked/resources/app.asar` exited 0 with `PACKAGE_NOTICES_OK 6 dependencies`.

All three final executables are `NotSigned` according to [Authenticode inspection](windows-phase-6-signatures.json). Packaging's signing-related log text does not establish a signature. Silent installation did not provide interactive SmartScreen/unknown-publisher warning evidence; that check remains open.

## Bounded performance observations

Same documented hardware, final packaged archive, synthetic 4194-byte package, September 2025, all products/categories, empty search, all transaction kinds. Three fresh application processes each performed five repeated report-context, sales, purchasing and representative `S1` evidence reads. These are process-cold observations with normal filesystem cache, not a disk-cold benchmark.

| Measurement | Samples | Minimum / median / maximum ms |
| --- | ---: | --- |
| Process start to report | 3 | 1298.01 / 1307.36 / 1346.94 |
| Warm report context | 15 | 1.00 / 1.30 / 7.10 |
| Warm sales | 15 | 0.70 / 1.00 / 1.70 |
| Warm purchasing | 15 | 0.70 / 1.40 / 3.10 |
| Warm source evidence | 15 | 0.30 / 0.40 / 6.60 |

Individual observations and filters are retained in the [business record](windows-phase-6-business-proof.json). Five documents cannot establish the full imported-dataset two-second target.

## Review and handoff

Independent Spec review exposed the two failures before implementation and found no remaining actionable code findings after `bb74a3f`. Independent Standards review also found none. Separate agent contexts used the same available GPT-6 Astra model; this was not cross-model review. The [evidence review](windows-phase-6-independent-evidence-review.md) checked artifact/source hashes, timing counts and limitations. The [Spec review](windows-phase-6-independent-spec-review.md) and [Standards review](windows-phase-6-independent-standards-review.md) preserve their scopes and findings. Final evidence validation parsed 13 JSON records, resolved 86 local links, matched all five archived proof scripts to the executed copies, and rehashed all 79 release files without a mismatch. The [decision record](windows-phase-6-decisions.tsv) records the bounded choices.

The existing PR #20 is the review target. No merge, issue closure, Phase 7 implementation, deployment, source access or owner acceptance is authorized by this record.

## Gates that this work cannot close

Real-source unit, KDV, historical cost, return attribution, conversion, and supplier-settlement semantics remain unvalidated. The synthetic 32 MiB/100,000-row package format does not cover the full historical source dataset. Small-fixture timings cannot pass the full imported-dataset two-second target. Expenses, operating-result implementation, owner completeness confirmation, report-acceptance UI, export, encrypted recovery, and live integration remain later work. This evidence cannot certify all A02, A03, or A07 requirements.

## Remaining Windows checks on 2026-09-21

The user authorized completing the remaining tests and stated, "physical-disconnect testing is successfull". This closes the pending manual physical-disconnect check as a user-reported pass. The agent did not observe that test. The message did not supply an artifact hash or separate launch, import, and restart observations. No such details or owner report acceptance are inferred.

The branch and fetched origin tip were both `2fb25b3b1d26b124f56ee26f54ed1ad1022b3e01`, with a clean checkout and one worktree. This follow-up changes verification scripts and evidence only. The application revision remains `bb74a3fb0a1a081784c0ad21527fbd28d0f5fc8d` and the tested archive hash remains `bab372e4d8cfef9fa869c7ecf564504aab1fb62aebf38721b7f7dd086696bd0d`.

The [follow-up observations](windows-phase-6-remaining-proof.json) retain environment, fixture hashes, raw geometry, input results, the first unsuccessful probe, and installer observations. The same HP host runs Windows 11 Pro 25H2 build 26200.9457. This session's display was 1920×1200 at 125%, unlike the earlier display configuration. Native Windows Settings was accessible. The agent tested actual OS scaling at 125%, 150%, and 100%, then restored the original 125%. No security setting changed. Settings screenshots containing account information were not saved to the repository.

The [layout procedure](windows-phase-6-tools/remaining-layout.mjs) creates fresh temporary profiles and a 29,488-byte synthetic package, `business-fixture/business-long-layout-1`. It contains 36 documents, 36 lines and one supplier, including one long source identifier and 32 purchase history rows. SHA256 is `f4975d373dd04d152d546dbbf098ace184b9cc9e61dc6fa94fa3af3dea59bbd1`. It imports through the normal application request with automated dialog substitution. It launches the packaged Windows executable without a forced Chromium scale flag, and asserts both the Electron display scale and renderer device-pixel ratio.

| A07 check | Expected and actual result |
| --- | --- |
| Actual OS 100%, 125%, 150% | All three runs passed. Each actual display scale and device-pixel ratio matched 1, 1.25, or 1.5. The window was resized to its 680×520 minimum. No document-wide horizontal overflow occurred. |
| Overflowing purchase table | Horizontal wheel input over an observed visible table cell moved `scrollLeft` from 0 to 55, 51.2, and 53.33 respectively. Reverse wheel input returned it to 0 at every scale. |
| Source access and keyboard | Enter opened the long-ID source. The source heading received focus. Escape closed it and restored focus to the opener at all three scales. Programmatic scrolling reached the history row and lower source text. This is not a vertical wheel or drag test. |
| Estimates and warnings | Sales remained 200 TRY and covered estimated gross remained 40 TRY. Negative-stock and sparse-waste warnings remained visible. Turkish dates, quantities and labels were retained. |
| Physical disconnect | User-reported pass on 2026-09-21, separate from connected-host automation. |

The first 125% probe timed out waiting for horizontal movement. That version positioned the pointer from the whole tall table's rectangle, which could be outside the visible row. The revised procedure scrolls a specific row into view, records the element under the pointer, and sends wheel input there. All three runs then passed. This was a verification-script correction, with no established application defect or application change. The source panel itself has horizontal overflow for the long line identifier; the screenshots do not establish that all source text fits without scrolling.

Synthetic screenshots show source access at [100%](windows-phase-6-os-100-source.png), [125%](windows-phase-6-os-125-source.png), and [150%](windows-phase-6-os-150-source.png), plus the [150% overview](windows-phase-6-os-150-overview.png). These are actual Windows scale settings, superseding the earlier forced-scale-only limitation.

The local NSIS installer ran without `/S` into a fresh temporary installation directory. Native UI inspection observed "Installing, please wait...", followed by the empty application screen, "Henüz veri içe aktarılmadı". No unsigned-publisher warning was observed. The local file had no `Zone.Identifier` stream. This completes observation of the local installer path but does not establish downloaded-artifact SmartScreen behavior. No security barrier was bypassed. The installed archive matched the tested hash.

The installer automatically launched the app in `%APPDATA%\esmer-market-analytics`, despite process-local temporary `APPDATA` and `LOCALAPPDATA` values. The empty database was created during this test at 06:28:35 UTC. The agent closed the app without importing data. This is a test-isolation limitation, not evidence of an isolated installer auto-launch. The new empty profile was retained. Silent uninstall from the verified temporary installation path exited 0, removed the test executable, and preserved that database byte-for-byte. No personal data was removed. Future interactive auto-launch isolation requires a disposable Windows account or VM; environment variables alone are insufficient.

The three layout commands, `npm run lint`, and a fresh complete `npm test` each exited 0. The suite passed 22 unit, 148 integration and 11 actual packaged Windows desktop tests. Its Windows build and directory packaging completed. The rebuilt archive and existing portable/NSIS artifact hashes still match the release table above. No application or dependency change required a new distribution build.

An independent same-model context reviewed the procedure, raw results, fixture hashes and screenshots. It found no blocking issue and required the vertical-scrolling and source-overflow limits above. See the [follow-up review](windows-phase-6-remaining-review.md). Real-source acceptance, owner confirmations and full imported-dataset performance remain open. Downloaded-installer trust warnings, clean-VM and version-number upgrade behavior remain unverified. No merge, issue closure, Phase 7 or deployment follows from these results.

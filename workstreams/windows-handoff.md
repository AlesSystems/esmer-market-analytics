# User-run Windows acceptance

The user will run these checks personally. This is a continuation checklist, not evidence of a Windows pass. Freeze the integrated synthetic candidate after #47 and #42 review and merge; record its full commit here before execution. #39/#40 and real financial reconciliation remain separate prerequisites for a real-profit release.

Use a disposable Windows test installation. Do not connect to production, install on Eralp's computer, or point tests at a working business profile. Only synthetic inputs are authorized by this checklist. Keep recovery keys, databases and private inputs outside Git and screenshots.

## Build and automated checks

Use Node 24.15.0 or a compatible locked Node 24 release. Start from a clean checkout of the final integrated candidate and record `git rev-parse HEAD`, Windows edition/build, CPU, RAM, display scaling, Node/npm and Electron versions. Preserve any existing work before switching branches.

Run each command separately in PowerShell and stop on a failure:

```powershell
git status --short --branch
git rev-parse HEAD
node --version
npm --version
Remove-Item Env:ESMER_SQL_TEST_ADMIN, Env:ESMER_SQL_TEST_CONFIG, Env:ESMER_SQL_PREVIEW_PACKAGE, Env:ESMER_SQL_DEV_CONFIG -ErrorAction SilentlyContinue
Remove-Item Env:ESMER_LIFECYCLE_PROFILE, Env:ESMER_LIFECYCLE_REUSE_PHASE8 -ErrorAction SilentlyContinue
npm ci
npm run typecheck
npm run lint
npm run test:unit
npm run test:integration
npm run package:win
$env:ESMER_EXECUTABLE = (Resolve-Path 'release/win-unpacked/Esmer Market Analytics.exe').Path
npm run test:desktop
Get-FileHash 'release/win-unpacked/Esmer Market Analytics.exe' -Algorithm SHA256
Get-FileHash 'release/win-unpacked/resources/app.asar' -Algorithm SHA256
Get-ChildItem release -Filter '*.exe' | Get-FileHash -Algorithm SHA256
```

The environment resets remove inherited source/private-preview inputs and lifecycle overrides from this PowerShell process without printing their values. Keep the resulting source-dependent skips open. Configure a disposable lifecycle override only for its later explicit procedure.

Retain logs, package/license inventories, and every skipped test with its reason. `test:desktop` rebuilds `package:local`, so record hashes after its final run. An NSIS or portable artifact produced earlier is a different distribution until its embedded application content is checked. Tests against `win-unpacked` do not establish installer/portable lifecycle behavior.

The existing Windows full-dataset test covers its stated workload. It does not by itself prove new product-profit aggregation or UI measurements. The #47 exploratory macOS probes also require Windows adaptation or equivalent recorded procedures before their results count here.

## Native and independent checks

1. Install and launch both NSIS and portable distributions in a clean Windows environment without a developer runtime. Record exact artifact and installed application hashes. Verify upgrade, restart and uninstall preserve app-owned records as documented. Use the existing package-lifecycle test's explicit disposable profile mechanism when testing upgrade preservation; never supply the normal owner profile.
2. Physically disconnect networking. Import the approved synthetic package and verify monthly report, daily graph, product search/sort/pages, line evidence, expenses, purchasing, raw records, accepted reports and Excel export remain usable. Live POS access must remain disabled.
3. Run the ten R42 scenarios in [the release plan](esmer-market-release-plan.md#compose-the-one-page-monthly-profit-experience-r42). Include 101 products and 101 evidence lines, delayed month/product responses, hidden versus off-page selection, missing cost, partial month, genuine zero, loss, return-only and unavailable days. Filtering must not change report totals, graph or exported population.
4. Use native open/save/folder/cancel dialogs, Turkish filenames and Excel. Check keyboard-only navigation, visible focus, narrow windows, Windows 100/125/150 percent scaling and 200 percent application zoom. Compare literal UI and workbook values with the approved synthetic oracle, including warnings, cutoff and report identity.
5. Configure encrypted backups with actual Windows OS credential protection. Retain the encrypted backup and recovery key on independent media. Restore on a separate clean account/VM or computer that cannot access the original profile or credential store. Compare accepted v1/v2 reports, exports, expenses, adjustments and settings. A second folder on the original computer alone does not prove machine-loss recovery.
6. Exercise wrong key, tampered backup, unsupported snapshot, missing/removable media, read-only destinations, storage exhaustion and interrupted restore against disposable data. Verify the last working dataset and accepted reports remain usable. Inspect Windows temporary-file and rollback ACLs. Follow the detailed [recovery continuation](../docs/operations/windows-phase-9-handoff.md#complete-platform-implementation-and-proof), using the current candidate rather than its historical branch instructions.
7. Record five interleaved baseline/candidate observations on the same host and fixture, with cold/warm conditions stated. Ordinary dashboard and drill-down interactions must stay below two seconds. Record import/calculation/export/recovery separately, including progress, cancellation, memory and disk use. Use #47's 25,000-document synthetic workload for its local engineering ceilings; real-market capacity remains unproven until an authorized admitted dataset exists.
8. Inspect release contents and startup traffic. No source backup, secret, identifying record, test profile or task-local probe may ship. Preserve package/license inventory and unsigned-build warning evidence.

## Return evidence

For each check record gate/task ID, commit, executable and archive hashes, fixture identity/hash, environment, exact procedure, literal expected and actual result, evidence location and limitations. Return sanitized logs and screenshots; never return a recovery key or database.

Use [A01–A07](../docs/superpowers/specs/2026-09-04-esmer-market-rebuild-acceptance.md) as the acceptance matrix. Mark a row passed only when the required current-build evidence exists. SQL skips, absent real semantics and absent real-population reconciliation remain open. Passing synthetic Windows checks does not close #39, #40, #41 or #43 by itself.

# Repeat the Phase 8 packaged checks

These scripts support [the Windows evidence](../windows-phase-8.md). They are not shipped application files. Use only disposable profiles and synthetic files.

## Prepare the fixtures

Preserve existing `work/windows-phase-8` evidence. Copy `prepare.mjs` into that directory and run it with Node 24. It builds `api.mjs` and refuses to overwrite existing fixtures.

```powershell
node work/windows-phase-8/prepare.mjs
```

The native fixtures contain two sales of 100, one supported historical cost of 60, and a separate expense of 50. The correction package deletes the second sale. Product labels exercise Turkish letters and formula-like text. These records are synthetic.

## Exercise packaged reporting

Use the repository's locked Node 24 dependencies and a freshly built Windows package. Copy `packaged-proof.mjs` into `work/windows-phase-8`, beside the generated `api.mjs` fixture bundle. The bundle must export `openStore`, `Expenses`, `businessPackage`, `businessRecords`, `workbook` and `row` from the current branch. Do not run desktop tests, installers or native keyboard automation concurrently with this script.

Set the real Windows display scale before each invocation. Record the original setting and restore it afterward. The script checks Electron's observed scale and never overrides Chromium's scale.

```powershell
node work/windows-phase-8/packaged-proof.mjs 1
node work/windows-phase-8/packaged-proof.mjs 1.25
node work/windows-phase-8/packaged-proof.mjs 1.5
```

Each invocation creates a unique directory under `work/windows-phase-8` and retains its disposable profile, synthetic fixtures, workbook, screenshots and JSON evidence. `proof.json` records the checked commit, archive and fixture hashes, literal financial assertions, actual scale, repeated process-start and warm report/drill timings, shutdown durations, cancellation latency and large-fixture retry durations. Process memory after calculation is a snapshot, not a peak measurement. A failed run records the failure and exits nonzero. Keep raw profiles and workbooks outside Git.

The review journey saves sales 200 with covered cost 60, estimated covered gross 40, expense 50 and unavailable operating profit. Three process restarts preserve the accepted object. A source correction to 120, deleted source line and expense correction to 60 leave the saved values and Turkish evidence unchanged. The export probe pauses a substituted save dialog, refreshes source data, and then asserts original identity and metadata on every worksheet plus the original literal totals. Open and save dialog results are substituted. Native save/cancel/overwrite/failure and spreadsheet application compatibility require separate evidence.

The cancellation probe uses 25,000 documents and 25,000 lines. It times navigation and import cancellation, verifies preservation, retries the import, cancels monthly calculation and retries calculation. A job that completes before cancellation fails the probe instead of claiming measured cancellation. Increase the explicit synthetic fixture only after recording such a result. These timings do not establish the full imported-dataset performance gate. Cold timing means a new application process with ordinary filesystem caching, not a cleared OS cache.

The script captures overview, report-history and minimum-window viewport screenshots alongside a full-page image. At the minimum window it records comparison-table dimensions, tests horizontal wheel scrolling when the table overflows, and asserts that Enter opens focused retained evidence. The probe pages through comparison rows when the expense change appears after the first 100 differences. Installer lifecycle, physical disconnection, native spreadsheet use and publisher prompts are outside this script.

## Verify native export and Excel

Launch the packaged app with a fresh explicit `--user-data-dir` under the work directory. Use the real native open dialog to import `sentetik-İşçilik/sentetik-satış.json`. Review and save the monthly report with a synthetic reason. Retain the selected report as `native-selected.json` through the named `readReportVersion` operation.

Cancel the real save dialog and check `Excel kaydı iptal edildi.`. Open it again. While it remains open, invoke the existing import operation with the correction package, substituting only the import picker. Save as `sentetik-İşçilik/Seçili-İşçilik-Çığ.xlsx`. Check every worksheet's identity and literal net 200, cost 60 and covered gross 40. The save dialog is real; concurrent import selection is a test substitution.

Repeat export to the same disposable destination and observe native overwrite confirmation. Open the result in installed Microsoft Excel. Record its version and any repair warning. Use Excel's native Save As to create `sentetik-İşçilik/Excel-kaydedildi-Çığ.xlsx`, then close Excel.

```powershell
node docs/evidence/windows-phase-8-tools/verify-native.mjs
```

The verifier compares every sheet's values and types, checks identity/cutoff and independent totals, and rejects generated formulas. It cannot prove that Excel was used. Keep the native procedure and version with its output. Raw workbooks remain outside Git because Excel may add local author metadata.

For the separate precision compatibility probe, run `node docs/evidence/windows-phase-8-tools/native-precision.mjs create`. This deliberately substitutes two synthetic quantities in a copy of the selected report. It does not change the stored report or demonstrate fixture reconciliation. Open `sentetik-İşçilik/Hassasiyet-Çığ.xlsx` in installed Excel and use native Save As to create `Excel-hassasiyet-Çığ.xlsx` in the same folder. Close Excel and run `node docs/evidence/windows-phase-8-tools/native-precision.mjs verify`. The verifier requires exact text `0.125000000000000001` and `12345678901234567890.123456789`, plus equal values and types across all sheets.

For native save failure, copy the verified export to a disposable `Kilitli-Çığ.xlsx`. Hold that copy open with a .NET `FileStream` using `FileAccess.ReadWrite` and `FileShare.ReadWrite`, which denies delete sharing. Export the selected report through the native save/overwrite dialogs to that copy. Expect a failure message, unchanged destination SHA-256 and unchanged selected report object. Release the handle in `finally`, then repeat the native save. Expect success and equal worksheet values/types. Retain the result as `native-save-failure.json`. Never lock an owner's workbook.

## Verify isolated installation preservation

Preserve the Phase 7 installer as `work/windows-phase-8/prior-setup.exe` before rebuilding. The script checks its expected hash. Copy `lifecycle-proof.mjs`, `lifecycle.ps1` and `lifecycle-registration.ps1` into the work directory. Close all app instances. Run each stage separately and check its exit code.

```powershell
node work/windows-phase-8/lifecycle-proof.mjs prepare
pwsh -NoProfile -File work/windows-phase-8/lifecycle.ps1 install-prior
node work/windows-phase-8/lifecycle-proof.mjs baseline
pwsh -NoProfile -File work/windows-phase-8/lifecycle.ps1 upgrade
node work/windows-phase-8/lifecycle-proof.mjs upgraded
node work/windows-phase-8/lifecycle-proof.mjs seed
node work/windows-phase-8/lifecycle-proof.mjs installed
node work/windows-phase-8/lifecycle-proof.mjs portable
pwsh -NoProfile -File work/windows-phase-8/lifecycle.ps1 reinstall
node work/windows-phase-8/lifecycle-proof.mjs reinstalled
```

`prepare` and `seed` refuse existing evidence. The profile contains expense imports, corrections, reversal/restoration, synthetic completeness and accepted output. After upgrade, `seed` adds an accepted monthly report. Its independent oracle is gross 40 less expense 50, yielding estimated operating result -10.

Each executable stage runs twice and compares schema 5, app revisions, expense batches, accepted output and pinned facts. The installer uses an isolated directory and process-local APPDATA. APPDATA is not a sandbox. NSIS still uses the real user/machine registry, shortcuts and local installer cache. The registry preflight reads both views of HKCU/HKLM for this app's locked-builder identity. Fresh install refuses any existing registration; subsequent stages permit only the exact disposable installation and uninstaller. Do not bypass a refusal or remove an unrelated registration to make the test pass. Uninstall must preserve the explicit profile's database hash. This does not establish default-profile removal behavior or a separate clean Windows account.

Run `pwsh -NoProfile -File docs/evidence/windows-phase-8-tools/lifecycle-registration.test.ps1` to verify empty and isolated registrations plus refusals for unrelated paths, malformed/empty records, and a fresh install over existing registration. It uses in-memory records and invokes no installer or registry write.

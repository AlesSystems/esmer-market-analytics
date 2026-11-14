# Windows v1 build and smoke test (operator handoff)

For Altan, on his own Windows machine. The [11 November Windows 11 receipt](../evidence/2026-11-11-windows-v1-smoke.md) records the A07 v1 smoke journey for [#109](https://github.com/AlesSystems/esmer-market-analytics/issues/109). This procedure repeats those checks for another build or Windows configuration. It supersedes the per-phase handoffs ([Phase 1](windows-phase-1-handoff.md) to [Phase 9](windows-phase-9-handoff.md)), which stay as history.

For the separately directed supervised offline owner review, use the [14 November delivery](eralp-offline-delivery.md) and [Turkish acceptance checklist](reveal-tr.md). They identify the retained main `3520ce0` artifacts; no rebuild or developer tools are needed on Eralp's computer. His Windows version remains a pre-installation check. This document remains the developer procedure for additional platform/build validation.

PR #137 merged. [Current main Windows CI](https://github.com/AlesSystems/esmer-market-analytics/actions/runs/42807839845) passed on 2026-11-10 at `7f5020c`, app version **1.0.1**. Local Windows 11 checks on 2026-11-11 passed 185 unit, 302 integration and 68 packaged desktop tests, plus native dialogs, Excel, 125% and 150% scaling, persistence, same-machine recovery and uninstall. Optional skips and the exact artifacts are in the receipt.

The repeat-build source below includes the test portability fixes and the updated bundled limitations. The older `v1.0.1` tag points to `f23b11e` and predates the Windows fixes. Version 1.0.1 alone does not identify a tested build. Use the receipt's hashes for the delivered files. The workflow now retains verified executables and both inspection manifests for 14 days in `windows-distributions-<commit>`. It does not publish a release or move the tag.

Read `AGENTS.md` first. Use synthetic data only. This handoff does not authorize production source access or installing on the owner's PC; both need Eralp's separate permission ([issue #110](https://github.com/AlesSystems/esmer-market-analytics/issues/110)). Never put credentials, real customer data or backup details in Git or screenshots.

## Prerequisites

- Windows 10 or 11, x64.
- Node `>=24.15.0 <25` (`package.json` engines) and npm 11.
- Git.
- A clean test machine or user account if possible. The NSIS installer changes real registry entries and shortcuts, so do not run it next to a personal install of the same app.

```powershell
node --version
npm --version
git --version
```

## Build

Run separately in PowerShell. The commands rebuild the locally tested delivery source for the native walkthrough. Stop at the first failure and record it. For a later build, record its exact commit and repeat the automated checks before claiming acceptance.

```powershell
git clone https://github.com/AlesSystems/esmer-market-analytics.git
Set-Location esmer-market-analytics
git fetch --tags
git checkout --detach a4c325234dc2c4526287e5e5fe22b3b15368491a
git rev-parse HEAD
npm ci
npm run typecheck
npm run lint
npm run test:unit
npm run test:integration
$env:npm_config_script_shell = "$env:SystemRoot\System32\cmd.exe"
npm run package:win
```

`npm run package:win` runs, in order:

1. `npm run build` (esbuild into `dist/`).
2. `electron-builder --win nsis portable --x64 --publish never`, which writes the installer, the portable exe and `release/win-unpacked/` without publication.
3. `scripts/verify-package.mjs` on `release/win-unpacked/resources/app.asar`.
4. `tools/release-inventory.ts`, which inventories `release/win-unpacked` into `release/release-inventory.json` and fails on prohibited files (databases, backups, spreadsheets, credentials, key material).
5. `scripts/verify-distributions.mjs`, which unpacks the installer and the portable exe with 7-Zip, checks that both payloads equal the inspected `win-unpacked` files, and writes `release/distribution-inspection.json`. It prints `DISTRIBUTIONS_MATCH_INSPECTED_PAYLOAD` on success.

Output in `release/` (`<version>` is the `package.json` version, expected `1.0.1`):

- `Esmer Market Analytics Setup <version>.exe` (NSIS installer)
- `Esmer Market Analytics <version>.exe` (portable)
- `win-unpacked/` (unpacked app, `Esmer Market Analytics.exe`)
- `release-inventory.json`
- `distribution-inspection.json` (size and SHA-256 of both executables plus the container files)

No separate SHA256 sums file is produced. Take the hashes from `distribution-inspection.json`, and confirm them yourself:

```powershell
Get-FileHash -Algorithm SHA256 'release\Esmer Market Analytics Setup 1.0.1.exe', 'release\Esmer Market Analytics 1.0.1.exe'
```

## Required: packaged desktop tests

Run this after `npm run package:win` to verify the local artifact before the manual walkthrough. Playwright tests against the unpacked build. The CI step sets `ESMER_EXECUTABLE` exactly like this:

```powershell
$env:ESMER_EXECUTABLE = Join-Path (Get-Location) 'release/win-unpacked/Esmer Market Analytics.exe'
npm exec -- playwright test
```

`npm run test:desktop` instead rebuilds with `package:local` and tests that host build; use the command above for the Windows package.

## Smoke test (manual)

Tick each item and note anything odd. Use the synthetic data below only.

1. Install: run the NSIS installer in a disposable test account or with the guarded isolation described in the receipt. The build is unsigned, so Windows may show a publisher warning. A locally built installer may show none. Record the actual observation. Finish the install and launch the app.
2. Make a synthetic estimate package. The monthly tool needs a SQL source, so use the test fixture instead. From the repo root:

   ```powershell
   New-Item -ItemType Directory -Force work\v1-smoke | Out-Null
   node tools\make-synthetic-estimate.ts work\v1-smoke\synthetic-estimate.json
   ```

   `work/` is git-ignored. Do not commit the package.
3. Open the gear menu, select "Veri paketi içe aktar" and choose `synthetic-estimate.json` through the native picker. Expect "Gerçek kaynak kayıtları içe aktarıldı." The generated fixture is synthetic despite this generic success text.
4. Bu ay: the month figures and the trust chip load, no error text. Net profit is not shown until the month's expenses are marked complete (step 7).
5. Ürünler: the product list loads. Open a product card, then Kaynak satırlar; rows appear (Satış documents only).
6. Giderler: "Şablonu indir", fill the template with synthetic expenses, "Excel’den içe aktar". Expect the rows listed.
7. Giderler: "Bu ayın giderleri tamam" and confirm.
8. Bu ay again: net profit now appears.
9. Use "Excel’e aktar" in the header, save through the native dialog and open the file in Excel. Compare the figures, period, method and exclusions with Bu ay. Save a copy in Excel and compare worksheet values and cell types.
10. Open the gear menu. Check package import, "Yedekle / Geri yükle", text-size controls, "Canlı bağlantı", "Kaynak belgeler" and "Hakkında ve bilinen sınırlar". Check the limitations against [known-limitations-tr.md](known-limitations-tr.md). The app has three tabs, Bu ay, Ürünler and Giderler. Export is in the header. Leave the live connection disabled.
11. Display scaling: repeat a pass of steps 4 to 10 at Windows scaling 125 % and 150 % (Settings > System > Display). Look for clipped text, overlapping controls, unreachable buttons.
12. Backup and restore ([recovery-tr.md](recovery-tr.md)): choose distinct backup and key locations outside the app profile and confirm "Son doğrulanan yedek". Restore into a fresh test profile through the native dialogs. Check expenses, completeness, monthly figures and Excel values. Uninstall normally preserves the existing profile, so uninstall/reinstall alone does not create a fresh state. Record whether files are on independent media. A06's v1 scope is encrypted backup plus documented restore under [#98](../decisions/issue-98-profit-first-estimate-edition.md). Separate-machine and independent-media proof remain post-v1 in [#138](https://github.com/AlesSystems/esmer-market-analytics/issues/138).
13. Close and reopen. Launch the portable exe sequentially with the same explicit synthetic `--user-data-dir` and confirm that it shows the same data. For normal owner use, both variants share `%APPDATA%\esmer-market-analytics`; do not use that personal folder for this test.
14. Uninstall from Settings > Apps. Confirm the app is gone. The data folder normally stays; delete it only on your own test account.

The two-second benchmark is conditional on prepared packages exceeding 100,000 rows under #98. Packages currently cap at 100,000 rows and 32 MiB. This walkthrough records no full-dataset performance pass. If the cap changes beyond that threshold, measure the four pages on documented Windows hardware with dataset size and cold and warm timings.

Owner installation, Eralp's acceptance and permission for the specific production source and historical-cost column remain separately directed. The restored-backup mock-live demo does not pass production L01. Keep the connection disabled for this synthetic smoke test.

## Record the result

Write a new file `docs/evidence/<date>-windows-v1-smoke.md` (do not overwrite older evidence) with:

- Commit SHA (`git rev-parse HEAD`), app version and tag if applicable. Do not label a later 1.0.1 build as the older `v1.0.1` tag.
- Windows edition and build, CPU, RAM, display scaling tested, Node and npm versions.
- Every command above with pass or fail, and the final `DISTRIBUTIONS_MATCH_INSPECTED_PAYLOAD` line.
- SHA-256 of the installer and the portable exe, and the `release-inventory.json` and `distribution-inspection.json` hashes.
- The smoke checklist with pass or fail per step and notes.
- Screenshots (synthetic data only; no key files, no paths revealing personal data).
- What was not tested (live SQL, production source, owner install).

Commit the file as `docs: record Windows v1 smoke acceptance` and open a PR. Mark A07 passed only for the tested build and Windows configuration. If a check fails or is skipped, record it and keep that acceptance open. GitHub issue closure alone supplies no proof. Keep separate-machine recovery, production access and owner acceptance open until their own evidence exists.

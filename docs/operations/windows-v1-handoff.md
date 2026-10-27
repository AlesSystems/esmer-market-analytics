# Windows v1 build and smoke test (operator handoff)

For Altan, on his own Windows machine. This records the remaining A07 Windows smoke acceptance associated with [#109](https://github.com/AlesSystems/esmer-market-analytics/issues/109). That issue is closed, but no current manual acceptance receipt is recorded. This handoff supersedes the per-phase handoffs ([Phase 1](windows-phase-1-handoff.md) to [Phase 9](windows-phase-9-handoff.md)), which stay as history.

On 2026-10-27, [Windows CI passed](../evidence/2026-10-27-windows-ci.md) on main `6c11ed44510aa8b687f1279e01b220711a738185`, app version **1.0.1**. It built and inspected NSIS and portable distributions and passed 48 packaged desktop tests on Windows Server 2025. The billing block is no longer current. CI did not perform the manual installer, native display-scaling or uninstall walkthrough on Windows 10 or 11.

Use that exact commit below. The older `v1.0.1` tag points to `f23b11e` and predates the Windows fixes. Version 1.0.1 alone does not identify the tested build. CI retained test evidence and the unpacked inventory for 14 days, but did not retain the executables or publish a new release.

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

Run separately in PowerShell. The commands rebuild the CI-tested commit for the manual walkthrough. Stop at the first failure and record it. For a later build, record its exact commit and repeat the automated checks before claiming acceptance.

```powershell
git clone https://github.com/AlesSystems/esmer-market-analytics.git
Set-Location esmer-market-analytics
git fetch --tags
git checkout --detach 6c11ed44510aa8b687f1279e01b220711a738185
git rev-parse HEAD
npm ci
npm run typecheck
npm run lint
npm run test:unit
npm run test:integration
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

1. Install: run the NSIS installer. Expect an unsigned-publisher warning (SmartScreen, "Unknown publisher"); this is accepted for v1 ([known limitations](known-limitations-tr.md)). Finish the install and launch the app.
2. Make a synthetic estimate package. The monthly tool needs a SQL source, so use the test fixture instead. From the repo root:

   ```powershell
   New-Item -ItemType Directory -Force work\v1-smoke | Out-Null
   node tools\make-synthetic-estimate.ts work\v1-smoke\synthetic-estimate.json
   ```

   `work/` is git-ignored. Do not commit the package.
3. Ayarlar > Veri paketi: "Veri paketi içe aktar", choose `synthetic-estimate.json`. Expect "Gerçek kaynak kayıtları içe aktarıldı."
4. Bu ay: the month figures and the trust chip load, no error text. Net profit is not shown until the month's expenses are marked complete (step 7).
5. Ürünler: the product list loads. Open a product card, then Kaynak satırlar; rows appear (Satış documents only).
6. Giderler: "Şablonu indir", fill the template with synthetic expenses, "Excel’den içe aktar". Expect the rows listed.
7. Giderler: "Bu ayın giderleri tamam" and confirm.
8. Bu ay again: net profit now appears.
9. Rapor ve Excel: "Excel’e aktar", save the file, open it in Excel; figures match Bu ay.
10. Ayarlar: five tiles (Veri paketi, Yedekleme ve kurtarma, Görünüm, Canlı bağlantı, Hakkında). Open Hakkında and check the "Bilinen sınırlar" list matches [known-limitations-tr.md](known-limitations-tr.md). Leave Canlı bağlantı off; it needs a SQL source and is out of scope for this test.
11. Display scaling: repeat a pass of steps 4 to 10 at Windows scaling 125 % and 150 % (Settings > System > Display). Look for clipped text, overlapping controls, unreachable buttons.
12. Backup and restore ([recovery-tr.md](recovery-tr.md)): set up backup to a folder on a separate disk or USB stick, save the key file elsewhere, confirm "Son doğrulanan yedek". Then restore into a fresh state (uninstall and reinstall, or a second Windows user) and check expenses and the complete mark returned. CI already passed a same-runner fresh-profile restore. Record this manual result separately. A06's v1 scope is an encrypted backup plus documented restore under [#98](../decisions/issue-98-profit-first-estimate-edition.md); a separate clean-machine loss exercise remains post-v1.
13. Close and reopen: data persists. Optionally launch the portable exe and confirm it shows the same data (same `%APPDATA%\esmer-market-analytics`).
14. Uninstall from Settings > Apps. Confirm the app is gone. The data folder normally stays; delete it only on your own test account.

The two-second benchmark is conditional on prepared packages exceeding 100,000 rows under #98. Packages currently cap at 100,000 rows and 32 MiB. This walkthrough records no full-dataset performance pass. If the cap changes beyond that threshold, measure the four pages on documented Windows hardware with dataset size and cold and warm timings.

Owner installation, Eralp's acceptance and permission for the specific production source and historical-cost column remain separately directed. The restored-backup mock-live demo does not pass production L01. Keep the connection disabled for this synthetic smoke test.

## Record the result

Write a new file `docs/evidence/<date>-windows-v1-smoke.md` (do not overwrite older evidence) with:

- Commit SHA (`git rev-parse HEAD`), app version and tag if applicable. Do not label `6c11ed4` as the `v1.0.1` tag.
- Windows edition and build, CPU, RAM, display scaling tested, Node and npm versions.
- Every command above with pass or fail, and the final `DISTRIBUTIONS_MATCH_INSPECTED_PAYLOAD` line.
- SHA-256 of the installer and the portable exe, and the `release-inventory.json` and `distribution-inspection.json` hashes.
- The smoke checklist with pass or fail per step and notes.
- Screenshots (synthetic data only; no key files, no paths revealing personal data).
- What was not tested (live SQL, production source, owner install).

Commit the file as `docs: record Windows v1 smoke acceptance` and open a PR. Mark A07 smoke acceptance passed only when the required manual checks have a passing receipt. Update the row "Windows elle kullanım kabulü bekliyor" in [known-limitations-tr.md](known-limitations-tr.md) only after that acceptance. If a check fails or is skipped, record it and keep the applicable acceptance open. GitHub issue closure alone supplies no proof. Keep separate-machine recovery, production access and owner acceptance open until their own evidence exists.

# Windows v1 build and smoke test (operator handoff)

For: Altan, on his own Windows machine. This closes [issue #109](https://github.com/AlesSystems/esmer-market-analytics/issues/109) (A07: one Windows smoke test). It supersedes the per-phase handoffs ([Phase 1](windows-phase-1-handoff.md) to [Phase 9](windows-phase-9-handoff.md)), which stay as history.

Why here: Windows CI is blocked by GitHub billing before it runs, and `npm run package:win` fails on an Apple Silicon Mac at NSIS (error -86). Only a result from a real Windows host counts as Windows acceptance.

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

Run separately in PowerShell. Replace `v1.0.0` with the release tag or commit you were given. The v1.0.0 tag points at the merge commit of the release PR on main. Stop at the first failure and record it.

```powershell
git clone https://github.com/AlesSystems/esmer-market-analytics.git
Set-Location esmer-market-analytics
git fetch --tags
git checkout v1.0.0
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
2. `electron-builder --win nsis portable --x64`, which writes the installer, the portable exe and `release/win-unpacked/`.
3. `scripts/verify-package.mjs` on `release/win-unpacked/resources/app.asar`.
4. `tools/release-inventory.ts`, which inventories `release/win-unpacked` into `release/release-inventory.json` and fails on prohibited files (databases, backups, spreadsheets, credentials, key material).
5. `scripts/verify-distributions.mjs`, which unpacks the installer and the portable exe with 7-Zip, checks that both payloads equal the inspected `win-unpacked` files, and writes `release/distribution-inspection.json`. It prints `DISTRIBUTIONS_MATCH_INSPECTED_PAYLOAD` on success.

Output in `release/` (`<version>` is the `package.json` version, expected `1.0.0`):

- `Esmer Market Analytics Setup <version>.exe` (NSIS installer)
- `Esmer Market Analytics <version>.exe` (portable)
- `win-unpacked/` (unpacked app, `Esmer Market Analytics.exe`)
- `release-inventory.json`
- `distribution-inspection.json` (size and SHA-256 of both executables plus the container files)

No separate SHA256 sums file is produced. Take the hashes from `distribution-inspection.json`, and confirm them yourself:

```powershell
Get-FileHash -Algorithm SHA256 'release\Esmer Market Analytics Setup 1.0.0.exe', 'release\Esmer Market Analytics 1.0.0.exe'
```

## Required: packaged desktop tests

Run this after `npm run package:win`; it is required for closing #109. Playwright tests against the unpacked build. The CI step sets `ESMER_EXECUTABLE` exactly like this:

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
12. Backup and restore ([recovery-tr.md](recovery-tr.md)): set up backup to a folder on a separate disk or USB stick, save the key file elsewhere, confirm "Son doğrulanan yedek". Then restore into a fresh state (uninstall and reinstall, or a second Windows user) and check expenses and the complete mark returned.
13. Close and reopen: data persists. Optionally launch the portable exe and confirm it shows the same data (same `%APPDATA%\esmer-market-analytics`).
14. Uninstall from Settings > Apps. Confirm the app is gone. The data folder normally stays; delete it only on your own test account.

## Record the result

Write a new file `docs/evidence/<date>-windows-v1-smoke.md` (do not overwrite older evidence) with:

- Commit SHA (`git rev-parse HEAD`) and tag.
- Windows edition and build, CPU, RAM, display scaling tested, Node and npm versions.
- Every command above with pass or fail, and the final `DISTRIBUTIONS_MATCH_INSPECTED_PAYLOAD` line.
- SHA-256 of the installer and the portable exe, and the `release-inventory.json` and `distribution-inspection.json` hashes.
- The smoke checklist with pass or fail per step and notes.
- Screenshots (synthetic data only; no key files, no paths revealing personal data).
- What was not tested (live SQL, production source, owner install).

Commit the file as `docs: Windows v1 smoke-test receipt`, open a PR, and close [#109](https://github.com/AlesSystems/esmer-market-analytics/issues/109) only if every step passed. After a passing smoke test, update the row "Windows derlemesi ve duman testi bekliyor" in [known-limitations-tr.md](known-limitations-tr.md) from `açık` to `düzeltildi`. The row "Windows CI çalışmıyor" stays `açık`. If a step fails, leave #109 open and record the failure.

# Repeat the Phase 7 Windows checks

These scripts support the [Windows evidence](../windows-phase-7.md). They use synthetic inputs and the repository's locked development dependencies. They are not shipped application files.

Use Node 24 in the manifest range. Run `npm ci`, the commands in the [handoff](../../operations/windows-phase-7-handoff.md), and `npm run package:win`. Run commands separately and check every exit code. Do not run desktop automation concurrently with native keyboard interaction or an installer.

## Prepare synthetic workbooks

Use a fresh checkout or preserve the existing `work/windows-phase-7` directory before this procedure. Never reuse a personal app profile. Create `work/windows-phase-7` and copy the three `.mjs` scripts from this directory into it. The scripts import a generated local `api.mjs` bundle.

```powershell
node work/windows-phase-7/prepare.mjs
```

The generator refuses to overwrite fixture files. It writes the canonical empty template, a populated Turkish synthetic workbook and one sales package under `work/windows-phase-7/sentetik-İşçilik`. The sales package explicitly encodes net 300 and historical cost 100, giving the independent gross oracle 200. The January expense is 50 and the separate owner contribution is 500. March rows exercise text and native numeric/date cells.

Open `excel-girdi.xlsx` in installed Microsoft Excel. Save As `excel-kaydedildi.xlsx` in the same folder. Keep the original for byte and value comparison. Record Excel's version and the saved file's SHA256. Never replace this step with another workbook library and call it native Excel proof.

## Check the actual packaged UI and OS scale

Set the real display scale in Windows Settings before each invocation. The script asserts Electron's observed factor and does not set a Chromium override. Record and restore the original setting.

```powershell
node work/windows-phase-7/packaged-proof.mjs 1
node work/windows-phase-7/packaged-proof.mjs 1.25
node work/windows-phase-7/packaged-proof.mjs 1.5
```

Each run creates a fresh disposable profile, checks a long-content duplicate preview, scrolls horizontally, opens correction with Enter, checks the literal 150 result and completeness revocation, then restarts and verifies unchanged history and duplicate import. It writes JSON and screenshots into the work directory. Dialog results are substituted in this script. Real Windows open/save/cancellation must be checked separately.

## Check isolated installation and preservation

Retain the prior Phase 6 installer before rebuilding. Its hash must match `dd4d7e2b15f05e1b2f604e31565a685d5dad2348c298a290f7c06fdd92bf7433`. The lifecycle script checks its archive against the Phase 6 evidence. Close all Esmer app instances before running an installer, including unpacked test instances.

Create `work/windows-phase-7/lifecycle`. Use a resolved absolute install path beneath it, ending in `installed`. Use process-local `APPDATA` under this same root for installer bookkeeping. Do not rely on APPDATA to isolate Electron's default profile. Every launch below supplies `--user-data-dir` explicitly.

Install the prior NSIS executable with `/S` and `/D=<absolute isolated install path>`, using `Start-Process -WindowStyle Hidden -Wait -PassThru`. Check exit 0. Then run separately:

```powershell
node work/windows-phase-7/lifecycle-proof.mjs prepare
node work/windows-phase-7/lifecycle-proof.mjs baseline
```

Install the final NSIS executable into the same isolated directory with the same flags and check exit 0. Run:

```powershell
node work/windows-phase-7/lifecycle-proof.mjs upgraded
node work/windows-phase-7/lifecycle-proof.mjs seed
node work/windows-phase-7/lifecycle-proof.mjs installed
node work/windows-phase-7/lifecycle-proof.mjs portable
```

`prepare` and `seed` refuse existing profile directories. The legacy profile checks schema 4 to 5 migration. The expense profile contains one imported batch, a synthetic accepted 150 result, reversal/restoration and stale completeness. Each launch stage checks snapshots, accepted output and pinned evidence twice. The child PATH excludes development runtimes. Network blocking is not physical disconnection.

Copy `reinstall.ps1` into the work directory. Inspect its resolved isolated paths before running it. The script silently uninstalls only that installation, checks executable removal and unchanged database hashes, then reinstalls the current build. It retains both profiles.

```powershell
./work/windows-phase-7/reinstall.ps1
node work/windows-phase-7/lifecycle-proof.mjs reinstalled
```

For release inspection, reuse `node docs/evidence/windows-phase-6-tools/inspect-release.mjs release work/windows-phase-7/package-inventory.json` and `node scripts/verify-package.mjs release/win-unpacked/resources/app.asar`. Record final release hashes after the last build. Keep installer outputs, Excel documents, databases and raw local logs out of Git. Commit only reviewed synthetic screenshots and reduced evidence.

## Exercise a failed maintenance upgrade

Use the existing isolated installation and both synthetic lifecycle profiles from the procedure above. Close all app instances. Copy `failed-upgrade.ps1` into the work directory and run it in a separate PowerShell process. It opens `resources/app.asar` without delete sharing and runs the same-build installer against the isolated directory. The installer displays an old-files uninstall failure even with `/S`. Acknowledge **OK** within three minutes. The script expects a nonzero exit and compares every installed file and both database hashes before and after failure.

```powershell
pwsh -NoProfile -File work/windows-phase-7/failed-upgrade.ps1
node work/windows-phase-7/lifecycle-proof.mjs installed
```

The second command verifies usable records and accepted report pins across two launches. This checks file and data preservation after locked-file removal fails. It does not simulate power loss or a failed database migration. Keep those limits with the result.

## Edit the saved template in native Excel

Copy the empty workbook saved through the app's native dialog to a new synthetic file. Open the copy in Excel. Paste the following tab-separated fields into A2:K2, beneath the existing headers, then save and close Excel.

```text
sentetik-bos-sablon	15.01.2026	01.02.2026	Sentetik İşçilik Çığ Şü Ö	Faaliyet gideri	50	0	50	İndirilemez	sentetik-vergi	sentetik-belge
```

Open a fresh disposable packaged profile. Select the saved workbook through the real native picker, using Windows backslashes in the file path. Check zero revisions before confirmation, then one imported row and batch afterward. Expect January incurred 50 and payment 0, February incurred 0 and payment 50, and unconfirmed completeness. Record the saved workbook hash and screenshot only synthetic application content.

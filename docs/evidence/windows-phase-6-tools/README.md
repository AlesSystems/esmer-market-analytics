# Phase 6 verification procedures

These are snapshots of the local proof scripts used for [the Windows record](../windows-phase-6.md). They use locked development dependencies and synthetic records. They are not application payloads and do not access the market source. Run from the repository root with Node 24 in the manifest range, after `npm ci` and Windows packaging. Never point them at a personal profile.

Copy the five `.mjs` files into a fresh `work/windows-phase-6` directory. They intentionally import generated helper bundles from that directory. If that work directory already contains evidence, preserve it before using a separate checkout for a new run. Do not copy generated helper bundles, SQLite files or release artifacts into Git.

```powershell
node work/windows-phase-6/golden-proof.mjs
node work/windows-phase-6/business-proof.mjs
node work/windows-phase-6/inspect-release.mjs release work/windows-phase-6/package-inventory.json
```

Run each command separately and check its exit code. `golden-proof.mjs` uses literal expected values and writes assertion/fixture/source hashes. `business-proof.mjs` creates fresh temporary profiles, launches the actual packaged Windows executable, measures repeated reads, checks pinning/refresh/restart and exercises forced Chromium scaling. Its dialogs are substituted. `inspect-release.mjs` inventories the actual release tree and archive. Its path/content scans have the limitations stated in the record.

For lifecycle reproduction, retain a prior Phase 5 installer and portable artifact whose hashes match the Windows record. Create a fresh temporary root and a `work/windows-phase-6/paths.json` containing `root` (the absolute fresh root) and `baselineAsarSha256` (`e919c3942792516715eb8c83a4c111d990eb114a42493a470b6a0e5c413c0e58`). `prepare.mjs` refuses to overwrite its synthetic fixture/expected snapshots and creates both profiles at schema 3.

```powershell
node work/windows-phase-6/prepare.mjs
```

Set process-local `APPDATA` to `<root>\installer-appdata`. Install the prior NSIS artifact silently into `<root>\nsis-app` using `/S` and `/D=<root>\nsis-app`, checking exit 0. Use `Start-Process -WindowStyle Hidden -Wait -PassThru`. Do not install into the default application directory. Then run:

```powershell
node work/windows-phase-6/lifecycle-proof.mjs baseline
```

Install the final NSIS artifact into that same isolated directory, checking exit 0. The final portable artifact remains at `release/Esmer Market Analytics 0.1.0.exe`. Run separately:

```powershell
node work/windows-phase-6/lifecycle-proof.mjs upgraded
node work/windows-phase-6/lifecycle-proof.mjs portable
```

Each stage launches twice, verifies process ownership and archive identity, removes developer runtime from the child PATH, checks the schema and original-column table hashes, reopens pinned snapshots and confirms file handles release after shutdown. Browser-offline reload is explicitly a stub, not physical disconnection. Profiles are retained for inspection.

For real native selection, create a third fresh profile and generate the package only when its destination does not exist:

```powershell
node scripts/create-business-fixture.mjs "$env:TEMP\phase-6-business-new.json"
```

Launch the isolated installed executable with `--user-data-dir=<fresh profile>`. Use its real “Veri paketi içe aktar” file chooser to select that exact path. Confirm sales 200 and covered gross 40, cancel a subsequent chooser, then select a newly created invalid synthetic JSON and confirm the last valid dataset survives. Restart and confirm those values again. Do not substitute `showOpenDialog` for these observations. Do not commit chooser screenshots of unrelated directories.

Close all isolated app processes before uninstall. Record SHA256 of each disposable `analytics.sqlite`. Resolve the uninstaller path and confirm it is inside the chosen isolated install directory, run its `/S` uninstall with isolated `APPDATA`, check exit 0 and executable removal, and compare all database hashes. Retain profiles; never remove personal data. The recorded run preserved all three databases. Actual OS scaling and physical network-disconnect checks remain separate manual evidence.

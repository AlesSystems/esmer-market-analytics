# Independent Windows Phase 6 evidence review

Read-only inspection on 2026-09-20 for application `bb74a3fb0a1a081784c0ad21527fbd28d0f5fc8d`. No application launch, test, build, package, or tracked-file edit by this reviewer.

Inputs: `package-inventory.json`, `signatures.json`, `golden-proof.json`, `business-proof.json`, `native-proof.json`, `uninstall-proof.json`, `environment.json`, `paths.json`, proof-script timing/validation procedures, and baseline/portable/upgraded result files plus installed/portable expected hashes under the disposable lifecycle directory named by `paths.json`.

## Supported claims

- Host: Windows 11 Pro 25H2, build 26200.9457, x64; HP ZBook Studio 16 inch G9; Intel i9-12900H, 14 cores/20 logical processors; 33,974,288,384 bytes RAM; PowerShell 7.6.6. Development Node is 24.19.0. Golden proof uses development SQLite 3.53.3. Packaged business/native proof uses Electron 44.3.0, Node 24.20.0, Chromium 152.0.7977.78, SQLite 3.53.4, Turkish locale. Do not conflate these runtimes. npm is not independently recorded in these inspected inputs.
- Golden proof contains 100 passing literal assertions: G02 34, G03 19, G04 15, G07 32. G02 records covered L1=100, cost60, gross40, excluded L2=100/null/MISSING_COST, coverage50%; cancellation keeps absolute denominator300 and coverage66.67%; all-zero exposure and nonpositive sales withhold percentages/margin. G03 retains historical30 while replacement75 changes to150 and preserves synthetic accepted output/evidence across a staged source correction (corrected cost36). G04 resolves prior-period return sales-100/cost-60 and rejects unsupported attribution. G07 records single recognition, conflict exclusions and unknown settlement. All eight recorded source/proof-file hashes independently match current disk files. This is synthetic development-engine/persistence evidence, not 100 packaged UI checks or owner acceptance.
- Business proof uses `business-fixture/business-1`, mapping `synthetic-business-v1`, 4,194 bytes, 5 documents/5 lines/1 supplier, SHA256 `3499516f34f9ff87b22454bf4412a5b306df01ad04cc27a33135ddd6e360b99b`. Replacement package is 4,202 bytes, `business-2`, SHA256 `3d5caf93d0a23f18e110c8733f6a851ca9429897f864421ec9d928875317cc6d`. Period 2025-09, no category/product/search restriction, kind all. Open tabs and evidence retain old dataset/methods; refresh changes sales200 to210, gross40 to50 and latest price25 to50. Old sales/purchasing/detail contexts all return STALE_CONTEXT; browsing creates no accepted report; restart loads active sales210.
- Native proof records the real Windows picker (no dialog substitution), successful original-package import, Escape cancellation retaining cost40, invalid-package selection retaining cost40, and restart retaining active data. Its fixture and archive hashes match the business/inventory records. Earlier native automation locator failures are recorded as harness failures.
- Lifecycle files each contain two successful process launches with exit0: baseline schema3, portable schema4, upgraded NSIS schema4. Process ownership was checked, the runtime archive was hashed, SQLite integrity and FK checks passed, original table projections/hashes and pinned/current/report snapshots were checked, and database rename after shutdown succeeded. The seed includes 4 source documents/7 lines, three app revisions, an adjustment target, two evidence references, and one synthetic accepted report. Installed baseline/upgraded snapshot hashes match exactly: current `cd8eb4d2fbf8c12288865b7c163b131d30db1ef83dcddc2a1ddae79447956676`, accepted `2a3b6672b8a485d08ba904e49556aa2577f6759568be16a4df0fccfe5334beb3`, report `61d484374d08df25e4c7848081716cc23a107c49434b421b7367e558793e02d1`. Portable snapshots match their own separately seeded expectations; their different snapshot hashes are not a migration inconsistency.
- Child PATH excludes developer runtime paths, and NODE_PATH/NODE_OPTIONS are cleared by the proof scripts. This supports packaged startup without a developer runtime in the child PATH, while a development runtime still drives the external harness.
- Subsequent `uninstall-proof.json` records exit0, installed executable removal, and identical before/after SHA256 bytes for closed installed, portable, and native disposable SQLite profiles. Independent read-only recheck confirms the executable is absent and all three retained database hashes still match. This supports uninstallation of the isolated test install while preserving those test profiles; it is not a test against personal data.

## Timing summary

Recomputed directly from all observations. Three fresh process starts, five warm sequences per start (15 observations per operation). The warm sequence separately times openSales, querySales, queryPurchasing and inspectSales(S1) over IPC; it is not a rendered interaction benchmark. Process-cold is not OS/disk-cache-cold.

| Measure | n | Min ms | Median ms | Max ms |
| --- | ---: | ---: | ---: | ---: |
| Process start to ready report | 3 | 1298.01 | 1307.36 | 1346.94 |
| Open report | 15 | 1.00 | 1.30 | 7.10 |
| Sales query | 15 | 0.70 | 1.00 | 1.70 |
| Purchasing query | 15 | 0.70 | 1.40 | 3.10 |
| Representative S1 evidence read | 15 | 0.30 | 0.40 | 6.60 |

The tiny fixture cannot pass the full imported-dataset two-second gate.

## Artifact identity and inspection

Independently rehashed all 79 release files against the inventory: zero mismatches. Inventory records 349 ASAR entries/301 files and no forbidden-path/known-marker issue. Archive and seven application-bundle hashes are recorded. This verifies current file identity and the bounded scan, not absence of every possible secret. Third-party React test-utility modules exist in dependencies; do not phrase the inventory as proving no filename containing test anywhere. No application test/fixture/extraction-tool path was reported. Notices need their separately recorded verifier result.

| Artifact | Bytes | SHA256 |
| --- | ---: | --- |
| Portable 0.1.0 | 112644615 | `4c02ccd8246934665935e90d266dcbc73d2826e2e36c506c0d98a8d9cf9c6f46` |
| NSIS Setup 0.1.0 | 112811914 | `dd4d7e2b15f05e1b2f604e31565a685d5dad2348c298a290f7c06fdd92bf7433` |
| Unpacked executable | 246070272 | `f1dcf620565d74405fc49a8d67ca1a0d172da64d0c2173407e529cd850e02787` |
| app.asar | 10366944 | `bab372e4d8cfef9fa869c7ecf564504aab1fb62aebf38721b7f7dd086696bd0d` |

Current ASAR matches native/business/portable/upgraded proof. Baseline ASAR is explicitly different: `e919c3942792516715eb8c83a4c111d990eb114a42493a470b6a0e5c413c0e58`. Baseline installer/portable hashes are separately recorded in paths.json. Both baseline and final package version are 0.1.0; describe this as a same-version code/schema upgrade, not a version-number upgrade.

## Limitations and required wording

No material contradiction found among the inspected records. Avoid these unsupported extensions:

- All physicalDisconnect values are false. Browser setOffline/reload is a browser network stub and does not prove physical-disconnect launch/import/restart.
- Runtime display scale is 1, supporting the actual Windows 100% observation. The 1.25/1.5 runs explicitly force Chromium scaling without changing Windows OS settings. They show keyboard Enter/Escape/focus behavior and minimum-window layout at devicePixelRatio1/1.25/1.5, not actual OS 125%/150% scaling acceptance.
- All five tables in all three layouts have zero horizontal overflow and horizontalScrollExercised=false. Report that they fit and have overflow-x:auto; scrolling was not exercised. The earlier expectation of mandatory overflow was a harness error, not an app defect.
- Signatures.json reports all three EXEs unsigned (status2). It does not show an actual SmartScreen/UAC/unknown-publisher warning. Do not quote its generic PowerShell StatusMessage as an observed launch rejection.
- Lifecycle result files establish start/restart and preserved seeded data after upgrade; the separate uninstall proof now supports successful isolated removal with three retained database files. Installer invocation/exit details still belong in the parent's procedure record. No claim about personal-data deletion behavior follows from disposable profiles.
- Real-source semantics/privacy, owner completeness/report acceptance, full-volume performance, later-phase export/recovery and broader A02/A03/A07 acceptance remain open. These inputs do not replace the final complete test-suite result or artifact recheck after any repackaging.

# v1.0.1 Windows CI evidence

## Build and environment

On 2026-10-27, [Windows validation run 40494227677](https://github.com/AlesSystems/esmer-market-analytics/actions/runs/40494227677) completed successfully on main after [PR #134](https://github.com/AlesSystems/esmer-market-analytics/pull/134). This receipt records that existing run, not a new Windows execution during the documentation update.

| Field | Recorded value |
| --- | --- |
| Tested commit | `6c11ed44510aa8b687f1279e01b220711a738185` |
| App version | 1.0.1 in `package.json` and the build log |
| Workflow | `.github/workflows/ci.yml`, Windows validation, push to main |
| Job | `windows`, GitHub-hosted `windows-latest`, x64 |
| OS | Windows Server 2025 Datacenter, 10.0.26100 |
| Runner image | `windows-2025-vs2026`, version `20261021.278.1` |
| Runtime | Node 24.15.0, Electron 44.3.0 |
| Run interval | 2026-10-27 11:11:10 to 11:16:30 UTC |
| Data | Synthetic fixtures only. No production SQL source configured. |

The `v1.0.1` tag points to `f23b11ea08d0ec13042d45c1eb089380ba8b8163`. The tested main commit retains version 1.0.1 and includes later fixes, including [Windows test paths in #133](https://github.com/AlesSystems/esmer-market-analytics/pull/133) and disabled implicit distribution publication in #134. This run did not create a release or move the tag.

## Commands and results

Expected results were successful checks, distributions that match the inspected payload and passing packaged workflows. The run recorded the following actual results.

| Command or procedure | Actual result |
| --- | --- |
| `npm ci --no-audit --no-fund` | Passed with locked dependencies |
| `npm run typecheck` | Passed |
| `npm run lint` | Passed |
| `npm run test:unit` | 33 files, 171 tests passed, no skips or failures |
| `npm run test:integration` | 44 files passed, four files skipped; 302 tests passed, 29 skipped, no failures |
| `npm run package:win` | Built unsigned x64 NSIS and portable executables, verified package notices and inventory, and inspected both distributions |
| Package notices | `PACKAGE_NOTICES_OK 79 dependencies` |
| Unpacked release inventory | 82 files, 3,080 archive files, no prohibited-file violations |
| Distribution payload comparison | `DISTRIBUTIONS_MATCH_INSPECTED_PAYLOAD` |
| `npm exec -- playwright test` with `ESMER_EXECUTABLE` set to `release/win-unpacked/Esmer Market Analytics.exe` | 48 passed, four skipped, no failures |

The packaged workflows include the Bu ay launch, product drill-down, expenses, net-profit states, Excel export, settings, offline restart and profile preservation. `v1-walk.test.ts` passed the end-to-end synthetic journey. `clean-install-restore.test.ts` created an encrypted backup, deleted the original user-data directory and restored into a fresh profile on the same runner. On Windows it checks real OS key protection with Electron `safeStorage`. Native file dialogs are stubbed by the test. This proves the automated path, not an independent-machine recovery exercise.

### Skipped checks

The 29 integration skips are explicit limitations of this run.

- `source-evidence.test.ts` skips 11 tests on Windows.
- `sql-product-names.test.ts`, `synthetic-sql-dev.test.ts` and `live-sql-server.test.ts` skip 16 tests because the isolated SQL admin configuration is absent.
- `live-consistency.test.ts` skips one isolated SQL extraction test because the SQL reader configuration is absent.
- `release-inventory.test.ts` skips one Apple Silicon Mac-specific inventory test.

The four desktop skips are optional screenshot captures. `bu-ay-capture.test.ts` requires `ESMER_CAPTURE_BU_AY`; the three `visual-capture.test.ts` cases require `ESMER_CAPTURE_VISUAL`. The Windows profile lifecycle test ran and passed.

## Evidence and retention

The workflow uploaded `windows-evidence-6c11ed44510aa8b687f1279e01b220711a738185`, artifact ID `12729917608`. It contains `test-results/` and `release/release-inventory.json`. GitHub records its digest as `sha256:84503b6138864d984089836b1adafdc0327fbbedecda37f025b011567c0caff4` and expiry as 2026-11-10 11:16:22 UTC. The configured retention is 14 days. Logs and the artifact were inspected for this receipt.

The artifact does not contain the installer, portable executable or `distribution-inspection.json`. Distribution inspection succeeded in the logs, but installer hashes are not preserved by this receipt. The [manual Windows handoff](../operations/windows-v1-handoff.md) rebuilds this exact commit and records hashes for those newly built artifacts. Do not assume a rebuild is byte-identical to CI.

The inspected `release/release-inventory.json` has SHA-256 `4613b2f734dd8a5a78766c586ed2e597e281c5f1df97787f1df9525d4acb9752`.

The run and artifact metadata can be checked with:

```sh
gh run view 40494227677 --json conclusion,headSha,url,jobs
gh run view 40494227677 --log
gh api repos/AlesSystems/esmer-market-analytics/actions/runs/40494227677/artifacts
```

## Remaining acceptance

- A07 manual smoke acceptance remains open on the intended Windows 10 or 11 configuration. Record installation, the Turkish UI and native Excel walkthrough, 125% and 150% OS display scaling, restart and uninstall. CI tests the unpacked executable, not manual installation through NSIS or launch through the portable wrapper.
- The v1 A06 scope is encrypted backup plus documented restore under [#98](../decisions/issue-98-profit-first-estimate-edition.md). The automated Windows restore now passes and the [Turkish procedure](../operations/recovery-tr.md) exists. Separate clean-machine recovery without the original credential store remains post-v1. Windows power-loss durability is still unproven.
- The two-second Windows benchmark applies only if prepared packages exceed 100,000 rows under #98. Current limits are 100,000 rows and 32 MiB. This CI run records no full-dataset timing and passes no conditional benchmark.
- Production SQL access, approval for the historical-cost column, Eralp's acceptance and owner installation still require separate direction and evidence. The [restored-backup mock-live demo](2026-10-26-mock-live-demo.md) is isolated evidence. It does not pass L01 or validate financial source semantics.
- The live-tile fixes in [#132](https://github.com/AlesSystems/esmer-market-analytics/pull/132) have synthetic coverage but have not been rechecked against the restored real source after the demo.

[#109](https://github.com/AlesSystems/esmer-market-analytics/issues/109) and [#110](https://github.com/AlesSystems/esmer-market-analytics/issues/110) are closed in GitHub. Their closure does not pass these checks. The [evidence index](index.md) records current acceptance independently of tracker state. Historical receipts retain the older billing and verification observations for their own builds.

## Documentation update verification

The documentation branch based on `6c11ed4` was checked on macOS arm64 with Node 24.15.0 and npm 11.12.1 on 2026-10-27. The limitations Markdown is bundled into Ayarlar, so the updated copy was also tested in a rebuilt packaged Mac app.

- `npm run typecheck` and `npm run lint` passed.
- `npm run test:unit` passed 171 tests.
- `npm run test:integration` passed 314 tests, with 17 skipped SQL-dependent tests.
- `npm run test:desktop` built and packaged the app, then passed 47 tests. Five tests skipped, comprising the Windows-only lifecycle test and the four optional captures described above.
- A separate packaged-app check confirmed `düzeltildi` for the Windows CI row and `açık` for manual Windows acceptance. The [limitations screenshot](windows-ci-status/limitations-mac.png) shows those exact rows in the rebuilt Mac app with an empty disposable profile.
- The changed Markdown files passed local-link and CI-claim checks. `git diff --check` passed.

These Mac checks verify the documentation update and its bundled text. They do not extend the Windows acceptance recorded above.

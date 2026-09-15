# Phase 1 Windows verification

## Gate status

The Phase 1 exit gate remains **open**. Windows build and package creation passed. Packaged startup, disconnected networking, restart, portable launch, and NSIS install/launch/uninstall have not run. This record does not complete A01, A05, or A07.

The session requested confirmation that the available Windows host is the isolated development/test machine, as required by the [Windows handoff](../operations/windows-phase-1-handoff.md). That confirmation is pending. Windows Sandbox is unavailable on this host. Application launches and installer execution remain pending rather than assuming this is an approved installation target.

## Build and environment

- Date: 2026-09-15.
- Issue and tasks: [#4](https://github.com/AlesSystems/esmer-market-analytics/issues/4), 1.1 and 1.2.
- Existing PR: [#15](https://github.com/AlesSystems/esmer-market-analytics/pull/15).
- Branch: `codex/phase-1-independent-foundation`.
- Fetched baseline: `51255786a47cffc3b4a274e0db4d72ac1d1024fe`. Recorded before any file changes.
- Final code and packaging commit: `709c75f1e64e4f34fcc0042aa24e269b18141e5e`. Final checks and artifacts used these unchanged file contents. The evidence commit adds documentation only.
- Initial working tree: clean, on `main` at `7c0dfee0abda9793fafa7e1145d6603d050fa69b`. The session fetched and switched to the existing remote Phase 1 branch.
- App version: `0.1.0`.
- Fixture: `synthetic-empty-v1`. No business records, source database, backups, credentials, or network services were used.
- OS: Windows 11 Pro 25H2, build `26200.9445`, x64.
- Hardware: HP ZBook Studio 16 inch G9, Intel Core i9-12900H, 14 cores and 20 logical processors, approximately 31.6 GiB reported physical memory. A hypervisor is present. This is not evidence of a clean guest VM.
- Command host: PowerShell 7.6.6.
- Initial development runtime: Node 22.19.0 and npm 10.9.3. These were not used for the verification commands below.
- Verification development runtime: Node 24.15.0 and npm 11.12.1, from the official Windows x64 Node archive, checked against its published SHA-256 list and extracted under ignored `work/`.
- Packaged runtime measurement: **pending**. Electron `44.3.0` is the selected package version. Bundled Node and SQLite versions have not been measured on Windows. The macOS runtime record is separate.

Machine names, serial numbers, account identifiers, private paths, and raw logs are excluded from this record.

## Commands and actual outcomes

Commands ran from the repository root in PowerShell. The local Node 24 directory was placed first in the process `PATH`. The host's npm configuration sets `script-shell` to `powershell.exe`. This invokes Windows PowerShell 5, which rejects the existing `&&` script separators. The initial build failed before executing application build logic. Setting `$env:npm_config_script_shell = $env:ComSpec` restored npm's standard Windows shell for this session. No global npm setting or repository script changed.

| Command | Actual outcome |
| --- | --- |
| `git status --short` | Clean baseline |
| `git branch --show-current` | Recorded `main`, then switched to the requested branch |
| `git rev-parse HEAD` | Recorded the initial checkout and fetched Phase 1 SHA above |
| `node --version` | `v24.15.0` after local runtime selection |
| `npm --version` | `11.12.1` after local runtime selection |
| `npm ci` | Passed, 410 packages installed, 411 audited, zero reported vulnerabilities |
| `npm run typecheck` | Passed |
| `npm run lint` | Passed |
| `npm run test:unit` | Passed, 2 tests |
| `npm run test:integration -- tests/integration/desktop-boundary.test.ts` | Passed, 7 tests |
| `npm run test:desktop -- tests/desktop/startup.test.ts` | Not run, pending confirmation of the isolated test host |
| `npm run build` | Initial host-shell parse failure; passed with the session shell setting above |
| `npm run package:win` | Passed with the session shell setting; produced x64 NSIS and portable executables; final check printed `PACKAGE_NOTICES_OK 6 dependencies` |
| `npm test` | Not run because its packaged desktop step requires the pending host confirmation |
| `git diff --check` | Passed for the final changes |

After the packaging fix, `npm ci`, typecheck, lint, both unit tests, all seven integration tests, build, and Windows packaging passed again. Neither the full suite nor packaged runtime/manual smoke ran. No application source, IPC contract, sandbox preference, or desktop test-driver setting changed.

The installer uses electron-builder's default per-user, one-click NSIS configuration. Successful packaging does not prove installation or startup.

## Artifact hashes

SHA-256 values were measured with `Get-FileHash -Algorithm SHA256` after packaging completed. Artifacts remain local under ignored `release/`. They have not been deployed or attached as a production release.

| Artifact under `release/` | SHA-256 |
| --- | --- |
| `Esmer Market Analytics Setup 0.1.0.exe` | `82780b97360b761829b8ae3e9e8cafa2e81d942eff10cdba09dfdbf24950576a` |
| `Esmer Market Analytics 0.1.0.exe` | `9ccd3e96827be04844d92d9b24e0c179e87b3075845e55bd96eee97025eae93c` |
| `win-unpacked/Esmer Market Analytics.exe` | `06fbf01c3bc9f00bd668bf67c8b306a355499f069d4de180ae27195e6f1b673d` |
| `win-unpacked/resources/app.asar` | `3ea55989fa43f7cd974b46376f1dda1479d765ec0c6df78fb0f5c82f1f757460` |

`Get-AuthenticodeSignature` reports `NotSigned` for all three application executables. The builder's log says it runs a signing step, but these outputs have no Authenticode signature. No SmartScreen or publisher dialog has been observed because the artifacts have not been launched. No absence of warnings is claimed.

## Boundary and release-content evidence

The seven integration cases passed. Unknown operations, malformed availability payloads, untrusted senders, path/credential-bearing payloads, and SQL-bearing import or availability requests return safe failures without calling the service. The valid service-failure case preserves its typed Turkish response. These are integration results; Windows renderer/runtime enforcement still needs the packaged desktop test.

Inspection used the installed `@electron/asar` library's `listPackage`, `statFile`, and `extractFile` functions. Windows inspection requires native path separators for the archive API. The final archive contains 349 entries and 301 files. Its top-level contents are `dist`, production `node_modules`, and `package.json`. Searches found no prohibited private input paths, `.env` files, source backups, databases, source maps, credential files, repository fixtures, or local checkout/user-home paths. Public dependency documentation is retained, including `write-excel-file/docs/IMAGES.md`.

The [Windows inventory](windows-phase-1-package-inventory.json) records release file names, sizes, hashes, dependency versions, and notices. The local `builder-debug.yml` contains generated build diagnostics with machine paths. It is not a distribution artifact, is ignored by Git, and must not be uploaded with the installer or portable executable. Only its filename, size, and hash appear in the inventory.

Electron's `LICENSE` and `LICENSES.chromium.html` in `resources/licences` match the downloaded Windows Electron runtime byte for byte. The final archive includes six dependency licence files for six production dependencies. All six notices are present and nonempty. No unresolved notice omission remains in this Phase 1 archive. The Excel reader still requires a distribution decision before its later implementation phase.

## Reproduced packaging defect and fix

The baseline archive contained 12 dependencies and 11 licence files. Its SHA-256 was `0ad314bb1e9f23c840a2653e2e46b10ceb1ab3310a87b5c8adaba955771009c7`. `worker-f` 0.1.20 declared MIT but omitted a licence notice in both its npm package and exact upstream tree. The [runtime decision](../decisions/runtime.md#decimal-and-excel-limits) records the provenance and later-phase requirement.

The new behavioral check ran against that actual Windows archive before the dependency fix:

```text
node scripts/verify-package.mjs release/win-unpacked/resources/app.asar
PACKAGE_NOTICE_MISSING worker-f@0.1.20
```

It exited with code 1. The failing-check commit `5b62c06aee746c7e18bc655805e5ae339a20141b` precedes the fix in history. The first inspection draft hit a Windows path-separator error; that tooling error was corrected before reproducing the missing notice.

The fix keeps `read-excel-file` pinned as a development dependency for the synthetic compatibility test. No Phase 1 application source imports it. Electron-builder therefore excludes it and its unused transitive dependencies from the distribution. Dependency versions and integrity hashes are unchanged. `package:win` now runs the notice check after packaging. On the rebuilt archive it exited with code 0:

```text
PACKAGE_NOTICES_OK 6 dependencies
```

## Screenshots and remaining checks

No Windows application or installer screenshot exists for this run. The [macOS screenshot](phase-1-offline-startup.png) is prior evidence and must not be presented as Windows evidence.

On the confirmed isolated Windows test target, the remaining work is to run the packaged desktop check and full suite, open the unpacked and portable artifacts with networking disconnected, close and reopen the same fresh profile, and exercise NSIS install/launch/uninstall. Record worker SQLite loading, actual bundled versions, renderer restrictions, safe Turkish failures, publisher dialogs, screenshots, and final artifact hashes. Repeat these checks after any application or test-driver fixes.

Independent read-only review at the fetched baseline found no confirmed Windows application defect and no code comments or lint/TypeScript suppressions. It identified the unperformed restart, worker-version measurement, disconnected-network, portable, and installer evidence above. A separate reviewer examined final commit `709c75f` and the Windows evidence and found no actionable code or evidence inconsistency. All 81 recorded release-file hashes matched the local artifacts. Reviews used separate agents from the same model family. Windows runtime and manual smoke checks remain unperformed.

Poteto's Prove It Works principle kept the gate open without Windows runtime evidence. Test Behavior, Not Implementation required the failing and passing check against real archives. Sequence Work into Verifiable Units put the failing check before the fix. Laziness Protocol limited the fix to dependency classification. Model the Domain represented each shipped package with its name, version, directory, and notice files.

Phase 10 retains upgrade, recovery, performance, and full-dataset acceptance. Persistent business storage and Phase 2 remain outside this work.

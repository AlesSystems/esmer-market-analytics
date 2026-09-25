# Windows recovery filesystem compatibility

Issue #13, Phase 10 Task 10.1 and the outstanding Phase 9 filesystem check. A06 and A07 remain open. This is developer-host synthetic evidence, not independent computer-loss acceptance.

## Environment and build

- Windows 11 Pro, version 10.0.26200, build 26200.
- Node 24.19.0. Locked repository dependencies. npm scripts used `cmd.exe`.
- Branch `codex/phase-10-recovery-proof`.
- Contract commit `a415d70`, implementation `5d4b206`, Windows fixture correction `eb79f84`.
- Fixtures are generated synthetic recovery records in disposable local temporary directories. No source access, production connection or owner installation occurred.

## Reproduction and correction

The initial focused `recovery-files.test.ts` run passed one test and failed one with `EPERM: operation not permitted, fsync`. Opening a directory succeeded, but flushing that directory handle failed. The existing `restore-failures.test.ts` suite failed 17 of 22 tests before reaching its intended restore boundaries.

`syncDirectory` now makes Windows support explicit. It checks that the destination still exists as a directory and returns `unsupported` for directory flushing. Other platforms retain directory flushing and propagate its errors. File writes still flush file contents before rename. File flush, rename, stat and cleanup errors are not caught or converted to success by this change. No new dependencies were added.

This enables recovery operations and their process-interruption journal on Windows. It does **not** establish persistence of directory-entry changes after power loss or storage removal. The returned capability is internal; the current callers do not surface it in the UI. A successful backup means its ciphertext was decrypted and validated during creation, not that Windows namespace persistence has been proven under power loss. Do not cite the simulated fault exceptions named `power-loss` in older tests as actual power-loss evidence.

The full integration run also exposed an unrelated test setup failure. Creating a directory symlink required unavailable Windows privilege. The fixture now uses a Windows junction and a POSIX directory symlink. Both exercise the existing real-path rejection of an alias into app data.

## Verification

| Task/gate | Procedure | Expected and actual | Limitation |
| --- | --- | --- | --- |
| 10.1 / A06 | `npm run test:integration -- tests/integration/recovery-files.test.ts tests/integration/restore-failures.test.ts tests/integration/encrypted-backup.test.ts tests/integration/recovery-equivalence.test.ts` | All 34 tests passed after the fix. Publication and replacement preserve exact content; failed publication retains existing content and removes its partial file. Restore fault cases recover the original or committed candidate. | Local host filesystem and injected process faults only. |
| 10.1 / A06 | `npm run test:integration` | 222 tests passed after the directory-alias fixture correction. Initial broader run had 221 passes and the symlink privilege failure. | OS key protection is mocked where existing tests require it. |
| 10.1 | `npm run test:unit` | 29 tests passed. | Unit checks only. |
| 10.1 | `npm run typecheck`, `npm run lint`, `npm run build`, `git diff --check` | All passed. | Build is not packaged-app verification. |

Evidence is the committed executable test in `tests/integration/recovery-files.test.ts`, the existing recovery integration suites and this result record. The coordinating branch must rerun packaged desktop checks after integration. Independent clean-account or VM restore, independently retained physical media, actual power interruption, disk exhaustion, antivirus/open-file interference, native key protection, ACLs and installer lifecycle remain separate unperformed checks.

Fix Root Causes shaped the shared filesystem change instead of changing individual backup callers. Test Behavior, Not Implementation shaped the literal retained-content assertions. Model the Domain kept directory-flush support as an explicit result rather than a blanket exception handler.

# Phase 9 standards review

Scope: Standards axis for `a7f0cd8..working tree`, including untracked Phase 9 files, reviewed on 2026-09-24. Issue #12, `AGENTS.md`, the foundation documents, `docs/contracts/desktop.md`, and `docs/decisions/phase-9-recovery.md` were read. This review stops before Windows implementation or acceptance. Tooling-enforced style was excluded.

## Documented-standard findings

1. **Pre-upgrade copy can be skipped after local recovery configuration fails.** `src/desktop/main.ts:104-107` turns every `loadRecoveryConfig` error into `undefined` configuration and starts the worker. `src/recovery/backup.ts:35-47` makes the pre-upgrade capture conditional on configuration, then opens and migrates the existing database. Thus a previously configured older installation with an unreadable wrapper or unavailable OS key protection can be migrated without its expected pre-upgrade artifact. The requirement to retain pre-upgrade copies is in `docs/superpowers/plans/esmer-market-implementation-plan.md:423`; the chosen ownership design requires the pre-upgrade checkpoint in `docs/decisions/phase-9-recovery.md`. Keep that installation on its old schema until the recovery configuration can be repaired or separately retained material can be used.

2. **Restore errors can assert preservation without proving it.** `src/recovery/backup.ts:183-192` closes the working store, then may fail while recovering the switch journal or reopening the database. `src/service/worker.ts:132` maps these failures to the generic `recoveryFailure`, whose Turkish message at `src/recovery/contracts.ts:8-9` states that current records were preserved and advises a routine retry. A failed rollback, failed reopen, or lingering journal needs a distinct recovery-required result and instructions to preserve files and restart or obtain help. The current message conflicts with the safe, meaningful Turkish error contract in `docs/contracts/desktop.md:35-37` and the safe-failure requirement in `docs/superpowers/specs/2026-09-04-esmer-market-rebuild-acceptance.md:110-112`.

## Baseline smell (judgment)

- **Possible Duplicated Code:** the same recovery-operation list appears in `src/recovery/contracts.ts:7` and `src/desktop/requests.ts:40`. The worker uses one list for exclusive routing while IPC uses the other for validation. Reuse the exported list so later operation additions cannot drift across this trust boundary; this also follows `AGENTS.md`'s reuse-first rule.

No other material Standards findings in the reviewed diff. This was a source review, not a test run or a Windows acceptance claim.

## Resolution review

The independent Spec reviewer performed this focused follow-up because the original Standards reviewer was unavailable at the thread limit. Production reviewed at `2b81b62`, tests at `3d5cbc1`.

1. Resolved. Electron main now passes `recoveryConfigUnavailable` to the worker. Recovery holds the existing store closed until configuration is repaired. Configuring recovery takes a verified pre-upgrade snapshot before opening and migrating. Independent command `npx playwright test tests/desktop/startup.test.ts -g 'unreadable recovery config'` passed 1 packaged macOS test. It verifies schema version 1 remains unchanged and the recovery screen remains reachable.
2. Resolved after the cleanup follow-up. Journal recovery, reopening, and committed-outcome interruptions now have distinct Turkish recovery-required messages. The targeted recovery run passed 6 relevant regressions. The intermediate re-review found that `confirmRestore` awaited temporary cleanup in `finally` outside error classification. A cleanup error after the committed switch could override success with a raw filesystem error and reach the generic preservation claim. This intermediate gap was reproduced and fixed before the final verdict.

The duplicated-operation-list observation is resolved. Desktop IPC and the worker both import `recoveryOperations` from the recovery contracts.

The cleanup follow-up now records whether restore committed and preserves the committed/restart or recovery-required classification if final temporary-file removal fails. Independent command `npx vitest run tests/integration/restore-failures.test.ts -t 'post-commit temporary cleanup'` passed 1 test, with 21 unselected. It injects cleanup failure after commit and verifies both the committed-state error and the restored record set. Both documented-standard findings and the operation-list observation are resolved. This is a focused local re-review, not Windows acceptance.

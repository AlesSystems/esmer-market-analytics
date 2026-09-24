# Phase 9 spec review

Reviewed `git diff a7f0cd8` and untracked recovery implementation on `codex/phase-9-recovery`, HEAD `11916c0`, against issue #12, D09, A06, and Tasks 9.1 and 9.2. This report records the implementation before review fixes. No implementation files were changed by this review.

## Findings

1. **P1. Restarting an interrupted rollback can disable recovery and strand original sidecars.** `src/recovery/restore.ts:26` moves the original database back before deleting the journal. A crash there leaves the original database present, but neither the candidate nor rollback file exists. Line 28 then throws `RESTORE_RECOVERY_REQUIRED` on every startup. `Recovery.open` throws before returning an object, so the service cannot expose another restore. An isolated probe reproduced both failures. An earlier interruption after line 24 can also leave the original WAL at `path-wal`. On retry, line 23 treats that WAL as uncommitted candidate data and moves it away before restoring the original base database. Make recovery itself restartable at each file operation, with durable stage information or an equivalent unambiguous protocol. Add repeated-interruption tests with real SQLite sidecars. A06 line 112 requires “Restore failure leaves the current working data usable”; Task 9.2 line 436 requires interruption testing and says “None may destroy the working store.”

2. **P2. Restore reports success without a durable audit record.** `src/recovery/backup.ts:204` swallows audit write failures. Line 185 still returns `status: restored` after switching the database. In an isolated probe, making `recovery-audit.jsonl` unwritable allowed preview and confirmed restore to succeed without any audit record. The only evidence was a transient `AUDIT_UNAVAILABLE` status. Persist the restore outcome or a recoverable audit intent as part of the commit protocol, and verify failure handling without reporting an unrecorded success. A06 line 112 requires “successful restore is explicit and auditable”; Task 9.2 line 437 requires “an auditable success/failure record.”

## Validation and limits

Synthetic macOS probes are in local scratch `work/poteto/phase-9/spec-review/probe.ts`. Bundled with the installed esbuild and executed with Node. Results were `RESTORE_RECOVERY_REQUIRED` for both restart calls and `{ status: 'restored' }` with `AUDIT_UNAVAILABLE` for the audit failure. No shared application profile was used.

No scope creep was identified. Windows implementation and acceptance remain an authorized handoff boundary, not a finding. A06 remains open.

## Resolution review

Reviewed the production fixes in `2b81b62` and regression coverage in `3d5cbc1` on 2026-09-24. Both original Spec findings are resolved within the local scope.

- P1 resolved. Rollback now records the exact move plan and completed index before replaying filesystem operations. Each rename is synced before advancing the durable index. A persisted outcome distinguishes completed rollback from an unfinished switch. Independent targeted execution passed the final-base-rename interruption and repeated interruptions after every rollback rename with real committed SQLite WAL records.
- P2 resolved. Preview and restore intent require a synced audit entry before closing the working store. A synced restore outcome is the commit record. An unavailable outcome write rolls back, while an interruption after the outcome reports committed recovery requiring restart. Independent execution confirmed unavailable audit, failed outcome publication, committed-outcome restart, and unavailable rollback audit behavior.

Command `npx vitest run tests/integration/restore-failures.test.ts -t 'restart after rollback|unavailable audit|rollback rename|outcome|rollback audit'` passed 6 tests, with 15 unselected. This focused resolution pass does not close Windows acceptance or A06. The Standards follow-up also resolved post-commit cleanup error classification with an independently passing targeted regression.

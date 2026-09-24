# Continue Phase 9 on Windows

Continue [issue #12](https://github.com/AlesSystems/esmer-market-analytics/issues/12), Tasks 9.1 and 9.2, on `codex/phase-9-recovery`. Fetch its latest tip and update [PR #23](https://github.com/AlesSystems/esmer-market-analytics/pull/23). The locally tested implementation is `e12aa5b`; fetch later documentation commits too. The macOS run stops before Windows-specific implementation and testing. A06 remains open. Do not merge or close the issue from this handoff.

Read `AGENTS.md`, the foundation specification/audit/acceptance checklist, [Phase 9](../superpowers/plans/esmer-market-implementation-plan.md#phase-9--encrypted-backup-and-independent-recovery), [local evidence](../evidence/phase-9-local.md), and [Turkish recovery instructions](recovery-tr.md). Use synthetic fixtures and disposable profiles. No source access, owner contact, production connection, installation on Eralp's PC or later phase is authorized.

## Continue the same branch

Run separately in PowerShell. Preserve unrelated changes.

```powershell
git status --short --branch
git fetch origin
git switch codex/phase-9-recovery
git pull --ff-only
git log -10 --oneline
node --version
npm --version
npm ci
npm run typecheck
npm run lint
npm run test:unit
npm run test:integration -- tests/integration/encrypted-backup.test.ts
npm run test:integration -- tests/integration/restore-failures.test.ts
npm run test:integration
npm run test:desktop -- tests/desktop/clean-install-restore.test.ts
npm run test:desktop
npm run package:win
```

Record exact SHA, package hashes, Windows edition/build, CPU, RAM, display scaling, Node/npm, Electron and bundled SQLite versions. `test:desktop` exercises packaged output. Automated tests that substitute OS key protection establish application behavior only. Repeat the native proof below with actual safeStorage and native dialogs.

## Complete platform implementation and proof

1. Verify native OS protection of the wrapped local key. Reject unavailable protection. Inspect the installation for plaintext key material outside the explicitly exported key file. No secret may enter renderer state, logs, SQLite snapshots, workbooks or screenshots. Test a missing or unreadable local wrapped key and recovery via the independently held key.
2. Inspect Windows ACLs of temporary plaintext snapshots and retained local rollback data. POSIX `mode: 0600` alone does not establish Windows access restriction. Add the smallest required Windows protection if the inherited user-data ACL is insufficient. Check cleanup after success, failure and process termination. Record actual ACL evidence with sanitized identities.
3. Start with `src/recovery/files.ts::syncDirectory`: opening and flushing a directory is verified only on macOS here. Implement the required Windows durability behavior before treating that platform as supported; do not silently suppress flush errors and claim equivalent durability. Test open-file/antivirus interference, flush and rename behavior, unavailable external media, read-only destinations and disk exhaustion using disposable volumes. Fault injection is useful but does not replace actual Windows file-system evidence. Last verified backups and the working store must remain usable.
4. Verify automatic checkpoints after source activation, expense import/correction, completeness revision, adjustment and accepted report. Include concurrent changes during backup, termination immediately after a committed edit, and restart retry. Confirm latest-five retention, pins and pre-upgrade copies. Never prune before successful new verification.
5. Exercise the restore switch under forced interruption at each recorded stage. Restart with the interrupted journal present. Confirm original or fully verified restored state, with no empty replacement or mixed SQLite journals. Test rejection of a stale preview after a newer change, explicit cancellation and failed reopen. Retain auditable outcomes.
6. Test upgrade from a disposable prior-phase profile with expenses, adjustments and accepted reports. Verify transactional schema migration, pre-upgrade protection when recovery is configured, and preservation of local recovery configuration through installer/portable lifecycle. Document any bootstrap limitation for a pre-recovery installation that has no exported key.
7. Use actual native folder/open/save/cancel and destructive confirmation dialogs. Test Turkish filenames, keyboard navigation, supported minimum window and 100%, 125%, 150% Windows scaling. Check recovery remains reachable with an empty or unavailable analytics store. Check useful retry messages after destination or key failures.

## Prove independent recovery

Use a clean Windows user account or isolated clean VM with no access to the original installation or OS credential store. Prefer a separate machine/VM disk and independently retained external media. A second folder on the original disk does not pass computer-loss acceptance.

1. On the original disposable installation, import the synthetic business fixture and expense workbook. Record exact fixture hashes and literal expected financial values. Create an expense correction, adjustment, completeness revision and accepted report. Preserve a pre-backup workbook and sanitized record/evidence manifest.
2. Configure backup with actual OS protection. Retain the encrypted artifact and recovery key independently. Record the backup ID and artifact hash only. Never commit the key, plaintext database, wrapped key or private data.
3. Remove access to the original profile and its credential store. On the clean installation, restore using only the retained artifact and key. Confirm that no login/PIN or original machine dependency is required.
4. Compare expense/import histories, adjustments, completeness revisions, settings, accepted reports, report pins, source manifests and source-line evidence. Reopen the accepted report and compare UI and Excel values with the saved baseline. Estimates and missing data must retain their original meaning.
5. Repeat wrong-key, tampered/truncated ciphertext, invalid SQLite, unsupported schema, failed candidate migration and storage failures against a populated disposable installation. Verify existing data and accepted reports remain readable. Record expected and actual outcomes separately.
6. Restart the recovered app, configure its independent backup destination and create another verified backup. Check the audit trail and the Turkish instructions against the actual flow.

## Return evidence

Write `docs/evidence/windows-phase-9.md`. Each row needs task/gate ID, commit/build, fixture or backup identity, environment, procedure, expected/actual results, evidence path and limitations. Link screenshots without secrets. Fix only Phase 9 Windows defects using focused failing tests and coherent Conventional Commits. Update the same PR.

Mark A06 criteria complete only where the full required evidence exists. Keep unperformed Windows, actual-media machine-loss, source-dependent, full-volume, Phase 10 and L01 gates open. Return branch, commits, PR link, verification and unresolved limitations. Do not merge without separate direction.

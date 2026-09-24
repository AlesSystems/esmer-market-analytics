# Phase 9 comment review

Scope: comment-only review of `a7f0cd8..working tree` in the requested Phase 9 paths. This is not a correctness review. No implementation files were changed.

Reviewed 6 comments: recommend 5 deletions; keep 1 platform-specific test note.

## Delete (5)

- `src/recovery/backup.ts:104` — **MUST KILL `Recovery.loadCatalogue`**: extract/name the uncatalogued-artifact reconciliation; the crash narrative is then redundant.
- `src/recovery/backup.ts:113` — **MUST KILL `Recovery.loadCatalogue`**: name the failed-discovery path instead of explaining a deliberately swallowed candidate in prose.
- `src/recovery/backup.ts:193` — **MUST KILL `Recovery.confirmRestore`**: make the journal-dependent candidate cleanup predicate explicit.
- `src/recovery/restore.ts:19` — **MUST KILL `recoverInterruptedSwitch`**: express the rollback case with a named branch/helper.
- `src/recovery/restore.ts:48` — **MUST KILL `switchStore`**: make retention of the rollback artifact apparent in the operation boundary rather than leave a trailing narration.

## Keep (1)

- `tests/desktop/clean-install-restore.test.ts:22` — Electron's OS credential adapter can trigger a real macOS Keychain prompt. The comment restricts the mock to that external platform dependency.

No comments were present in the other requested files: `src/desktop/recovery-config.ts`; `src/recovery/{cipher,contracts,files,keys,validate}.ts`; and `tests/integration/{encrypted-backup,recovery-boundary,recovery-equivalence,restore-failures}.test.ts`.

## Resolution

The five explanatory comments were removed. Existing method and branch names already state their operations; no helper extraction was added solely to replace a comment. The OS-adapter test note remains. Correctness fixes from the separate Spec review are recorded there.

Final main-process diff also retains one brief catch explanation: a damaged OS wrapper may be replaced only through new separately exported recovery material. The prior-config read now explicitly distinguishes ENOENT; its inaccurate absent-file comment was removed.

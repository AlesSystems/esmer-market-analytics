# Phase 9 local recovery evidence

Tracks [issue #12](https://github.com/AlesSystems/esmer-market-analytics/issues/12), Tasks 9.1 and 9.2 of the [implementation plan](../superpowers/plans/esmer-market-implementation-plan.md#phase-9--encrypted-backup-and-independent-recovery). The user authorized implementation and a PR, with work stopping at Windows-specific implementation and testing.

## Environment and scope

[Draft PR #23](https://github.com/AlesSystems/esmer-market-analytics/pull/23) is the continuation target. Branch `codex/phase-9-recovery` starts from `a7f0cd8`, the updated merged main branch. Dependencies #7, #10 and #11 were closed when work began. Host is macOS 27.0 build 26A428, arm64, Node 24.15.0, npm 11.12.1. Inputs are synthetic. No source connection, private backup, identifiable customer/employee data or owner contact was used.

The [recovery decision](../decisions/phase-9-recovery.md) records two independently explored designs and the independent judgment. Astra Low owns the recovery core, Sol 6 Low owns desktop/UI integration, and Astra High reviews the complex recovery contracts. The existing SQLite worker owns the store throughout. No runtime dependency is added.

## Observed missing contracts

- `f17c623` adds the durable-intent and IPC contracts. The first integration run failed because `recovery_state` did not exist after a committed app change. The boundary test observed `UNKNOWN_OPERATION` where the recovery request should have been recognized and rejected with `INVALID_PAYLOAD`.
- `4db754e` adds independent recovery of financial history and every parsed Excel sheet. Its first run executed zero tests because `src/recovery/backup` did not yet exist. This absent-module failure is not an arithmetic failure.
- The focused ownership, intent and IPC run passed 5 tests after the schema and named boundary implementations. Schema migration expectation is explicitly version 6.

## Verification ledger

A06 remains open until clean Windows recovery with independently retained material passes.

- `npm run test:unit`: 29 tests in 9 files passed.
- `npm run test:integration`: final run passed 220 tests in 26 files at implementation commit `e12aa5b`.
- `npm run typecheck` and `npm run lint`: passed.
- `npm run test:desktop`: builds and launches the packaged macOS arm64 app. The first full run passed 21 tests, skipped the existing Windows-only pagination test, and failed one old migration assertion expecting schema 5 instead of actual schema 6. Updating that explicit expectation yielded a passing focused packaged migration test. Final rebuild/rerun passed 22 tests and skipped only the existing Windows-only pagination test (23 total).
- `node scripts/verify-package.mjs 'release/mac-arm64/Esmer Market Analytics.app/Contents/Resources/app.asar'`: passed with 7 dependency notices. No dependency or lockfile changed.
- Focused recovery tests cover generation intent, real native backup page-batch concurrent writes, ciphertext tamper/truncation, retention/pins, unavailable destinations, candidate validation/migration failures, switch interruption and worker request draining. Explicit `ENOSPC` injection is not an actually exhausted disk.
- `recovery-equivalence.test.ts` removes the original installation directory and discards its in-memory key, then restores from the retained artifact/key. Every stored business/report record and every parsed workbook sheet equals the baseline, including literal 100 TRY sales, 40 TRY covered gross profit and 60 TRY corrected expenses. This is synthetic filesystem isolation on one macOS host, not independent physical-media acceptance.
- That test exposed insertion-order-dependent Excel evidence layout. `e63538f` records the focused failing export contract; `11916c0` sorts exported evidence keys and uses canonical serialized values. Financial rules are unchanged.

Fixture SHA-256 identities:

| Fixture source | SHA-256 |
| --- | --- |
| `tests/helpers/recovery-fixtures.ts` | `b4eb22748c903a0dd68d2b60e19950a120c35a2fc1237a2547fb5930e7dece72` |
| `tests/helpers/business-fixtures.ts` | `283af17c152434020cb749ffbe6721b38400f4f39120aa3f415b612a708d0632` |
| `tests/helpers/expense-fixtures.ts` | `bb794d71bbdad93b55cf66e076ea65868ff6efd4e15d37d157974abc9460d006` |

## Independent reviews and UI

[Standards](phase-9-standards-review.md), [Spec](phase-9-spec-review.md) and [comment](phase-9-comment-review.md) reviews were independent of the implementation owners. They identified startup migration with unavailable configuration, misleading restore-failure language, restart-idempotence in rollback and unavailable audit storage; follow-up outcomes are recorded in those reports.

Packaged screenshots use only synthetic records: [backup 1120](phase-9/phase-9-recovery-1120.png), [backup 680](phase-9/phase-9-recovery-680.png), [preview 1120](phase-9/phase-9-restore-preview-1120.png), [preview 680](phase-9/phase-9-restore-preview-680.png). The Impeccable detector returned `[]`. The UI extends the incumbent system. The [UI finish review](phase-9-ui-review.md) found a narrow-window brand regression and Turkish date/time presentation defects. Both were corrected and independently scored resolved (`ship` at that correction scope). A specialized fresh reviewer could not be started because of the thread limit; the independent Spec reviewer substituted and also verified incumbent-system preservation.

## Remaining gates

The [Windows continuation](../operations/windows-phase-9-handoff.md) owns Windows packaged execution, actual OS key protection, temporary-file ACLs, open-handle/flush/rename behavior, disk exhaustion, interruptions, installer lifecycle and actual independent machine-loss proof. macOS profiles and a substituted key protector in automated desktop tests cannot satisfy those checks. A same-disk destination and key are synthetic test fixtures, not recovery storage acceptance.

The [Turkish instructions](../operations/recovery-tr.md) describe setup, retention, restore and failure recovery. Source-dependent financial acceptance, full-volume performance, Phase 10 reveal and L01 remain separate.

## Commit sequence

| Commit | Contract/change |
| --- | --- |
| `f17c623` | Durable backup intent and named IPC red contracts |
| `4db754e` | Independent record and Excel recovery contract |
| `3d29ef9` | Schema 6 transactional checkpoint generations |
| `e63538f` | Persisted Excel ordering regression |
| `11916c0` | Stable workbook evidence after recovery |
| `2b81b62` | Authenticated backup, durable restore, IPC and Turkish workspace |
| `3d5cbc1` | Recovery failure/concurrency/platform-boundary regression coverage |
| `e12aa5b` | Distinguish committed restore from cleanup failure; observed red then green regression |

## Final build and review outcome

The final macOS arm64 package contains implementation `e12aa5b`. `app.asar` SHA-256: `58d45691720721e8e43d99ed6c33893a3057e794f16cec75f3e9a23e59ed7485`. `npm run test:desktop` ran `npm run build` and local packaging before the final 22-pass/1-Windows-skip run. Typecheck and lint passed after the final source change.

All original material Spec and Standards findings were resolved and independently rechecked. The final cleanup regression first returned raw `cleanup unavailable`; it now reports `RESTORE_COMMITTED_RESTART_REQUIRED` and preserves the restored state. The reviewer independently ran the targeted regression. No open material code finding remains within this reviewed local scope; this is not Windows acceptance.

Documentation links and `git diff --check` passed. Screenshots were reviewed at 1120 and 680 CSS pixels using synthetic fixtures. Recovery notes, review outcomes and the Windows continuation are committed alongside this record.

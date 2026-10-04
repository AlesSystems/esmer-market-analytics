# Manual expense entry verification

The owner can add one expense from Giderler through the secondary **Elle gider ekle** action. Excel remains the primary entry path. Creation preserves exact amounts, manual provenance, immutable history, and period completeness rules.

The implementation follows [the reviewed plan](../superpowers/plans/2026-10-04-manual-expense-entry.md), extending phase 7 tasks 7.1–7.2 and [issue #10](https://github.com/AlesSystems/esmer-market-analytics/issues/10).

## Environment and scope

- Branch `codex/live-mock-tracking`; starting commit `dae315b21f6605443612d7db41cfcddaedc0e0d2`.
- Local macOS 27.0 arm64, Node 24.15.0, packaged Electron 44.3.0 application.
- Synthetic expense, workbook, source-preview, and financial-package fixtures only. No private source inspection or production access.
- No dependency changes, source writes, external publication, or PR.
- Schema 8 adds immutable `expense_commands` receipts and a receipt backup trigger. Existing schema 7 backups upgrade through the established migration path. Earlier application versions reject the newer schema.
- The isolated renderer session now uses `persist:esmer`. Local storage contains only the pending opaque command ID. Draft field contents remain in memory. Permission and network restrictions remain applied to that session.

## Observed test sequence

The initial focused tests failed with `service.create is not a function`, exposing missing creation behavior independently of the toolchain. Commit `36c7a34` records this contract. Commits `51fd4ee`, `82bdf0f`, `e9cd85f`, and `2ad628a` add the command, recovery validation, boundary coverage, and guarded form.

At `2ad628a`, the complete local checks passed:

| Command | Actual result |
| --- | --- |
| `npm run test:unit` | 50 passed. |
| `npm run test:integration` | 324 passed; 14 skipped across two environment-dependent files. |
| `npm run typecheck` | Passed. |
| `npm run lint` | Passed. |
| `npm run build` | Passed. |
| `npm run test:desktop` | Actual packaged macOS application; 78 passed, 11 skipped. |

Skipped live-source and private-backup cases are not acceptance evidence. No SQL test or private package configuration was supplied for this run.

The focused manual tests cover localized amount parsing and precision, required and unknown values, duplicate consent and complete match-set changes, stable references in both entry directions, active loss evidence collisions, aggregate labour, owner contributions, separate incurred/payment periods, completeness invalidation, retained pins, source activation, disk reopen, two store connections, transaction rollback, and receipt-aware encrypted backup/restore. Packaged tests cover all three hosts, keyboard focus, dirty and busy navigation, real lost-reply resolution, process restart, and manual correction/void/restoration history.

## Independent review and repairs

Independent review used the configured GPT-6.1 worker and reviewer roles within one model family.

- Comment review found no new comments or suppressions requiring action.
- Impeccable's detector returned an empty finding list. Desktop and narrow captures were inspected in two bounded rounds. The reviewer scored its hidden-reference-error and duplicate-review-focus fixes resolved.
- The Standards review found malformed enum coercion at the new boundary.
- The Spec review found active-task draft protection loss, missing required record review after an absent receipt, payment-only outside-period feedback, and Source/Sales error-retry actions bypassing draft protection.

The original reviewers verified all their findings resolved, independently within one model family. Standards: one P2 finding resolved, none open. Spec: four findings resolved (worst originally P1), none open in the reviewed scope. Impeccable's scoped absent-receipt follow-up also returned ship; its documentation handoff confirmed the existing design files should remain unchanged.

| Repair | Commit | Acceptance evidence |
| --- | --- | --- |
| Reject coerced tax/loss enums | `aa283a0` | Malformed arrays leave no receipt/revision; legitimate unknown retains `UNKNOWN_TAX`. Independent focused regression passed. |
| Retain draft protection through no-op/failed navigation | `ebf4358` | All three packaged hosts retain the draft and guard subsequent navigation. |
| Require current-record review after an absent receipt | `a0f3cc2` | Fields/save disabled; focus reaches **Kayıtları incele**. Pending ID and review gate survive task remount and full restart. Failed record loading retains both; explicit successful review clears the ID and opens records. |
| Explain/link separate payment periods | `7a145fc` | January-incurred/February-paid notice names both; selected January remains until the link goes to February. Service returns payment period from the original historical revision. |
| Guard Source/Sales error recovery | `f3a3d67` | Packaged synthetic rejected source query and transient sales retry prompt before replacement, preserve fields on Continue, and retain protection after a failed retry. |

The worker's final focused integration suite passed 13/13; packaged manual plus existing expense tests passed 14/14. Parent full-suite results below govern final acceptance.

Saved synthetic captures: [desktop form](manual-expense-entry/desktop.png), [narrow form](manual-expense-entry/narrow.png), and [required record review](manual-expense-entry/absent-receipt.png). Keyboard tests verify first invalid field visibility/focus, duplicate-review arrival focus and acknowledgment by Tab/Space, and required-review action focus. Narrow capture is a desktop-window responsiveness probe, not a supported mobile product.

## Final verification

Application build/commit: `f3a3d675`, branch above. Fixture identities: committed synthetic `manual-expense` service fixtures, packaged manual-expense profiles, synthetic workbook/source snapshots and financial packages. Expected: atomic exact saves/replays, preserved provenance/history/pins, guarded navigation, required review after absent receipts, no invented completeness. Actual focused results meet those expectations.

| Task / related gate | Procedure | Result / evidence |
| --- | --- | --- |
| M01–M04 / A02 G05–G06, A04 | Focused creation, timing, completeness, source activation and retained-pin tests | Passed. New expense invalidates incurred-period completeness; separate payment period remains separate; accepted versions remain unchanged. |
| M03 / A06 | Schema 7 upgrade, original-revision receipt validation, disk reopen, encrypted backup/restore | Passed on macOS synthetic fixtures; receipt-only changes schedule a backup and restore identified Excel receipts after later void. |
| M05 / A05 and UI slice of A07 | Named IPC validation plus actual packaged navigation/keyboard/restart tests | Focused and final full suites passed on macOS; Windows acceptance remains open. |

Final checks at `f3a3d67`: unit 50 passed; integration 325 passed, 14 skipped; typecheck/lint/build passed; serialized actual packaged desktop suite 82 passed, 11 skipped. Commands are the same complete scripts shown above. Logs: `final-unit.log`, `final-integration.log`, `final-static.log`, `final-desktop-serialized.log`. M05 is complete for this local synthetic slice; this is not blanket closure of foundation acceptance gates.

Skipped cases include environment-dependent live SQL, private estimate/actual-backup packages, full 25,000-document performance, optional pagination/visual journeys and Windows lifecycle checks. No SQL/private-package configuration was supplied. Their requirements remain open.

Raw local logs, structured decisions, workflow state and axis/finish reports are under ignored `work/poteto/manual-expenses/`. The first final desktop packaging attempt failed before tests because coordinator builds overlapped on `dist/` (missing generated `app.css`). This was recorded as orchestration failure, diagnosed, and rerun serially after static build completion. It is not a failing application assertion.

The final [decision log snapshot](2026-10-04-manual-expense-decisions.tsv) records design, implementation, repairs and verification. All implementation commits, in order: `36c7a34`, `51fd4ee`, `82bdf0f`, `e9cd85f`, `2ad628a`, `aa283a0`, `ebf4358`, `a0f3cc2`, `7a145fc`, `f3a3d67`. The subsequent documentation commit records this evidence and the approved plan; no PR or push was requested.

## Windows acceptance remains open

`npm run package:win` was attempted at `f3a3d67` and exited 1 during NSIS generation: bundled `makensis` is a Mach-O x86_64 executable, while this host is arm64; spawning it returned system error -86. Neither installer nor portable distribution was produced/verified. The existing build configuration/dependencies were preserved. Logs: `windows-package.log`, `windows-toolchain.log` (executable/host architecture inspection).

The generated `release/win-unpacked` payload was independently inspected with `node scripts/verify-package.mjs release/win-unpacked/resources/app.asar` (80 dependency notices passed) and `node tools/release-inventory.ts release/win-unpacked release/release-inventory.json` (88 files, 3,079 archive files, zero inventory violations). These partial checks do not replace distribution verification or Windows execution. Logs: `windows-unpacked-notices.log`, `windows-unpacked-inventory.log`. M06 is blocked on an environment that can build/run the Windows distributions.

Cross-packaging is distinct from running the Windows application. Actual Windows startup/upgrade, offline behavior, 100%, 125%, and 150% scaling, pending-command restart, migration, encrypted recovery, and installer lifecycle checks require a Windows environment. This macOS run does not close A07. L01 live integration was not attempted and remains outside this slice.

Continue on the same branch. Build with `npm run package:win`, run the packaged tests with `npm run test:desktop` on Windows, then exercise the manual journey, interrupted reply/restart, schema 7 upgrade, older-backup absence review, and receipt-only backup/restore. Preserve existing owner data and use synthetic profiles for verification.

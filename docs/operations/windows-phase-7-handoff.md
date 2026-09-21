# Continue Phase 7 on Windows

Continue [issue #10](https://github.com/AlesSystems/esmer-market-analytics/issues/10) on branch `codex/phase-7-expenses-operating` and [existing PR #21](https://github.com/AlesSystems/esmer-market-analytics/pull/21). The user requested a stop before Windows implementation or testing. The macOS run does not establish Windows acceptance. Do not merge or close the issue during this handoff.

Read [local evidence](../evidence/phase-7-local.md), the [expense contract](../contracts/expense-completeness.md), [implementation plan](../superpowers/plans/esmer-market-implementation-plan.md#phase-7--expenses-adjustments-and-operating-results), repository `AGENTS.md`, and the foundation documents before changes. Use synthetic workbooks and an isolated application profile. No production access, source inspection, contact with Eralp, or installation on his computer is authorized.

## Prepare the branch

Use the existing checkout if it is on this branch. Preserve unrelated changes. Otherwise fetch and switch to the remote branch.

```powershell
git status --short --branch
git fetch origin
git switch codex/phase-7-expenses-operating
git pull --ff-only
git log -8 --oneline
node --version
npm --version
npm ci
```

Record Windows edition/build, CPU, RAM, architecture, display resolution/scaling, Node/npm and Electron versions, exact commit, and fixture identities. The locked toolchain expects Node 24.15 or newer within major 24.

## Run the automated checks

Run each command separately and retain its exit status and output.

```powershell
npm run test:unit -- tests/unit/expense-validation.test.ts
npm run test:unit -- tests/unit/operating-profit.test.ts
npm run test:unit -- tests/unit/expense-workbook-boundary.test.ts
npm run test:integration -- tests/integration/expense-import.test.ts
npm run test:integration -- tests/integration/adjustment-history.test.ts
npm run typecheck
npm run lint
npm run build
npm run test:unit
npm run test:integration
npm run test:desktop
npm run package:win
```

`test:desktop` builds and launches the packaged application. Do not substitute a browser or development server. After any Windows fix, rerun the affected checks and package inspection. Keep a missing executable/toolchain failure separate from a failed behavioral assertion.

## Exercise the packaged application

Use both the portable executable and an NSIS installation in isolated profiles. Record build hashes and package paths. Retain screenshots only of synthetic data.

1. Open with an empty local store and no network requirement. Reach **Giderler** without a sales package. Save the Turkish Excel template through the real native save dialog. Cancel open/save dialogs and verify that no expense revision or successful batch appears.
2. Fill the canonical workbook with synthetic rows. Check Turkish characters, `1.234,5678` text decimals, native Excel numeric/date cells where supported by the contract, and fractional amounts. Include one operating expense of 50 incurred in January and paid in February, plus an owner contribution of 500. Import through the real native open dialog, including a Turkish-character folder path.
3. Confirm that preview changes no financial records. Inspect each row explanation. Reject formula cells with cached, stale and absent values, unknown columns, employee/payroll columns, impossible dates, inconsistent amounts and unsupported structures. Rejected values must not appear in logs or retained records.
4. Confirm a valid workbook. Verify provenance, row identities and import history. Reimport the same bytes before and after restart and observe no duplicated records. Use another workbook with an existing stable reference; identical values must remain idempotent and changed values must require a correction. Explicitly preserve distinct rows with the same date and amount when duplicate review suggests them.
5. Review January and February. The incurred expense affects January only; the payment appears in February only. Successful import must leave completeness unconfirmed. With fully covered, reconciled synthetic gross profit 200 and explicit reviewed owner confirmation, verify estimated management operating profit 150. The separate owner contribution 500 does not change 150. Revoke confirmation and verify `Faaliyet kârı hesaplanamıyor — gider verileri eksik.`
6. Check that unknown tax/cost treatment, material unclassified expenses, excluded historical-cost rows, sales discrepancies and incomplete period coverage block the headline. Covered gross estimates remain available where supported. Check separately evidenced losses and records already included in cost to prove no double deduction.
7. Correct an expense with a reason, inspect its original and revised provenance, and reverse or restore it through the supported UI. Move its incurred date between months and verify that both affected completeness reviews become stale. Confirm stale previews/reviews cannot overwrite newer changes. Open a pinned report before a correction and check that it remains reproducible until explicitly refreshed.
8. Import a newer synthetic source package after expenses, corrections and completeness exist. Confirm app-owned records survive, and changed/missing source adjustment targets are flagged rather than silently reused. Retain the prior accepted report output in the automated evidence.
9. Restart, upgrade the isolated installation and exercise documented uninstall/reinstall behavior. Preserve the profile deliberately and verify expense history, app revisions and report pins. Never use a real owner profile for lifecycle tests.
10. Inspect the actual application at Windows display scaling 100%, 125% and 150%, including the supported narrow window. Check keyboard focus, correction controls, duplicate selections, wide-table scrolling, busy/error states and readable Turkish explanations. Browser viewport resizing alone is not evidence of OS scaling.
11. Record a physically disconnected offline check separately from automated network blocking. Document interactive unsigned-publisher warnings. Do not claim full-volume performance from small synthetic fixtures; keep the documented full-data two-second benchmark gate open until measured on authorized data/hardware.

## Record the result and return

Create `docs/evidence/windows-phase-7.md`. For each task/gate record the commit/build, fixture, environment, command/procedure, expected result, actual result, evidence path and limitation. Include package hashes, notice inspection, screenshots, G05/G06 and the literal 200/50/500 oracle. Do not copy private workbooks, payroll, backups, credentials or identifiable records into Git.

Fix only Phase 7 Windows failures. Add a focused failing test first for behavioral fixes; commit coherent `test:`, `fix:` and `docs:` changes to this same branch. Update the existing PR with the evidence. Leave source-dependent A02–A05, unperformed A07 checks, later phases and L01 open. Return the branch, commit hashes, PR link, checks, evidence paths and unresolved gates. Do not merge without separate direction.

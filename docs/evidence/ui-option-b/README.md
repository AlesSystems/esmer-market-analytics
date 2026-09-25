# Option B implementation evidence

Date: 2026-09-25. Branch: `codex/option-b-ui`. Initial implementation build: `baaa256`; final runtime build: `a56d925`, with test adapters through `ac394ad`.
Initial baseline: `9af7305`. Current main `76ca815` was merged before handoff. Related issue: [#3](https://github.com/AlesSystems/esmer-market-analytics/issues/3).

This implements the user-selected Option B from the [redesign specification](../../superpowers/specs/2026-09-25-ui-redesign.md). It supplies synthetic implementation evidence for A03 and A07, not completed owner or source acceptance.

## Scope and decisions

The shared navy sidebar owns navigation, period, actual cutoff and operations. The monthly answer uses the pinned report, with a dominant sales figure, financial ledger, categories and daily trend. Purchasing has local ledger views. Expenses separate records, import, corrections and completeness review. Reports separate the version list, saved-version comparison and pinned report detail. Recovery retains its deliberate preview and confirmation path.

`SalesWorkspace` remains the sole analysis-session owner. A new period cannot display the previous period's monthly figures if its report request fails. Import and recovery navigation preserve report context. Expense headlines reuse the service's existing decimal calculation components. Import history reads existing persisted batches through availability. No schema migration, dependency change, new privileged IPC operation or renderer financial calculation is introduced.

Applied Poteto principles: Model the Domain kept one typed report context; Laziness Protocol reused the existing services and packaged test harness; Prove It Works required real packaged Electron journeys. The named Impeccable finish-reviewer role was unavailable, so a fresh independent reviewer used the skill's degraded review contract. Review scope and disposition are recorded below.

## Environment and fixtures

- Windows `10.0.26200`, x64. Build/test Node `24.15.0`; packaged Electron `44.3.0`, embedded Node `24.20.0`.
- Actual display scale factor `1`, 2560 by 1440 monitor. Captures use 1440 by 1000, 680 by 900 and 453 by 900 CSS-pixel viewports. Narrow captures are full-page images.
- `businessPackage` and `businessRecords` from `tests/helpers/business-fixtures.ts`; `journeyRecords` and `salesPackage` from `tests/helpers/sales-fixtures.ts`. All records are synthetic.
- The overview capture intentionally has net sales 200 TRY, covered estimated gross profit 40 TRY, estimated cost 60 TRY and 50% cost coverage. Expenses are unavailable. This small fixture has one category and one daily data point.
- The implementation worktree uses the existing dependency directory via a junction. Windows builder warned about `fflate@undefined` and `scheduler@undefined` path discovery; dependencies are bundled by the existing build. Runtime journeys exercise the resulting package.

## Initial verification record

| Gate / procedure | Expected | Actual |
| --- | --- | --- |
| A03/A07: `npm run test:unit` | Existing calculations and contracts remain valid | 29 passed in 9 files |
| A03/A07: `npm run test:integration` | Service and persistence contracts remain valid | 198 passed; 27 failed in 5 Windows recovery files, reproduced unchanged on baseline |
| A03/A07: packaged `npm run test:desktop` | Existing and new journeys work with the new navigation | Initial full run 23 passed, 4 failed; focused reruns and final result below |
| Focused sales drill-down | Filters, receipt/source evidence, signed returns and pinned dataset survive navigation/import | 2 passed after updating assertions to open the new evidence disclosure |
| Import-history integration | Persisted successful/failed imports appear without changing active data | 1 passed |
| Expense headline integration and operating unit checks | Missing/unknown inputs stay unavailable; existing arithmetic is unchanged | 13 integration and 3 unit checks passed |
| TypeScript, ESLint, diff whitespace | No new diagnostics | Passed before final packaging; final confirmation below |

The first sidebar and workspace tests failed on the old navigation before implementation. Expense headline tests failed before the service summary existed. Later tests cover the period/session guard, two saved-version comparison independent of candidate approval, keyboard focus restoration, import cancellation and missing-period behavior.

### Baseline recovery failures

The unchanged baseline produced the same 27 integration failures across `recovery-boundary`, `recovery-worker`, `encrypted-backup`, `recovery-equivalence` and `restore-failures`. Failures include directory `fsync` returning `EPERM` in `src/recovery/files.ts` and Windows symlink permissions, followed by dependent missing-backup/cleanup failures. Recovery implementation files were not changed by this redesign.

A separate fresh package of clean baseline `9af7305` also failed `clean-install-restore.test.ts` at the setup-success assertion. Both baseline and redesign displayed “Kurtarma kurulamadı. Hedefi ve anahtar dosyasını kontrol edip yeniden deneyin.” The baseline was built and run with `npm run test:desktop -- tests/desktop/clean-install-restore.test.ts --output=work/option-b-baseline-recovery-results` in the original checkout. Baseline `app.asar` SHA256 was `16f56be3b556f11ec2ea999c0dc5a1ee0efbcf1ea211ee087904bc679bcca303`. Original checkout remained clean.

## Visual and accessibility evidence

The repeatable capture procedure is `tests/desktop/option-b.test.ts`. It runs the packaged app, imports the synthetic fixture, visits all destinations, opens import history over the report form, checks document overflow at both narrow widths and emulates forced colors. [Environment metadata](images/environment.json) records the actual packaged runtime and monitor.

| Surface | Evidence |
| --- | --- |
| Empty store | [empty.png](images/empty.png) |
| Monthly desktop | [overview-1440.png](images/overview-1440.png) |
| Monthly narrow | [overview-680.png](images/overview-680.png), [overview-453.png](images/overview-453.png) |
| Sales and purchasing | [sales.png](images/sales.png), [purchasing.png](images/purchasing.png) |
| Expenses and reports | [expenses.png](images/expenses.png), [reports.png](images/reports.png) |
| Operations and recovery | [operations.png](images/operations.png), [recovery.png](images/recovery.png) |
| Forced colors emulation | [forced-colors.png](images/forced-colors.png) |

Relative sRGB luminance calculation gives contrast ratios of 16.15:1 for ink/white, 7.58:1 for secondary/white, 6.24:1 for primary blue/white, 5.14:1 for green/white, 6.57:1 for red/white, 6.64:1 for amber text/light amber and 14.05:1 for sidebar labels/navy. These are token-pair checks, not an exhaustive accessibility certification.

The independent visual review required three fixes: dark import-history text on white, a sidebar stacking level that keeps the operations panel above report controls, and a blue primary import action in the empty state. All three were applied together and the same views were recaptured. The reviewer scored all three resolved and returned `ship` for that fix list; this is not whole-surface acceptance. All eleven captures were valid. The [detector result](impeccable-detector.json) was empty. A separate standards/code review found no new material findings in `9af7305..baaa256` and confirmed all three earlier context/focus findings resolved.

## Verification after merging current main

Remote main advanced during implementation. Merge `a56d925` brought in `76ca815`, including its Windows recovery filesystem fixes and release checks. The earlier recovery failures above are historical observations and no longer describe the final branch.

| Procedure | Final result |
| --- | --- |
| `npm run test:unit` | 29 passed in 9 files |
| `npm run test:integration` | [229 passed in 30 files](checks/final-integration.log) |
| Packaged Playwright full suite | [28 passed, 1 locator failure](checks/final-desktop.log); the restore assertion matched both visible ledger and collapsed evidence values |
| Focused packaged restore after scoping that assertion | [1 passed](checks/final-restore.log), including real Windows key protection, encrypted backup, fresh-profile restore, pinned report and Excel checks |
| `npm run typecheck`, `npm run lint`, `git diff --check` | Passed |
| `npm run package:win` | [Passed](checks/final-package.log); notices for 6 dependencies, 75 runtime files / 291 archive entries, no inventory violations, both distributions match the inspected payload |

Thus all 29 desktop cases have passing results across the full run and the focused correction; this is not a claim of a subsequent all-green full-suite run. New workload coverage uses three fresh processes and a complete 25,000-document synthetic package. All measured ordinary interactions passed the 2-second threshold, without claiming real market-volume performance.

The [workload receipt](checks/performance.json) records samples and synthetic package identity. The final portable wrapper also passed two launches against an isolated seeded profile, with accepted-report/business hashes preserved, network-blocked offline reload and no development runtime in the child PATH. See the [portable proof](checks/portable-proof.json) and [distribution inspection](checks/distribution-inspection.json). Its profile-seeding lifecycle test passed separately.

The final x64 NSIS and portable artifacts are version `0.2.0`. No installer was executed. Final `app.asar` SHA256 is `6d931a6c27b83651e987a7ae7ee55a8ed1b19d91a8ee8e39e28892f83aed2097`. Visual captures remain from the reviewed `baaa256` build; the merge changed recovery/runtime release handling, with no further UI-source edits.

## Remaining acceptance

A03 and A07 remain open. Actual Windows 150% system scaling, owner task acceptance and real-source reconciliation are not completed by this PR. Forced-colors emulation is not a claim that native Windows high-contrast configuration was tested. No source inspection, owner contact, installation on the owner's computer or live connection occurred.

Continue on `codex/option-b-ui`. Test the packaged app at actual Windows 150% scale with a 680px window. Exercise period/cutoff visibility, wrapped navigation, ledger scrolling, receipt/source focus return, expense review, saved-version export and recovery preview/cancel. Record actual results against A03/A07 before closing either gate. The merged [Windows recovery limitations](../phase-10-windows-recovery-files.md) still apply, including unproven directory-entry persistence after power loss.

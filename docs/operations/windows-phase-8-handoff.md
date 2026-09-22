# Continue Phase 8 on Windows

Continue [issue #11](https://github.com/AlesSystems/esmer-market-analytics/issues/11), Tasks 8.1 and 8.2, on branch `codex/phase-8-reporting`. Update the existing Phase 8 PR. The implementation run stopped before Windows packaging, testing or platform changes at the user's request. macOS evidence does not establish Windows acceptance. Do not merge or close the issue during this handoff.

Read `AGENTS.md`, the foundation documents, [Phase 8 in the roadmap](../superpowers/plans/esmer-market-implementation-plan.md#phase-8--complete-turkish-reporting-report-revisions-and-excel-export), [local evidence](../evidence/phase-8-local.md), and [report contract](../contracts/reports.md). Preserve unrelated work. Use isolated application profiles and synthetic fixtures. No production access, renewed source inspection, owner contact, installation on Eralp's computer or later-phase implementation is authorized.

## Prepare the same branch

Run each command separately. Use the existing branch checkout where available.

```powershell
git status --short --branch
git fetch origin
git switch codex/phase-8-reporting
git pull --ff-only
git log -10 --oneline
node --version
npm --version
npm ci
```

Record the exact commit, Windows edition/build, CPU, RAM, architecture, resolution, OS scaling, Node/npm and Electron versions. Use the locked Node 24 toolchain. Attach the existing PR to the Windows task.

## Run application checks

```powershell
npm run typecheck
npm run lint
npm run test:unit
npm run test:integration -- tests/integration/report-revisions.test.ts
npm run test:integration -- tests/integration/excel-report.test.ts
npm run test:integration -- tests/integration/desktop-boundary.test.ts
npm run test:integration
npm run build
npm run test:desktop
npm run package:win
```

`test:desktop` packages and exercises the actual application. In particular, retain results for `monthly-overview.test.ts`, `unavailable-states.test.ts`, `sales-drilldown.test.ts`, `purchasing.test.ts`, `expenses.test.ts` and `startup.test.ts`. A browser preview does not replace packaged Electron checks. Record toolchain failures separately from failed behavioral assertions. The final macOS reruns exposed intermittent Electron shutdown timeouts after successful assertions; see local evidence. Investigate any Windows recurrence from a trace rather than increasing committed timeouts without identifying the cause.

## Verify native Windows behavior

Use both the portable executable and an NSIS installation with isolated profiles. Record executable/archive hashes and package paths. Retain only synthetic screenshots and workbooks.

1. Start offline with an empty store, then import the synthetic business package. Confirm **Aylık Market Özeti** is the starting view. Check sales, completed transactions, basket, comparisons, covered costs/gross margin, expenses, labour and conditional operating result against independent fixture values. Every estimate retains its coverage and method. Missing expenses do not become zero or a profit claim.
2. Navigate by keyboard from the monthly view to sales, product, transaction and source detail; purchasing and supplier returns; expenses; and report history. Test Turkish `I/ı`, `İ/i`, `ş`, `ğ`, `ü`, `ö`, `ç`, search and ordering, TRY decimals, date presentation, and separate `adet`/`kg` units. Customer returns and supplier returns must remain distinct.
3. Save a reviewed synthetic report with a reason. Restart. Reopen its values and explanations. Import a corrected/deleted source fixture, correct an expense, and compare a new candidate with the accepted version. Preserve the accepted version, evidence, original figures and review history. Check changed methods and evidence even when the displayed amount is unchanged. Acceptance must never turn estimated profit into trusted exact profit.
4. Export the selected report through the real native save dialog, including a Turkish-character folder and filename. Cancel the dialog and verify no false success. Open the workbook in the available Windows spreadsheet application and record its name/version. Check numerical versus text cells, Turkish round-trip, fractional precision, formula-like text and absence of generated formulas. Exact decimal text must remain intact where Excel numeric precision is insufficient.
5. Select an older report, begin its export, and refresh the source while the save dialog remains open. Every sheet must retain the selected report identity, period, cutoff, method, confidence, warnings, filters and values. Reconcile totals and detail with the selected UI report. Record native overwrite and save-failure behavior using disposable files only.
6. Exercise empty, loading, partial, stale, warning, failed, cancelled and unavailable-profit states. During a sufficiently large synthetic import and monthly calculation, observe progress, navigate and cancel. Measure cancellation latency and navigation responsiveness. Cancellation before activation must preserve the active dataset, expenses, revisions and accepted reports. If activation has committed, completion must win over a late cancellation request. After a failed/cancelled job, retry successfully.
7. Inspect Windows OS scaling at 100%, 125% and 150%, plus the supported minimum window. Check focus visibility/return, long Turkish labels, evidence IDs, report comparison tables and horizontal scrolling. Browser viewport resizing alone does not prove OS scaling.
8. Restart, upgrade the isolated installation from the prior release, uninstall/reinstall under the documented preservation policy, and compare expenses, corrections, confirmations and accepted reports. Never use an owner profile. Verify packaged dependency notices and absence of private files or source credentials.
9. Record a physically disconnected offline run separately from automated network blocking. Record unsigned-publisher prompts. Document cold/warm dashboard and drill-down timings with dataset identity/size and repeated measurements. Small synthetic fixtures cannot pass the full imported-dataset two-second gate.

The synthetic demonstration label must remain visible in UI and workbook. Do not populate a reveal profile with synthetic reports or manufacture an owner's expense-completeness confirmation. A real-data reveal and source-semantic validation remain separate work.

## Record and return

Create `docs/evidence/windows-phase-8.md`. For every applicable task/gate include commit/build, fixture identity, environment, command/procedure, expected value, observed value, evidence path and limitations. Fix only Phase 8 Windows defects; expose behavior failures with focused tests and use coherent Conventional Commits on this branch. Update the existing PR with results and screenshots.

Leave unperformed A03/A07 checks, source-dependent correctness, full-volume performance, Phase 9 recovery, Phase 10 reveal and L01 open. Return the branch, commit hashes, PR link, test results, evidence locations and remaining gates. Do not merge without separate direction.

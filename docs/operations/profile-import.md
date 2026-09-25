# Profile a synthetic import

Use this developer command to measure the existing local import APIs before proposing a package or persistence change. It creates its own synthetic data and temporary SQLite stores. It accepts no source path, credentials, or connection parameters.

Use Node 24 as required by `package.json`, and install the locked dependencies with `npm ci`. Run these commands from the repository root in PowerShell.

```powershell
$env:npm_config_script_shell = 'cmd.exe'
npm exec -- esbuild tools/profile-import.ts --bundle --platform=node --format=esm --packages=external --outfile=work/profile-import.mjs
node work/profile-import.mjs 1000 > work/profile-1000.json
if ($LASTEXITCODE -ne 0) { throw 'Profile failed' }
```

The optional argument is the number of sale documents, each with one line. It defaults to 100 and accepts integers from 1 through 25,000. The existing package row and byte limits still apply. Invalid arguments or a failed scenario return a nonzero status and `PROFILE_FAILED`. A failed run does not publish a successful receipt.

Run each size in a fresh process. Avoid simultaneous tests or builds when collecting timing evidence.

```powershell
foreach ($count in @(100, 1000, 10000, 25000)) {
    node work/profile-import.mjs $count > "work/profile-$count.json"
    if ($LASTEXITCODE -ne 0) { throw "Profile failed for $count" }
}
```

Rebuild the profiling bundle after changing code. Keep the checkout unchanged throughout a measurement series so the recorded commit identifies the measured implementation. For comparisons, use the same fixture counts, machine, Node version, and profiler revision. Retain the JSON receipts with the decision or evidence record.

## Read the receipt

The fixture is `synthetic-business-profile-v1`. Each original sale has net sales of TRY 100 and historical estimated cost of TRY 60. The corrected snapshot changes the first sale to TRY 120. IDs start above JavaScript's safe integer range and remain strings. Decimal fields retain fifteen fractional digits in the package and store.

The profiler checks independent integer totals, exact stored records, accepted-report retention, app-owned expense and setting preservation, malformed-candidate rejection, and SQLite backup reopening. It generates Excel from the accepted original report after the corrected snapshot becomes active. The profiler measures Excel buffer generation. Workbook round-trip checks remain in the separate integration suite.

`stages` records elapsed milliseconds and memory before and after each API call. `processHighWaterRssKiB` is the process-lifetime resident-memory high water. It is not a per-stage peak. `readBackingBufferBytes` records the allocation retained by the first file read. File sizes are observed at the end of the scenario.

The profiler retains input buffers, parsed records, snapshots, and reports to make its correctness comparisons. Its memory usage includes those extra copies. Do not report it as the actual Electron service footprint. Stage samples also miss temporary synchronous heap peaks, and end-of-run file sizes miss temporary disk peaks.

## Keep acceptance separate

This command does not exercise SQL Server extraction, Electron IPC, UI response times, cancellation, encrypted recovery, or the approved historical population. SQLite backup reopening is not the encrypted recovery workflow. The uniform one-month scenario does not cover skewed histories, cross-period returns, or multiple accepted months.

The [capacity decision](../decisions/issue-26-import-capacity.md) records why the current limits remain. [Issue #26](https://github.com/AlesSystems/esmer-market-analytics/issues/26) still requires source evidence, measured full-path budgets, and real-data acceptance.

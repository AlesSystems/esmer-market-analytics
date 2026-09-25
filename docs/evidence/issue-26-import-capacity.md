# Issue 26 synthetic import capacity evidence

This is an intermediate contribution to [issue #26](https://github.com/AlesSystems/esmer-market-analytics/issues/26), R3 and R5, and implementation Tasks 3.2 and 10.1. It does not implement real SQL Server import or complete R1 through R6. No R7 live handoff is claimed.

The work uses `codex/issue-26-real-import` in an isolated worktree based on `dc99905821d9d265670787c067a8ec01910974c7`. Application code is tested at `2f3d607`. The [decision](../decisions/issue-26-import-capacity.md), [procedure](../operations/profile-import.md), and [raw profile receipts](issue-26-import-profiles.json) describe the scope and reproduce the measurements.

## Environment and data

The host is Windows 11 Pro x64, build 26200, Intel Core i9-12900H, 20 logical CPUs, and 33,974,288,384 bytes of RAM. Commands use Node 24.19.0 and the locked dependency graph. The system initially selected Node 22.19.0. `npm ci` completed with an engine warning under that version. All test, build, profile, and package commands use Node 24 with a process-local PATH override. Package scripts use process-local `npm_config_script_shell=cmd.exe`.

All inputs are generated `synthetic-business-profile-v1` fixtures. Each sale has one line, net sales of TRY 100, and historical estimated cost of TRY 60. A replacement snapshot changes the first sale to TRY 120. Each package's exact SHA-256 and row counts are retained in the receipts. There are no customer records, credentials, source locators, or private backups in this evidence.

## Observed red and green behavior

The first profiler test could not collect because its new module did not yet exist. That was a missing API, not a demonstrated application calculation failure. The implemented profiler then passed its independent two-sale oracle and invalid-argument checks.

The file-reader tests demonstrated three application failures before the fix. A four-byte file retained a 33,554,433-byte backing buffer. Shrinking that file after `stat` returned a one-byte success. Growing it returned a five-byte success. Tests use real files and handles, with a filesystem-boundary spy to perform the mutation after the size observation. The corrected reader rejects both size changes and closes the handle.

The final focused run passes six tests. The reader retains exactly the input size, permits an exact configured limit, preserves empty-file byte behavior, rejects oversized or invalid limits, and retains the regular-file restriction. Package parsing still rejects invalid contents.

The audit reviewer requested a retained red-run artifact. The parent reproduced the three failures with only the baseline reader substituted, retained the [sanitized failure output](issue-26-reader-red.txt), restored the current file byte-for-byte, and reran all four reader tests successfully. A final Git diff check confirmed restoration. [Verification metadata](issue-26-verification.json) identifies the test and implementation revisions.

## Allocation measurements

The same fixture hashes were checked across both series. Each scenario ran in a fresh process on this host. The profiler revision is `4b6bf97`; the baseline production reader is unchanged from the base commit. The baseline series overlapped a test-only commit, which accounts for the end-of-run HEAD values in its receipts. No application code changed during either series.

| Sale documents and lines | Package bytes | Baseline retained file buffer | Changed retained file buffer |
| --- | ---: | ---: | ---: |
| 100 each | 80,107 | 33,554,433 | 80,107 |
| 1,000 each | 794,709 | 33,554,433 | 794,709 |
| 10,000 each | 7,940,711 | 33,554,433 | 7,940,711 |
| 25,000 each | 19,850,711 | 33,554,433 | 19,850,711 |

The changed series verifies expected totals, exact ID and decimal text, app-owned setting and expense retention, original accepted-report retention, malformed-import rejection, and SQLite backup reopening. For 25,000 sales, expected and observed original net sales are TRY 2,500,000, estimated cost TRY 1,500,000, and estimated gross profit TRY 1,000,000. The corrected snapshot adds TRY 20 to sales and gross profit. Operating profit remains unavailable.

These runs do not establish a timing improvement. The 25,000-sale scenario took 26.68 seconds before and 31.05 seconds after in these single samples. OS caches were not cleared. The change targets retained file allocation, not the full calculation or export duration.

The changed large scenario's process high-water RSS was 2,699,984 KiB. This includes buffers, parsed records, snapshots, and reports retained by the profiler for assertions. It is not the Electron worker's memory footprint. Stage-boundary samples and end-of-run disk sizes do not measure transient heap or disk peaks. The current limits remain 32 MiB and 100,000 total package rows.

## Verification record

| Command or procedure | Expected and actual result | Evidence |
| --- | --- | --- |
| `npm run test:unit` | Pass, 29 tests in 9 files | `work/issue-26/test-unit.log` |
| `npm run test:integration` | Pass, 234 tests in 31 files | `work/issue-26/test-integration.log` |
| `npm run typecheck` | Pass | `work/issue-26/typecheck.log` |
| `npm run lint` | Pass | `work/issue-26/lint.log` |
| `npm run test:desktop` | Pass, 29 tests in the packaged Windows application | `work/issue-26/test-desktop.log` |
| `npm run build` through `test:desktop` and `package:win` | Pass | `work/issue-26/test-desktop.log`, `work/issue-26/package-win.log` |
| `npm run package:win` | Pass, NSIS and portable artifacts; notices, inventory, and distribution payload checks passed | [Artifact hashes](issue-26-verification.json) |
| Profile CLI at 100, 1,000, 10,000, and 25,000 sales | Pass, independent totals and preservation assertions | [Receipts](issue-26-import-profiles.json) |
| Profile CLI with count `0` | Exit 1, empty stdout, fixed `PROFILE_FAILED` stderr | `work/issue-26/invalid-cli.stdout`, `work/issue-26/invalid-cli.stderr` |

The local logs remain in the ignored work directory. The checked-in receipts preserve the measurements and fixture identities.

The packaged suite exercised native-selection import, restart after failed or interrupted imports, expenses, immutable reports, Excel integration, encrypted recovery, and cancellation with synthetic fixtures. The existing 25,000-document desktop benchmark passed its below-two-second assertions. Its [separate packaged timing record](issue-26-desktop-performance.json) identifies the archive hash and all three process samples. This is a different fixture and measurement path from the developer profiler. It does not establish full-source performance or installation acceptance.

The final package ASAR hash matches the archive tested by Playwright. The distribution checks found no inventory violations and verified that NSIS and portable outputs contain the inspected payload. These distribution files were built and inspected but were not installed or launched as compressed distributions during this increment. Physical disconnection, publisher prompts, clean-machine lifecycle, and real-source acceptance remain separate checks.

## Independent review

Two Sol Medium explorations compared exact file-sized allocation with chunk collection. A separate Sol High design review selected exact allocation and preserved empty-file compatibility. An Astra Low worker implemented the bounded increment. The parent inspected the diff and ran the comparison series and broader checks.

The Astra High Standards review found no actionable violations or code-smell findings. Its preceding comment review found no scoped comments or suppressions. The independent Astra High Spec review found no new implementation defect and recorded one completion blocker: the full issue still needs real-source evidence and implementation. Both reviews avoided runtime work during measurement collection.

The Sol High audit checked artifacts and the [decision trail](issue-26-decisions.tsv). No task transcript file was supplied. Its missing red-output finding was resolved by the recorded reproduction. Decision timestamps record when the evidence summary was written, not the original action times.

## Open gates and continuation

R1 remains blocked on renewed authorization and an available isolated restored backup. The repository's source-access rule requires separate authorization. No source was opened in this session. Docker's Linux-engine pipe was unavailable when checked; no Docker daemon or source container was started. A historical audit cannot fill these gaps.

R2 needs the approved raw-column allowlist, observed engine and TLS requirements, a selected driver, and restricted-account extraction proof. R3 still needs real provenance and measured transport bounds. R4 needs the real preview and source oracles. R5 needs the approved full population, budgets, per-process and worker peaks, temporary disk peaks, cancellation, overlap, failure, retention, and response measurements. This uniform synthetic scenario does not cover those obligations.

R6 still needs real-data Windows acceptance and the applicable release gates. R7 can link the completed evidence into issue #14 only after R1 through R6 are satisfied. Live access remains disabled. Do not close issue #26, mark A01 through A07 complete, or enable production access from this PR.

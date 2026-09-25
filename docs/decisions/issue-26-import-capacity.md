# Measure import capacity before changing the package format

This decision covers the source-independent measurement work in [issue #26, R3 and R5](https://github.com/AlesSystems/esmer-market-analytics/issues/26). It contributes to implementation Tasks 3.2 and 10.1, D18, A04, and A07. It does not approve a real-source mapping or complete those gates.

## Keep the existing format until the population is known

The current format allows 32 MiB and 100,000 total records. The historical audit reports more than two million document and line records. R1 must establish which records belong in an approved package before a supported historical capacity can be chosen.

The existing reader materializes the package, validates hashes and references, and checks canonical encoding. Store staging and activation reread records. Monthly evidence retains the source records, and accepted reports preserve that evidence. Raising an input limit alone would leave these allocations and persistence costs unbounded by any measured acceptance budget.

Measure the existing APIs with deterministic synthetic inputs first. Retain the package version, row and byte limits, calculation gates, and accepted-report representation. A future format decision needs approved population measurements across extraction, desktop transport, import, reporting, export, and encrypted recovery.

## Size file buffers to their input

The existing native file reader reserves the maximum allowed bytes plus one for every input. The returned slice retains that whole buffer. This also affects expense workbooks and recovery-key files, which use the same reader with different limits.

| Choice | Allocation and behavior | Decision |
| --- | --- | --- |
| Maximum-sized buffer | Reserves the configured cap for every input | Replace |
| File-sized buffer and one-byte probe | Holds the reported file size, rejects early EOF and observed growth | Use |
| Chunk collection and concatenation | Holds chunks and a second complete output buffer during concatenation | Defer |
| Streaming package format | Changes parsing, hashing, staging, and compatibility | Requires full-path measurements |

Keep a single open file descriptor for the size check and reads. Preserve regular-file checks, existing symlink behavior, empty-file byte reading, and closure on failure. The package parser remains responsible for rejecting empty or invalid packages. Reject premature EOF and growth observed by the final probe. This does not promise a filesystem snapshot against concurrent overwrites or changes after the probe.

Two independent design explorations preferred the file-sized buffer. They differed on empty files. Preserving the existing byte-reader behavior avoids adding package semantics to the shared reader.

A separate Sol High design review agreed with that choice. The baseline experiment read a 100-byte regular file and observed a 33,554,433-byte backing buffer. This measures retained allocation directly. It does not establish a timing improvement or whole-process memory reduction.

## Distinguish measurements from acceptance

The developer profiler generates synthetic business packages. It exercises local package writing, file reading, parsing, staging, activation, snapshots, accepted reports, Excel buffer generation, and SQLite backup reopening. It uses independent expected totals and checks that replacement and rejected imports preserve accepted reports and app-owned state.

Memory at stage boundaries is a sample. It is not a peak for synchronous parsing, calculation, or export. Process high-water RSS describes the whole process. Disk sizes at checkpoints can miss temporary peaks. Run each scenario in a fresh process and retain the build, input hashes, counts, hardware, and measurement limitations.

This procedure does not measure SQL Server extraction, Electron IPC, renderer responsiveness, encrypted backup and restore, cancellation latency, or the complete historical population. The existing packaged desktop tests provide separate synthetic regression evidence. None of these measurements supplies the missing R1 source contract.

## Source-dependent continuation

Real-source access remains subject to the repository's separate authorization rule. Keep the backup, source locator, credentials, and private evidence outside Git. Resume R1 with an authorized isolated restore, then select a SQL Server driver against the observed engine, TLS, authentication, and exact-value requirements.

R2 restricted-account proof, R3 real provenance, R4 real-data preview, R5 full-population budgets, R6 real-data Windows acceptance, and the R7 handoff remain open. Live implementation stays in [issue #14](https://github.com/AlesSystems/esmer-market-analytics/issues/14).

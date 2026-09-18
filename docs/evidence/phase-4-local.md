# Phase 4 local verification

## Scope and authorization

The user authorized [issue #7](https://github.com/AlesSystems/esmer-market-analytics/issues/7), PR creation, and a stop before Windows-specific implementation/testing. This record covers Tasks 4.1 and 4.2 on `codex/phase-4-durable-imports`, based on `4240576`. Prerequisite issues #4, #5 and #6 were closed at inspection. Their unresolved real-source gates remain open.

The implementation uses synthetic packages and disposable SQLite databases. No market source, existing container, private backup or credential was accessed. Financial calculations, expense spreadsheet import, report presentation, backup/recovery and Phase 5 remain outside this work.

## Environment and baseline

- macOS 26.4.1, build 25E253, ARM64.
- Node 24.15.0 and npm 11.12.1.
- `npm ci` passed with the existing lockfile and reported zero registry advisories.
- Baseline typecheck, lint and all seven analytics-package tests passed.

## Design and verification boundaries

Independent design candidates compared normalized source tables with per-entity app revisions against generic source payloads with full app snapshots. The parent and independent judge selected normalized tables because the package already fixes the source shape and SQLite can enforce its references. Per-entity revisions preserve unrelated changes without whole-state replacement. The selected design includes strict tables, explicit pinned reads, and compact history separate from prunable candidate facts.

One implementation owner changes the coupled store, service, IPC and tests. The parent owns documentation and final verification. Independent reviews use separate agents from one model family.

The [persistence contract](../contracts/persistence.md) defines ownership, activation, report pins and retention. Structural summaries have no financial calculations. Package hashes detect corruption and identify repeated content; they do not authenticate the sender or validate business semantics.

## Verification at the Windows handoff

The tested application and tests are at `a08da74e30a2600981737f8f0b1ca2ff7149f8f8`. Later evidence-only changes do not change that build. No dependency or lockfile changed.

| Procedure | Expected outcome | Actual outcome |
| --- | --- | --- |
| Focused ownership, activation, failure, IPC and bounded file-read tests | Preserve versions, reject unsafe operations and recover working state | 30 tests passed across five files |
| `npm run typecheck` | Source and tests typecheck | Passed |
| `npm run lint` | Source and tests satisfy configured lint | Passed |
| `npm test` | Unit, integration and actual packaged desktop paths pass | 2 unit, 110 integration and 4 packaged desktop tests passed |
| `npm run build`, invoked by `test:desktop` through `package:local` | Bundle desktop, preload, service and UI with notices | Passed; unsigned macOS ARM64 directory package built |
| File-backed v1 to v2 migration | Preserve exact source decimals, expense revisions, report pins and evidence | Passed; accepted report overwrite rejected |
| A/B overlap and lineage reset | Replace source view once, retain concurrent app edits and flag affected adjustments | Passed; original target identities and accepted A report remain readable |
| Five injected failures and first-import rejection | Keep the prior complete source/app snapshot, or remain empty | Passed for reading, persistence, validation, summary and activation |
| Actual SQLite page exhaustion | Return `STORAGE_FULL`, retain active state and database integrity | Passed using `max_page_count` on a disposable database |
| Child process killed inside an activation transaction | Recover prior source/app snapshot after restart | Passed; interrupted candidate marked failed and pruned |
| Native file selection through packaged IPC/worker | Import, repeat, reject corrupt input, cancel and reopen | Passed; renderer remains without Node/process access |
| Packaged interrupted-import restart | Show a useful warning in empty/loaded states while preserving the previous dataset | Both states passed; successful import clears the warning |
| ASAR and notice inspection | Exclude development/private inputs and retain dependency notices | Passed; 349 archive entries and 6 dependency notices |

The source A and B oracle files remain unchanged. The helper maps only their sale rows into package documents/lines, then tests create app-owned records through the revision API. Their package mapping is `synthetic-relational-v1`, lineage `synthetic-market-1`, extraction identities `source-a` and `source-b`, coverage 2025-01-01 through 2025-02-02, and cutoff 2025-02-02. Reset-lineage tests use deliberately different synthetic identities.

| Fixture | SHA-256 |
| --- | --- |
| `tests/fixtures/source-a/snapshot.json` | `5c1c36c8890fb29e7134fa37f606df68778a21064dbb2d028f465939b1293116` |
| `tests/fixtures/source-b/snapshot.json` | `f3d59dd196f7b3d79c365bd39df0016ad7671fb80d9dc780ed2ea84af580cf53` |

The A/B expectations are literal fixture values. A has source amounts 100 and 50; B has 90 and 20. The accepted synthetic A report retains 150. No runtime financial engine or certified source total is claimed.

`max_page_count` causes a real SQLite allocation failure at the configured page limit. This differs from physically exhausting a Windows volume. See the [SQLite page-limit documentation](https://www.sqlite.org/pragma.html#pragma_max_page_count). The process-kill test is separate from caught exception injection and synchronizes at the uncommitted activation boundary before terminating the child.

## Contract-first and review evidence

- `b4f198c` introduced the ownership contract before implementation. Vitest failed to load the absent store module, with zero assertions executed. This was a missing implementation seam, not an observed behavioral assertion failure. `9528617` made both initial ownership tests pass.
- `700ba31` introduced the desktop import boundary contract. Three assertions failed and eight passed. Invalid import payloads returned the wrong error, and the valid no-argument operation did not invoke import. `faf858d` implemented the named native selection/import path.
- Independent core review reproduced rejection of a valid unsorted package and acceptance/migration of a damaged recognized v1 database. `2606d88` added two failing assertions. `cdaf030` preserves stream order and checks recognized schema structure before migration; both regressions passed.
- Parent review added explicit reset-lineage difference semantics and guarded rollback after errors that may already abort a SQLite transaction. No failing-before assertion is claimed for those observations.

Final Spec review found that interruption recovery did not expose a restart warning. `ac72d74` reproduced three failing assertions. `a08da74` exposes the persisted error on both empty and loaded startup screens. The actual process-kill test checks that error, and packaged tests verify both visible warnings and clearance after successful import. The ownership test also explicitly verifies partial-coverage and missing-cost warnings after activation.

Final Standards and Spec follow-ups at `a08da74` reported zero remaining findings. Standards review caused a service behavior fix and its packaged tests to be split into `9a525db` and `12b151a`; the source/test tree was unchanged by that split. The comment review reported zero deletion recommendations or suppressions. The Spec reviewer independently passed all 30 focused integration checks. Parent final verification reran the complete suite against the final code.

| Commit | Coherent change |
| --- | --- |
| `b4f198c` | Ownership and migration contract |
| `9528617` | Durable datasets, app revisions and report pins |
| `b2f84b3` | Lineage-reset differences and retention |
| `6caf928` | Interruption and SQLite exhaustion coverage |
| `700ba31` | Native import boundary contract |
| `faf858d` | Desktop import into the durable store |
| `2606d88` | Package-order and damaged-schema regressions |
| `cdaf030` | Preserve package order and reject damaged schemas |
| `9a525db` | Keep readable data available when import cleanup fails |
| `12b151a` | Packaged import, restart and bounded file-read checks |
| `ac72d74` | Visible interruption-recovery contract |
| `a08da74` | Persist and display safe restart warnings |

## Packaged evidence

The [imported state](phase-4-imported.png) and [failed-import state](phase-4-import-failed.png) were visually inspected. Both show the historical cutoff, synthetic warning and disabled live connection. The failure screen retains the loaded dataset and reports that valid data was preserved. The test replaces the native dialog's return value inside Electron main; the subsequent renderer/preload/IPC/file/worker/database path is real. Native picker interaction and Windows lifecycle checks remain for the Windows agent.

The [runtime record](phase-4-runtime.json) measures Electron 44.3.0, Node 24.20.0 and SQLite 3.53.4 in both main and the packaged service probe. The probe uses a separate disposable database, so it does not become a second owner of the application store.

The [package inventory](phase-4-package-inventory.json) records archive SHA-256 `300c1f458ec9ea1f5390fdaf1b740000240422cea271eb2411e93a8fb5bb5c28` and application bundle hashes. Inspection used the installed `@electron/asar` APIs and `scripts/verify-package.mjs`. Repository source/tests/tools/docs/work directories, backup/database/environment files, source maps and synthetic private sentinels were absent. The package reader and store are now expected inside the service bundle; extraction and preparation tooling remain absent. This is macOS archive evidence only.

`git diff --check` and all 53 local Markdown targets in the changed documentation passed.

## Remaining gates

Windows-specific implementation and testing are deliberately deferred. Continue on the same branch with the [Windows-agent prompt](../operations/windows-phase-4-handoff.md). No Windows packaging, physical disk-exhaustion, installer upgrade or Windows file-lock claim is made here.

A04 still includes later expense-import provenance/duplicate handling and recovery obligations. A01/A05 require separately authorized real-source evidence. A02/A03 require reviewed financial behavior and source semantics. A06 encrypted recovery, A07 complete Windows/full-volume acceptance, and L01 live authorization remain open. Synthetic packages remain synthetic-only.

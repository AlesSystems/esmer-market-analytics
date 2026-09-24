# Acceptance evidence

## Phase 1 status

The user authorized application implementation for [issue #4](https://github.com/AlesSystems/esmer-market-analytics/issues/4) on 2026-09-15 and requested a stop at the Windows check. The Windows agent continues on `codex/phase-1-independent-foundation` using [this handoff prompt](../operations/windows-phase-1-handoff.md).

The Phase 1 exit gate is **complete**. Windows checks passed, and the user reported successful manual startup with networking disconnected. This phase supplies part of A01, A05, and A07. It does not complete those release acceptance gates.

The fixture is `synthetic-empty-v1`. It contains no imported transactions, business schema, source connection, customer records, or employee records. The local SQLite connection is an in-memory empty-store probe. Later phases add persistence and business features.

## Entry and dependency evidence

| Check | Procedure | Outcome | Limit |
| --- | --- | --- | --- |
| Implementation authority | Current user instruction authorizes Phase 1 and PR creation | Authorized | No source access, installation on Eralp's computer, or production rollout |
| Independent repository | `git status --short`, `git ls-files`, and baseline history at `7c0dfee` | Clean documentation-only checkout; isolated branch created | Legacy checkout was not accessed |
| Initial release inputs | Inspected all tracked input paths before implementation | Only instructions, README, and approved planning documents | Final [packaged inventory](phase-1-package-inventory.json) also inspected |
| Exact dependency selections | Public upstream documentation, `npm view`, and installed package manifests | Direct versions and licences recorded in [runtime decision](../decisions/runtime.md) | Windows packaged runtime compatibility passed; manual offline startup is user-reported |
| Dependency vulnerability metadata | `npm audit --json` on the locked graph | Zero reported advisories on 2026-09-15 | An audit is a point-in-time registry check, not a security guarantee |

## Local verification

The development host is macOS 26.4.1, build 25E253, ARM64. Development Node is 24.15.0 and npm is 11.12.1. The [local verification record](phase-1-local.md) contains the tested commit, packaged runtime versions, commands, outcomes, archive hash, screenshot, independent review, and remaining limitations.

## Windows evidence

The [Windows verification record](windows-phase-1.md) contains the fetched commit, host characteristics, Node/npm versions, passing build and integration results, unsigned artifact hashes, package inventory, and remaining checks. Windows packaging and shipped dependency notices passed after excluding the unused Excel reader with an unresolved transitive notice. The user confirmed the HP development test host. The packaged desktop and full suite passed, including worker SQLite and same-profile restart checks. Native portable launch and an NSIS install/launch/uninstall cycle passed. Windows screenshots and bundled runtime measurements are recorded. The user reported the expected empty/offline state with networking disconnected and no failures or warnings. That manual report is separate from the automated results. Final test-installation removal passed. The unattended offline runner timed out and supplies no offline evidence. The [approved plan](../superpowers/plans/esmer-market-implementation-plan.md#execution-and-evidence-rules) defines the evidence fields.

## Phase 2 status

The user authorized [issue #5](https://github.com/AlesSystems/esmer-market-analytics/issues/5) implementation and a PR, then authorized Windows continuation on the same branch, `codex/phase-2-source-contract`. Phase 1 is complete and issue #4 is closed. The existing PR is [#16](https://github.com/AlesSystems/esmer-market-analytics/pull/16).

The Phase 2 contribution is a declarative source contract, synthetic golden/edge fixtures and paired snapshots with independent expected outputs. See [source](../contracts/source.md), [calculations](../contracts/calculations.md), [privacy](../contracts/privacy.md), [golden oracles](golden-oracles.md), and [local verification](phase-2-local.md). No source was accessed and no source-backed financial mapping was validated.

The [Phase 2 Windows record](windows-phase-2.md) contains passing fixture, timezone, typecheck, lint, build, packaging and full-suite checks, packaged runtime measurements, archive/distribution inventory, hashes, native screenshots and successful portable/NSIS lifecycle checks. On 2026-09-17, the user reported successful physical-disconnect testing. That manual report is separate from the connected-host automated checks.

The Phase 2 exit gate remains **open** for source-dependent evidence. Synthetic checks do not pass extraction, financial-runtime, import-activation or full Windows release acceptance. No source rules were promoted, no Phase 3 work began, and issue #5 remains open. The original [Windows handoff](../operations/windows-phase-2-handoff.md) is retained as the procedure; the Windows record above governs actual outcomes and remaining checks.

## Phase 3 status

The user authorized [issue #6](https://github.com/AlesSystems/esmer-market-analytics/issues/6), a PR and a stop before Windows testing. Issue #5 was closed when this work began; its source-dependent evidence remains open. This supersedes the older issue-status sentence above without changing its evidence limitations.

Phase 3 implements synthetic SQLite extraction, a bounded validated analytics package and developer-side preparation. See the [package contract](../contracts/analytics-package.md), [preparation procedure](../operations/prepare-package.md), [local evidence](phase-3-local.md), and [archive inventory](phase-3-package-inventory.json). Real raw-column mapping and SQL Server permissions remain unvalidated. The desktop retains its empty/offline behavior.

The [Phase 3 Windows record](windows-phase-3.md) contains passing synthetic extraction/privacy/package tests, typecheck, lint, build, Windows packaging and the full suite against the actual packaged executable. It records a fixture-only transaction fix for Windows setup timeouts, deterministic CLI output, worker/file cleanup, archive/distribution inventories, runtime versions, native screenshots and portable/NSIS lifecycle checks. On 2026-09-17, the user reported successful physical-disconnect testing. That manual report is separate from the connected-host automated checks.

The source-dependent Phase 3 exit gate remains **open**. Real-source mapping, SQL Server permissions, reconciliation, real-data privacy and full-volume performance are unvalidated. The original [Windows prompt](../operations/windows-phase-3-handoff.md) remains as the procedure; the Windows record governs actual results. Package validation does not establish Phase 4 activation or app-owned preservation. No merge, issue closure or Phase 4 work follows from this evidence.

## Phase 4 status

The user authorized [issue #7](https://github.com/AlesSystems/esmer-market-analytics/issues/7), PR creation and a stop before Windows-specific implementation/testing. Issues #4, #5 and #6 were closed at entry; their unresolved source gates remain open.

Phase 4 adds one durable app-owned SQLite store, immutable source datasets, append-only app revisions, accepted-report pins, atomic package activation, retention and a minimal Turkish native-file import flow. The [persistence contract](../contracts/persistence.md), [desktop boundary](../contracts/desktop.md), [local verification](phase-4-local.md), [runtime record](phase-4-runtime.json) and [archive inventory](phase-4-package-inventory.json) describe the implementation and proof.

Local verification passed 2 unit, 110 integration and 4 actual packaged macOS desktop tests, plus typecheck and lint. Build and macOS directory packaging passed within the desktop run. Review exposed and corrected package-order, damaged-schema and missing restart-warning regressions. Final independent Standards and Spec follow-ups have no remaining findings. No dependency changed.

The [Phase 4 Windows record](windows-phase-4.md) now records passing Windows typecheck, lint, build, packaging, 2 unit tests, 119 integration tests and 5 actual packaged desktop tests. Windows continuation fixed lost interruption markers during staging and warnings hidden by cancelled/historical imports. Native picker success/cancellation/failure, portable and NSIS restart, an in-place same-version code upgrade, immutable state preservation and uninstall checks passed on isolated synthetic profiles. The record includes hashes, inventory, runtime measurements and screenshots.

The authorized synthetic Phase 4 exit gate is **complete**. On 2026-09-18, the user reported that the physical tests all passed, closing the pending physical-disconnect cold-launch and restart check. This human report is recorded separately from automated results in the Windows evidence. Full A04 expense-import/recovery obligations and the real-source, financial, recovery, full-volume and live-integration gates remain open. Physical disk exhaustion, power loss and versioned/failed installer upgrades are not established by this report. The [Windows-agent prompt](../operations/windows-phase-4-handoff.md) remains the procedure; the Windows record governs actual results. Continue on `codex/phase-4-durable-imports` and existing PR #18. No merge, issue closure or Phase 5 work is authorized by this evidence.

## Phase 5 status

Phase 4 is merged in `4452fd9` and issue #7 is closed. The user authorized [issue #8](https://github.com/AlesSystems/esmer-market-analytics/issues/8) with the selected Option A and requested a stop before Windows validation. Work continues on `codex/phase-5-sales-analytics` in [PR #19](https://github.com/AlesSystems/esmer-market-analytics/pull/19).

Phase 5 implements synthetic-supported decimal sales, immutable browsing sessions and the monthly overview → category/product → transaction → source-evidence journey. See the [design decision](../decisions/phase-5-sales.md), [local evidence](phase-5-local.md), [decision trail](phase-5-decisions.tsv) and [Windows continuation prompt](../operations/windows-phase-5-handoff.md). Legacy sparse packages remain importable and show unavailable analytics.

The user subsequently authorized Windows continuation on the same branch and PR. The [Phase 5 Windows record](windows-phase-5.md) records a source-evidence precision fix and passing 12 unit, 133 integration and 7 actual packaged Windows desktop tests, plus typecheck, lint, build, packaging, real native picker, isolated portable/NSIS lifecycle, schema2 upgrade preservation, inventory and bounded timing checks. Independent Standards and Spec review found no remaining code findings.

On 2026-09-20, the user reported that physical-offline testing passed and authorized merging PR #19 when ready. This human report is separate from automation. The archive and distribution hashes still match the tested build. A fresh independent packaged smoke test passed, with no outstanding code findings.

The Phase 5 exit gate remains **open** for source-dependent acceptance and remaining Windows checks. Actual Windows scaling changes and interactive unsigned-publisher warning review remain unverified. Automated browser-offline and forced Chromium scaling probes are recorded separately. Synthetic checks do not establish real-source semantics, full imported-data performance or all A02/A03/A07 requirements. The authorized implementation merge does not complete these gates; issue #8 remains open, and no Phase 6 work or deployment is included.

## Phase 6 implementation

- [Costs, purchasing, supplier returns and local verification](phase-6-local.md).
- [Windows continuation prompt](../operations/windows-phase-6-handoff.md).
- [Windows verification](windows-phase-6.md) records two provenance-navigation fixes, 22 unit, 148 integration and 11 packaged Windows desktop tests, real native picker checks, isolated portable/NSIS migration and uninstall, hashes, screenshots and bounded performance observations. The same branch and PR #20 remain the review target.

Tasks 6.1/6.2 have supported synthetic implementation evidence. The Phase 6 exit gate remains open for real-source semantics and acceptance. The [2026-09-21 follow-up](windows-phase-6.md#remaining-windows-checks-on-2026-09-21) records the user's physical-disconnect pass, passing actual Windows 100%/125%/150% scaling and horizontal table-wheel checks, and local interactive installer observations. No publisher warning appeared for the local artifact; downloaded-installer SmartScreen behavior remains unverified. Full imported-dataset performance and owner acceptance remain open. Synthetic accepted-report records do not represent owner acceptance. No merge, issue closure, Phase 7 or deployment follows from this record.

## Phase 7 local implementation

Issue [#10](https://github.com/AlesSystems/esmer-market-analytics/issues/10) adds canonical Excel expense imports, reversible history, explicit completeness review and conditional estimated operating results. See the [local evidence](phase-7-local.md), [expense contract](../contracts/expense-completeness.md), and [Windows-agent prompt](../operations/windows-phase-7-prompt.md).

The user requested a stop before Windows implementation/testing. Tasks 7.1/7.2 have synthetic local evidence; source-dependent A02–A05, Windows A07, full-volume performance and owner acceptance remain open. No merge, rollout or later phase is authorized.

The user subsequently authorized Windows continuation on PR #21. The [Windows record](windows-phase-7.md) adds passing 29 unit, 159 integration and 16 packaged desktop tests, native Excel open/save and native picker checks, actual Windows 100%/125%/150% scaling, the 200 minus 50 equals 150 oracle, and isolated NSIS/portable upgrade and uninstall/reinstall preservation. No application change was required. Physical disconnection on this build, interactive publisher warnings, full-volume performance and source/owner acceptance remain open. The original handoff remains the procedure; the Windows record governs performed checks. No merge or issue closure follows from this evidence.

## Phase 8 reporting and Excel

The user authorized Windows continuation of [issue #11](https://github.com/AlesSystems/esmer-market-analytics/issues/11) on [PR #22](https://github.com/AlesSystems/esmer-market-analytics/pull/22). The [Windows record](windows-phase-8.md) supplements [local evidence](phase-8-local.md) with packaged reporting/revision checks, native save and Excel round-trip, actual Windows scaling, cancellation/retry measurements, artifact hashes and repeatable verification tools. The application source and schema are unchanged by this continuation.

The 25,000-document synthetic monthly calculation took 49–59 seconds, so D18/A07 performance remains unmet. Physical disconnection on this build, publisher/downloaded SmartScreen behavior, full imported-data/source acceptance and the broader release gates remain open. The [Windows handoff](../operations/windows-phase-8-handoff.md) remains the procedure. No merge, issue closure, later phase or owner rollout follows from this evidence.

## Phase 9 encrypted recovery

[Issue #12](https://github.com/AlesSystems/esmer-market-analytics/issues/12) is implemented locally on `codex/phase-9-recovery` through the macOS verification boundary. See [local evidence](phase-9-local.md), the [recovery decision](../decisions/phase-9-recovery.md), [Turkish instructions](../operations/recovery-tr.md), and [Windows-agent prompt](../operations/windows-phase-9-prompt.md).

A06 remains open for actual Windows key protection, file-system behavior, independent-media clean recovery and the remaining checks in the [Windows handoff](../operations/windows-phase-9-handoff.md). No merge, issue closure, owner installation or later-phase work is included.

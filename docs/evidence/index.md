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

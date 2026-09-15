# Acceptance evidence

## Phase 1 status

The user authorized application implementation for [issue #4](https://github.com/AlesSystems/esmer-market-analytics/issues/4) on 2026-09-15 and requested a stop at the Windows check. The Windows agent continues on `codex/phase-1-independent-foundation` using [this handoff prompt](../operations/windows-phase-1-handoff.md).

The Phase 1 exit gate remains **open** until the packaged Windows smoke is recorded. This phase supplies part of A01, A05, and A07. It does not complete those release acceptance gates.

The fixture is `synthetic-empty-v1`. It contains no imported transactions, business schema, source connection, customer records, or employee records. The local SQLite connection is an in-memory empty-store probe. Later phases add persistence and business features.

## Entry and dependency evidence

| Check | Procedure | Outcome | Limit |
| --- | --- | --- | --- |
| Implementation authority | Current user instruction authorizes Phase 1 and PR creation | Authorized | No source access, installation on Eralp's computer, or production rollout |
| Independent repository | `git status --short`, `git ls-files`, and baseline history at `7c0dfee` | Clean documentation-only checkout; isolated branch created | Legacy checkout was not accessed |
| Initial release inputs | Inspected all tracked input paths before implementation | Only instructions, README, and approved planning documents | Final [packaged inventory](phase-1-package-inventory.json) also inspected |
| Exact dependency selections | Public upstream documentation, `npm view`, and installed package manifests | Direct versions and licences recorded in [runtime decision](../decisions/runtime.md) | Windows runtime compatibility remains pending |
| Dependency vulnerability metadata | `npm audit --json` on the locked graph | Zero reported advisories on 2026-09-15 | An audit is a point-in-time registry check, not a security guarantee |

## Local verification

The development host is macOS 26.4.1, build 25E253, ARM64. Development Node is 24.15.0 and npm is 11.12.1. The [local verification record](phase-1-local.md) contains the tested commit, packaged runtime versions, commands, outcomes, archive hash, screenshot, independent review, and remaining limitations.

## Pending Windows evidence

The Windows agent must add `windows-phase-1.md` with the tested commit, environment, artifact hashes, commands, observed offline startup, privilege-boundary results, screenshot, and remaining limitations. No Windows package or smoke result is claimed by the macOS record. The [approved plan](../superpowers/plans/esmer-market-implementation-plan.md#execution-and-evidence-rules) defines the evidence fields.

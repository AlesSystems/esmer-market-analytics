# Eralp offline installation and acceptance preparation

Agreed on 2026-11-14: prepare an offline review; Altan installs alongside Eralp; independent-machine recovery and power-loss proof (#138) remain deferred. Eralp's Windows version is unknown. Preparation does not establish owner acceptance or authorize production source access.

Base: `3520ce0821f6b90a1f0ed903beb2e08fa837584f`. Branch: `codex/eralp-offline-handoff`. Preserve unrelated work. Only synthetic fixtures and existing public/repository evidence are inputs; no renewed source inspection.

## Execution graph

Run a node only after every dependency is completed. No deterministic scheduler exists in this repository. Read-only investigations may overlap; the parent owns all writes.

| ID | Type | Objective and allowed area | Dependencies | Acceptance | State |
| --- | --- | --- | --- | --- | --- |
| H01 | design | Confirm offline review scope and current Windows evidence | — | User confirms scope; current main and #109/#138/#139 checked | completed |
| H02 | analysis | Trace #139 through locked dependencies, SQL entry points and auth configuration; independent investigation | H01 | Advisory preconditions, reachable modes and compatibility constraints established | completed |
| H03 | test | Exercise the relevant security boundary and legitimate control with synthetic inputs | H02 | Focused checks establish actual behavior without source access | completed |
| H04 | implementation | Apply minimal required fix, or document concrete non-applicability | H03 | No vulnerable reachable flow remains; no speculative upgrade | completed |
| H05 | documentation | Update Turkish install/review procedures, agreed terminology, current gate status and artifact identity | H01 | Accurate offline workflow; Windows preflight; acceptance and backup checklist; no invented acceptance | completed |
| H06 | test | Verify affected tests, links, package identity and required platform checks | H04, H05 | Exact changed scope passes; unchanged-runtime evidence identified or replacement Windows evidence produced | completed |
| H07 | review | Independent security and regression review of final candidate | H06 | Concrete findings resolved within scope | running |
| H08 | integration | Publish reviewable changes, preserve tested delivery and update #139 with evidence | H07 | PR/checks and delivery hashes available; #138 deferred; owner acceptance left to actual session | pending |

## Risks and handoff boundaries

- Dependency presence alone does not prove the authorization-code flow is reachable; default-disabled SQL alone does not prove non-applicability.
- An application/dependency change needs Windows packaging and desktop evidence; documentation/test-only work must preserve the exact accepted runtime.
- The old `v1.0.1` tag predates Windows fixes. Deliver by immutable build identity and SHA-256, not version text alone.
- The supported evidence is Windows 11 x64. Check Eralp's actual Windows version before installation and record any additional compatibility check.
- #110's closure does not supply its unchecked owner acceptance or production permissions.

## Verification receipt

H02: parent and independent investigator traced the strict SQL-only boundary, including retries, server FedAuth and optional encryption providers. H03/H04: `ad4bb38` adds 10 passing authentication-boundary checks; no runtime/dependency change required. Focused group: 15 passed, one optional SQL skip. H06: typecheck/lint, 185 unit and 324 integration passed (17 optional SQL skipped); initial missing Electron fixture binary was installed and the full integration suite rerun. Runtime/package inputs match `3520ce0`; retained Windows installer/portable hashes match CI; generated synthetic October oracle and changed local Markdown links pass. Full details: [readiness receipt](../docs/evidence/2026-11-14-eralp-offline-readiness.md).

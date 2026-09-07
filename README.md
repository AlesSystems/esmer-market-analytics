# Esmer Market Analytics

Private Turkish desktop analytics for Esmer Market, intended for one owner on one trusted Windows computer. The approved product uses Electron, TypeScript, React, a local Node service and SQLite.

This repository currently contains planning documents only. No application code, dependencies, test suite, installer or database fixtures have been added.

## Reading order

| Document | Purpose |
| --- | --- |
| [Foundation specification](docs/superpowers/specs/2026-09-04-esmer-market-rebuild-design.md) | Approved product scope, architecture and D01–D20 constraints |
| [Database audit](docs/superpowers/specs/2026-09-04-esmer-market-rebuild-audit.md) | Historical source observations, uncertainty and required revalidation |
| [Release acceptance checklist](docs/superpowers/specs/2026-09-04-esmer-market-rebuild-acceptance.md) | Required evidence for A01–A07 and the later L01 live gate |
| [Phased implementation plan](docs/superpowers/plans/esmer-market-implementation-plan.md) | Eleven phases with dependencies, tasks, verification and completion criteria; no delivery schedule or effort estimates |

The three foundation documents remain authoritative. The plan organizes their delivery. Phases 1–10 cover the first release; Phase 11 is conditional live integration.

## Approval and current state

The user approved the written foundation, requested the phased implementation plan, and authorized creating this repository and adding the documents through a PR and merge. Application implementation is not part of this change. All implementation steps and application acceptance gates remain unchecked.

The next implementation work requires the user's direction. Renewed source inspection retains its separate authorization gate. Production integration requires Eralp's acceptance, explicit permission for the specific source, and separate rollout direction.

The plan's commands and proposed file paths describe future work; they are not runnable scripts or existing modules. No application tests, build or Windows acceptance have been performed in this repository.

## Essential product boundaries

- Turkish UI, English internal identifiers and TRY only; one store and one owner.
- Source access is permanently read-only. The offline first release imports prepared data and reads its local analytics store.
- Historical last-purchase cost is an estimate after source semantics are validated. Missing costs and incomplete expenses remain explicit; they never become zero or verified profit.
- Expense imports, corrections and accepted reports survive source refreshes. Excel export and independently recoverable encrypted backups are required.
- No identifiable customer records or employee-level payroll, source backups, credentials, legacy databases, runtime code or migrations belong in this documentation baseline.

Read the full specification and acceptance checklist before making implementation decisions.

## Document provenance

The three specification filenames retain their original record date. They were transferred from the separate `EsmerMarketAccounting` legacy repository. The implementation plan was transferred from the approved planning task's deliverable. Only approval status, repository context and links were updated; audit observations and application requirements were retained.

The original documents and legacy checkout remain separate. The audit is a historical summary, not a new database inspection or evidence that application acceptance passed. No legacy Git history was imported.

## Contribution and evidence

Use small, coherent Conventional Commits and link each implementation PR to its plan task and relevant acceptance gate or decision. Test financial behaviour against independently checked expectations before implementation, then record focused verification and unresolved limitations. Higher-risk changes require the evidence defined in the acceptance checklist.

Keep private source evidence outside Git and reference it by an opaque identity. PRs must explain the change and risk, list verification, include UI evidence when relevant, and state schema, security, privacy and deployment impacts. Do not mark a gate complete without its required evidence.

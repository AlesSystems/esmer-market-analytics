# Esmer Market Analytics

Private Turkish desktop analytics for Esmer Market, intended for one owner on one trusted Windows computer. The approved product uses Electron, TypeScript, React, a local Node service and SQLite.

Phase 1 adds an offline desktop shell, a local SQLite availability probe, and a protected renderer boundary. The empty application has no login or source connection. Business features and durable analytics storage remain later work.

## Develop and verify

Use Node 24.15 or a compatible newer Node 24 patch and npm 11.

```sh
npm ci
npm run typecheck
npm run lint
npm test
npm run build
```

`npm run test:desktop -- tests/desktop/startup.test.ts` builds and launches a packaged application for the current host. `npm run test:unit -- <file>` and `npm run test:integration -- <file>` run Vitest once with a file filter. `npm run package:local` creates an unpacked host application. On Windows, `npm run package:win` creates unsigned x64 installer and portable artifacts in `release/`.

See [runtime decisions](docs/decisions/runtime.md), [the desktop contract](docs/contracts/desktop.md), [acceptance evidence](docs/evidence/index.md), and [the Windows agent handoff](docs/operations/windows-phase-1-handoff.md). Windows smoke validation remains pending.

## Reading order

| Document | Purpose |
| --- | --- |
| [Foundation specification](docs/superpowers/specs/2026-09-04-esmer-market-rebuild-design.md) | Approved product scope, architecture and D01–D20 constraints |
| [Database audit](docs/superpowers/specs/2026-09-04-esmer-market-rebuild-audit.md) | Historical source observations, uncertainty and required revalidation |
| [Release acceptance checklist](docs/superpowers/specs/2026-09-04-esmer-market-rebuild-acceptance.md) | Required evidence for A01–A07 and the later L01 live gate |
| [Phased implementation plan](docs/superpowers/plans/esmer-market-implementation-plan.md) | Eleven phases with dependencies, tasks, verification and completion criteria; no delivery schedule or effort estimates |

The three foundation documents remain authoritative. The plan organizes their delivery. Phases 1–10 cover the first release; Phase 11 is conditional live integration.

## Approval and current state

The user approved the written foundation and phased plan, then authorized Phase 1 implementation and PR creation. The current handoff stops before Windows testing. The Phase 1 exit gate and the release acceptance gates remain open until their required evidence is recorded.

Later implementation phases require the user's direction. Renewed source inspection retains its separate authorization gate. Production integration requires Eralp's acceptance, explicit permission for the specific source, and separate rollout direction.

Phase 1 establishes the verification commands above. The remaining plan paths describe future work. The evidence index distinguishes local verification from pending Windows acceptance.

## Essential product boundaries

- Turkish UI, English internal identifiers and TRY only; one store and one owner.
- Source access is permanently read-only. The offline first release imports prepared data and reads its local analytics store.
- Historical last-purchase cost is an estimate after source semantics are validated. Missing costs and incomplete expenses remain explicit; they never become zero or verified profit.
- Expense imports, corrections and accepted reports survive source refreshes. Excel export and independently recoverable encrypted backups are required.
- Do not commit identifiable customer records, employee-level payroll, source backups, credentials, legacy databases, or copied legacy runtime code and migrations.

Read the full specification and acceptance checklist before making implementation decisions.

## Document provenance

The three specification filenames retain their original record date. They were transferred from the separate `EsmerMarketAccounting` legacy repository. The implementation plan was transferred from the approved planning task's deliverable. Only approval status, repository context and links were updated; audit observations and application requirements were retained.

The original documents and legacy checkout remain separate. The audit is a historical summary, not a new database inspection or evidence that application acceptance passed. No legacy Git history was imported.

## Contribution and evidence

Use small, coherent Conventional Commits and link each implementation PR to its plan task and relevant acceptance gate or decision. Test financial behaviour against independently checked expectations before implementation, then record focused verification and unresolved limitations. Higher-risk changes require the evidence defined in the acceptance checklist.

Keep private source evidence outside Git and reference it by an opaque identity. PRs must explain the change and risk, list verification, include UI evidence when relevant, and state schema, security, privacy and deployment impacts. Do not mark a gate complete without its required evidence.

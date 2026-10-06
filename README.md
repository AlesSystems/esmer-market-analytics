# Esmer Market Analytics

Private Turkish desktop analytics for one owner and one Esmer Market store in the TRNC/KKTC. The application uses Electron, TypeScript, React, a local Node service and SQLite on Windows.

The local application includes sales, purchasing, Excel and manual expense entry, monthly reports, Excel export and encrypted recovery. Financial datasets still use synthetic mappings. Separately, an authorized prepared SQL package can supply raw-record browsing or unverified product/day/month contribution estimates. These estimates disclose assumed source meanings, excluded returns and unsupported costs. They do not activate validated financial reports or establish whole-market profit.

The optional isolated SQL test connection starts disabled. Imported records remain usable offline. Production rollout, validated real-source financial mapping and current-build Windows/recovery acceptance require separate evidence and direction. [The evidence index](docs/evidence/index.md) identifies current work and preserved historical receipts.

## Develop and verify

Use Node 24.15 or a compatible newer Node 24 patch and npm 11.

```sh
npm ci
npm run typecheck
npm run lint
npm test
npm run build
```

`npm run test:desktop -- tests/desktop/startup.test.ts` builds and launches the packaged application for the current host. Unit and integration scripts accept file filters. `npm run package:local` creates an unpacked host application. On Windows, `npm run package:win` creates unsigned x64 installer and portable artifacts in `release/`.

Inspect `package.json` for the current commands and locked dependencies. Optional SQL, private-package, performance and Windows tests require their documented environments; report skips separately. Local tests cannot pass another platform's acceptance gates.

## Read the applicable contract

| Document | Purpose |
| --- | --- |
| [Agent instructions](AGENTS.md) | Scope, source safety, implementation and handoff rules |
| [Foundation specification](docs/superpowers/specs/2026-09-04-esmer-market-rebuild-design.md) | Approved architecture and D01–D20 constraints |
| [Historical database audit](docs/superpowers/specs/2026-09-04-esmer-market-rebuild-audit.md) | Original source observations and their limits |
| [Acceptance checklist](docs/superpowers/specs/2026-09-04-esmer-market-rebuild-acceptance.md) | A01–A07 and later L01 proof requirements |
| [Original implementation plan](docs/superpowers/plans/esmer-market-implementation-plan.md) | Phase dependencies and verification contracts |
| [Recorded-source estimates](docs/contracts/recorded-estimates.md) | Current unverified contribution capability and exclusions |
| [Monthly product profit](docs/contracts/monthly-product-profit.md) | Covered financial gross-profit reporting contract |
| [Expense contract](docs/contracts/expense-completeness.md) | Import, manual entry, provenance and completeness |
| [Runtime decisions](docs/decisions/runtime.md) | Runtime and packaging choices |
| [Known limitations](docs/operations/known-limitations-tr.md) | Turkish explanation of current limits |

The foundation documents govern requirements. Later approved contracts describe bounded extensions. Original planning status and phase stop instructions are historical; use current source, tracker records and build-specific evidence for present work.

## Product boundaries

- Turkish UI, English internal identifiers and TRY only. One store and one owner, with no login or required paid cloud service.
- Source access is permanently read-only. Dashboards read the local analytics store.
- Historical last-purchase cost is an estimate. Missing costs, incomplete expenses and unknown tax treatment stay explicit. Source assumptions cannot become verified profit through arithmetic reconciliation or owner acknowledgement.
- Source refreshes preserve expenses, settings, adjustments and accepted reports. Failed imports preserve the last valid dataset.
- Keep source backups, credentials, identifying customer records, employee-level payroll and legacy runtime code out of Git and release artifacts.

Renewed source inspection requires authorization for an isolated copy. Owner contact, installation and production integration keep their separate boundaries.

## Document provenance

The three foundation filenames retain their original dates. Their approved requirements and historical audit observations were transferred from the separate legacy repository. No legacy Git history or runtime code was imported. Later evidence records identify the tested commits and remaining gates; they do not retroactively validate the original audit.

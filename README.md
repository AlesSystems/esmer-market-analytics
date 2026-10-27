# Esmer Market Analytics

Private Turkish desktop analytics for one owner and one Esmer Market store in the TRNC/KKTC. The application uses Electron, TypeScript, React, a local Node service and SQLite on Windows.

The current app version is **1.0.1**. The application includes monthly and product profit estimates, source-document browsing, Excel and manual expense entry, Excel export and encrypted recovery. Imported source records feed one workspace and SQLite store. Existing financial-only installations remain supported. Financial datasets still use synthetic mappings. Under the [profit-first decision](docs/decisions/issue-98-profit-first-estimate-edition.md), recorded-source estimates are v1's financial truth, disclosed once per page with a trust chip. They do not activate validated financial reports or establish verified profit.

On 2026-10-27, [Windows CI passed on main at `6c11ed4`](https://github.com/AlesSystems/esmer-market-analytics/actions/runs/40494227677). It built and inspected the installer and portable distributions and passed 48 packaged desktop tests. The [Windows CI receipt](docs/evidence/2026-10-27-windows-ci.md) records the exact build, test counts, skips and limits. The older `v1.0.1` tag predates the Windows fixes; the app version remains 1.0.1.

The app opens **Bu ay**, with **Ürünler**, **Giderler** and **Rapor ve Excel** in the sidebar and **Ayarlar** available separately. Navigation remembers the month and protects expense drafts. Tahmini net kâr appears only after eligible monthly expenses are marked complete.

The optional isolated SQL connection starts disabled. Imported records remain usable offline. The remaining Windows smoke test covers installation, Turkish presentation, native display scaling and uninstall on a supported Windows computer. Independent clean-machine recovery, production source permission and owner installation remain separate checks. Follow the [Windows handoff](docs/operations/windows-v1-handoff.md) and [current acceptance status](docs/evidence/index.md). The restored-backup demo is not production validation.

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

`npm run package:mac` creates the unsigned v0.5 Apple Silicon demo ZIP and its privacy inventory. Follow [the Turkish demo guide](docs/operations/demo-v0.5-tr.md) and [build-specific evidence](docs/evidence/2026-10-09-v0.5-demo.md). Mac demo delivery does not satisfy Windows acceptance.

Inspect `package.json` for the current commands and locked dependencies. Optional SQL, private-package, performance and Windows tests require their documented environments; report skips separately. Local tests cannot pass another platform's acceptance gates.

## Read the applicable contract

| Document | Purpose |
| --- | --- |
| [Agent instructions](AGENTS.md) | Scope, source safety, implementation and handoff rules |
| [Foundation specification](docs/superpowers/specs/2026-09-04-esmer-market-rebuild-design.md) | Approved architecture and D01–D20 constraints |
| [Historical database audit](docs/superpowers/specs/2026-09-04-esmer-market-rebuild-audit.md) | Original source observations and their limits |
| [Acceptance checklist](docs/superpowers/specs/2026-09-04-esmer-market-rebuild-acceptance.md) | A01–A07 and later L01 proof requirements |
| [Original implementation plan](docs/superpowers/plans/esmer-market-implementation-plan.md) | Phase dependencies and verification contracts |
| [Recorded-source estimates](docs/contracts/recorded-estimates.md) | v1 estimated profit (Tahmini brüt kâr, Marj) and exclusions |
| [Monthly product profit](docs/contracts/monthly-product-profit.md) | Covered financial gross-profit reporting contract |
| [Expense contract](docs/contracts/expense-completeness.md) | Import, manual entry, provenance and completeness |
| [Runtime decisions](docs/decisions/runtime.md) | Runtime and packaging choices |
| [Profit-first estimate edition](docs/decisions/issue-98-profit-first-estimate-edition.md) | v1 re-baseline: estimate as financial truth, plain wording, trust chip, Tahmini net kâr |
| [Known limitations](docs/operations/known-limitations-tr.md) | Trackable list of v1 limits and open items (Turkish) |

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

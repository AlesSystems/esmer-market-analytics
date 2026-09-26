# Agent instructions

## Start here

- Check the current branch, worktree and existing changes before editing. Preserve unrelated work.
- Read the requested issue and its comments with `gh issue view <number> --comments`; inspect its labels and dependencies. Work within the authorized phase and stop at the user's stated handoff boundary.
- Read the foundation documents before implementation decisions:
  1. [Specification](docs/superpowers/specs/2026-09-04-esmer-market-rebuild-design.md): product scope, architecture and D01–D20 constraints.
  2. [Database audit](docs/superpowers/specs/2026-09-04-esmer-market-rebuild-audit.md): historical observations and unresolved source semantics.
  3. [Acceptance checklist](docs/superpowers/specs/2026-09-04-esmer-market-rebuild-acceptance.md): required evidence for A01–A07 and L01.
  4. [Implementation plan](docs/superpowers/plans/esmer-market-implementation-plan.md): phase dependencies, tasks and verification.
- The three foundation documents govern requirements; the plan organizes delivery. Surface conflicts rather than silently changing the product contract.
- For the isolated SQL live check and the prepared SQL backup import, follow [Show recorded SQL rows](https://github.com/AlesSystems/AlesSystems-Workstreams/blob/main/Esmer%20Market%20Analytics/plans/2026-09-26-live-and-backup-display.md) before editing those paths. The first priority is recorded source rows in the source workspace. Do not treat those rows as sales, cost, or profit. Do not add customer, employee, product-name, or supplier columns.
- Check files and scripts on the current branch. Proposed paths, unchecked plan items and historical status paragraphs are not evidence of current implementation or acceptance. Honor authorization already given in the conversation without asking for it again.

## Product and data boundaries

- Build one offline desktop application for one owner and one store on Windows, using Electron, TypeScript, React, a local Node service and SQLite.
- Use Turkish UI text and presentation conventions, English internal identifiers and TRY only. The business is in the TRNC/KKTC; do not assume another jurisdiction's tax rules.
- Dashboards read the local analytics store. Source access is permanently read-only; the first release has live access disabled. Do not add login, PIN, roles, multi-user features or required paid cloud services.
- Renewed source inspection requires separate authorization and an isolated restored backup. A historical audit is not permission to access a source or proof of its current semantics. Continue independent synthetic work when source evidence is unavailable.
- Do not contact Eralp, install on his computer or connect to production as a side effect of development. Live integration requires his acceptance, explicit permission for the source and separate rollout direction.
- Do not copy legacy application code, migrations or Git history, or depend on the legacy application at runtime.
- Keep original backups, credentials, identifiable customer records and employee-level payroll out of Git, logs, screenshots, fixtures and release artifacts. Use synthetic or approved reduced fixtures; keep private evidence outside Git and reference it by opaque identity.

## Implementation rules

- Build only the authorized slice. Reuse existing code and platform capabilities before adding dependencies; do not scaffold later phases or introduce independently deployed services or a public HTTP API.
- Keep privileged operations behind narrow, named IPC operations. Validate the sender, operation and payload before invoking the service. The renderer must not receive Node powers, database access, credentials or arbitrary SQL execution.
- Keep financial calculations out of the UI. Use deterministic decimal arithmetic, preserve source precision and define rounding explicitly. Verify expected results independently of the implementation.
- Missing cost, incomplete expenses and unknown tax treatment remain explicit. Never convert them to zero, silently invent source mappings or label an estimate as verified profit.
- Source refreshes must preserve app-owned expenses, adjustments, settings, audit history and accepted reports. Failed imports must retain the last valid active dataset; accepted report versions must remain reproducible.
- Keep dependency versions locked and review licence and Windows packaging compatibility when changing them.

## Verification and handoff

- For behavioral changes, first expose the missing contract with a focused test. Record the observed failure accurately: a broken toolchain or missing executable is different from incorrect application behavior.
- Inspect `package.json` before choosing commands. Once present, use the relevant `test:unit`, `test:integration` and `test:desktop` scripts, plus `typecheck`, `lint` and `build` for application changes. Desktop checks must exercise the packaged application. For documentation-only changes, check the diff and local links.
- Windows packaging uses `npm run package:win` once established. macOS/Linux checks do not satisfy Windows acceptance. Follow any requested Windows handoff and leave unperformed checks open.
- Work in small, coherent Conventional Commits: `test:` for the contract, `feat:`/`fix:` for implementation, separate boundary tests and `docs:` for evidence when needed. Keep unrelated cleanup out of behavior commits.
- Record acceptance evidence with task/gate ID, commit/build, fixture or source-batch identity, environment, command/procedure, expected and actual results, evidence path and limitations. Never mark a gate complete solely because code exists or tests on another platform pass.
- PRs must link the issue and relevant plan task/decision, explain the change and risk, list verification, include UI screenshots when relevant, and identify schema, security, privacy and deployment impacts.
- Handoffs must include branch, commit hashes, PR link if present, tests run, evidence and unresolved gates. When handing off to another platform, give exact remaining checks and instructions to continue on the same branch.

## Workflow references

- [Issue tracker](docs/agents/issue-tracker.md): GitHub Issues and PRDs; use `gh` for tracker operations.
- [Triage labels](docs/agents/triage-labels.md): the five-role label vocabulary.
- [Domain docs](docs/agents/domain.md): single-context layout, glossary and ADR conventions. Read applicable records when they exist; do not create placeholders merely to satisfy the layout.

Keep this file focused on durable repository rules. Store current phase status and detailed evidence in the issue, PR and evidence documents; keep machine-specific skill installation instructions in the user's agent configuration.

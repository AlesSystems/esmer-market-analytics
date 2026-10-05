# Agent instructions

## Start here

1. Check the branch, worktrees, changes and Git remote. Preserve unrelated work and verify the remote before commits, pushes or PRs.
2. For an assigned issue, read `gh issue view <number> --comments`, its labels and dependencies. Work within the authorized scope and handoff boundary.
3. Read [README.md](README.md) and [the evidence index](docs/evidence/index.md) for current capabilities and open gates. Read these foundation documents before implementation decisions:
   - [Specification](docs/superpowers/specs/2026-09-04-esmer-market-rebuild-design.md) governs scope, architecture and D01–D20.
   - [Database audit](docs/superpowers/specs/2026-09-04-esmer-market-rebuild-audit.md) preserves historical observations and unresolved semantics.
   - [Acceptance checklist](docs/superpowers/specs/2026-09-04-esmer-market-rebuild-acceptance.md) defines A01–A07 and L01 proof.
   - [Implementation plan](docs/superpowers/plans/esmer-market-implementation-plan.md) records phase dependencies and verification. Its proposed paths, checkboxes and historical stop instructions are not current implementation or authorization evidence.
4. Read the affected [contracts](docs/contracts), [decision records](docs/decisions) and [domain glossary](CONTEXT.md). For UI work, also read [PRODUCT.md](PRODUCT.md) and [DESIGN.md](DESIGN.md). Surface conflicts with the foundation rather than changing the product contract silently.

For SQL live-check or backup-preparation changes, read [Show recorded SQL rows](https://github.com/AlesSystems/AlesSystems-Workstreams/blob/main/Esmer%20Market%20Analytics/plans/2026-09-26-live-and-backup-display.md). Raw previews preserve recorded rows without sales, cost or profit claims. The separately approved [recorded-source estimate contract](docs/contracts/recorded-estimates.md) permits only its declared unverified contribution calculation. Read [monthly product profit](docs/contracts/monthly-product-profit.md) for financial reporting. None authorizes customer, employee, product-name or supplier columns by implication.

Use `gh` for GitHub issues and PRs. Check actual labels with `gh label list`. Store current work status in issues, PRs and evidence records. Historical issue closure does not pass an acceptance gate or authorize source access. Honor authorization already given in the conversation.

## Execution graphs

Before substantial work across workstreams, agents, implementation areas or verification stages, write an explicit directed acyclic graph of work contracts. Trivial isolated edits need no graph.

Each node has a unique ID, type, objective, dependencies and acceptance criteria. Include inputs, allowed areas, artifacts, verification and risk where relevant. Use analysis, design, implementation, test, review, integration or documentation types.

Run a node only after every predecessor succeeds. Check file and resource conflicts before parallel work. Serialize overlapping critical writes or add a shared prerequisite. Agent availability alone does not justify delegation.

Keep graph states inspectable as `pending`, `ready`, `running`, `blocked`, `completed` or `failed`. A blocked node names its unmet dependency. Derive ready nodes from the graph and use an existing deterministic scheduler where available. Pass decisions, changed files, evidence and findings to downstream nodes. Diagnose failures before repair and re-test. Include downstream verification, review, integration and final acceptance where appropriate; implementation alone does not complete the graph.

## Product and data boundaries

- One offline Windows application serves one owner and store. Use Electron, TypeScript, React, a local Node service and SQLite.
- Use Turkish UI and presentation, English internal identifiers and TRY only. The business is in the TRNC/KKTC; infer no other jurisdiction's tax rules.
- Dashboards read the local analytics store. Source access stays permanently read-only. Production live access remains separately gated; optional isolated test access starts disabled. Add no login, PIN, roles, multi-user features or required paid cloud services.
- Renewed source inspection requires separate authorization and an isolated restored backup. Historical audits confer no access permission or current semantic proof. Continue independent synthetic work when source evidence is unavailable.
- Owner contact, installation on Eralp's computer and production access require separate direction. Live rollout also requires his acceptance and explicit permission for the specific source.
- Keep the legacy application separate. Copy no legacy runtime code, migrations or Git history, and add no legacy runtime dependency.
- Keep original backups, credentials, identifying customer records and employee-level payroll out of Git, logs, screenshots, fixtures and releases. Use synthetic or approved reduced fixtures. Keep private evidence outside Git and reference it by opaque identity.

## Implementation rules

- Build the authorized slice with existing modules and platform capabilities. Avoid later-phase scaffolding, independently deployed services and public HTTP APIs.
- Expose privileged work through narrow named IPC operations. Validate sender, operation and payload before service execution. The renderer receives no Node powers, database access, credentials or arbitrary SQL capability.
- Calculate finances in the service/domain layer with deterministic decimal arithmetic, preserved source precision and explicit rounding. Independently verify expected results.
- Preserve missing cost, incomplete expenses and unknown tax treatment explicitly. They never become zero, guessed mappings or verified profit. Keep recorded-source estimates distinct from validated financial reports.
- Source refreshes preserve expenses, adjustments, settings, audit history and accepted reports. Failed imports retain the last valid dataset. Accepted report versions remain reproducible.
- Lock dependency versions and review licences and Windows packaging compatibility when dependencies change.

## Verification and handoff

- For behavioral changes, first expose the missing contract with a focused test. Distinguish application failure from missing executables or broken tooling.
- Inspect `package.json` before selecting commands. For application changes, run relevant unit, integration and actual packaged desktop tests, plus typecheck, lint and build. For documentation-only changes, check the diff, local links and references to removed paths.
- Build Windows artifacts with `npm run package:win`. macOS/Linux checks do not satisfy Windows acceptance. Follow the requested platform handoff and leave unperformed checks open.
- Use small coherent Conventional Commits. Separate the contract test, implementation, extra boundary coverage and higher-risk evidence. Keep unrelated cleanup out of behavior commits.
- Record task/gate ID, commit/build, fixture or opaque source batch, environment, command/procedure, expected and actual result, evidence location and limitations. Code existence, issue closure and another platform's tests cannot pass a gate.
- PRs link the relevant issue and plan task/decision, explain risk and verification, include UI evidence when relevant, and identify schema, security, privacy and deployment impacts.
- Handoffs include branch, commit hashes, PR, verification, evidence and unresolved gates. For another platform, give exact remaining checks and the intended branch/build.

Keep these instructions durable. Keep detailed phase status and receipts in the evidence records, and machine-specific skill installation instructions in the user's agent configuration.

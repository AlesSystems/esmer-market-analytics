# Windows agent prompt for Phase 4

Copy this prompt into a Windows-agent session.

```text
Continue issue #7 in AlesSystems/esmer-market-analytics:
https://github.com/AlesSystems/esmer-market-analytics/issues/7

The user authorized Phase 4 implementation and PR creation, with a stop before Windows-specific implementation/testing on the Mac. Continue Windows checks and necessary Phase 4 fixes on the SAME branch, codex/phase-4-durable-imports. Find its existing PR:
  gh pr list --head codex/phase-4-durable-imports --state open
Do not open a replacement PR, merge, close issue #7, or begin Phase 5.

Read AGENTS.md. Inspect branch, worktrees and existing changes. Preserve unrelated work. Fetch origin and safely check out the same branch. Record its fetched SHA. Read issue #7 with comments, labels and dependencies #4, #5 and #6. Read the foundation specification, audit, acceptance checklist and Phase 4/global/shared/evidence sections of docs/superpowers/plans/esmer-market-implementation-plan.md.

Read docs/contracts/persistence.md, docs/contracts/analytics-package.md, docs/contracts/desktop.md, docs/evidence/phase-4-local.md, docs/evidence/index.md and docs/decisions/runtime.md. Inspect src/store, service operations/worker, desktop IPC and all Phase 4 integration and packaged desktop tests before changing code.

Scope is one app-owned SQLite database, versioned source snapshots, app-owned revisions, pinned accepted reports, atomic package import and retention. Source packages remain synthetic-only. No financial calculation, expense spreadsheet workflow, report/export UI, backup/recovery or live source integration is authorized by this handoff.

No renewed source access is authorized. Do not start existing source containers, restore private backups, access credentials, query a market source, contact Eralp or install on his computer. Tests must create disposable synthetic SQLite databases. Source mapping, SQL Server permissions, reconciliation, real-data privacy and full-volume performance remain open.

Inspect package.json. Use Node >=24.15.0 <25 and npm 11. Run in PowerShell and check each exit code before continuing:
  git status --short --branch
  git rev-parse HEAD
  node --version
  npm --version
  npm ci
  npm run test:integration -- tests/integration/store-ownership.test.ts
  npm run test:integration -- tests/integration/import-activation.test.ts
  npm run test:integration -- tests/integration/import-failures.test.ts
  npm run typecheck
  npm run lint
  npm run build
  npm run package:win
  npm test

The full suite must launch the actual packaged Windows executable. Verify the owning worker creates/reopens analytics.sqlite under the chosen userData profile. Verify migration and same-profile restart preserve source values, expense/adjustment revisions, evidence, and accepted report pins. Reimporting identical or superseded packages must not duplicate source rows or silently roll back active data. A/B overlap must replace the active view, preserve app edits made during staging, and flag changed/missing adjustment targets without reassignment. Reused source IDs under a reset lineage must remain distinct.

Exercise the packaged native file selection and import success/cancel/failure flow with synthetic packages. A failed first import stays empty with a useful Turkish error. After a successful import, invalid input, cancellation and failures must keep the previous complete dataset readable. Missing costs and partial coverage stay visible; no synthetic financial total becomes a real or source-reconciled result. Renderer input cannot supply arbitrary SQL, credentials or filesystem paths. Preserve sandboxing, context isolation and existing navigation/network restrictions.

Rerun interruption recovery and storage-pressure checks on Windows. Distinguish actual process termination and SQLite max_page_count SQLITE_FULL from physical disk exhaustion. If testing physical disk exhaustion, use a disposable bounded test volume, never fill the system disk. Verify interrupted imports show a Turkish warning after restart in both empty and loaded profiles. A subsequent successful import must clear the warning. Verify workers release file handles on cancellation, failure and shutdown. Inspect any locking or rename behavior on this platform. Do not count caught exceptions alone as crash-recovery proof.

Exercise portable launch and NSIS install/start/restart/upgrade/uninstall in an isolated test profile. Seed synthetic durable app state before upgrade and verify it afterward. Document where user data survives uninstall; do not delete an existing personal profile. Exercise offline launch with a previously imported package and distinguish automated checks from separately attributed human physical-disconnect observations. Record unsigned publisher warnings accurately.

Inspect app.asar and surrounding release files. Confirm private backups, credentials, local databases, source extraction/preparation tooling, tests, fixtures and work files are absent. Package reading/store code is now expected in the service bundle. scripts/verify-package.mjs checks notices; inspect archive contents separately and record safe inventories and SHA-256 hashes.

For defects, first expose the missing behavior with a focused failing test. Fix the smallest root cause. Do not weaken validation, source gates, retention or immutable report history. After code changes rerun focused checks, typecheck, lint, build, Windows packaging and the full suite. Keep dependencies locked and use small Conventional Commits.

Write docs/evidence/windows-phase-4.md with task/gate IDs, fetched and final code/build SHAs, synthetic fixture/package identities, Windows edition/build/architecture, non-identifying hardware, Node/npm and packaged runtime versions, commands, expected and actual results, artifact hashes, screenshots/inventory and limitations. Link it from the evidence index and existing PR. Record manual results separately. Keep unperformed checks open. A04 includes later expense-import/recovery obligations, and macOS results cannot pass Windows acceptance.

Review independently when agents are available. Commit/push only Phase 4 fixes and evidence on codex/phase-4-durable-imports. Update the existing PR description with Windows evidence. Return the PR URL, commit hashes, tests, evidence and open gates. Stop after Phase 4 without merging or starting Phase 5.
```

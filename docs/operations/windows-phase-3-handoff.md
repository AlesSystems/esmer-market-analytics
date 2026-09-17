# Windows agent prompt for Phase 3

Copy this prompt into a Windows-agent session.

```text
Continue Phase 3 of https://github.com/AlesSystems/esmer-market-analytics/issues/6 in AlesSystems/esmer-market-analytics.

The user authorized Phase 3 implementation and a PR, with a stop before Windows testing on the Mac. Continue Windows verification and necessary Phase 3 fixes on the SAME branch, codex/phase-3-analytics-packages. Find and update its existing PR:
  gh pr list --head codex/phase-3-analytics-packages --state open
Do not open a replacement PR, merge, close issue #6, or begin Phase 4.

Read AGENTS.md. Inspect status, branch and worktrees; preserve unrelated changes. Fetch origin and safely check out codex/phase-3-analytics-packages. Record the fetched SHA. Read issue #6 with `gh issue view 6 --comments`, its labels and dependency #5. Read the foundation specification, audit, acceptance checklist and Phase 3/global/shared/evidence sections of docs/superpowers/plans/esmer-market-implementation-plan.md.

Then read:
- docs/contracts/source.md and docs/contracts/privacy.md
- src/source/contract.ts and the new extraction/package modules
- docs/contracts/analytics-package.md
- docs/operations/prepare-package.md
- docs/evidence/phase-3-local.md and docs/evidence/index.md
- docs/decisions/runtime.md and docs/evidence/windows-phase-2.md
- tools/prepare-backup.ts and all three Phase 3 integration tests

Scope is developer-side synthetic read-only extraction, portable analytics-package validation and Windows regression. The desktop still displays its empty/offline view. There is no package import/activation UI yet. Do not implement later-phase storage, financial calculations, reports or live integration.

No renewed source access is authorized. Do not start an existing source container, restore a POS backup, query a market source, use private credentials/records, contact Eralp or install on his machine. The tests create disposable synthetic SQLite databases themselves. Negative write/administration tests run ONLY there. Windows access does not authorize SQL Server access. Keep real SQL Server restricted-account proof, reviewed real raw-column mapping, source reconciliation, real-data privacy and full-volume performance gates open. A synthetic package must not become source-reconciled data.

Inspect package.json. Use Node 24 satisfying >=24.15.0 <25 and npm 11. In PowerShell run these commands, checking each exit code before continuing:
  git status --short --branch
  git rev-parse HEAD
  node --version
  npm --version
  npm ci
  npm run test:integration -- tests/integration/source-readonly.test.ts
  npm run test:integration -- tests/integration/source-privacy.test.ts
  npm run test:integration -- tests/integration/analytics-package.test.ts
  npm run typecheck
  npm run lint
  npm run build
  npm run package:win
  npm test

The full suite includes the actual packaged desktop test. Verify it launches the packaged Windows executable. Do not disable sandboxing/context isolation/webSecurity, expose raw IPC/Node to the renderer, or weaken source/package validation to obtain a pass.

Follow prepare-package.md to exercise the synthetic CLI on this host. Verify deterministic output from identical source/metadata, round-trip validity, missing-cost/partial-coverage warnings, strict rejection and safe diagnostics. Verify cancellation/timeouts release workers and file handles on Windows. Failed or repeated preparation must preserve an existing destination and leave no published partial package. The synthetic source bytes must remain unchanged. Test support creates the fixture; never substitute a private restored database.

Inspect app.asar and surrounding release files. Confirm preparation tools, extraction worker, synthetic source fixtures, repository tests/docs/work files, backups, credentials and local databases are absent. scripts/verify-package.mjs checks dependency notices only. Use @electron/asar inspection separately, following the Phase 3 local inventory, and retain a safe file inventory and SHA-256. Inspect generated payloads/logs for synthetic private sentinels without copying actual private values.

Open the final portable artifact. Exercise NSIS install/start/restart/uninstall on this isolated test machine. Confirm `Henüz veri içe aktarılmadı`, `Canlı bağlantı kapalı`, service availability, no login and no financial demo data. Exercise startup with networking disconnected and distinguish automated evidence from human observations. Record unsigned publisher warnings accurately. Do not claim later full-dataset, upgrade, recovery or performance gates from this empty-app check.

For defects, first reproduce with a focused failing behavioral test. Make the smallest root-cause fix, then run relevant checks. Keep small Conventional Commits and locked dependencies. After code changes, rerun the complete suite, typecheck, lint, build, Windows packaging and final packaged smoke. Preserve worker cleanup, strict unknown-field rejection, exact decimal strings and source gating.

Write docs/evidence/windows-phase-3.md with task/gate IDs, fetched and final code/build SHAs, synthetic fixture/mapping/lineage identities, Windows edition/build/architecture, non-identifying hardware details, Node/npm and packaged runtime versions, commands, expected/actual outcomes, artifact names/hashes, inventory/screenshots and remaining limitations. Record manual results separately. Link it from docs/evidence/index.md and the existing PR. Only mark evidence actually demonstrated; SQLite denial is not SQL Server account permission proof.

Review independently when agents are available. Commit and push only Phase 3 fixes/evidence on codex/phase-3-analytics-packages, then update the existing PR description with the Windows record. Return the PR URL, commit hashes, tests, artifacts/evidence and open gates. Stop after Phase 3. Do not merge or begin Phase 4.
```

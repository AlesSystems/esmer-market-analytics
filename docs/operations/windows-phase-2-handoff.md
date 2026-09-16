# Windows agent prompt for Phase 2

Copy this prompt into a new Windows-agent session.

```text
Continue Phase 2 of https://github.com/AlesSystems/esmer-market-analytics/issues/5 in AlesSystems/esmer-market-analytics.

The user authorized Phase 2 implementation and a PR, with this session completing Windows implementation/testing on the SAME branch, codex/phase-2-source-contract. Locate the existing PR with:
  gh pr list --head codex/phase-2-source-contract --state open
Update that PR. Do not open a replacement, merge it, close issue #5 automatically, or start Phase 3.

Read AGENTS.md first. Inspect git status, branch and worktrees, preserve unrelated changes, fetch origin, and safely check out codex/phase-2-source-contract. Record the fetched SHA before edits. Read issue #5 with `gh issue view 5 --comments`, its labels, and closed dependency #4. Read the foundation specification, audit, acceptance checklist, and Phase 2/global/shared/evidence sections of docs/superpowers/plans/esmer-market-implementation-plan.md. Historical status paragraphs do not override the user's implementation authorization.

Then read:
- docs/contracts/source.md
- docs/contracts/calculations.md
- docs/contracts/privacy.md
- src/source/contract.ts
- tests/integration/fixture-contract.test.ts and its referenced fixtures
- docs/evidence/golden-oracles.md
- docs/evidence/phase-2-local.md
- docs/evidence/index.md
- docs/decisions/runtime.md and docs/evidence/windows-phase-1.md

Scope is Phase 2 contracts, synthetic oracles, paired snapshots, their validation, and Windows regression checks. Fix only defects needed for this scope. Financial engines, extraction/packages, persistent imports/reports and later UI are later phases. There is no new Phase 2 UI; the packaged app should retain the empty/offline Phase 1 view.

No renewed source access is authorized. Do not start a database container, restore a backup, query a source, use private records or credentials, connect to production, contact Eralp or install on his computer. Use an isolated Windows development/test machine. Synthetic fixture success must not promote source financial rules to supported/source-reconciled, turn estimated profit into exact profit, or close source-dependent gates. Leave unavailable source evidence open and finish independent Windows work.

Inspect package.json before choosing commands. Use a supported Node 24 patch satisfying >=24.15.0 <25 and npm 11. In PowerShell run, checking each exit code before proceeding:
  git status --short --branch
  git rev-parse HEAD
  node --version
  npm --version
  npm ci
  npm run test:integration -- tests/integration/fixture-contract.test.ts
  npm run typecheck
  npm run lint
  npm run build
  npm run package:win
  npm test

`npm test` runs unit, integration and actual packaged desktop tests. `npm run package:win` creates NSIS/portable x64 outputs and verifies dependency notices. The desktop test must use the packaged Windows executable, not a development server. Never disable sandboxing, context isolation or webSecurity, add --no-sandbox, weaken sender/payload checks, or expose Node/raw IPC to get a pass.

Run the focused fixture test under TZ=UTC and TZ=Pacific/Honolulu, saving and restoring the previous process TZ value. Do not permanently change the system clock/timezone. Record the limit: this checks synthetic date-only expectations, not an actual market-local source timestamp interpreter, which does not exist yet.

Inspect app.asar and surrounding release files. Confirm tests, synthetic/private attack fixtures, docs/work files, source backups, credentials and local databases are absent. The source contract has no desktop entry-point import. scripts/verify-package.mjs checks licence notices, not complete privacy; use @electron/asar inspection separately and retain a safe inventory/hash record. Do not print private machine/user identifiers.

Open the final portable artifact and exercise the NSIS install/start/restart/uninstall smoke path on the test machine. Check `Henüz veri içe aktarılmadı`, `Canlı bağlantı kapalı`, no login, actual service availability and no financial demo data. Test launch with networking disconnected and distinguish automated evidence from human observation. Record unsigned publisher warnings accurately. Full-dataset/upgrade/recovery/performance acceptance belongs to later phases.

For defects, reproduce with a focused failing behavioral check, apply the smallest root-cause fix, and rerun relevant checks. Keep small Conventional Commits. Reuse installed dependencies. Add no source connector or later-phase engine to make fixtures pass. After code changes rerun the complete suite, typecheck, lint, build, Windows packaging and final packaged smoke.

Create docs/evidence/windows-phase-2.md with task/gate ID, final code/build SHA, fixture mapping/lineage identities, Windows edition/build/architecture and non-identifying hardware details, Node/npm and bundled runtime versions, commands, expected versus actual results, artifact names and SHA-256 hashes, inventory and screenshot paths, and limitations. Record manual outcomes separately. Link it from docs/evidence/index.md and the existing PR.

Review changes independently when agents are available. Commit and push only Phase 2 fixes/evidence to codex/phase-2-source-contract. Update the PR description with Windows evidence. Mark only checks actually demonstrated. Keep clean-source revalidation, source units/KDV/discounts/rounding/business-date/economic-identity questions and real reduced-fixture work open. A02/A03/A04/A05/A07 release gates are broader than this synthetic phase.

Return the existing PR URL, final commit hashes, tests, artifact/evidence links, and unresolved limitations. Stop after Phase 2. Do not merge or begin Phase 3.
```

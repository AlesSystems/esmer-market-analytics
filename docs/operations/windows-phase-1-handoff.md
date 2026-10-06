# Windows agent prompt

Continue Phase 1 of [issue #4](https://github.com/AlesSystems/esmer-market-analytics/issues/4) in `AlesSystems/esmer-market-analytics`.

The user authorized Phase 1 implementation, a PR, and handoff to a Windows agent for Windows testing and final Phase 1 modifications on the same branch. Work on `codex/phase-1-independent-foundation`. Fetch the branch and record its current SHA before you change anything. Preserve unrelated local changes. Update the existing PR for this branch; do not open a replacement PR or merge it.

Read these files first:

- `AGENTS.md`.
- The global constraints, shared decisions, execution rules, and Phase 1 tasks in `docs/superpowers/plans/esmer-market-implementation-plan.md`.
- The three linked foundation specifications and acceptance checklist.
- `docs/decisions/runtime.md`, `docs/contracts/desktop.md`, and `docs/evidence/index.md`.

## Scope and authorization

Complete Windows validation and fix defects needed for Phase 1 only. Use an isolated Windows development/test machine. Do not install on Eralp's computer, connect to the market database, restore source backups, import private data, add credentials, start Phase 2, or deploy. The application must work offline and have no login screen. Empty synthetic data is the entire test fixture for this phase.

## Verify the Windows build

Use Node 24.15 or a compatible newer Node 24 patch and npm 11. Run the following commands in PowerShell from the repository root:

```powershell
git status --short
git branch --show-current
git rev-parse HEAD
node --version
npm --version
npm ci
npm run typecheck
npm run lint
npm run test:unit
npm run test:integration -- tests/integration/desktop-boundary.test.ts
npm run test:desktop -- tests/desktop/startup.test.ts
npm run build
npm run package:win
```

The desktop command must launch the actual packaged executable. Keep context isolation and sandboxing enabled. Never add `--no-sandbox`, disable `webSecurity`, or expose raw IPC to make a test pass. If the test driver needs a change, preserve the security contract and document the cause.

Open the packaged Windows executable with networking disconnected. Also open the portable artifact and exercise the NSIS install/launch/uninstall smoke path on the isolated test machine. Phase 10 retains comprehensive upgrade, recovery, performance, and full-dataset acceptance.

Verify these observations:

1. The window displays `Henüz veri içe aktarılmadı` and service-derived offline availability. No login or password prompt appears.
2. A fresh profile is a valid state. Close and reopen the application. No developer Node runtime, SQL restore, source credentials, or network service is required by the packaged app.
3. The packaged local worker can load SQLite. Record Electron, bundled Node, and SQLite versions from the tested runtime, separately from development Node.
4. Unknown operations, invalid payloads, untrusted senders, and SQL-bearing import requests fail before service work. The renderer exposes only the named availability method, with no native modules, filesystem paths, or credentials.
5. Navigation, popups, permissions, and network access remain restricted. Errors shown to the user are Turkish. Logs contain safe codes rather than request contents or private paths.
6. Inspect `app.asar` and other release files. The package must contain only the application and approved public dependencies, including required licence notices. It must exclude `.env` files, source backups, legacy databases/code, private fixtures, source maps with machine paths, credentials, and identifying records.

Record the Windows edition/build, architecture, machine characteristics, Node/npm versions, tested commit SHA, artifact names and SHA-256 hashes, commands, actual outcomes, and screenshots in `docs/evidence/windows-phase-1.md`. Record any unsigned publisher warning accurately. Keep private machine/user identifiers and production material out of Git. Link the evidence from `docs/evidence/index.md` and the PR.

## Fix and finish on this branch

For a reproducible defect, add the smallest useful failing behavioral check before the fix. Use small Conventional Commits with one behavior per commit. After modifications, rerun focused checks, typecheck, lint, build, packaging, and the complete available suite with `npm test`. Repeat the manual packaged Windows smoke for the final code.

Run an independent review of the final changes when agents are available. Commit and push the fixes and evidence to `codex/phase-1-independent-foundation`. Update the PR description and screenshot with the final evidence. Mark the Phase 1 exit gate complete only if the required offline startup, privilege-boundary, dependency, and Windows smoke evidence all pass. Do not mark all of A01, A05, or A07 complete; later phases own the remaining release criteria.

Return the PR URL, final commit hashes, verification results, artifact hashes, screenshot/evidence links, and unresolved limitations. Stop after Phase 1. Do not merge or begin Phase 2.

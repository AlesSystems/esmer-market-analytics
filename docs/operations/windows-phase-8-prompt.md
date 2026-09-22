# Windows-agent prompt for Phase 8

Continue Phase 8 of AlesSystems/esmer-market-analytics, GitHub issue #11, on branch `codex/phase-8-reporting` and [PR #22](https://github.com/AlesSystems/esmer-market-analytics/pull/22). The macOS implementation intentionally stopped before Windows work. Inspect branch/worktree/status, preserve unrelated changes, fetch the latest branch and attach the existing PR to this task. Do not create a replacement PR or merge.

Implementation source is `534c091`; the initial evidence/handoff commit is `23a7368`. Fetch the branch tip so this prompt includes later documentation links.

Read repository AGENTS.md, the foundation specification/audit/acceptance checklist, Phase 8 of the roadmap, `docs/evidence/phase-8-local.md`, `docs/contracts/reports.md`, and `docs/operations/windows-phase-8-handoff.md`. Follow the handoff's exact commands and native checks. Record the tested SHA and Windows hardware/OS/scaling/toolchain.

Implement only fixes required for Phase 8 on Windows. Run unit/integration/typecheck/lint/build checks, packaged desktop journeys including monthly-overview/unavailable-states and existing sales/purchasing/expense drills, then `npm run package:win`. Test portable and NSIS builds, real open/save/cancel dialogs, Turkish filenames and spreadsheet round-trips, saved-report revisions after restart/refresh/expense correction, selected-version export during refresh, progress/cancel/navigation, 100/125/150% OS scaling, and isolated upgrade/data preservation. Use focused failing regressions before behavioral fixes.

Use synthetic data and disposable profiles. Do not connect to production, inspect a source backup, contact Eralp, install on his computer, fabricate owner confirmation, merge, close issue #11, or implement Phases 9–11. Keep real-source and unmeasured full-volume performance gates open. Never treat macOS or small-fixture results as Windows/full-data acceptance.

Write `docs/evidence/windows-phase-8.md`, update the existing PR with screenshots and results, and commit coherent test/fix/docs changes to the same branch. Return commit hashes, PR link, checks, acceptance evidence and unresolved limitations.

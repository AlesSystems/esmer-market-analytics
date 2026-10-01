# Windows handoff factual review

ISSUES. One actionable environment-isolation gap was found in `workstreams/windows-handoff.md`. This is a bounded documentation check, not a correctness verdict or Windows acceptance.

Reviewed on 2026-10-01 against the available checkout at `11ed6e993f0165b807fc77850492f9f7a335469b`. The final integrated candidate SHA is deliberately pending #47/#42 integration. Recheck this report against that candidate before execution. Only this findings artifact changed.

## Clear inherited SQL inputs before automated checks

The handoff permits synthetic inputs only at line 5 but runs unfiltered integration and desktop suites at lines 22 and 25. Its command block does not clear SQL environment variables inherited by the PowerShell session.

The existing tests switch behavior based on those variables:

- `tests/integration/live-sql-server.test.ts:5-7` enables real SQL fixtures when `ESMER_SQL_TEST_ADMIN` exists. `tests/helpers/live-sql-fixture.ts:104-127` then connects to the configured administrator target, creates a fixture database/login, and later drops them.
- `tests/integration/synthetic-sql-dev.test.ts:6-21` also enables SQL seed, mutation, and cleanup with `ESMER_SQL_TEST_ADMIN`.
- `tests/integration/live-consistency.test.ts:19-23` reads `ESMER_SQL_TEST_CONFIG` and performs two source extractions.
- `tests/desktop/live-connection.test.ts:14-15` reads the same config instead of the synthetic unavailable-endpoint config. The test opens the connection and refreshes it at lines 31-32. Its explicit screenshot at line 45 is not appropriate for an unapproved real source run.
- `tests/desktop/source-preview.test.ts:14-25` enables private actual-backup import when `ESMER_SQL_PREVIEW_PACKAGE` exists. Private-output guards reduce capture risk, but do not make that input authorized for this synthetic-only handoff.
- `tests/helpers/live-sql-fixture.ts:71-75` can write reader credentials to the path in `ESMER_SQL_DEV_CONFIG` during fixture preparation.

Add this process-local reset before any test command. It neither prints nor reads the variable values:

```powershell
Remove-Item Env:ESMER_SQL_TEST_ADMIN, Env:ESMER_SQL_TEST_CONFIG, Env:ESMER_SQL_PREVIEW_PACKAGE, Env:ESMER_SQL_DEV_CONFIG -ErrorAction SilentlyContinue
Remove-Item Env:ESMER_LIFECYCLE_PROFILE, Env:ESMER_LIFECYCLE_REUSE_PHASE8 -ErrorAction SilentlyContinue
```

The second line also prevents an inherited lifecycle profile or historical Phase 8 mode from changing the default disposable suite. Configure a separately reviewed exact disposable profile only for the later native upgrade procedure. Record the resulting SQL/private-preview skips as intentionally unperformed source evidence. No source permission is granted by the automated checklist.

## Other checked statements match the repository

- `package.json` defines every named npm command. Its Node range is `>=24.15.0 <25`. The named Windows executable and archive paths match the test defaults and packaging scripts.
- `scripts/test-desktop.mjs:3-5` rebuilds `package:local` before Playwright. Handoff line 31 correctly requires final directory hashes and distinguishes those bytes from earlier NSIS/portable distributions. Directory-package testing is not installer acceptance.
- `tests/desktop/package-lifecycle.test.ts:26-38` uses a temporary profile by default, restricts an explicit profile to the selected disposable work root, and checks its resolved path. The handoff does not claim normal-owner-profile testing or installer proof from that test. The native procedure still needs concrete frozen artifacts and profile setup before execution.
- `tests/desktop/full-dataset.test.ts` is Windows-only and runs the documented 25,000-document synthetic workload. The handoff correctly leaves new product-profit measurements and real-market capacity unproved.
- `tests/desktop/clean-install-restore.test.ts:12-13` keeps original/fresh profiles, backup, and key under one temporary host directory. It uses actual Windows safeStorage at lines 33-38 but substitutes native dialogs. Handoff steps 4-6 correctly require native and independent-media recovery rather than claiming that same-host test satisfies computer-loss acceptance.
- `docs/evidence/windows-acceptance.md` leaves independent clean-account/VM recovery, default-profile lifecycle, failed upgrade, disk/media failures, ACL checks, native dialogs, scaling, and namespace power-loss behavior open. `docs/evidence/phase-10-windows-recovery-files.md:17-19` explicitly reports unsupported Windows directory flushing. The linked historical recovery handoff must be read with these current limitations, as the new handoff already instructs.
- The handoff says synthetic checks do not close #39/#40/#41/#43. No completed Windows, independent-recovery, or real-source acceptance is claimed.

No commands were executed on Windows. No tests, SQL, source/private data, container, lifecycle operation, application edit, or graph edit occurred. The next required action is the documentation reset above, followed by final candidate binding and the user's actual Windows checks. Root retains final review.

## Coordinator repair

Added both process-local environment reset commands before npm ci/tests and explained deliberate source skips. The reviewed scripts contain these exact switches. Final integrated candidate binding and user execution are still pending; no Windows pass is asserted.

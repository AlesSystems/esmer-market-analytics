# Live mock tracking verification

Date: 2026-10-03. Workstream: `codex/live-mock-tracking`. Related to [#32](https://github.com/AlesSystems/esmer-market-analytics/issues/32), implementation tasks 11.1 and 11.2, D06/D07/D16, and the synthetic portions of A04/A07/L01.

This work verifies synthetic source updates through the packaged desktop application. SQL observations remain raw previews. They do not activate financial data or close Windows, real-source, or production rollout gates.

## Failures reproduced

| Contract | Observed before | Required result |
| --- | --- | --- |
| Keep the inspected record through a new capture | Real SQL refresh replaced `Kaynak belge 1001` with `Aylık Market Özeti` and changed `2025-09` to `2025-12` | Preserve the selected period, screen, filters, and record for the same source identity |
| Reuse the app's configured reader between scenarios | A second seed made the original reader configuration fail with `SOURCE_UNAVAILABLE` | Reseeding preserves its password and database identity |
| Retain failures until deliberate recovery | A row scenario restored denied permissions; connection-loss changed only a temporary extraction config | Failure affects the app's reader until recovery |
| Validate document associations | A line attached to the wrong header passed the observation checker | Reject the incorrect parent ID |
| Explain retained raw data during an outage | Raw-only preview reported no valid local data | Show the retained source and its coverage endpoint |
| Validate reset before deleting data | Wrong saved password was discovered after dropping the populated database | Authenticate before replacement; preserve rows and GUID on rejection |
| Clean failed first setup | Failed config publication left a database/login that blocked the next start | Remove only resources created by that failed attempt; preserve existing fixtures |
| Keep editing during a background capture | The busy guard removed and recreated controls, closing advanced filters and losing focus | Retain the controls only while rebasing the same query onto a new capture |
| Preserve SQL failure information | SQL rejection, timeout, and cancellation all appeared as `SOURCE_UNAVAILABLE` | Keep broad rejection explicit; translate timeout and cancellation to existing live status codes |

The initial packaged reproduction used a real disposable SQL engine and the normal configuration picker. Later packaged regressions also exercise same-source package imports without requiring SQL.

## Design and boundaries

The source query already holds the selected period, scope, filters, document, and page. A fresh capture updates its hash. A different lineage or database GUID resets the selection. Capture identity remains unchanged, and deleted records show an explicit absence with a return to the filtered list.

The fixture keeps its existing command interface. `append` adds a complete document on each call, `check` validates a reader observation, and `recover` restores the disposable reader. Row mutations and reseeding use transactions. The app still uses its normal five-minute schedule; renderer status checks occur every five seconds.

The implementation adds no dependency, schema migration, privileged renderer operation, or source write capability to the application. Fixture administration stays in development tooling against the explicitly configured loopback test instance. Private configuration stays outside Git.

## Verification record

Environment: macOS arm64, Node 24.15.0, npm 11.12.1, packaged Electron 44.3.0. A newly created container uses the already available native arm64 SQL Edge image `9d0e27694fc9`. It contains only generated fixtures. Existing source containers and restored backups were not opened.

Fixture identities: `EsmerSyntheticDev` for reusable CLI checks; randomized `EsmerLiveFixture_*` databases for engine and packaged tests; `fixture:tracking` for file-only desktop checks. Financial preservation uses the existing synthetic business fixture, one app-owned expense, and an accepted report.

Build source: `0b48406`. Packaged `app.asar` SHA-256: `aa833115ff55ff4078358c51229e4b777bc6a7f688f29ce89c19a8bec1ebd5b7`. Focused contract commits: `06544f2`, `f9b1cbe`, `1c4a02a`, `28448a5`, `0c34dd6`. Implementation commits: `5c1afb1`, `4440950`, `d44a922`, `0b48406`. Packaged coverage: `7fb3b84`, `42df827`, `0c34dd6`.

| Gate | Command/procedure | Actual result | Evidence |
| --- | --- | --- | --- |
| LM-03 regression | New tracking, outage, parent-link, reset and bootstrap contracts before implementation | Failed on the intended behaviors; repaired tests pass | Test commits above; local `work/poteto/live-mock/*red*.log` |
| LM-05 unit | `npm run test:unit` | 50 passed | Local `unit-final.log` |
| LM-05 integration | `ESMER_SQL_TEST_ADMIN=<private> npm run test:integration` | 322 passed; optional configured-reader test skipped | Local `integration-retest.log` |
| LM-05 reader | `ESMER_SQL_TEST_CONFIG=<private> npm exec -- vitest run tests/integration/live-consistency.test.ts` | 4 passed, including the previously skipped reader test; 323 unique integration checks covered | Local `consistency-final.log` |
| LM-05 package | `npm run test:desktop` with SQL admin and `ESMER_SQL_POLL_PROOF=1` | Build/package succeeded; actual five-minute schedule passed; initial full run exposed one obsolete assertion and four executable-path setup failures | Local `desktop-final.log` |
| LM-05 desktop acceptance | `npm run package:local`, then explicit macOS `ESMER_EXECUTABLE`, SQL admin, `npm exec -- playwright test` | 76 passed; 9 intentionally skipped, including the separately proven five-minute test | Local `package-focus.log`, `desktop-acceptance.log` |
| LM-05 static | `npm run typecheck`, `npm run lint`, `git diff --check` | Passed | Local `typecheck-final.log`, `lint-final.log` |
| LM-06 review | Independent design and final code review | Two fixture findings repaired and retested; no remaining actionable findings | Reset/password and failed-publication integration tests |

Logs named above are under ignored `work/poteto/live-mock/`. They are local diagnostic evidence, not release artifacts. The packaged SQL journey verifies corrections, inserts, backdating, deletion while inspecting a record, permission failure/recovery, restart, and exact retention of the financial snapshot, expense and accepted report. The scheduled check uses the actual five-minute timer and verifies the selected screen and month.

Synthetic screenshots: [retained preview during failure](images/live-mock/retained-stale-synthetic.png), [recovered tracking](images/live-mock/tracking-recovered-synthetic.png), [scheduled update](images/live-mock/scheduled-poll-synthetic.png). All depicted rows are generated fixtures.

A full-suite rerun also exposed a keyboard-test race after clearing filters. That test now waits for the explicit query to finish and reopens advanced filters before typing; three repetitions passed. A separate actual-SQL regression confirmed background captures also removed focused controls, so that behavior received its own scoped repair.

The initial source-preview assertion expected a return to the overview after importing a new capture. It now asserts the retained document list and adjusted pagination. Four existing tests default to a Windows executable; the retest uses their existing `ESMER_EXECUTABLE` override. Eight other tests remain intentionally skipped on this host: Windows-only lifecycle/UI coverage, optional large-dataset performance, and private-source checks. The five-minute opt-in test is skipped in the short final run but passed in the prior packaged run. The later focus-only repair is verified against an actual SQL capture in the final package; the service timer was unchanged.

## Repeat the checks

Follow the [synthetic SQL operating procedure](../operations/synthetic-sql-environment.md) to prepare a disposable engine and private admin configuration.

```sh
npm run test:unit
npm run test:integration
npm run typecheck
npm run lint
npm run test:desktop
```

On macOS, set `ESMER_EXECUTABLE` to the absolute packaged executable under `release/mac-arm64/Esmer Market Analytics.app/Contents/MacOS/Esmer Market Analytics` (use `release/mac` on x64) so older Windows-default tests launch the same package.

Set `ESMER_SQL_TEST_ADMIN` to enable engine tests and the SQL desktop journey. Also set `ESMER_SQL_POLL_PROOF=1` to run the packaged five-minute polling check. The poll proof waits for the real service schedule without replacing timers or renderer APIs. The ordinary SQL journey explicitly refreshes through the real IPC and waits for the renderer's normal status poll.

## Open acceptance

Windows packaging and desktop checks must run on Windows on this branch. macOS results do not satisfy them. Real-source mapping, historical costs, production permissions, representative load and capacity, and L01 rollout approval remain open.

The synthetic append date is September 2025, so select that period. Fixed-ID mutation scenarios remain one-shot between seeds. `rejected-candidate` is an extractor-only probe, and `late-low-id` returns after both commits. The separate SQL integration test exercises the transaction lock barrier. A GUID-preserving source replacement remains outside the application's current reset-detection guarantee.

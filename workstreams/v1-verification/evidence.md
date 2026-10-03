# V1 verification and simplicity evidence

Verified on 2026-10-03 on branch `codex/live-mock-tracking`. The user requested whole-v1 verification excluding Windows, simpler UI and text, removal of decorative 3D, and PR creation. This record covers the current application with synthetic fixtures. It does not approve production access, rollout or owner acceptance.

## Result and change

All applicable checks have passing evidence after three narrow repairs. The simplified package retains the six destinations, task navigation, expense preview and review drafts, report selection/export, source provenance and financial uncertainty. Six production 3D modules and their scene styles were removed. Duplicate panels, captions and introductory copy were cut. Prototype tooling and its licensed dependencies remain outside the production entry.

The application now compares replacement prices by product and unit, preserving separate kilogram and piece values. The release inventory admits only the observed logo, fonts, stylesheet and copied notice paths; unknown files and secret sentinels remain rejected. Four existing desktop checks now find the local package using a shared executable policy with explicit overrides.

Related delivery scope is [estimated V1 issue #41](https://github.com/AlesSystems/esmer-market-analytics/issues/41), implementation-plan tasks [5.2, 6.1–6.2, 7.1–7.2 and 8.1–8.2](../../docs/superpowers/plans/esmer-market-implementation-plan.md), and the [workspace contract](../../docs/contracts/page-control-desks.md). The latest removal instruction supersedes older decorative-object requirements. Financial calculations, database schema, privileged IPC, production connections and dependency versions were not changed.

## Environment and identity

- macOS 27.0 build 26A428, arm64; Node 24.15.0; npm 11.12.1; Electron 44.3.0.
- Initial main baseline `f7f3ae5a84ee880b77ac2b5b15e71e8fc62f042b`. Application UI commit `577e54f`; report repair `1d74f98`; final code commit `219cfac`.
- Fresh unsigned local package at `release/mac-arm64/Esmer Market Analytics.app`. ASAR SHA-256 `37dd314c762e7171b23d55fdc51544a7ca0210e02b5cde28577ff49b6d2784a3`.
- `dist/ui/app.js` measured 1,463,588 bytes before and 514,173 bytes after, approximately 65% smaller. This is a bundle measurement, not a CPU or load-time benchmark.
- Business fixtures are `businessPackage`, `purchasingJourney`, representative-month and recovery fixtures. Source UI fixtures use `rawSnapshot`, `fixture:v1-simplicity` and `v1-simplicity-source`. No private market rows, backups or credentials enter Git or screenshots.
- SQL fixtures are generated `EsmerSyntheticDev` and `EsmerLiveFixture_*` populations. Two task-owned loopback engines isolated mutable suite fixtures from the stable configured reader. Both engines and their three credential files were removed afterward; pre-existing services were preserved.

## Verification receipts

Raw logs remain under `/tmp/esmer-v1-verification`. [Structured receipts](verification-receipts.json) record log hashes, outcomes and package identity. [System audit](system-audit.md) maps inspected contracts and generated SQL evidence. The expected result for each passing check below was its stated behavioral contract without failures.

| Contract / gates | Command or procedure | Actual result | Receipt |
| --- | --- | --- | --- |
| V1-02 baseline | `npm run test:unit`; `npm run test:integration` | 50 unit passed; 309 integration passed and 14 SQL opt-ins skipped before provisioning | `unit-baseline.log`, `integration-baseline.log` |
| UI-02 red contract | Packaged `v1-simplicity.test.ts` before cuts | Two tests failed on visible decorative canvas counts, as expected | `simplicity-before.log` |
| FIX-01 / A02–A03 | Product with distinct kg/piece replacement prices; change each unit and reorder rows | Missing kg change and false reordered differences reproduced before fix; nearby 16 tests passed after repair | `bda73ee`, `1d74f98`; `system-audit.md` |
| FIX-02 / A05 | Current-assets synthetic unpacked fixture; counterfeit paths and private-key sentinels | Two new cases failed before fix with 14 legitimate paths rejected; all six inventory cases passed after fix | `d609796`, `5c41018`; `fixes-handoff.log` |
| V1-03 / A01–A06 synthetic contracts | `ESMER_SQL_TEST_ADMIN=<suite-admin> ESMER_SQL_TEST_CONFIG=<stable-reader> ESMER_SQL_POLL_PROOF=1 npm test` | 50 unit and 324 integration passed, no integration skips; build/local packaging passed; 72 desktop passed, four launch failures, eight exclusions; exit 1 | `full-suite.log` |
| FAIL-03 / FIX-03 | Inspect four ENOENT traces, then rerun `option-b`, `shadcn-ui`, `workspace-subviews` | Defaults pointed to Windows .exe on macOS. After path repair four applicable tests passed; three Windows tests skipped | `desktop-harness-retest.log`; `8b22392` |
| REV-FIX-01 | `npx playwright test tests/desktop/option-b.test.ts tests/desktop/shadcn-ui.test.ts tests/desktop/workspace-subviews.test.ts tests/desktop/v1-simplicity.test.ts` | Six passed, three Windows skips; no assertion changes | `desktop-resolver-retest.log`; `219cfac` |
| V1-04 final focused fixes | `npx vitest run tests/integration/report-revisions.test.ts tests/integration/release-inventory.test.ts` | 14 passed across two files, including two new inventory cases added after the full integration run | `fixes-handoff.log` |
| UI-03 workflows / A03, A07 local | Packaged overview, sales, purchasing, expenses, reports and simplicity tests | 19 passed; financial/source modes and wide/narrow task controls retained | `focused-desktop.log` |
| UI-03 confirmation | Final packaged simplicity checks at 1440, 1120, 680 and 390 pixels | Two passed; no page overflow, one visible h1, zero decorative canvases; financial 40 TRY and 50% coverage, raw-source warning, expense tasks and no renderer errors retained | `simplicity-final.log`; [screenshot manifest](screenshots/manifest.json) |
| Generated SQL / A01, A05, L01 synthetic only | Actual restricted reader, permission denials, source edits/deletes, lock timeout, cancellation, outages and packaged polling | All 14 initially skipped SQL cases exercised; actual five-minute service cadence passed | `integration-sql.log`, `integration-reader.log`, `full-suite.log` |
| Package notices / A05 local | `node scripts/verify-package.mjs <mac-app-asar>` | `PACKAGE_NOTICES_OK 80 dependencies` | `package-notices.log` |
| Static acceptance | `npm run typecheck`; `npm run lint`; `git diff --check` | Passed, including the final shared-resolver extraction | Final handoff receipts and worker verification |
| Impeccable bounded check | One context read and one mechanical detector pass; batched packaged inspection and one small caption confirmation | Zero blocking findings; 20 retained-token advisory findings (7 colour, 12 font size, 1 radius). No further polish loop | [detector](impeccable-detector.json) |

Across these receipts, 50 distinct unit, 326 distinct integration and 76 distinct packaged desktop checks have passed. The initial full-suite exit 1 is preserved; four repaired checks passed separately. The final integration count adds two new release-inventory regressions to the 324-case full run. Repeated focused checks are not counted again. The 5-minute SQL case was not repeated after test-path extraction because the application package did not change.

## Review and retained limits

Independent [Standards](standards-review.md) and [Spec](spec-review.md) reviews examine the patch against `f7f3ae5`. The Standards reviewer identified a nonblocking duplicated resolver; `219cfac` addresses it. [Comment/suppression review](comments-review.md) found no actionable issue. Both reviewers use the same available model family. They read the supplied user request and decision trail; the raw full transcript was unavailable.

The eight desktop exclusions are six explicit Windows contracts (full-volume performance, Windows lifecycle, report pagination and three visual/layout journeys) and two private prepared-source opt-ins. No Windows build, installer, publisher, scaling, private backup or production test ran. No full-market performance claim is made. Continue those checks on this same branch when separately authorized, following the existing Windows handoffs and `npm run package:win`.

The Windows-layout full distribution inventory cannot certify a macOS .app. An exploratory macOS invocation reported platform-specific paths/links and a binary-content match, alongside the real allowlist gaps repaired in FIX-02. Synthetic exact-path regressions and actual ASAR notice checks pass; full Windows distribution inventory remains open.

A01/A05 have synthetic source-safety and privacy evidence. A02/A03 preserve estimated and unverified semantics; real source completion, unit/tax/cost/return meanings require separate acceptance. A04/A06 have synthetic atomic import, immutable reports, encrypted backup and clean macOS restore evidence; physical power loss, exhausted volumes and owner retention of independent keys remain outside this run. A07 Windows acceptance and L01 production permission, representative load, source-reset detection and rollout remain open. A GUID-preserving replacement can evade the current SQL identity check.

The Impeccable context reported broader DESIGN sidecar drift and no buildPath. This patch updates only records contradicted by removed objects. A broader document refresh was not part of the UI change.

## Principles and decisions

- Subtract Before You Add removed renderers, scene styles and duplicate panels before changing retained controls.
- Prove It Works selected actual packaged checks and the five-minute SQL service schedule.
- Model the Domain retained report identities as line IDs or product/unit pairs and selected executable identity in one shared constant.
- Foundational Thinking kept source rows, financial snapshots, app revisions and accepted reports as separate existing data shapes.
- Separate Before Serializing Shared State isolated stable SQL reads from disposable mutation fixtures and assigned disjoint file ownership.
- Sequence Work into Verifiable Units separated red regressions, implementation, review repair and evidence commits.
- Test Behavior, Not Implementation asserted literal changed prices and retained task/draft outcomes.
- Laziness Protocol reused existing harnesses and native disclosures without dependencies or new product layers.
- Never Block on the Human continued authorized synthetic work without seeking production access or waiting for source evidence.

## Screenshots and commits

Before/after images use synthetic data. [Overview before](screenshots/overview-before.png), [overview after](screenshots/overview-after.png), [expenses before](screenshots/expenses-before.png), [expenses after](screenshots/expenses-after.png), [narrow expenses](screenshots/expenses-narrow.png), [source sales before](screenshots/source-sales-before.png) and [source sales after](screenshots/source-sales-after.png) are hashed in the manifest.

| Commit | Coherent change |
| --- | --- |
| `eba1e08` | Expose packaged UI simplicity contract |
| `bda73ee` | Expose replacement comparison unit collision |
| `1d74f98` | Fix product/unit comparison identity |
| `577e54f` | Remove decorative renderers and redundant UI |
| `d609796` | Expose current-build inventory rejection |
| `5c41018` | Admit exact assets and notices |
| `8b22392` | Repair local packaged executable defaults |
| `219cfac` | Share repaired executable policy |

[Execution graph](plan.md) and [decision trail](decisions.tsv) preserve the work and failure/repair sequence. PR publication follows verified documentation and review. No merge or deployment is included.

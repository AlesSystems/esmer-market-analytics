# Concurrent monthly navigation reads, 2026-10-22

Packaged owner-workspace verification found a financial Özet to Satışlar transition ending in `Başka bir işlem sürüyor. Tamamlandığında yeniden deneyin.` without its page heading. Separate `MonthlyWorkspace` instances request the same monthly report. Effect cleanup ignores late responses but does not stop the underlying desktop operation. The exclusive `OperationJobs` gate rejects a second overlapping request with `busy`.

The focused reproduction uses the actual `OperationJobs` and a deferred service action. On commit `c29b06c`, the summary read succeeds while the overlapping sales read fails:

```text
FAIL tests/integration/monthly-read.test.ts > overlapping monthly navigation shares one pending read instead of displaying busy
AssertionError: expected { status: 'busy' } to deeply equal { Object (status, period) }
- Expected
+ Received
  {
-   "period": "2025-09",
-   "status": "monthly",
+   "status": "busy",
  }
```

Commit `4e698b1` coalesces concurrent identical `queryMonthly` calls inside the validated desktop report handler. The key includes session, dataset, app revision, calculation version and period. It shares only a pending promise, not retained report data. Completion and rejection evict the entry. All work still passes through `OperationJobs`; different contexts, active imports and `openMonthly` (since removed in #100) retain exclusive admission. No write, cancellation, sender or payload validation is bypassed.

Lifting report ownership into `SalesWorkspace` was considered. That would change multiple component contracts and their lifecycle state. Sharing the pending named read fixes the measured dispatch conflict with a smaller surface. It preserves normal revalidation after a request settles.

Verification after `e449f45`:

```text
Test Files  2 passed (2)
Tests       9 passed (9)
```

Command `npx vitest run tests/integration/monthly-read.test.ts tests/integration/report-jobs.test.ts` includes the real service worker cancellation/report checks. Additional tests exercise every pinned context field, subsequent reads after completion/rejection, active import contention and monthly-read contention with import. `npm run typecheck`, focused ESLint and `git diff --check` passed.

The dedicated packaged regression exercises identical concurrent requests through the real preload, then reloads and navigates Özet to Satışlar. Its initial setup opened a second sales session while App startup was still opening its own session, causing both query responses to be unavailable. Waiting for the initial monthly workspace to settle before opening the explicit test context removes this test-induced session race. The corrected test passed against the root macOS package on 2026-10-22. The test also asserts the first-wide Sales profit chart has 0/2,000/4,000 axis ticks and a first-day bar taller than 90 SVG units, preventing the previously observed flat screenshot from passing.

A separate live DOM investigation ran two fresh packaged launches with and without remembered month preferences. Both first-wide Sales charts had `viewBox="0 0 1128 262"`, ticks `0 ₺`, `2 B ₺`, `4 B ₺` and a first-day bar from y138.47 to y236. First three table amounts were 1,773.329, 1,262.006 and 1,084.258 TRY. Reports showed the same data and geometry. Narrow resize and chart/table remount preserved the correct chart. The flat first-wide screenshot could not be reproduced on this package, so no speculative runtime chart change was made. This investigation does not establish the cause of that earlier capture.

Windows runtime acceptance remains separate. The work adds no schema, dependency, financial formula, source access or deployment behavior.

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

Commit `4e698b1` coalesces concurrent identical `queryMonthly` calls inside the validated desktop report handler. The key includes session, dataset, app revision, calculation version and period. It shares only a pending promise, not retained report data. Completion and rejection evict the entry. All work still passes through `OperationJobs`; different contexts, active imports and `openMonthly` retain exclusive admission. No write, cancellation, sender or payload validation is bypassed.

Lifting report ownership into `SalesWorkspace` was considered. That would change multiple component contracts and their lifecycle state. Sharing the pending named read fixes the measured dispatch conflict with a smaller surface. It preserves normal revalidation after a request settles.

Verification after `e449f45`:

```text
Test Files  2 passed (2)
Tests       9 passed (9)
```

Command `npx vitest run tests/integration/monthly-read.test.ts tests/integration/report-jobs.test.ts` includes the real service worker cancellation/report checks. Additional tests exercise every pinned context field, subsequent reads after completion/rejection, active import contention and monthly-read contention with import. `npm run typecheck`, focused ESLint and `git diff --check` passed.

This focused test proves the concurrent-read mechanism. Root integration must repeat the original packaged UI flow before claiming the user-visible defect fixed. Windows runtime acceptance remains separate. The work adds no schema, dependency, financial formula, source access or deployment behavior.

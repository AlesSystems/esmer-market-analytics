# Source estimate paging verification, 2026-10-22

[Issue #85](https://github.com/AlesSystems/esmer-market-analytics/issues/85) reports repeated revalidation and calculation for product paging. [PR #90](https://github.com/AlesSystems/esmer-market-analytics/pull/90) introduced the bounded package/month cache. [PR #93](https://github.com/AlesSystems/esmer-market-analytics/pull/93) reduced cold validation and singleton aggregation work. This receipt verifies those existing changes and adds regression coverage and a reproducible benchmark. No further runtime optimization was justified by the measurements.

## Identity and scope

- Baseline application commit `6424384`, containing #90 and #93. This work changes tests, the benchmark and this evidence only.
- Regression commit `a85e37d` adds literal decimal assertions for warm paging and exact final-product lookup after invalid import and cancellation after the replacement write. The cancellation exercises SQLite rollback, preserving the prior source.
- Node `v24.15.0`, Darwin `27.0.0`, arm64, Apple M4 Pro. Tests use generated packages only. No SQL connection, original backup or private records were accessed.
- Both fixtures contain 99,999 identical synthetic sale lines under one document, with either 3,529 repeated product IDs or 99,999 unique product IDs. Their JSON packages are respectively 22,957,476 and 23,078,308 bytes. Raw results include their hashes in [the measurement artifact](source-performance-2026-10-22.json).
- Every line has amount 120, quantity 2 and cost candidate 70. Independently calculated expected monthly amount is 11,999,880, candidate cost 13,999,860 and contribution -1,999,980. The benchmark asserts these exact decimal strings, product counts, ranking size and exact final-product identity on every response.

## Measurement

The timed operation is the actual `AnalyticsStore.querySourceEstimate` against persisted SQLite. Each sample opens a fresh store, clearing application caches. The Node process and OS filesystem cache remain warm. Import, store open, IPC, renderer and export are excluded. This is service timing, not end-to-end desktop timing or cold machine startup.

| Products | Cold query samples (ms) | Warm page samples (ms) | Exact final-product samples (ms) |
| --- | --- | --- | --- |
| 3,529 | 697.31, 700.86, 670.03 | 6.54, 6.30, 6.58, 6.43, 6.64, 6.38 | 7.27, 6.86, 7.30 |
| 99,999 | 873.07, 850.03, 892.56 | 7.70, 7.16, 6.62, 6.38, 6.93, 6.48 | 11.09, 10.36, 8.68 |

For each sample, the cold request is offset 0, followed by warm offsets 50 and 100, then exact ID lookup. Max-diversity warm paging is at most 7.70 ms, versus 850.03–892.56 ms after clearing the application cache. All six cold queries were below two seconds on this host. A preliminary CPU-profiled max-diversity run measured 863 ms cold and 6/4 ms warm. Its largest self-time categories included decimal totals, canonical package validation and garbage collection. It did not establish a need for another optimization.

The issue's original Linux measurements were 1,843/1,701/1,830 ms for 3,529 products and 2,722/3,388/3,008 ms for 99,999 products. These are historical reproduction figures on another host. They cannot establish a controlled before/after speedup percentage for this Mac. There is no new runtime before/after delta in this evidence-only follow-up.

Reproduce from repository root with the locked dependencies installed:

```sh
mkdir -p .scratch
node_modules/.bin/esbuild scripts/benchmark-source-estimate.ts --bundle --platform=node --format=esm --packages=external --outfile=.scratch/benchmark-source-estimate.mjs
node .scratch/benchmark-source-estimate.mjs
```

Bundling is required because project modules use TypeScript extensionless imports. Running the `.ts` entry directly with Node fails module resolution before exercising the application. The harness creates and removes disposable SQLite files. It leaves no fixture data in the repository.

## Verification and acceptance

- `npx vitest run tests/unit/source-estimate.test.ts tests/unit/source-estimate-days.test.ts tests/unit/source-estimate-cold.test.ts tests/integration/source-estimate-cache.test.ts tests/integration/source-estimate.test.ts` passed 5 files and 20 tests.
- `npm run typecheck` passed.
- `npm run lint` passed.
- `git diff --check` passed.
- Existing cache tests cover same-period paging, month switching, evidence, result mutation isolation, source replacement, persisted byte corruption and source deletion. The new test proves invalid/cancelled replacement preserves the prior source and exact decimal results beyond the first two pages.
- Root integration owns independent review, the final full suite and packaged desktop verification. This receipt does not substitute for those results.

The reported repeated-page defect is resolved by #90/#93 and verified here at both issue reproduction cardinalities. Windows A07/D18 remains open. Run the benchmark on the intended Windows build/host, then measure packaged UI navigation, IPC, rendering, startup and representative filters at admitted volume. Record CPU, OS, build, package identity, cold/warm conditions and repeated timings. Current measurements do not validate arbitrary numeric distributions, the historical full POS dataset, real-source semantics, Windows responsiveness or installation on the owner's computer.

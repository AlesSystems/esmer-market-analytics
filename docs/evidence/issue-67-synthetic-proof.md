# Issue 67 synthetic profit proof

This receipt covers S01 of [the implementation plan](https://github.com/AlesSystems/AlesSystems-Workstreams/blob/main/Esmer%20Market%20Analytics/plans/2026-10-04-real-product-gross-profit.md), following [issue #67](https://github.com/AlesSystems/esmer-market-analytics/issues/67). The user authorized implementation, PR creation, synthetic groundwork, and the necessary bounded isolated-source investigation on 2026-10-04. Permission is resolved. G01 financial meaning still requires evidence.

S01 adds tests and a synthetic capacity probe. Application behavior, source mapping, package limits, schema, UI, and dependencies are unchanged. It does not pass G01 or complete the owner outcome.

## Reviewed and tested revision

- Base `ff21492fbb024591512aeaa9fc1011c089830c85` includes the estimate-package recovery fix from PR #68.
- Test commit `368d95e390aae3004730849b150e73a2c3edbe66` on `codex/issue-67-synthetic-proof`.
- Environment macOS 27 arm64, Node 24.15.0. Windows was not tested.
- Packaged application's `app.asar` SHA-256 `5b77abc54042aedcf3c490232c2a9bc7d90f6d1b70aa94eccbdf48ce6025f4a9`.
- Full-suite log SHA-256 `9f4503e1da03c502a2262634e2a98a574372b0b321528a7eb99160a59f707c9a`.

## Behavioral evidence

[The unit checks](../../tests/unit/issue-67-profit.test.ts) call `calculateSales`, `estimateGrossResult`, and `buildProductProfit` with synthetic facts. They assert exact recognized and covered line IDs, literal monthly amounts, and additive product/day totals.

| Scenario | Expected and actual |
| --- | --- |
| Covered sale plus unsupported return | Recognized sales 50. Covered sales/cost/profit 100/60/40. Return exposure -50 remains excluded. Coverage 66.67%, partial scope. |
| Original sale of 3 units, returns of 1 and 0.5 next month | Return sales/cost/profit -150/-90/-60. Prior sale month remains 300/180/120. |
| Original sale of 2 units, return of 1.5, then another 1.5 in a later snapshot | Both linked return costs become unsupported. September covered sales/cost/profit becomes 100/80/20 for the separate covered product; excluded return exposure remains -150. Reversing input order gives identical memberships and totals. |
| Imported dependency population | 32 groups retain 96 documents and 96 lines. Original-sale facts remain available without entering September's 64 contributing lines. Sales/cost/profit is -1600/-960/-640. |

All four checks passed on their first execution. They add missing coverage; no production defect or failing-before behavior was observed. Independent Python `Fraction` checks passed for twelve amount equations and two coverage percentages. Expected constants are not copied from calculator outputs.

The prior-result assertion checks an in-memory value snapshot. It does not claim accepted-report persistence, encrypted restore, or a real-source cutoff contract. Existing full-suite report and recovery tests provide separate synthetic regression coverage.

## Verification

| Command | Actual result |
| --- | --- |
| `npm run test:unit -- tests/unit/issue-67-profit.test.ts tests/unit/product-profit.test.ts tests/unit/return-cost.test.ts` | 14 tests passed. |
| `npm run test:integration -- tests/integration/issue-67-capacity.test.ts` | 1 test passed. |
| `npm run typecheck` | Passed. |
| `npm run lint` | Passed. |
| `npm test` | Unit 53 passed. Integration 326 passed, 14 skipped. Packaged desktop 86 passed, 11 skipped. |
| `git diff --check` | Passed. |

The full suite ran with source/private-input opt-ins removed from its environment. Desktop execution rebuilt and packaged the macOS application through `test:desktop`. The suite-generated tracked estimate screenshot was restored to its unchanged baseline. Private-source and optional lifecycle checks remain skipped; skips are not acceptance.

Independent Standards and Spec reviews passed at the test commit. The Spec reviewer separately ran the four focused checks, rational arithmetic, a 100-group CLI probe, and invalid-argument checks. The comment review removed two narration comments. Reviews used separate agents from the same model family.

## Capacity probe

[The replayable probe](../../tests/helpers/issue-67-capacity-probe.ts) uses [synthetic dependency groups](../../tests/helpers/issue-67-capacity.ts). Each group contains one original sale in August, a September sale, and a September return linked to that original. All six document/line records count against the unchanged package bounds. This synthetic format includes originals in its declared two-month interval; it does not implement the proposed real package's separate dependency stream.

Build and run it from the repository root:

```sh
node_modules/.bin/esbuild tests/helpers/issue-67-capacity-probe.ts --bundle --platform=node --format=esm --outfile=/tmp/issue-67-capacity-probe.mjs
node /tmp/issue-67-capacity-probe.mjs 16666
node /tmp/issue-67-capacity-probe.mjs 16667
```

Supported preset group counts are 100, 1000, 5000, 10000, 16666, and 16667. The final preset must fail package construction because it contains 100,002 records. Other construction failures or an unexpectedly accepted overflow make the probe fail.

[Five fresh-process receipts](issue-67/capacity.json) cover 6,000 through 100,002 records. At 99,996 records the package is 32,121,670 bytes, with hash `6cc6ecf9f522d0ab934887785537864488f3dc49eccbe5193ea6dc1912c53c9a`. Parse and calculation retain all 16,666 original-sale dependencies and 33,332 September contributions. Exact sales/cost/profit is -833300/-499980/-333320. The 100,002-record fixture is rejected.

The largest accepted run took about 2.68 seconds for fixture preparation, package writing, parsing, and calculation together. Process high-water RSS was 896,640 KiB. These observations include the probe and retained inputs. Background test activity was not controlled. They do not measure Electron service memory, UI latency, full report persistence, export, encrypted recovery, or cancellation. There is no Windows, full-real-population, or performance-regression acceptance claim.

## Remaining issue gates

The [source registry](../../src/source/contract.ts) continues to reject unsupported real meanings. No synthetic test can establish completed-sale identity, source business dates, cost snapshot timing and tax/unit basis, real return attribution, or confirmed product identity. G02 through G06 remain downstream of a passing G01. The [source investigation receipt](issue-67-source-gate.md) records the native cost-recalculation finding and the remaining independent evidence required for real financial acceptance.

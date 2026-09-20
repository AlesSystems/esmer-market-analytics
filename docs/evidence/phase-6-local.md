# Phase 6 local evidence

## Scope and environment

This record covers issue [#9](https://github.com/AlesSystems/esmer-market-analytics/issues/9), tasks 6.1 and 6.2. The user requested implementation through a PR and a stop before Windows implementation/testing. This evidence uses generated synthetic records and the packaged macOS application. It does not complete Windows, real-source, or full-volume acceptance.

- Branch `codex/phase-6-costs-purchasing`, based on merged Phase 5 at `56d0d35`.
- Environment macOS 27.0 build 26A428, arm64, Node 24.15.0, npm 11.12.1.
- No new dependency. `npm ci` reported zero vulnerabilities.
- [Local design and delivery plan](../superpowers/plans/2026-09-20-phase-6-local-plan.md).
- [Windows continuation prompt](../operations/windows-phase-6-handoff.md).
- Existing unrelated untracked documents in the original checkout were preserved. Development used `work/phase-6`.

## Contracts and reviewed choices

The package adds `synthetic-business-v1` with explicit historical cost, purchasing, inventory, and supplier display evidence. Existing transport cost values remain insufficient. Schema 4 adds nullable evidence columns without replacing app-owned rows or report history. The [package](../contracts/analytics-package.md), [calculation](../contracts/calculations.md), [persistence](../contracts/persistence.md), and [desktop](../contracts/desktop.md) contracts describe the boundary.

Independent design review compared a separate purchasing session with a purchasing read on the current sales session. The shared session keeps one immutable dataset across both views with one new named IPC operation. Calculations use the existing decimal layer. UI changes preserve the Option A palette, table, notice, metric, and source-panel patterns. The design detector reported no findings. No generated images or new visual system were introduced.

## Test-first and review evidence

The cost contract initially failed because `src/analytics/costs` did not exist. The purchasing report contract failed with `reports.purchasing is not a function`. Existing 12 unit tests passed at that point. These were missing-implementation failures, not toolchain failures.

The first full run passed 22 unit and 142 integration tests, typecheck, lint, and build. Its packaged suite passed both purchasing journeys and both sales journeys. Three startup cases failed because their assertions still expected the previous API list/schema 3. Those assertions were updated to the implemented named purchasing read and schema 4 without weakening sandbox or preservation assertions.

Independent Spec and Standards reviews reproduced unsupported converted dispatch semantics leaving invoices recognized. The Spec reviewer also reproduced linked settlement evidence being discarded or silently contradicted. Two focused regressions failed on those exact behaviors before correction. The Standards review found dropped partial-period evidence. The visual reviewer found focus returning to an internal source link after linked-document navigation. These findings received focused corrections and verification before the final run.

All independent reviewers used GPT-6 Astra. Review separation was independent context and task scope, not multiple model families. The native reviewer role substituted for the unavailable specialized Impeccable role.

## Acceptance evidence

| Task / gate contribution | Fixture and procedure | Independent expectation |
| --- | --- | --- |
| 6.1 / G02 / A02, A03 | `cost-coverage.test.ts`, `businessRecords()` | Sales 100 + 100, one supported cost 60, yield covered sales 100, cost 60, gross estimate 40, absolute-value coverage 50%. |
| 6.1 / G03 / A02, A03 | `purchasing.test.ts`, cost provenance integration | Three units × historical 10 stays 30 when replacement changes 25 to 50. Replacement totals change 75 to 150. Prior accepted output and pinned evidence remain unchanged. |
| 6.1 / G04 / A02 | `return-cost.test.ts` | Supported return contributes -100 sales and -60 historical cost, including an original sale in an earlier month. Missing, excessive, future, or mismatched attribution is excluded. |
| 6.1 / A02, A03 | Cost coverage/return cases | Unknown unit/KDV, missing and invalid zero/negative cost are explicit. Documented zero is supported. Sale100/return-100 with excluded100 gives 66.67% absolute coverage and no margin. Zero monetary population has no percentage. |
| 6.2 / G07 / A02, A03 | `supplier-return.test.ts` | Converted purchase80 and supplier-return-20 recognize one event each, retaining both documents. Contradictory linked evidence blocks recognition. Physical return alone leaves credit and replacement unknown. |
| 6.2 / A03 | Purchasing tests and packaged journey | Negative stock stays negative. Sparse/zero recorded waste does not imply no loss. Latest conflicting prices remain ambiguous. Supplier and product selection does not allocate document-level credit. |
| 6.1–6.2 / A04 | `cost-provenance.test.ts`, report and startup tests | Old schema/snapshots remain readable. Evidence-only source changes flag adjustments. Imports and pruning preserve open report context, accepted output, and app-owned records. |
| 6.2 / A01, A05 | Purchasing IPC and packaged startup tests | Exact context/sender validation rejects invalid requests. Renderer has no Node or SQLite access. No source or operational writes are added. |
| 6.2 / A03, A07 | `purchasing.test.ts` desktop | Turkish estimates, coverage, supplier-return vocabulary, source evidence, legacy-unavailable state, filtering, keyboard navigation, and import pinning work in the packaged macOS app. |

The lead independently recalculated G02, G03, G04, G07, and the cancellation denominator with Python Decimal before reviewing implementation outputs. Tests assert literal results rather than copying calculator output into expected values.

## Reproduce the synthetic fixture

From the repository root, run:

```sh
node scripts/create-business-fixture.mjs <new-output.json>
```

The output must not exist. Both successful generation and refusal to overwrite an existing path were checked. The generator reuses `purchasingJourney()` and `businessPackage()` from test helpers. It is not bundled into the application.

Fixture lineage is `business-fixture`, extraction `business-1`, mapping `synthetic-business-v1`, cutoff `2025-09-30`. It has G02 covered sales100/cost60/gross40/coverage50%, purchase P1 at25, linked supplier-return dispatch D1 and invoice R1 at-25 with unknown settlement, stock-2, and recorded waste0 with incomplete recording. It is not real market data.

## Final verification

Application revision `7fe3d69687bc6d48c642adf4cd70141579b7dfd9` passed the following commands on the environment above. Subsequent documentation and fixture-generator commits do not change bundled application code.

| Command | Actual result |
| --- | --- |
| `npm run test:unit` | 22 tests passed across 6 files |
| `npm run test:integration` | 147 tests passed across 14 files |
| `npm run typecheck` | Passed |
| `npm run lint` | Passed |
| `npm run build` | Passed |
| `npm run test:desktop` | 10 tests passed against the packaged macOS arm64 application |
| `node scripts/verify-package.mjs <app.asar>` | `PACKAGE_NOTICES_OK`, 6 dependencies |
| `git diff --check` | Passed |

The packaged `app.asar` SHA256 is `2b07e8cf44b836fc2d2f667f5b4a78c6cc4237f671a3738e570ff2286b6d62e3`. The builder reported unsigned macOS output and the default Electron icon. This is local verification, not a Windows release artifact.

Spec review replayed both original reproductions after the fix and marked them resolved. Standards review replayed incomplete coverage and conversion checks and marked both resolved. The final desktop run verifies both Escape and Kapat after linked-source navigation, as well as partial/no-data periods. The visual reviewer scored the focus fix resolved and returned `ship` for that scoped verdict. A separate package-boundary regression exposed and fixed array-to-string coercion in historical cost units.

Screenshots captured by that packaged run contain synthetic data only:

- [Cost coverage, purchases, supplier returns and inventory](phase-6-purchasing.png).
- [680px window](phase-6-purchasing-small.png).
- [Pinned source evidence](phase-6-purchasing-source.png).

## Commit sequence

- `7d7de07`, `9f0474b`: missing report and cost contracts.
- `bd8dd6f`, `6e907b5`, `99266c0`: evidenced analytics, additive persistence, and boundary tests.
- `a4325ab`: shared report/IPC/UI and packaged journeys.
- `48cca6d`: packaged API/schema expectations.
- `00189b7`, `cfef6f8`: linked meaning/settlement regressions and correction.
- `8e711e1`, `2029c46`: coverage/focus regressions and correction.
- `7fe3d69`: strict cost-unit package validation and regression.

## Remaining gates

Windows packaging, portable/NSIS lifecycle, native picker, Windows scaling, and physical offline checks remain unperformed in this session. The automated picker response is substituted; it does not establish native Windows interaction. The Windows agent must continue on the same branch and update the same PR.

Real-source unit/KDV/cost/return/conversion/supplier semantics remain unvalidated. Existing package limits remain 32 MiB and 100,000 rows and do not establish full historical dataset scalability. Full-data response targets, source-backed reconciliation, expense completeness, accepted-report review UI, export, and recovery retain their separate gates. No production access, source restore, owner contact, installation, release, or merge occurred.

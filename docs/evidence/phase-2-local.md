# Phase 2 local verification

## Scope and tested artifact

- Issue/tasks: [#5](https://github.com/AlesSystems/esmer-market-analytics/issues/5), 2.1 and 2.2.
- Branch: `codex/phase-2-source-contract`, based on `035dd97` with Phase 1 merged and issue #4 closed.
- Environment: macOS 26.4.1, build 25E253, ARM64; Node 24.15.0 and npm 11.12.1.
- Mapping: `source-contract-v1`. All fixtures are synthetic. The ordinary lineage is `synthetic-market-1`; reset evidence uses `synthetic-market-reset`.
- Code/test commit: `8bd7439e6b5cd5222ee8ac75df850a8b06fcee28`. Later documentation commits do not change the tested application or fixtures.
- Date: 2026-09-16.

The user authorized Phase 2 implementation, PR creation and a stop before Windows execution. No source/container/backup access occurred. The application retains its Phase 1 empty/offline behavior. Financial calculation, extraction, persistence and report engines remain outside this change.

## Contract-first evidence

At `65712e3`, `npm run test:integration -- tests/integration/fixture-contract.test.ts` ran one test and failed with `golden oracle catalogue is absent: expected false to be true`. Vitest loaded and executed the test. This is a missing required fixture artefact, not a broken toolchain or an observed financial calculation defect.

Before changes, the baseline had 2 passing unit tests and 7 passing integration tests, plus successful typecheck and lint. Dependencies were installed with `npm ci`; no dependency or lockfile change was made.

## Verification record

| Procedure | Expected | Actual |
| --- | --- | --- |
| Focused `npm run test:integration -- tests/integration/fixture-contract.test.ts` | All fixture and rejection cases pass | 65 passed after final review fixes |
| `npm run typecheck` | Strict TypeScript checks pass | Passed |
| `npm run lint` | No lint errors | Passed |
| `npm test` | All unit, integration and actual packaged desktop checks pass | Passed: 2 unit, 72 integration and 1 packaged desktop test |
| `npm run build` | Existing desktop/service/UI bundle and notices build | Passed |
| Focused fixture test under `TZ=UTC` and `TZ=Pacific/Honolulu` | Same synthetic expectations under both process environments | 65 passed in each environment on the final code |
| Deliberately remove required `denominators` fixture | Suite rejects missing mandatory coverage | Failed with exit 1; original fixture restored |
| Deliberately remove numeric/status inputs from denominator, partial-period and document-warning scenarios | Suite rejects unsupported expected values | Failed with exit 1; original fixtures restored |
| `git diff --check` and local Markdown link check | No whitespace errors or missing local file targets | Passed |

The final fixture set has 25 entries across five JSON files: eight golden scenarios, fourteen edge cases, two snapshots and one privacy case. Negative checks cover version/lineage/evidence claims, private fields and metadata, expected outputs, supplier purchasing membership, concrete snapshot changes and app-owned preservation. These are evidence integrity checks, not runtime financial or importer tests.

The test-only exact-arithmetic helper initially parsed `-0.375` incorrectly as `375` thousandths. A new assertion reproduced that failure. Signed parsing now returns `-375` and `-1005` for `-0.375` and `-1.005`. This change affects only oracle verification.

Review also exposed private sentinel values in metadata. Commit `c2d8482` records the failing metadata regression with 1 failure and 64 passes. Commit `8bd7439` checks the entire fixture and passes all 65 cases. Its rejection error is the fixed code `FIXTURE_CONTRACT_REJECTED`, without input values.

The timezone runs check explicit synthetic date-only inputs. They do not verify the market-local source timestamp convention, which remains unresolved.

## Independent oracle review

The expected G01–G08 results were transcribed from the approved acceptance checklist. The parent independently checked G01–G04 arithmetic with Python `fractions.Fraction`, without importing application code. The [oracle record](golden-oracles.md) retains the derivations. Fixtures include literal expected results; test arithmetic uses exact independently specified checks rather than a future financial implementation.

Two independent design candidates compared a static registry with a public evidence validator. A reviewer selected the registry because the proposed public validator had only a test consumer. Strict nested-key validation, scenario-specific expected outputs and concrete snapshot correspondence were retained in tests. Reviews use separate agents from one model family; no cross-family review is claimed.

An independent document review found no historical-count or arithmetic drift. Its request to name transaction/volume/purchase-price oracle gaps and clarify KDV exclusion was incorporated. Both Standards findings and the Spec completeness finding were fixed. Separate follow-up reviews of `5ae6ea4...8bd7439` found no remaining findings in scope. Comment review found no comments or suppressions to remove.

## Packaged regression and inventory

The packaged macOS application still displays the Turkish empty/offline state. Its desktop test checks the actual preload/main/worker path, restricted renderer privileges, navigation/network policy and same-profile restart. Bundled main and worker runtimes report Electron 44.3.0, Node 24.20.0 and SQLite 3.53.4. The unchanged UI screenshot was visually inspected; this phase adds no UI.

The [archive inventory](phase-2-package-inventory.json) records the hash and safe path counts. Inspection uses the installed `@electron/asar` `listPackage`, `statFile` and `extractFile` functions. Top-level paths are restricted to `dist`, `node_modules` and `package.json`. No repository tests/fixtures/docs/work/src, `.env`, backup/database or map files were found. Application bundles contain none of `SYNTHETIC_PRIVATE_`, `synthetic-market-1`, `source-contract-v1` or the local checkout prefix.

An initial inventory assertion also rejected a public vendor file, `node_modules/write-excel-file/docs/IMAGES.md`. The corrected check distinguishes repository documentation from packaged public dependency documentation and lists that allowed file in the inventory. No packaging configuration or dependency was changed. `node scripts/verify-package.mjs <app.asar>` passed with six dependency notices. This inspection does not prove a future extractor or all source privacy paths.

## Acceptance limits

| Task / gate | Evidence provided by this phase | Remains open |
| --- | --- | --- |
| 2.1 / A02 / A03 | Versioned unsupported source rules, documented populations/consequences, explicit calculation policy | Authorized clean-source schema/lineage/hash, cost units/KDV, discounts, rounding, type inclusion/conversions, business-date examples and source reconciliation |
| 2.2 / A02 | G01–G08 and synthetic edge expectations with independent arithmetic | Actual financial engine tests; any formula lacking its independent oracle remains blocked |
| 2.2 / A04 | Concrete paired snapshots, reset/interruption and app-owned preservation expectations | Real import activation, concurrency and failure-injection behavior in later phases |
| 2.1–2.2 / A05 | Reviewed synthetic fields, default-deny fixture checks and synthetic privacy sentinels | Authorized raw column mapping, reduced real fixture, actual extractor/log/package privacy checks |
| A07 | Local packaged regression only when its result is recorded | Windows packaging, packaged runtime, portable/installer and offline smoke for this branch |
| L01 | Live connection remains disabled | No live work authorized or performed |

The Phase 2 source-dependent exit gate is not complete. Synthetic success does not authorize source reads or label any financial source population supported. No complete A01–A07 release gate is passed by this change. Continue with the [Windows agent prompt](../operations/windows-phase-2-handoff.md) on the same branch, then stop after Phase 2.

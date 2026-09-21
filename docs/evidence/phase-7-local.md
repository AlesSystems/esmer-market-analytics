# Phase 7 local evidence

Tracks [issue #10](https://github.com/AlesSystems/esmer-market-analytics/issues/10), tasks 7.1 and 7.2 of the [plan](../superpowers/plans/esmer-market-implementation-plan.md#phase-7--expenses-adjustments-and-operating-results). The user authorized implementation, a PR and a Windows-agent prompt, with execution stopping before Windows work.

## Environment and scope

- Branch `codex/phase-7-expenses-operating`, baseline `b09392b0b3aeddceeb2f3b9f4100e816792d0a90`.
- macOS 27.0 build 26A428, arm64; Node 24.15.0, npm 11.12.1.
- Synthetic fixtures only. No source backup, private workbook, production connection or owner contact.
- Baseline passed typecheck, lint, 22 unit tests, 148 integration tests and 11 packaged macOS desktop tests.
- [Design comparison](phase-7-design-review.md), [decision trail](phase-7-decisions.tsv), [UI brief](../superpowers/specs/2026-09-21-phase-7-expenses-ui.md).

## Implementation and verification

Final application commit: `c54b3116969e2609c14b177c678b7b626a88fedb`. Later handoff commits contain documentation/screenshots only. Verification date: 2026-09-21. All commands below ran on the macOS environment above; no Windows command ran.

| Task / gate | Fixture / procedure | Expected and actual result | Evidence |
| --- | --- | --- | --- |
| 7.1, relevant A04 | Canonical synthetic workbooks; `npm run test:unit` | 29 tests pass across 9 files, including Turkish/native numeric dates, exact decimals, invalid formulas and ambiguous OOXML rejection | `tests/unit/expense-validation.test.ts`, `tests/unit/expense-workbook-boundary.test.ts` |
| 7.2, G05/G06, relevant A02/A03 | Independent literal gross 200, expense 50, owner contribution 500; operating unit tests in the same run | Estimated 150, owner contribution excluded; incurred/payment periods separate; absent or stale confirmation and unsupported prerequisites withhold headline | `tests/unit/operating-profit.test.ts` |
| 7.1/7.2, relevant A04/A05 | `npm run test:integration`, committed synthetic fixture helpers | 159 tests pass across 16 files: atomic rollback, idempotency, reference conflicts, explicit duplicate consent, history, corrections, revocation, restart, source refresh, old pins and accepted-output preservation | `tests/integration/expense-import.test.ts`, `tests/integration/adjustment-history.test.ts`, existing import activation tests |
| Desktop trust boundary and workflow | `npm run test:desktop` through `npm test`; isolated profiles and stubbed native dialog results | 16 actual packaged desktop tests pass, including all 5 expense cases, no renderer Node privileges, explicit API allowlist, v4→v5 migration, load-error retry and pinned reports | `tests/desktop/expenses.test.ts`, `tests/desktop/startup.test.ts`; screenshots below |
| Build and static checks | `npm run typecheck`, `npm run lint`, `npm run build`, then `npm test` | All exit zero; desktop runner rebuilds/packages the local app | Local execution logs: `work/poteto/phase-7/final-{typecheck,lint,build}.log`, `final-test-after-review.log` (scratch, not shipped) |
| Distribution notices | `node scripts/verify-package.mjs 'release/mac-arm64/Esmer Market Analytics.app/Contents/Resources/app.asar'` | `PACKAGE_NOTICES_OK 7 dependencies` | [Runtime dependency decision](../decisions/runtime.md); archive SHA-256 below |
| Bounded preview | Reviewer reproduced 5,000 valid same-date/amount rows with distinct references | 181,128 workbook bytes → 4,999 representative IDs → 3,976,814-byte preview; focused max-row confirmation test passes | [Standards review](phase-7-standards-review.md) |

Final archive SHA-256: `e94483b626519b58c1e60e8d242fc10fddeff036861bf668bac12dc8202157a4`. The unsigned macOS directory package is local verification only, not a Windows release. The preview measurement checks one resource boundary, not the full imported-dataset performance gate.

## Test and review history

- `bf71cdf` committed the operating contract first; the red run failed to import the absent implementation and executed zero tests. This was not a failed financial assertion.
- `f031c26` independently exposed two real parser failures: multiple stored values in one cell and duplicate worksheet relationship IDs. Both reject after implementation.
- `0fa718f` exposed a real UI recovery failure: loading persisted after the initial expense query failed. `552af6e` resolves it and the packaged retry test passes.
- The first full suite at `552af6e` passed 29 unit and 157 integration tests but failed 3 of 16 desktop cases on old API-list/schema-version assertions. `7c98fc1` updates the exact intended allowlist and schema 5 expectations while retaining renderer-privilege and migration checks.
- Standards review found quadratic duplicate-preview growth. `42a58c2` first exposed the bound at 1,000 rows; `c54b311` retains one representative per row and indexes lookups. The final regression exercises all 5,000 allowed rows and explicit confirmation. Repeated stock-loss evidence remains rejected across rows and batches.
- Independent [Standards](phase-7-standards-review.md) and [Spec](phase-7-spec-review.md) follow-ups through `c54b311` have no remaining actionable findings. Spec independently ran 11 focused integration tests; Standards ran the 5 import tests and the maximum-row reproduction.
- [Impeccable review](phase-7-ui-review.md) resolved all five scored UI findings and gave `disposition: ship`. The single detector run returned `[]`. [Incumbent design preservation](phase-7-ui-preservation.md) records this ordinary extension; no design-system replacement or raster product assets were introduced.

The implementation commits retain separate contracts, implementation and boundary coverage. Main milestones: `f61f19a` dependency promotion, `bf71cdf` operating contract, `fc4ca7d` UI flow, `076699b` import/store/operating service, `034c11b` history coverage, `45ff149` contract, `897cd9c` revision freshness, `552af6e` UI evidence/recovery, `7c98fc1` desktop assertions, `42a58c2`/`c54b311` bounded preview.

## Packaged UI evidence

All captures use synthetic data and isolated macOS profiles. Native dialog results are stubbed in automation; these are not real Excel or Windows-native-dialog checks. The operating desktop fixture is deliberately smaller than the unit oracle: covered gross 40 minus expense 10 yields estimated 30.

- [Empty narrow layout and workbook guide](phase-7-expenses-empty-small.png).
- [Valid preview and explicit duplicate consent](phase-7-expenses-preview.png).
- [Rejected batch](phase-7-expenses-rejected.png).
- [Reasoned revision history](phase-7-expenses-history.png) and [narrow correction layout](phase-7-expenses-small.png).
- [Pinned operating calculation and supporting records](phase-7-operating.png).
- [Initial load failure with direct retry](phase-7-expenses-retry.png).

## Change and risk

Schema 5 adds the immutable expense-batch ledger while reusing existing append-only revisions and report pins. Legacy expense shapes remain unsupported evidence. New privileged operations use named sender/payload-validated IPC; the renderer receives neither paths nor database access. Formula/payroll/unsupported workbook rejection, sanitized row errors and whole-batch confirmation protect the import boundary. Original workbooks are not persisted.

Existing locked `fflate@0.8.3` and `saxen@11.1.1` move to runtime dependencies with MIT notices; no dependency version changes. The unused Excel reader remains development-only. Parser compatibility with real Windows Excel remains a handoff check. Expense completion is an explicit owner attestation, never inferred from a successful import.

## Acceptance boundary

Synthetic checks can establish the implemented expense/import rules relevant to A02–A05. They do not establish real-source semantics, actual expense completeness or Windows acceptance. Historical cost remains an estimate. A reveal without an expense workbook or a real owner confirmation must withhold operating profit.

A07 Windows packaging, native dialogs, OS scaling, lifecycle and physical-offline checks remain unperformed in this run. Full-volume performance remains unmeasured. Recovery, complete Phase 8 reporting, installation on Eralp's computer, production rollout and L01 remain outside this work.

Continue using the [Windows handoff](../operations/windows-phase-7-handoff.md) and [copyable Windows-agent prompt](../operations/windows-phase-7-prompt.md) on the same branch and PR.

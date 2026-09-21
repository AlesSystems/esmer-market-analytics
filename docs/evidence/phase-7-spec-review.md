# Phase 7 independent specification review

Reviewed commit `552af6eb8f3cfd9073578a177386f3e6328248e4` against merge-base `b09392b0b3aeddceeb2f3b9f4100e816792d0a90` on `codex/phase-7-expenses-operating`. Review date 2026-09-21. This review covers the Spec axis only and makes no application changes.

## Result

No actionable specification findings in the reviewed diff. No unrelated feature expansion identified.

The review used issue [#10](https://github.com/AlesSystems/esmer-market-analytics/issues/10), which had no comments, foundation specification sections 4.4 and 5, the historical database audit, acceptance gates A02–A05, and implementation plan tasks 7.1–7.2. It traced workbook parsing through preview, confirmation, SQLite revision writes, report pinning and the available expense UI.

Observed implementation includes exact incurred/payment separation, explicit duplicate retention, stable reference conflicts, formula rejection, payroll-column rejection, atomic batch rollback, original provenance, reversible corrections, full-history completeness revisions, G05/G06 gating, loss evidence uniqueness, classification/tax exclusions, unsupported legacy expenses and unchanged source-adjustment fingerprint behavior. Missing or estimated inputs remain unavailable or labelled estimates.

## Independent verification

On the local macOS checkout at the reviewed commit, both commands exited zero.

- `npm run test:unit -- tests/unit/operating-profit.test.ts tests/unit/expense-validation.test.ts tests/unit/expense-workbook-boundary.test.ts`. Three files, seven tests passed. Expected and actual outcomes include the literal 200 minus 50 equals 150 oracle, unknown-evidence blocking, Turkish decimal/date parsing, and rejection of ambiguous workbook cells and relationships.
- `npm run test:integration -- tests/integration/expense-import.test.ts tests/integration/adjustment-history.test.ts`. Two files, nine tests passed. Expected and actual outcomes include preview without writes, explicit duplicate confirmation, complete rollback, restart persistence, reasoned correction history, moved-period invalidation, historical report pins, legacy migration and sender/payload validation.

Fixtures were the committed synthetic expense/business fixtures. No source, private workbook or production system was accessed. Application diffs were reviewed through the pinned SHA; subsequent evidence-only files are outside that immutable review.

## Remaining evidence boundaries

This is bounded synthetic review evidence, not closure of A02–A05 or Windows acceptance. Windows packaging, real native Excel round trips, lifecycle and full-scale timing remain with the Windows agent. Real source semantics, a real expense workbook and the owner's completeness attestation remain unavailable. Desktop verification was delegated to the parent workstream and is not claimed as independently rerun here.

## Bounded follow-up review

Final application SHA reviewed `c54b3116969e2609c14b177c678b7b626a88fedb`. The additional review was limited to commits `7c98fc1`, `42a58c2` and `c54b311`.

No actionable specification findings. The packaged startup expectations now name exactly the exposed expense API operations and schema version 5 while retaining the absent Node/process privilege assertions. Duplicate preview indexing preserves the requirement for explicit consent on every suggested duplicate, stable-reference conflict rejection and identical-batch idempotency. A separate loss-evidence set continues rejecting repeated loss evidence within and across batches; correction/restoration enforcement is unchanged.

Independently reran `npm run test:integration -- tests/integration/expense-import.test.ts tests/integration/adjustment-history.test.ts` at this SHA. Two files and eleven tests passed, including the 5,000-row duplicate-preview bound, consent failure/success, idempotency and cross-batch loss rejection. The parent workstream owns the final full-suite and packaged-desktop run. Windows and real-source evidence boundaries remain unchanged.

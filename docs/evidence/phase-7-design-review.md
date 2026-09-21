# Phase 7 independent design verdict

Independent comparison of two Phase 7 designs on `codex/phase-7-expenses-operating`. Candidate A extends existing immutable expense revisions with one import ledger. Candidate B adds normalized expense records and version tables alongside the app revision clock. Both were grounded in the repository store, report and IPC code at `b09392b`. One bounded pass; scores assess proposed designs, not implemented behavior. This is an independent agent review within one model family, not cross-family validation.

Score scale: 1 = material gaps, 3 = viable with significant clarification, 5 = strong and explicit.

| Criterion | A | B | Evidence and implication |
| --- | ---: | ---: | --- |
| Requirements coverage | 5 | 4 | Both cover incurred/payment separation, independent owner confirmation, classification, estimates and Windows handoff. A explicitly preserves legacy expense evidence, monthly labour, duplicate loss evidence, and expense UI without a source dataset. B omits some of those concrete contracts. |
| Pin, atomicity and completeness safety | 5 | 5 | Both retain the app revision clock, immutable history, transaction-wide import, stale edit checks, and old/new period invalidation. A spells out why repeated `appendRevision` calls cannot form the import transaction. Neither design alone proves implementation correctness. |
| Parser and privacy boundary | 4 | 3 | Both reject formulas from raw OOXML, constrain archives, avoid rejected-value echoes, and keep bytes privileged. A incorporates the known `worker-f` notice blocker; B still allows promotion of `read-excel-file`. B is more explicit about date epochs, numeric dates and mixed-preview policy. Both need executable parser adversarial checks. |
| Existing code reuse and API depth | 5 | 3 | A keeps financial truth in existing revisions and adds only an import ledger. B introduces record/version tables and event coordination despite acknowledging no demonstrated query or volume need. Both hide preview contents behind worker-owned tokens. |
| Minimum maintenance | 5 | 3 | A has one financial history and preserves existing kinds. B adds schema projection, migration and revision coordination costs without a measured benefit. A's OOXML reader still needs a narrowly documented supported subset. |
| Total | **24** | **18** | **Choose A.** |

## Required grafts and clarifications

1. Graft B's explicit mixed-preview policy: reject confirmation for an entire workbook containing invalid rows. Keep row-specific explanations and state this in the confirmation copy. This avoids partial acceptance and ambiguous retry identity in the initial implementation.
2. Graft B's explicit numeric-cell/date contract: parse OOXML numeric decimal lexemes separately from Turkish text decimals; define supported 1900/1904 date handling or reject numeric dates clearly. Include serial 60, epoch flags, invalid calendar dates and timezone-independent business dates in parser tests. Do not leave numeric date acceptance to incidental library behavior.
3. Preserve A's no-promotion decision for `read-excel-file` while the known `worker-f` licence-notice issue remains unresolved. B's dependency suggestion is rejected. Using exact direct pins of `fflate` and `saxen` remains contingent on actual licence/distribution checks; this review did not perform those checks.
4. Carry the grounding's app-revision stale indicator into the final design. A pinned sales/operating view must remain unchanged after an expense edit, while clearly allowing the user to reopen it to see the new app revision. A dataset-only freshness comparison would conceal expense changes.
5. Make the full-history completeness calculation a pinned query: an old report's relevant revision must never include later edits, including a move between periods. Pair the moved-period test with an already-open report test; current-state correctness alone is insufficient.

Reject B's normalized financial tables, an independent expense counter/cache, and runtime reader promotion. Do not add alternate storage backends or generalized event infrastructure.

## Evidence boundary

The candidates converge on the service boundary, identity rules and core financial controls. Their disagreement is principally storage complexity. A is the smaller design that preserves the known existing invariants. Parser safety, rollback, precision, migration preservation and packaged UI behavior still require implementation evidence; Windows acceptance remains explicitly open. No code, commits, source inspection or Windows execution occurred in this review.

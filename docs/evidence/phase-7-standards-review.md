# Phase 7 Standards review

Reviewed commit `552af6eb8f3cfd9073578a177386f3e6328248e4` against merge base `b09392b0b3aeddceeb2f3b9f4100e816792d0a90` on `codex/phase-7-expenses-operating`.

## Findings

1. **P2. Bound duplicate evidence before copying the preview.** In `src/expenses/import.ts:56–58`, every matching prior record adds its full entity ID to each candidate's `duplicates`. Line 68 clones that growing graph, then the worker and Electron IPC copy it again. A valid workbook containing 1,000 distinct references with the same date and amount produced **499,500 duplicate IDs and a 40,174,393-byte JSON preview from 38,102 workbook bytes**. The permitted 5,000-row population yields 12,497,500 IDs, approximately 1 GB serialized before IPC copies. This can exhaust the desktop's memory or freeze an import, despite the compressed and expanded workbook limits. The UI in `src/ui/ExpensesWorkspace.tsx:51` only consumes whether duplicates exist. Keep bounded evidence, a count, or a boolean, while preserving the independent loss-evidence checks. Add a maximum-row repeated-expense test that asserts a bounded preview. This is a concrete resource-boundary defect, not a style heuristic. It undermines the bounded import boundary documented in `docs/contracts/expense-completeness.md` and the payload-validation intent in `AGENTS.md`.

## Evidence and scope

The synthetic reproduction calls `workbook(Array.from({length:1000}, (_,i) => ['ref-'+i, ...row.slice(1)]))` from `tests/helpers/expense-fixtures.ts`, then `new Expenses(openStore(':memory:')).preview(bytes)`. Count duplicate IDs and measure `Buffer.byteLength(JSON.stringify(preview))`. The measured preview had no workbook errors and took 235 ms on this macOS host. The 5,000-row estimate follows the loop's exact `n*(n-1)/2` cardinality; that larger allocation was not executed.

Reviewed validation, canonical workbook parsing, named IPC guards, atomic batch persistence, migration, corrections, completeness, financial eligibility, report pins, and affected UI flows. No additional actionable documented-standard violations or smell findings were identified. Full-suite execution belongs to the parent evidence record. Windows checks were not run. Comment-agent delegation and code edits were excluded by this review assignment.

## Resolution verification

**P2 resolved at `c54b3116969e2609c14b177c678b7b626a88fedb`.** Reviewed the regression contract in `42a58c2`, the fix in `c54b311`, and the desktop expectation updates in `7c98fc1`. Duplicate suggestions now retain one representative per row. Indexed date/amount lookup removes the repeated scan, while separate loss-evidence validation preserves rejection within and across batches. Explicit confirmation still requires every candidate row.

`npm run test:integration -- tests/integration/expense-import.test.ts` passed all five tests on macOS at the fixed commit. An independent rerun with 5,000 valid repeated-expense rows measured 181,128 workbook bytes, 4,999 duplicate IDs, and a 3,976,814-byte JSON preview in 196 ms, with no workbook errors. The regression also confirms all 5,000 rows import only after explicit consent. The desktop expectation changes match the named preload capabilities and schema version 5. No remaining actionable findings in this recheck. Full desktop and Windows evidence remain separate.

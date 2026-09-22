# Phase 8 Standards review

Reviewed `git diff 6e0a478...add17a4` on `codex/phase-8-reporting`, covering commits `fac0296`, `47f43c3`, `4ddc8e9`, `6b4e06c`, `10b8d39`, and `add17a4`. Standards: [AGENTS.md](../../AGENTS.md), the foundation documents, and the twelve Fowler heuristics in the code-review skill. Tool-enforced style was excluded.

## Documented-contract findings

- **P2 — Preserve known expenses and payments when sales coverage is unavailable.** [export.ts:59](../../src/reports/export.ts#L59) unconditionally substitutes `null` for every summary metric when `s.coverage === "unavailable"`. This also affects app-owned expense, labour and payment amounts at line 66, although their evidence is independent of source sales coverage. The [specification §4.5](../superpowers/specs/2026-09-04-esmer-market-rebuild-design.md#45-export-and-local-operations) requires exported figures to reconcile with the corresponding UI/report version; AGENTS.md requires explicit financial evidence and preservation of app-owned expenses. Reproduced with the existing September `businessPackage` fixture plus an imported TRY 50 expense incurred and paid in October: the October report retains expense `"50"` and payments `"50"`, and MonthlyOverview displays them, but the exported `Özet` rows `Faaliyet gideri` and `Ödemeler` contain null numeric and exact-value cells. Apply sales-coverage gating only to source-dependent metrics and add this expense-only-period regression case. The current unavailable-month export test has no expense records and misses it.

## Heuristic findings

No actionable smell finding. Existing narrow IPC operations, snapshot ownership, shared arithmetic and native filesystem operations justify the boundaries reviewed; simplification alone would not warrant changes.

## Validation and limits

A standalone Node 24.15.0/esbuild probe exercised real expense import, monthly report generation, Excel export and `readSheet` on macOS and reproduced the mismatch. `git diff --check 6e0a478...add17a4` passed. The parent reports 29 unit, 174 integration and 20 packaged macOS tests plus typecheck/lint passing; this reviewer did not rerun those suites. Windows checks remain explicitly deferred. No source files were changed.

## Resolution

Root disposition: regression `c104339` reproduced null instead of 50; fix `c5e460f` applies source-coverage gating only to source-dependent metrics. The independent specification reviewer verified the fix and all four Excel tests. This resolves the documented-contract finding; the original review above remains pinned to `add17a4`.

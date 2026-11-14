# Implement the approved A workspace

Issue [#154](https://github.com/AlesSystems/esmer-market-analytics/issues/154), continuing [PR #153](https://github.com/AlesSystems/esmer-market-analytics/pull/153). Baseline: `23aab64` on `codex/ui-prototype-review`; production base remains `3520ce0`.

## Authority

After reviewing the first prototype, the project owner said: “Prototype A is nice. Implement this. Dont forget that we may add chart and graphs later on so it should be scalable for that”. [Decision #143](https://github.com/AlesSystems/esmer-market-analytics/issues/143#issuecomment-6876945959) records that selection and authorization. This new implementation workstream supersedes the earlier design-only sequencing for this request. It does not invent a completed uncoached walkthrough or Eralp/Windows acceptance. Historical prototype-only tickets #149–152 and human decisions #144–145 are not implicitly completed.

## Visual and interaction contract

Use the concrete A prototype at `23aab64`: left navigation, plum `#6c3d78`, plum wash `#f1eaf4`, slate ink `#252b39`, cool page `#f4f5f8`, white surfaces and grey rules `#e0e2e9`. Keep locally bundled Figtree, tabular amounts, generous readable spacing and quiet flat surfaces. Gain/loss/unknown states have written meaning in addition to color.

The month and actual period lead the content area. A broad monthly-result section pairs Tahmini brüt kâr and its explanation with aligned Satış, Tahmini ürün maliyeti and Marj. Product observations and the expense next step follow as distinct sections. Product, expense and supporting operations retain their real existing behavior; this is not a replacement with simulated forms or fixture values. Labels may follow A while service/API contracts stay fixed.

Preserve month memory and draft-safe transitions, full-catalogue search/filter/sort, product/source context and focus, Excel-first expense entry, validation/duplicates/history/reversal, explicit completeness and net invalidation, matching export, import failure retaining data, source-only and financial-only routes, accepted history, offline/recovery/settings/limitations.

The established financial contracts and service results remain authoritative. No renderer calculations, changed tax/expense assumptions, schema/IPC changes, source access or new dependencies. Keep unknown, zero, loss, absent and partial states distinct. Existing source-only/financial-only paths must not lose access through layout changes.

## Capacity for charts

Build the page from ordinary React sections in a responsive grid with `minmax(0, ...)`, intrinsic heights and full-width/split-width placement. A chart is another section with a title, context and numeric alternative; it must not require changing navigation or the core summary. Existing charts remain supported with existing service data. Keep their available labels, null/zero/loss distinctions and table alternatives. No empty chart placeholders, new chart library, widget registry, user-configurable dashboard or new metrics are needed now. Document extension points where a later chart would be added.

## Verification

The pre-agreed seam is the actual packaged desktop UI, with existing unit/integration contracts retained. Use named synthetic fixtures and independently established amounts. First expose a missing changed behavior in a focused test; retain regression coverage and replace only superseded layout/color expectations. Check month → product/source → return and expense → confirmation/net → later change, plus first use and utilities.

Run relevant unit/integration and actual packaged desktop checks, typecheck, lint, build and `npm run package:win`. Capture the real implemented application at a representative desktop width and a narrow/larger-text condition; automated passes are not aesthetic acceptance. Actual Windows launch/scaling and owner hardware remain separate when unavailable on this Mac. Keep test failures distinct from missing tooling.

## Work graph

Each node runs only after its predecessors succeed. One worker owns production UI and related tests in its isolated worktree, so overlapping shell/page/styles writes are serialized. Parent owns this contract, current product/design documentation and evidence. A merger alone integrates worker commits. Build/package tests are serialized within the worktree to avoid output conflicts.

| ID | Type | Objective / allowed area | Dependencies | Acceptance | State |
| --- | --- | --- | --- | --- | --- |
| A01 | analysis/design | Record approved A and chart extensibility, issue #154 and scoped contract | — | Explicit human choice and updated scope; remote/base verified | completed |
| A02 | implementation/test | Adopt A using `src/ui/` and related existing UI tests in worker worktree | A01 | Faithful real UI; preserved flows; focused red/green checks and no data/finance changes | completed: worker `4b92b4d`, including integration `a81068e` |
| A03 | integration | Worker merges integration tip; merger integrates result | A02 | Coherent commits and clean merge; unrelated work preserved | completed: merger fast-forwarded to `4b92b4d`; parent documentation preserved |
| A04 | test | Integrated suites, build/package, actual screenshots and visual inspection | A03 | Checks and environment recorded; defects diagnosed and repaired | completed: final `4b92b4d`, 185 unit / 314 integration / 73 packaged checks; skips and host NSIS limitation recorded |
| A05 | review | Independent Standards and Spec reviews of `23aab64...HEAD` | A04 | Relevant findings fixed by one worker and rechecked | completed: one P2 per axis resolved; independent rechecks recorded |
| A06 | documentation | Reconcile current design/product docs and chart extension guidance; evidence/PR handoff | A05 | Concrete runnable app/build, screenshots, hashes, checks and unresolved gates | completed: [receipt](../../evidence/2026-11-14-approved-a-ui.md), [reviews](../../evidence/2026-11-14-approved-a-review.md) and PR #153 handoff; native Windows CI receipt tracked on PR |

Native Windows continuation: [run 43595408858](https://github.com/AlesSystems/esmer-market-analytics/actions/runs/43595408858), PR head `5e51446`, passed distribution inspection but exposed product-table overlap beneath the detail panel at the runner's constrained window size. Its 70 passing desktop checks do not make that run successful. The same implementer owns the bounded repair; the original overlap requirement remains.

| ID | Type | Objective / allowed area | Dependencies | Acceptance | State |
| --- | --- | --- | --- | --- | --- |
| A07 | implementation/test/review | Diagnose and correct product detail/table layout in `src/ui/` and focused packaged tests; merge and recheck | A06 | Deterministic regression; readable amounts and keyboard/context behavior; no overlap; independent focused review | completed: `5982fdf`, four product checks and both review axes clear |
| A08 | test/documentation | Repeat native Windows CI and record final build/PR handoff | A07 | Successful Windows distributions and complete desktop suite; exact run/build, remaining manual checks and cleanup recorded | running: final native CI; the exact run and final A08 state are recorded on PR #153 |

Risks: existing layout-specific desktop assertions may need deliberate updates; financial-only screens must remain reachable; fixed widths can clip at larger text; a browser prototype is not packaged Windows evidence. Production access, owner contact, install, release publication and merge remain outside this implementation.

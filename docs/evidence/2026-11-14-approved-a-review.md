# Approved A implementation review

Independent review axes for [#154](https://github.com/AlesSystems/esmer-market-analytics/issues/154). Fixed point: `23aab64e45e6f26f3bc2dff30f3138c052894476`; original reviewed head: `a81068e1bee9606fc6b8cf65f9452c5a829ef278`. Diff: `git diff 23aab64...a81068e`. The [implementation contract](../superpowers/specs/2026-11-14-prototype-a-implementation.md) incorporates the owner's later production authorization.

## Standards

### Documented-standard breaches

- **P2 — Identify incomplete sales amounts on the newly added supporting figure.** `src/ui/pages/MonthPage.tsx:66` renders `t.sales` as an unconditional `Satış` amount and ignores `t.unknownSaleAmounts`. `docs/contracts/recorded-estimates.md:25` requires “display the known subtotal with the unknown-amount count” when known and unknown operands coexist; `:52` says that subtotal is “never a complete figure.” Reproduced against the packaged app built from `9421f5a` (same production code as reviewed HEAD): extend `monthProfitSnapshot()` with an October sale line whose `TOPLAM_KDV_MATRAHI` is null. Public `readMonthProfit` returns `sales:'480'`, `unknownSaleAmounts:1`, but the new group displays only `Satış / 480,00 ₺`; no missing-amount indication/count appears in the monthly view. This new exact-value surface misleadingly looks complete. Mark it as the known subtotal when the count is positive and disclose the count through the existing accessible uncertainty presentation. Add a packaged mixed-known/unknown regression; retain ordinary/null/zero behavior. No financial calculation or IPC change is needed.

### Judgement smells

None actionable in this scoped change. The small shared `WorkspaceHeader` and ordinary responsive sections provide the requested chart extension point without speculative scaffolding.

Reviewed `23aab64e45e6f26f3bc2dff30f3138c052894476...a81068e1bee9606fc6b8cf65f9452c5a829ef278`. Historical top-tab/palette and prototype-only limits were not applied. No other actionable documented-standard breach found. Existing suites and Windows limitations were reported by the parent; independently ran one isolated packaged observation test with synthetic data, preserving repository files. Test and output: `/tmp/esmer-ui-a-standards-check/`. No repository/tracker edits or rebuild.

### Standards recheck

Standards recheck: `46286d193265a9e6af06d3a607f1e664a7f004ef` in `/tmp/esmer-ui-a-154`. Packaged executable built from `d72b045` (identical production code; later HEAD changes capture-test coverage only).

The sole P2 finding is resolved by `9237900`. Mixed known/unknown sales now show “Bilinen satış tutarı”, the unchanged service-provided known amount, and “1 satırın tutarı bilinmiyor”. The count is explicit beside the value. Null still renders Unknown; known zero remains formatted as zero; cases with no missing amount retain “Satış”. The change adds no financial arithmetic or IPC behavior.

Independently ran against the existing packaged Mac app with its own synthetic profile and isolated output:

`node node_modules/@playwright/test/cli.js test --config playwright.config.ts tests/desktop/approved-a.test.ts --grep 'mixed known and unknown' --output /tmp/esmer-ui-a-standards-recheck-results`

Result: **1 passed** (897ms). It verifies the label, 480,00 ₺ known subtotal, missing-amount count, and unchanged 57,50 ₺ gross result using the prior reproduction fixture. The focused fix introduces no new relevant standards issue. No unresolved finding from this Standards review.

No rebuild, repository/tracker edits, or destructive tests. Parent retains responsibility for integrated suites and Windows evidence.

## Spec

Reviewed `23aab64e45e6f26f3bc2dff30f3138c052894476...a81068e1bee9606fc6b8cf65f9452c5a829ef278` against `docs/superpowers/specs/2026-11-14-prototype-a-implementation.md`, with the explicitly approved production implementation scope.

- **P2 — Keep the calculation explanation inside the viewport.** `src/ui/pages/MonthPage.tsx:57` moves “Nasıl hesaplandı?” to the right edge of the broad result section, but its existing popup remains left-anchored (`src/ui/pages/pages.css:30–32`). The specification requires the monthly result to pair “Tahmini brüt kâr and its explanation” and preserve “product, expense and supporting operations” with their “real existing behavior.” Opening this explanation in the actual packaged app places the 460px panel at x=1223.09 in a 1440px viewport (right=1683.09), and x=483.09 in a 680px viewport (right=943.09). Both cases create document horizontal overflow and hide the calculation’s right-hand amounts. Right-align or otherwise constrain this popup to the viewport, including at larger zoom, and add an open-explanation boundary regression.

Evidence: focused read-only packaged-app check, using `monthProfitPackage` and the existing final Mac executable (matching production code at `9421f5a`); screenshots `/tmp/esmer-ui-a-spec-check/calculation-1440.png` and `calculation-680.png`; isolated test/config/results under `/tmp/esmer-ui-a-spec-check/`. No rebuild, production edits or tracker writes.

### Spec recheck

**Resolved.** Read-only review at clean worker HEAD `4b92b4dd2c7ffe3666d3f16721530cb4f177ad8e`, using its matching packaged Mac app; no rebuild or repository edits.

The original P2 calculation-popup clipping is fixed. Independent packaged check passed (1 test, 1.3s), including open-panel resize, actual zoom settling, all four viewport bounds, four hit-test samples proving the panel is not obscured, document horizontal-overflow checks, Escape/focus return at each size, and scrolling.

Actual CSS viewport / popup bounds (x, y, width, height):

- 1440×852, zoom 1: `(964, 257.59, 460, 458.29)`
- 680×800, zoom 1: `(204, 325.71, 460, 458.29)`
- 340×426, native content requested 680 wide at zoom 2: `(32, 16, 292, 394)`
- 720×426, native content requested 1440 wide at zoom 2: `(244, 16, 460, 394)`

Document scroll width equals the actual viewport width in every scenario. The chart table retains its accessible table role, October row and literal `57,50 ₺` value after containment. Native 340-CSS-pixel screenshot was inspected; the popup is above the narrow header and its amounts are readable. No remaining finding from this focused recheck.

Evidence: `/tmp/esmer-ui-a-spec-recheck/measurements.json`, screenshots `calculation-1440-zoom1.png`, `calculation-680-zoom1.png`, `calculation-680-zoom2.png`, `calculation-1440-zoom2.png`, and independent check/config/results in that directory. macOS native window height was clamped in some scenarios; only actual viewport sizes above are claimed. No 390px native viewport or Windows acceptance is claimed.

First review pass: Standards — one P2 resolved, zero unresolved; Spec — one P2 resolved, zero unresolved.

## Windows continuation — Standards

Focused Standards review: production correction `5e51446...8722d16`; actual tested worker HEAD `a05ce06323fdfa49964b55d45d41f3b35f351715` (only keyboard/source-return assertions follow the production fix).

No actionable documented-standard breach or judgement smell found in this correction. The <=1200px detail moves into ordinary document flow with intrinsic height, restoring a separate ledger/detail surface without dropping numeric columns. This follows DESIGN.md's responsive geometry, reachable actions and keyboard/context requirements and the approved-A implementation contract's preservation of full product/source behavior. The heading ref is a small explicit UI seam; no general-purpose abstraction or financial/service change was introduced. Wide layout/nonoverlap assertions remain intact at an explicit 1440px size.

Independently ran against the existing packaged app, without rebuilding:

`node node_modules/@playwright/test/cli.js test --config playwright.config.ts tests/desktop/urunler.test.ts --grep 'constrained product details' --output /tmp/esmer-ui-a-product-standards-results`

Result: **1 passed** (1.5s). Covers 1000px, 680px and 720 CSS px via 200% zoom: detail follows ledger, heading is visible, numeric values remain available, page has no horizontal overflow, arrow-key detail selection works, and source/close return retains expected focus/context.

No repository/tracker edits. This focused host review does not establish Windows acceptance; parent owns integrated/Windows receipts and documentation.

Final focused addendum — reviewed `8722d16...5982fdf700612f3be428b46fca76e899666c8b9b` read-only. No new actionable standards or smell issue. The shared detail-panel ref anchors both the populated drawer and no-sales notice, and the effect waits for the settled `viewMonth`; it retains the existing row/source/close focus ownership. This removes the inaccessible offscreen-notice edge without adding financial behavior or a speculative abstraction. The new regression explicitly covers a short 1000×560 window, selected product disappearing in the next month, the whole notice in view, and close returning to search. Worker reports four packaged checks plus typecheck/lint passed; no tests or build were repeated for this final static recheck. No repository/tracker edits.

## Windows continuation — Spec

Reviewed production fix `8722d16` (checkout HEAD `a05ce06323fdfa49964b55d45d41f3b35f351715`, subsequent capture-only changes), using the matching packaged Mac app.

- **P2 — Reveal the absent-product detail after a month change.** `src/ui/pages/ProductsPage.tsx:53–55` scrolls the new stacked detail into view only when `chosen` exists. Its fallback branch at line 123 is also now below the ledger, but has no scroll target or notification. The approved A specification requires preserving “product/source context and focus” and keeping “absent and partial states distinct.” After selecting Şeker in October and changing to August, where it has no sales, a valid longer catalogue leaves “Şeker bu ay satılmadı.” and its close action entirely offscreen. In an independent 1000×700 packaged check, the fallback begins at y=706.80 and its message at y=725.80, with scrollY=0; `toBeInViewport` fails with ratio 0. Reveal a shared detail anchor for both the chosen and absent branches after the new month settles, without taking row/control focus. Add a month-change regression with enough product rows to put the fallback below the fold.

Evidence: `/tmp/esmer-ui-a-product-spec/product.test.ts`, screenshot `absent-after-month.png`, and `results/`. Fixture: existing `monthProfitSnapshot` plus 30 synthetic August products/rows, no private data. The existing new constrained-detail/source-return/close test independently passes (1 test, 1.7s), output `existing-results/` in the same directory. No rebuild, repository edits or tracker writes.

### Spec recheck

# Focused Spec recheck — stacked product detail

**Resolved; no remaining focused finding.** Reviewed clean worker HEAD `5982fdf700612f3be428b46fca76e899666c8b9b` against its matching packaged Mac app, without rebuilding or changing the repository.

Independent fallback reproduction now passes at actual 1000×700: after selecting October’s Şeker and moving to August with 30 additional synthetic rows, the absent-product panel appears at y=479.80–644.20 (previously y=706.80–871.20, wholly offscreen). The month control retains focus through this scroll. Closing the absent panel returns focus to search, since its product is absent from the ledger.

Two independent packaged checks passed (1.9s): absent-product discoverability/focus/close, and stacked Enter → ArrowDown → Escape with selected-row focus and viewport return. The existing constrained-detail regression also independently passed (1 test, 2.0s), covering 1000px, 680px and actual 720 CSS px at 200% zoom, non-overlapping ledger/detail, known figures, source rows and return, and close-to-row context.

Evidence: `/tmp/esmer-ui-a-product-spec/product.test.ts`, updated screenshot `absent-after-month.png`, `results/` (independent checks), and `final-existing-results/` (source-return regression). Original finding preserved in `/tmp/esmer-ui-a-product-spec-review.md`. Synthetic fixtures only. These are Mac packaged checks, not Windows launch/scaling acceptance; no tracker writes.

Final review totals: Standards — one P2 resolved, zero unresolved; Spec — two P2 findings resolved, zero unresolved.

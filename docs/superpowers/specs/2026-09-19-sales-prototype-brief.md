# Sales journey wireframe prototype

Mode: Operate. Throwaway exploration, based on the confirmed [sales UI brief](2026-09-18-phase-5-sales-ui-design.md). The user selected Option A on 2026-09-19, with the current brighter palette carried forward. No production integration is implied.

Question: Can the owner follow a monthly sales figure through category/product, transactions, document details and source evidence without losing period, filters or meaning?

## Direction contract

THESIS: Make one sales investigation visible from summary to source. Preserve the agreed journey; compare information density rather than redesigning the product.

OWN-WORLD: Wireframes retain the shell's system sans and use the user-requested brighter blue/green/red palette. White elevated content, pale cool workspace, navy text, blue actions, green gains and red decreases/returns keep meaning explicit. Native controls and tabular figures remain. No artwork or new brand system. The owner reads financial tables on a desktop; a light document surface supports that task (ambient-light preference remains unverified).

STORY: Read the summary, choose a category or search a product, inspect matching transactions, open a document and explain a line. Back navigation retains context.

FIRST VIEWPORT: A uses a horizontal metric strip over a trend/category split. B uses compact metric rows above a broad category ledger with the trend alongside. C keeps a summary rail beside a sequential trend/category reading area. All contain the approved summary figures, comparisons, trend and category entry points. A fixed development-only switcher changes composition while preserving journey state.

FORM: Three code-led, low-fidelity variations of the previously approved workspace. No concept roll or image comp: the user specifically requested wireframes of the settled journey, not a new visual world. Each variation uses the same fixture and transitions.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

## Scope and proof

- Separate development entry beside the existing UI; production App.tsx, service and packaging stay untouched.
- One local run command; no source access, persistence, new dependencies or privileged operations.
- Clearly marked synthetic three-day fixture, fixed report version, precomputed report values. Illustrative tax amounts are not jurisdictional rules.
- Variant A/B/C in the URL; arrow switcher and keyboard shortcut. Period, search, returns filtering, details, source evidence and back navigation work.
- Controls for representative empty, loading, failure, discrepancy and refresh states are prototype controls, not promised production UI.
- Inspect the full journey and narrow/wide layouts; record screenshots and one runnable smoke check. No production acceptance claims, benchmark or Windows verification.
- Capture the prototype on codex/phase-5-ui-prototype. Option A is selected; B/C remain historical alternatives. See the selected-design section of the confirmed sales UI brief.

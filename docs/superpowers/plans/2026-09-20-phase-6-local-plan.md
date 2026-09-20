# Phase 6 local implementation and Windows boundary

Issue [#9](https://github.com/AlesSystems/esmer-market-analytics/issues/9) authorizes tasks 6.1 and 6.2 through local implementation, tests, PR, and Windows handoff. The [implementation plan](esmer-market-implementation-plan.md#phase-6--historical-estimates-purchasing-and-supplier-returns) and its foundation documents govern financial meaning.

## Data and report design

The existing package stores a cost decimal without validated unit, KDV basis, or return attribution. A new synthetic mapping carries explicit evidence. Earlier mappings retain sales support and cannot gain supported cost by reinterpretation. Evidence survives an additive SQLite migration, dataset fingerprints, and pinned report reads.

The estimator consumes the recognized sales population. Its covered sales and costs always refer to the same lines. Coverage uses absolute net exposure, with signed sale and return amounts retained separately. Historical cost stays estimated. Replacement prices come from eligible purchasing evidence and cannot rewrite historical results.

Purchasing recognition retains invoice and dispatch evidence but recognizes each validated event once. Physical returns, claims, financial credit, and replacement settlement have separate evidence states. Inventory and waste display only supported observations, with negative-stock and recording-completeness warnings.

Two designs were considered. A separate purchasing session provides stronger module separation but adds IPC operations and permits different dataset versions between tabs. A sibling purchasing result on the existing pinned sales session keeps one dataset and a smaller boundary. Use that shared session without folding purchasing metrics into sales transaction counts or filters.

## Delivery and checks

1. Add focused failing contracts for G02, G03, G04, and G07.
2. Add evidence validation, persistence, deterministic calculations, and provenance tests.
3. Add a named purchasing read behind the existing sender/payload boundary and integrate the Turkish workspace.
4. Run focused checks during implementation. Run the complete unit, integration, and packaged desktop suites, typecheck, lint, and build at completion.
5. Review financial correctness, standards, and UI independently. Record actual results and limitations.
6. Open a PR and provide a Windows continuation prompt on the same branch. Do not perform Windows acceptance here or close issue #9 as accepted.

The package/store worker and report/UI worker own separate files. Git commits and packaging serialize. Documentation and independent verification remain with the lead. No new dependency or general report framework is needed.

## Direction contract

**Mode and thesis.** Operate. Extend the sales workspace so the owner can see which sales have historical cost support and inspect the purchasing evidence.

**Existing visual system.** Preserve Option A in `src/ui/style.css`, including its blue actions, ink text, pale blue workspace, green positive amounts, red returns, native controls, and existing table and notice patterns.

**Journey.** Open the period, view covered historical estimates, inspect purchase and return evidence, and compare replacement prices without changing historical results.

**First viewport.** Keep the existing header, period control, and cutoff strip. Put historical coverage and estimate labels next to figures. Continue into purchase history and supplier returns with source details available nearby.

**Form.** A local extension of the established workspace. No concept tournament or visual-world change. Reuse table scrolling, keyboard focus, and disclosure patterns.

**Finish.** Verify packaged screenshots and keyboard behavior, review the rendered result independently, and record the existing design system without rewriting its identity. No generated raster assets are needed.

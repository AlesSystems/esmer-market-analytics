# Issue 27 implementation record

The user authorized implementation and a PR on 2026-09-25, superseding the issue's earlier planning-only handoff. Base is `dc99905821d9d265670787c067a8ec01910974c7`. Work is isolated on `codex/shadcn-monthly-ui`.

## Workflow

- [x] Read the Principles section of poteto-mode.
- [x] Phase A: Frame.
- [x] Phase B: Design the workflow.
- [x] Phase C: Run the loop.
- [x] U1. Record the screen inventory and selected composition before production edits.
- [x] U2. Build a small shadcn foundation in the existing esbuild pipeline.
- [x] U3. Prove a compact overview, visible trend, coverage and expense action through the packaged app.
- [x] U4. Migrate sales and purchasing controls while retaining filters, pagination and detail behavior.
- [x] U5. Migrate expense, report, import and recovery controls without changing workflow authority.
- [x] U6. Run regression, Windows packaging, visual and accessibility checks.
- [x] Phase D: Keep the audit trail.
- [x] Phase E: Verify and hand back.
- [x] Review Standards and Spec independently, resolve findings, commit and open a PR.

Done means the packaged application uses the selected lighter system across all existing destinations; its first desktop overview shows the monthly result, trend and important gaps; existing financial and recovery journeys pass; evidence and remaining acceptance limits are recorded; and the PR is open. Owner acceptance and real-source gates remain separate.

## Throughput checkpoint

There are 15 renderer files, one shared stylesheet, one build pipeline, and a packaged Playwright suite. Work partitions at file ownership. An Astra Low worker owns the CSS and component foundation. A Sol Medium worker owns the new packaged contract and synthetic fixture. The orchestrator owns overview behavior, integration and releases. Subsequent control migration and independent reviews use available slots. Only the orchestrator installs dependencies, builds packages and commits.

A shared registry of three components replaces repeated controls. Native tables, select controls, details and the existing SVG chart already provide the required behavior. Replacing them with Data Table, Chart, Sidebar and overlay frameworks would add state and dependencies without a corresponding user task. No new financial data model is needed; `MonthlyDisplay` already supplies every figure, comparison, coverage and warning.

## U1 screen and state inventory

| Workspace | Existing responsibilities and states retained | New composition |
| --- | --- | --- |
| Shell | Five destinations, period, cutoff, synthetic label, import history, recovery | Light neutral sidebar, restrained selected navigation, compact controls. At narrow widths navigation moves above content. |
| Monthly | Available, partial, unavailable, stale expenses, candidate and saved reports | Sales and supporting figures left; daily trend right; important gaps across the next row; finance and categories below. |
| Sales | Category, product and transaction filters; source detail; empty search; exclusions | Compact toolbar, aligned amounts, horizontally scrollable dense tables, quieter row actions. |
| Purchasing | History, supplier returns, replacement cost, inventory; filters and source detail | Shared toolbar/table spacing. Units, cost methods and settlement uncertainty stay visible. |
| Expenses | Empty, template, preview, validation, duplicate consent, confirmation, corrections, completeness | One primary import action; secondary template action; staged disclosure of evidence, clear field grouping. |
| Reports | Candidate, saved, comparison, acceptance reason, export | Shared controls and readable comparison rows, with version status adjacent to the report. |
| Operations and recovery | Busy, cancelled, failed import, retained dataset, backup setup, restore preview/confirmation | Shared form and alert styling; all safeguards and progress remain explicit. |

## Annotated composition

The old overview has a sales card spanning the finance and categories rows, leaving a tall blank area. The trend begins below it. The selected composition removes the row span. The target at 1440 by 900 CSS pixels is:

```text
sidebar 220 | Aylık Market Özeti                   report state
period      | Net sales + comparison | Daily sales trend
cutoff      | transactions / basket  | daily amount disclosure
destinations| Important gaps and Giderleri incele
            | Financial ledger      | Categories
            | Comparisons and report evidence
```

Dense tables use a compact heading/filter row and one table region with tabular numbers. Expense import keeps choose file, validate preview and confirm in that order, with supporting actions secondary. At 680 and 453 pixels, controls and navigation wrap above a single content column; dense tables scroll inside their own region.

Review before production changes compared two structures. The selected small component set preserves state ownership in `SalesWorkspace`; a broad generated widget system would introduce competing paging, filtering and focus state. Existing evidence from `../ui-option-b/images/overview-1440.png` was visually inspected. Sparse existing fixtures remain for correctness; the new fixture adds a synthetic month, five categories, long Turkish names and a negative return day. U6 screenshots validate the proposed layout against the actual artifact, rather than claiming this schematic is a runtime result.

## Direction contract

THESIS. The owner reads the month and its limitations together, then follows a figure to its records. Empty space must not displace the trend.

OWN-WORLD. User-pinned light shadcn styling, neutral white and zinc surfaces, Segoe UI, dark primary buttons, restrained teal selection and chart bars, amber missing-evidence states. Day-to-day use on a Windows desktop favors readable conventional controls.

STORY. Identify the period and actual cutoff, read sales with comparison validity, understand missing costs and expenses, open the relevant workspace.

FIRST VIEWPORT. Compact sales occupies the left 40% and trend the right 60%. A full-width attention row precedes the financial ledger and category table. No sales row span. Essential warnings and monetary coverage remain visible when explanations are collapsed.

FORM. Code-led, brief-pinned shadcn application structure. Concept seed `2e0460bf` was run; the user's agreed light sidebar and operational hierarchy govern the result. Decorative challenger directions do not replace those decisions.

FINISH. unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Verification seams

The issue already specifies packaged month, evidence, navigation and recovery journeys. These are the agreed public seams. Add a focused failure at the overview journey before UI changes, then retain existing unit, integration and packaged tests. Use literal independent fixture totals. Do not test component internals or duplicate financial formulas in the renderer.

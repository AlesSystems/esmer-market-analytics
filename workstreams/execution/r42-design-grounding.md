# R42 design comparison

## Checklist

- [x] Frame. Choose minimal composition for the approved #38 page.
- [ ] Fan out. Two structurally distinct sketches in bounded waves, one model family.
- [ ] Cross-judge. Independent reviewer compares complete artifacts.
- [ ] Pick. Coordinator selects module ownership and state.
- [ ] Graft. Keep only required improvements.
- [ ] Verify. Worker exposes and passes packaged owner journey.

## Grounding

Saved planning explorer trace is in planning-evidence.md and reports_plan handoff. App source workspace opens SalesWorkspace. Its existing month selector produces a ReportContext. MonthlyWorkspace requests compact MonthlyDisplay, rejecting old effects and checking session/period. MonthlyOverview renders it. ReportVersions independently invokes MonthlyOverview for stored candidates/v1/v2 and pins export by report ID. Named readReportProducts fixes page100; readReportEvidence product-profit filters by report/product and returns100 rows. No full graph needs renderer transfer.

## Selection rubric

1. One report identity owns summary, daily, table, selected evidence and export.
2. Minimal API and components; no duplicated request infrastructure or financial formulas.
3. Explicit late response, report change, pagination and focus behavior.
4. Existing v1 meaning, secondary navigation and saved workflows remain reachable.
5. Packaged behavior is checkable, including 100-row bounds and truthful unavailable states.

## Throughput checkpoint

- Blocking first steps. R47 must pass exact-head review and merge before R42 application changes.
- Independent workstreams. Source proposal and UI design only read report contracts and own disjoint outputs.
- Shared mutable state. R47 owns its branch/build; R42 gets separate worktree after R47 merge. Integration is serial.
- Smallest safe decomposition. One worker owns coupled UI state and its packaged tests, followed by independent review.

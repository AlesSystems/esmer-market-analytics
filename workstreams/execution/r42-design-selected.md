# Selected R42 composition

Choose candidate A. Coordinator scores A22/25 and B20/25, agreeing with independent gpt-6.1-sol review in r42-design-review.md. Both candidates were read completely. All work used one model family.

MonthlyOverview dispatches on format before hooks. Preserve its v1 implementation locally and render a focused MonthlyProfitPage for v2 with the same props. Both current and saved callers keep their report ownership. One component owns coupled product query/selection/detail; use existing formatters, controls and paging. Do not add a generic fetch abstraction or concatenate old complete pages.

Adopt all five concrete review corrections.

1. Determine selected product hidden-by-search from retained displayName/productId with the same trimmed Turkish lowercase matching as reportProducts. Absence from current page means off-page only. Do not make selected-ID search requests.
2. Fetch full-document recorded totals from its pinned header using existing documents evidence, and page its lines separately. Identify the exact header, not a substring collision. Label full-document scope separately from selected-product covered amounts. Never sum in React.
3. Key document requests by report, product, document, offset and attempt, using effect cleanup; validate only identities actually echoed by the current response. Do not invent an echoed documentId requirement.
4. Project daily chart geometry in monthlyDisplay with existing Exact arithmetic, preserving stored daily.trend. Complete empty days have trend0, unsupported/no-cost days null. Keep numerical alternative and signed zero baseline. Geometry is ephemeral display data, not persisted artifact or calculation version change. A focused display-contract test must first expose this missing projection if added.
5. Show originalSaleLineId and its stored cost attribution. Mark unavailable original document drill-down explicitly. No new lookup endpoint or full-graph scan in this slice. If a real acceptance case needs more, report it before expanding.

Graft B's focus/200percent zoom coverage and off-page distinction. Required chart is daily only; do not add optional charts that need new global projections. At most3 remains the contract ceiling. Existing secondary operations, v1 output and selected-report export remain intact.

Root owns the public choice. Implement only after R47 review/merge, re-ground against that exact base, then run missing-contract red/green and all R42 acceptance lanes. Present working screenshot and30-60second synthetic video before merge. User handles Windows; no real-data readiness claim.

# R42 design cross-review

Verdict ISSUES. Recommend candidate A as the base, with the concrete corrections below before implementation. This is a design verdict, not application acceptance.

Reviewed on 2026-10-01. Both complete candidates and the five criteria in `r42-design-grounding.md` were reviewed against the approved #38 contract and actual code at `625661b29108e053cbfabc7f72613e88169c23d6` in `/Users/altanesmer/.codex/worktrees/profit-source-evidence/esmer-market-analytics`. Candidate preparation and this independent judge used one model family. No cross-family validation is claimed.

## Criterion scores

Scores use 1 for materially missing and 5 for fully specified at design level.

| Rubric criterion | A | B | Concrete basis |
| --- | --- | --- | --- |
| One report identity owns summary, daily, products, selected evidence and export | 5 | 5 | Both preserve the existing caller and selected report ID. `ReportVersions.tsx:52` exports `selected.id`; `display.ts:39` projects the pinned v2 daily and summary fields. Neither substitutes filtered rows for monthly scope. |
| Minimal API and components, no duplicated requests or formulas | 4 | 4 | A isolates the changed v2 composition behind one format dispatch while keeping the hook-bearing v1 body separate. B limits the new component to the table/detail, but adds v2 presentation decisions throughout the existing broad overview. A explicitly puts chart geometry beside the display projection; B leaves that placement unspecified. |
| Late responses, report changes, pagination and focus | 4 | 3 | Both key requests and remount report state, retain selection and restore focus. A needs an exact search-visibility rule. B proposes an unnecessary selected-ID request that does not prove membership in the active search. Neither can validate an echoed document ID with today's response shape. |
| Preserve v1 meaning, secondary navigation and saved workflows | 5 | 4 | A's early format dispatch preserves the old rendering wholesale. B's section branches are viable, but v2 must not reuse old gross availability rules for its empty and unsupported states. Both retain saved report callers and navigation. |
| Packaged behavior, 100-row bounds and truthful unavailable states | 4 | 4 | Both name packaged journeys, response races, v1 reopening and export pinning. A explicitly includes 101-row and partial/loss/gap cases; B explicitly includes focus and 200% zoom. Both still need literal acceptance expectations and pinned document-header retrieval. |
| Total | 22/25 | 20/25 | A gives the maintainer one place to understand the new composition and its lifecycle. |

## Base and grafts

Choose A's format dispatcher, local preserved v1 implementation and focused `MonthlyProfitPage`. Its public props are the existing report and navigation props. The component owns product query, selection and detail state. This is a meaningful module rather than a pass-through wrapper. Keep both current callers unchanged.

Graft B's precise distinction between a selected product being absent from the current page and being absent from the complete search results. Also graft its explicit focus and 200% zoom acceptance requirement. Ship the required daily chart first; A's optional coverage chart can wait. The approved contract permits at most three graphs and does not require all three.

Reject B's extra selected-ID search. Reject a generic query framework, a full purchasing-page composition, financial calculations in React and chart data derived from the current product page. Laziness Protocol shaped these decisions. Existing bounded operations and the retained selected row already carry the necessary data.

## Required corrections

1. Determine hidden-by-search from the retained selected product's `displayName` and exact `productId`, using the same trimmed Turkish lowercase matching as `display.ts:75-76`. A page omitting the selected ID cannot establish that the product is hidden by search. A separate request searching the selected ID cannot establish membership in the current search either. Test selection on page two followed by an empty search, a matching Turkish search and a nonmatching search.
2. Obtain recorded document totals from pinned header evidence, separately from its paged lines. `display.ts:69-70` returns only raw lines for a document. The existing `SavedSourceRecords` also obtains the selected header through a `documents` page at `ReportEvidence.tsx:54-61`. Reusing its line UI alone cannot supply the full-document total. Do not sum visible lines in React. Fetch the bounded document header and all paged lines, mark selected-product matches, and label covered product scope separately from the recorded header. Test a multi-product document with more than 100 lines.
3. Use the request key and effect cancellation to bind document responses. `ReportEvidencePage` at `display.ts:23` echoes report, section and offset; it does not echo document ID. A's promise to check an echoed document ID cannot be implemented against that type. B correctly lists only existing response echoes, but still needs the key to include document selection. No response-contract expansion is necessary merely for this check.
4. Specify the daily chart's display projection before implementation. Use stored `daily.trend`, which deliberately represents complete empty days as `"0"` while `coveredGrossProfit` can remain null, as shown at `product-profit.ts:62-63`. Calculate only display geometry with existing Exact arithmetic outside React. Preserve null gaps, negative bars and the numerical alternative. Do not feed the old net-sales chart or infer empty-day zero from missing cost.
5. Preserve original-sale references honestly. `ProductProfitLine` stores `originalSaleLineId`, but the current `lines` operation requires a document ID. The `documents` operation filters to the current or comparison interval at `display.ts:64-67`. These operations do not resolve an arbitrary earlier original-sale line to its document. Keep the reference visible and mark unavailable drill-down explicitly. If an actual acceptance case requires more, design only the exact bounded lookup needed and review it before adding it. Do not scan or transfer the complete graph.

The architect red-flag screen found no proposed generic infrastructure or temporal pipeline worth rejecting outright. A's new page hides several coupled policies behind the existing prop boundary. Its dispatch must occur before v1 hooks, as the candidate specifies. B's principal risk is information leakage through repeated format-dependent section rules rather than a bad product-table component.

## Verification and remaining gates

Read-only inspection covered `MonthlyWorkspace`, `MonthlyOverview`, `ReportVersions`, `ReportEvidence`, `display.ts`, report contracts, `product-profit.ts`, report evidence construction and package scripts. The approved contract supplied literal E02 monthly +60 versus daily +100/-40, E03 covered scope, empty/zero/loss states, retained v1 meaning and search-independent scope.

Before acceptance, expose the missing packaged journey, then prove search/sort/page/selection invariance, 101-product and 101-line bounds, rapid report/product/document races, local retry, focus return, keyboard and 200% zoom, saved v1/v2 reopening and complete selected-report export. Run the existing unit, integration, typecheck, lint, build, package and packaged desktop commands for the changed implementation. No application checks ran for these prose sketches.

R47 must pass review and integrate before R42 application work. Re-ground the chosen sketch at that resulting SHA. Coordinator owns synthesis and integration. Real source meaning, financial activation, full-volume proof and user-run Windows acceptance remain open. Only this assigned review artifact changed.

Throughput checkpoint is not applicable to this read-only review. Arena frame and fan-out were supplied; this assignment performed cross-judging and a base/graft recommendation. Implementation, verification of implemented behavior and PR creation were skipped under the assigned boundary. Nested review and comment agents were skipped because the assignment expressly prohibits them.

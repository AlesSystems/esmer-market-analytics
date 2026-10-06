# Standards review

Baseline `afe93cdd1abe5f127240d761a6174aaa1c172e8f`; original head `f4c66e70af11efeaf4c6e9ecd6ea9b812992f61a`. Both resolve; three-dot diff is nonempty (68 files). Independent review, including supplemental uncommitted PRODUCT, DESIGN, contract and surface contradiction checks. Bounded follow-up reviewed `f4c66e7..bc3d426`, then `bc3d426..de4a5e5`. Current pinned head: `de4a5e596e1a5d17e575169fa05c8680f979319a`.

## Findings

**[P2, resolved at current head] Invoice detail requests remained permanently busy after hiding the page.** Original `src/ui/purchasing/PurchaseDocuments.tsx:18–29` shared `sequence` between the list effect and `inspect`. After the list was cached, a delayed `inspectPurchaseDocument` followed by hiding the page caused list cleanup to execute `++sequence.current`. The detail response and its `finally` failed their token checks. Returning skipped loading through `list?.key===key`, leaving `busy=true`, indefinite progress and disabled paging. Detail-page changes had the same cancellation risk.

The original correctness/validation gap conflicted with supplemental `docs/contracts/page-control-desks.md:23`: “Returning restores the originating search, filters, page, table scroll, window scroll and focus.” Existing invoice tests switched only after completed reads.

Current `PurchaseDocuments.tsx:17–18` explicitly cancels hidden reads and clears busy; identity changes also clear busy. Its linked-parent stack now advances only after a successful owned response. The new `navigation-lifecycle.test.ts:13` journey delays initial invoice inspection across sidebar navigation and detail paging across Settings, then verifies progress ends, paging stays enabled and a subsequent page read reaches `51–61 / 61`. Static tracing resolves the reported ordering. Parent reports 36 focused packaged passes, one private-gate skip and static checks passing; reviewer did not rerun them. No unresolved finding remains in this bounded follow-up.

No other documented-standard breach established. No baseline smell warrants a separate speculative rewrite. Minimize Reader Load and Boundary Discipline guided tracing shared mutable request state and validating IPC entry points; mandatory preload/main/worker boundaries were not treated as Middle Man smells.

Final delta clears the retained purchasing-evidence parent-back callback when its effect becomes inactive. It does not change invoice cancellation, request tokens or busy settlement. The added lifecycle assertion checks that selecting Özet twice does not close hidden purchasing evidence. The original invoice finding remains resolved; no open finding within this bounded recheck. Parent reports nine targeted cleanup checks passing; full-head suite was still running at review time.

## Limits

Static review only; no reviewer builds, suites, source access, commits or PR actions. Original scope covered IPC validation, retained snapshots, privacy, financial/expense meanings, preference serialization and hidden-page ownership. Follow-up covers only the original invoice finding and its regression test. Windows installer/runtime acceptance remains open.

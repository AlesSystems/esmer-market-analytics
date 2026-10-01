# Orchestrate status

Generated: 2026-10-01T13:02:23.729Z

## Units

States: done=11, failed=2, running=1

| ID | Track | State | Branch | PR | SHA | Brief |
| --- | --- | --- | --- | --- | --- | --- |
| E46 | source | done |  | 46 | 85d4645555cdac4fc0a244152837cf8904d5a39e | workstreams/execution/e46-review.md |
| R47-IMPL | reports | done |  |  |  | /Users/altanesmer/Desktop/Ales/esmer-market-analytics/workstreams/execution/r47-brief.md |
| R39-SCOPE | source | done | codex/profit-source-scope |  | fadcd06701d8a5ebfe28abbd6536a3f786391524 | /Users/altanesmer/Desktop/Ales/esmer-market-analytics/workstreams/execution/r39-scope-brief.md |
| R47-TEST | reports | done |  | 47 | 625661b29108e053cbfabc7f72613e88169c23d6 | /Users/altanesmer/Desktop/Ales/esmer-market-analytics/workstreams/execution/r47-brief.md |
| R39-SCOPE-REVIEW | source | failed |  |  |  | /Users/altanesmer/Desktop/Ales/esmer-market-analytics/workstreams/execution/r39-scope-review.md |
| R42-DESIGN | ui | done |  |  |  | /Users/altanesmer/Desktop/Ales/esmer-market-analytics/workstreams/execution/r42-design-grounding.md |
| R47-COMMENTS | reports | done |  |  |  | /Users/altanesmer/Desktop/Ales/esmer-market-analytics/workstreams/execution/r47-comments.md |
| R39-SCOPE-REPAIR | source | done |  |  | 1eac844e288695a35d70304506eae5fd1efa2e8d | /Users/altanesmer/Desktop/Ales/esmer-market-analytics/workstreams/execution/r39-scope-review.md |
| R39-SCOPE-RECHECK | source | done |  | 48 | 1eac844e288695a35d70304506eae5fd1efa2e8d | /Users/altanesmer/Desktop/Ales/esmer-market-analytics/workstreams/execution/r39-scope-review.md |
| R47-REVIEW | reports | failed |  | 47 | 9ba93b37f3346d912aca792224979a259938dc0d | /Users/altanesmer/Desktop/Ales/esmer-market-analytics/workstreams/execution/r47-spec-brief.md |
| R47-REPAIR | reports | done | codex/product-profit-reports | 47 | ad4bc3d | /Users/altanesmer/Desktop/Ales/esmer-market-analytics/workstreams/execution/r47-standards-review.md |
| R47-RETEST | reports | done | codex/product-profit-reports | 47 | 328453e1dafc0a5fc8aba72ccc62ffbcafef72e1 | /Users/altanesmer/Desktop/Ales/esmer-market-analytics/workstreams/execution/r47-brief.md |
| R47-RECHECK | reports | done |  | 47 | 328453e1dafc0a5fc8aba72ccc62ffbcafef72e1 | /Users/altanesmer/Desktop/Ales/esmer-market-analytics/workstreams/execution/r47-spec-recheck.md |
| R42-IMPL | ui | running | codex/monthly-profit-page |  | c2f8ee050911f17d704f203269285a19d7375f36 | /Users/altanesmer/Desktop/Ales/esmer-market-analytics/workstreams/execution/r42-brief.md |

## Verification ledger

Verdicts: live-ui-verified=1, type-check-only=2, verifier-failed=1

| PR | SHA | Verdict | Evidence | Verifier | Timestamp |
| --- | --- | --- | --- | --- | --- |
| 46 | 85d4645555cdac4fc0a244152837cf8904d5a39e | type-check-only | /Users/altanesmer/Desktop/Ales/esmer-market-analytics/workstreams/execution/e46-review.md | gpt-6.1-sol independent docs review | 2026-10-01T12:22:15.548Z |
| 47 | 9ba93b37f3346d912aca792224979a259938dc0d | verifier-failed | /Users/altanesmer/Desktop/Ales/esmer-market-analytics/workstreams/execution/r47-standards-review.md | Independent Standards and Spec review; reproduced contradictory restored v2 fields | 2026-10-01T12:47:27.113Z |
| 47 | 328453e1dafc0a5fc8aba72ccc62ffbcafef72e1 | live-ui-verified | /Users/altanesmer/Desktop/Ales/esmer-market-analytics/workstreams/execution/r47-spec-recheck.md | Independent Standards and Spec PASS; synthetic Mac current recovery and full suites | 2026-10-01T13:00:12.833Z |
| 48 | 1eac844e288695a35d70304506eae5fd1efa2e8d | type-check-only | /Users/altanesmer/Desktop/Ales/esmer-market-analytics/workstreams/execution/r39-scope-review.md | Docs-only independent review; query hashes and local links; no TypeScript or SQL execution | 2026-10-01T13:02:22.154Z |

## Frontier

Generation: 5
Lowest unmerged: none

| Branch | PR | SHA | State |
| --- | --- | --- | --- |
| codex/product-profit-reports | 47 | 328453e1dafc0a5fc8aba72ccc62ffbcafef72e1 | MERGED |
| codex/profit-source-scope | 48 | 1eac844e288695a35d70304506eae5fd1efa2e8d | MERGED |

## Gates

| ID | Status | Question | Options | Default | Answer |
| --- | --- | --- | --- | --- | --- |
| R39-AUTH | open | Approve exact renewed isolated source scope after proposal review | Approve named scope; defer source reads | No source access until explicit authorization |  |
| R39-PROOF | open | Establish independent real financial semantics | Evidence proves a bounded population; preserve unsupported mapping | Only isolated backup available; do not infer meanings |  |
| WINDOWS | open | User-run Windows acceptance receipts after integrated handoff | User supplies evidence; gate remains open | User performs checks; no Mac substitution |  |

<!-- orch-summary {"unitStates":{"done":11,"failed":2,"running":1},"ledgerVerdicts":{"live-ui-verified":1,"type-check-only":2,"verifier-failed":1},"frontierGeneration":5,"openGateIds":["R39-AUTH","R39-PROOF","WINDOWS"]} -->

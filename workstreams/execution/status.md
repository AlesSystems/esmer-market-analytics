# Orchestrate status

Historical execution record from 2026-10-01. Branch pins, tracker states and instructions below describe that run. Use [the current evidence index](../../docs/evidence/index.md) and the assigned task for present scope and acceptance.

Generated: 2026-10-01T16:57:23.711Z

## Units

States: done=19, failed=3

| ID | Track | State | Branch | PR | SHA | Record |
| --- | --- | --- | --- | --- | --- | --- |
| E46 | source | done |  | 46 | 85d4645555cdac4fc0a244152837cf8904d5a39e | workstreams/execution/e46-review.md |
| R47-IMPL | reports | done |  |  |  | docs/evidence/issue-41-synthetic-product-profit.md |
| R39-SCOPE | source | done | codex/profit-source-scope |  | fadcd06701d8a5ebfe28abbd6536a3f786391524 | docs/evidence/issue-39-renewed-scope.md |
| R47-TEST | reports | done |  | 47 | 625661b29108e053cbfabc7f72613e88169c23d6 | docs/evidence/issue-41-synthetic-product-profit.md |
| R39-SCOPE-REVIEW | source | failed |  |  |  | workstreams/execution/r39-scope-review.md |
| R42-DESIGN | ui | done |  |  |  | workstreams/execution/r42-design-grounding.md |
| R47-COMMENTS | reports | done |  |  |  | workstreams/execution/r47-comments.md |
| R39-SCOPE-REPAIR | source | done |  |  | 1eac844e288695a35d70304506eae5fd1efa2e8d | workstreams/execution/r39-scope-review.md |
| R39-SCOPE-RECHECK | source | done |  | 48 | 1eac844e288695a35d70304506eae5fd1efa2e8d | workstreams/execution/r39-scope-review.md |
| R47-REVIEW | reports | failed |  | 47 | 9ba93b37f3346d912aca792224979a259938dc0d | workstreams/execution/r47-spec-review.md |
| R47-REPAIR | reports | done | codex/product-profit-reports | 47 | ad4bc3d | workstreams/execution/r47-standards-review.md |
| R47-RETEST | reports | done | codex/product-profit-reports | 47 | 328453e1dafc0a5fc8aba72ccc62ffbcafef72e1 | docs/evidence/issue-41-synthetic-product-profit.md |
| R47-RECHECK | reports | done |  | 47 | 328453e1dafc0a5fc8aba72ccc62ffbcafef72e1 | workstreams/execution/r47-spec-recheck.md |
| R42-IMPL | ui | done | codex/monthly-profit-page |  | 98f129d1c89d34de9a006d782593e5dbe4092c29 | docs/evidence/r42-monthly-profit-page.md |
| R42-TEST | ui | done | codex/monthly-profit-page | 49 | 3219c0cbbb77b10a9af8991fa081d5b2b86dd44b | docs/evidence/r42-monthly-profit-page.md |
| R42-REVIEW | ui | failed | codex/monthly-profit-page |  | 98f129d1c89d34de9a006d782593e5dbe4092c29 | workstreams/execution/r42-spec-review.md |
| R42-REPAIR | ui | done | codex/monthly-profit-page |  | d7df4c9a7ba7b8cb08f61dc5dd79f1255be89e51 | workstreams/execution/r42-standards-review.md |
| R42-RETEST | ui | done | codex/monthly-profit-page |  | d7df4c9a7ba7b8cb08f61dc5dd79f1255be89e51 | docs/evidence/r42-monthly-profit-page.md |
| R42-RECHECK | ui | done | codex/monthly-profit-page | 49 | 3219c0cbbb77b10a9af8991fa081d5b2b86dd44b | docs/evidence/r42-monthly-profit-page.md |
| R42-MEDIA-REPAIR | ui | done |  |  | e06e377aa71f48c9fe09298e9527e94d88dd6f9f | docs/evidence/r42-monthly-profit-page.md |
| WORKSTREAMS-FINAL-REVIEW | docs | done |  |  | 56821261caf761313b9add702b33e68adf12dc96 | workstreams/execution/workstreams-final-review.md |
| R39-RESUME | source | done | codex/source-inspection-resume |  |  | workstreams/execution/r39-resume.md |

## Verification ledger

Verdicts: live-ui-verified=2, type-check-only=2, verifier-failed=2

| PR | SHA | Verdict | Evidence | Verifier | Timestamp |
| --- | --- | --- | --- | --- | --- |
| 46 | 85d4645555cdac4fc0a244152837cf8904d5a39e | type-check-only | workstreams/execution/e46-review.md | gpt-6.1-sol independent docs review | 2026-10-01T12:22:15.548Z |
| 47 | 9ba93b37f3346d912aca792224979a259938dc0d | verifier-failed | workstreams/execution/r47-standards-review.md | Independent Standards and Spec review; reproduced contradictory restored v2 fields | 2026-10-01T12:47:27.113Z |
| 47 | 328453e1dafc0a5fc8aba72ccc62ffbcafef72e1 | live-ui-verified | workstreams/execution/r47-spec-recheck.md | Independent Standards and Spec PASS; synthetic Mac current recovery and full suites | 2026-10-01T13:00:12.833Z |
| 48 | 1eac844e288695a35d70304506eae5fd1efa2e8d | type-check-only | workstreams/execution/r39-scope-review.md | Docs-only independent review; query hashes and local links; no TypeScript or SQL execution | 2026-10-01T13:02:22.154Z |
| 49 | 98f129d1c89d34de9a006d782593e5dbe4092c29 | verifier-failed | workstreams/execution/r42-standards-review.md | independent-standards-and-spec | 2026-10-01T13:57:15.794Z |
| 49 | 3219c0cbbb77b10a9af8991fa081d5b2b86dd44b | live-ui-verified | workstreams/execution/r42-spec-recheck.md | independent-standards-and-spec | 2026-10-01T13:57:15.921Z |

## Frontier

Generation: 6
Lowest unmerged: none

| Branch | PR | SHA | State |
| --- | --- | --- | --- |
| codex/issue-39-profit-evidence | 46 | 85d4645555cdac4fc0a244152837cf8904d5a39e | MERGED |
| codex/product-profit-reports | 47 | 328453e1dafc0a5fc8aba72ccc62ffbcafef72e1 | MERGED |
| codex/profit-source-scope | 48 | 1eac844e288695a35d70304506eae5fd1efa2e8d | MERGED |
| codex/monthly-profit-page | 49 | 3219c0cbbb77b10a9af8991fa081d5b2b86dd44b | MERGED |

## Gates

| ID | Status | Question | Options | Default | Answer |
| --- | --- | --- | --- | --- | --- |
| R39-AUTH | resolved | Approve exact renewed isolated source scope after proposal review | Approve named scope; defer source reads | No source access until explicit authorization | User authorized bounded isolated-backup inspection and necessary setup; full permission to complete non-Windows gates. Exact scope review and evidence still required. |
| R39-PROOF | open | Establish independent real financial semantics | Evidence proves a bounded population; preserve unsupported mapping | Only isolated backup available; do not infer meanings |  |
| WINDOWS | open | User-run Windows acceptance receipts after integrated handoff | User supplies evidence; gate remains open | User performs checks; no Mac substitution |  |

<!-- orch-summary {"unitStates":{"done":19,"failed":3},"ledgerVerdicts":{"live-ui-verified":2,"type-check-only":2,"verifier-failed":2},"frontierGeneration":6,"openGateIds":["R39-PROOF","WINDOWS"]} -->

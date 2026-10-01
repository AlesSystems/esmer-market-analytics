# R39 renewed-scope review

Verdict ISSUES. Standards PASS. Spec ISSUES with one actionable authorization gap. Execution remains BLOCKED on a stopped or unavailable isolated copy, separate lifecycle authorization and missing independent financial proof.

Reviewed on 2026-10-01. Scope is only `docs/evidence/issue-39-renewed-scope.md` on `codex/profit-source-scope` at `fadcd06701d8a5ebfe28abbd6536a3f786391524`, compared with merge base `9923427afa1716105b5ced224783bfa6189cccfe`. The worktree was clean during the review. Commit list contains only `fadcd06 docs(source): propose bounded renewed metadata scope`.

PatchID is `d86f0d7b427519f6a5bba89fe1048dbccc3180ce`, generated with `git diff 9923427afa1716105b5ced224783bfa6189cccfe...fadcd06701d8a5ebfe28abbd6536a3f786391524 -- docs/evidence/issue-39-renewed-scope.md | git patch-id --stable`.

Both code-review axes were performed by this reviewer, sequentially. No nested reviewers were spawned under the bounded assignment. This is independent of the author but not separate-agent independence between axes.

## Standards

PASS. No actionable documented-standard breach or Fowler smell was found in this documentation-only patch. The proposal leaves the runtime allowlist, accepted reports and application code unchanged. SQL drafts name fixed tables, fields, joins and bounds. Unknown unit/link fields wait for catalog evidence and another exact reviewed value scope. Private receipts, outputs and locators stay outside Git, public logs and release files. The draft preserves missing/null/unsupported meanings and does not claim Windows acceptance.

Factual checks agree with the public records. The prior evidence at `85d4645:docs/evidence/issue-39-source-profit.md` identifies batch `3824ff83-6d2f-47b7-9b74-02d7334d6cd4`, 15,880 headers, 54,965 lines, the September 2025 raw timestamp interval, cleanup that stopped the owned copy and unknown original backup identity. The proposed date window uses the historical bounds in `docs/contracts/source.md:64`, not a newly claimed source cutoff. The unusual `TEFKIFAT_TOPLAM` spelling matches the existing source/privacy allowlist. `STOK_BIRIM` is correctly treated as unconfirmed public evidence rather than invented schema fact. The metadata proposal requests new review instead of treating old catalog permission as continuing authorization.

`gh issue view 39 --comments --json number,state,labels,comments` confirms OPEN, label `enhancement`, and no comments. Saved issue content records the #38 completion dependency. The approved #38 planning outcome remains compatible with the proposal. The exact metadata-only request excludes value reads and lifecycle actions. No original backup, private receipt, credential, SQL or container was accessed by this review.

## Spec

ISSUES. One P2 finding needs a documentation correction before the exact request is issued.

### Include the mandatory safety reads in the exact Stage M scope

Evidence is `issue-39-renewed-scope.md:31-52`, `:107` and `:130`. M1 reads table and column metadata only. It does not bind the expected database GUID or check database read-only state. Line 107 nevertheless requires the execution wrapper to verify live identity and state before and after. Line 130 requests permission to run "only M1 catalog metadata". An operator's earlier identity receipt cannot replace the mandated live checks.

The #39 requirement says to "Verify the exact authorized source/scope" and "Apply P01 (#38)'s reviewed column/query scope." The project also requires exact separate authorization for renewed source reads. As drafted, a compliant operator must either stop because the required check queries are absent from the authorized M1 list, or run additional unlisted metadata queries. The proposal should not leave that choice implicit.

Add the exact existing identity/read-only metadata statements to the fixed reviewed query envelope, or enumerate them as separate named fixed safety queries in the request. Include their required permission and query hashes when preparing execution. Keep the same five-table catalog projection and all existing exclusions. This is a small authorization clarification and does not require lifecycle, source value or application work. Re-review the corrected immutable patch before publication.

No other missing implementation or scope expansion is alleged. Stage V is expressly a later proposal, so its incomplete extractor is appropriate here. Units, linkage and real meaning remain unsupported. The user has supplied only the existing backup; no independent POS documentation or receipts can be treated as present. The document correctly refuses to restart, restore or substitute a source under Stage M. The known stopped-copy condition prevents execution even after this wording correction unless an exact lifecycle scope is separately authorized. No permission question was issued during review.

## Verification

| Check | Actual result |
| --- | --- |
| Fixed base and head resolution, commit list and scoped three-dot diff | One new documentation file, 138 lines, at the SHA above. |
| `git diff --check 9923427afa1716105b5ced224783bfa6189cccfe...fadcd06701d8a5ebfe28abbd6536a3f786391524` | Passed with no output. |
| Python local Markdown target check on the reviewed file | Both local targets exist, the approved contract and foundation audit. No local anchor targets exist in this file. |
| Source identity/date/field comparisons | Matched the named public evidence, source/privacy contracts, foundation audit and existing SQL reader identifiers. |
| Issue metadata read through `gh` | #39 OPEN with `enhancement` and no comments; #38 CLOSED with `documentation` and no comments. |

Application tests, SQL execution, permission probes, lifecycle actions, private evidence checks and Windows checks were not run. They cannot be claimed from a documentation review. Only this assigned report changed; the reviewed worktree and dirty main application files were preserved. Coordinator owns corrections, publication and integration.

Standards has zero findings. Spec has one P2 finding, the incomplete fixed safety-query scope. Remaining source and financial gates are BLOCKED independently of the documentation correction.

## Final recheck at repaired head

Final documentation verdict PASS on 2026-10-01. Standards PASS and Spec PASS. This supersedes the initial ISSUES verdict above for the repaired artifact only. The original P2 finding is resolved. Source execution and financial meaning remain BLOCKED.

Reviewed immutable head `1eac844e288695a35d70304506eae5fd1efa2e8d` against base `1ed1824ec5ee448cf880d20e89d74d1d67d08486` in `/Users/altanesmer/.codex/worktrees/profit-source-scope/esmer-market-analytics`. Author repair is `835bb6328e916aa07315199f51ae02363d03c663`. The merge retained that repair and the original proposal. Scoped patchID is `1c5866345a69f4071340215164813e7e4998424d`.

The complete repaired document now defines the fixed M0, M1, M2 order. M0 and M2 explicitly check live read-only state and return database GUID plus engine version. Each requires exactly one matching non-null GUID. M0 failure prevents M1, and M2 failure prevents publication and deletes temporary output. The exact authorization question includes all three queries. Required metadata visibility is listed; missing privileges cause a stop without elevation. The wrapper must pin the SQL hashes and seek review for any added SQL. No user-table value, lifecycle, credential, source activation or runtime permission was added by implication.

The source-bound citation explicitly identifies prior-batch observations rather than proving the current cutoff. The repaired proposal acknowledges the known stopped-copy condition and requires separate lifecycle authorization before optional metadata work can run. Independent POS documentation and receipts remain absent. No semantic proof, #39 completion, R40 activation or Windows acceptance follows from this documentation PASS.

Both review axes were rechecked by this reviewer without nested delegation. Exact commands and results were:

| Check | Actual result |
| --- | --- |
| `git rev-parse HEAD`, clean `git status --short`, commit list and scoped three-dot diff | Head matches the requested immutable SHA, the reviewed worktree is clean, and the scoped proposal has 150 lines. |
| `git diff --check 1ed1824ec5ee448cf880d20e89d74d1d67d08486...1eac844e288695a35d70304506eae5fd1efa2e8d` | Passed with no output. |
| `git diff 1ed1824ec5ee448cf880d20e89d74d1d67d08486...1eac844e288695a35d70304506eae5fd1efa2e8d -- docs/evidence/issue-39-renewed-scope.md \| git patch-id --stable` | Returned the patchID above. |
| Python extraction from `git show` at the reviewed head, SHA-256 over exact UTF-8 fenced SQL including trailing newline | M0/M2 matches `76c79aeb2a8a22cccb3cd3925666d756eeb594c6423494f5ae33132f67d49339`. M1 matches `4cabf20b62aa33e9097fe05f74d8924168469212b86cdecca85e9dbb505a00d0`. |
| Python local Markdown target and anchor validation against files at that head | All five local links passed, including the recorded source-bounds anchor. |
| Comparison with the cited collector and SQL reader at that head | The guard and GUID-query identifiers match existing code. |

No source connection, private-data read, container action, SQL execution or GitHub action occurred during this recheck. No reviewed-worktree file changed. Only this final section was appended to the assigned report. Zero actionable findings remain on either axis for this immutable documentation patch.

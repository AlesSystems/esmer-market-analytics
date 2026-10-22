# October 22 integration and app verification

User scope: finish open issues/PRs, merge without waiting for CI, exercise the app as an owner and then repair CI. Only synthetic local inputs were used.

## Integration

| Work | Result | Merge commit |
| --- | --- | --- |
| #85 estimate paging performance | PR #94 merged; issue closed | `a9afc97e4cf1cae3013753284fbf4901347471b0` |
| Concurrent monthly navigation reads | PR #95 merged | `de00b2871a9f19eb573fc9c3274ab1970019c9de` |
| #81 owner workspace | PR #91 merged; issue closed | `35b0863` |

Both implementation areas received independent standards and specification review. Final UI head `75c54c0` also resolves the evidence wording review about requested window sizes. Reviewers used the same model family. GitHub listed no open issues or PRs after these merges.

## Merged app verification

`main` at `35b0863`, macOS arm64, Node 24.15.0/npm 11.12.1:

- `npm test`: 114 unit passed; 367 integration passed / 14 skipped; 133 packaged desktop passed / 14 skipped, with no failures. Desktop duration 2.6 minutes, using the app produced by `npm run package:local`.
- `npm run typecheck`: passed.
- `npm run lint -- --ignore-pattern '.scratch/**'`: passed. The excluded path is the local nested worktree, not committed application source.
- Owner workflows cover welcome/shortcuts, all business routes, month retention, product/document lookup, back-navigation focus, manual expense drafts and persistence, accepted report history, Excel exports, encrypted backup/clean-profile recovery, settings and offline restart. They operate the packaged Electron UI and assert stored/output results; this is automated user-flow evidence, not owner acceptance.
- The [visual receipt](owner-workspace/2026-10-22-acceptance.md) includes synthetic screenshots and larger-text/keyboard checks. The [performance receipt](source-performance-2026-10-22.md) records both admitted-volume shapes. The [monthly-read receipt](monthly-navigation-2026-10-22.md) records the reproduced concurrency failure and fix.

Skipped tests include platform-specific Windows checks, optional visual captures, isolated SQL and private-source inputs. This run establishes neither Windows acceptance nor real-source financial semantics.

## CI follow-up

The repository had no workflow and no Actions runs. Windows validation is added after merged-main testing: locked dependencies, typecheck/lint, unit/integration, `package:win` with distribution verification, then the packaged Windows workflows. Actions are pinned to immutable commits, with read-only repository permission and synthetic evidence retention for 14 days. The executable override supplies the Windows binary to all existing tests. The Windows performance journey removes an obsolete detail-close click and measures visible controls only.

CI execution results are pending at this receipt's initial commit. A configured workflow is not a passing Windows result. Real-source semantics, owner hardware/acceptance and production access remain separate gates.

## Execution graph

| Node | Type | Dependencies | Acceptance | State |
| --- | --- | --- | --- | --- |
| G0 | analysis | none | Foundations, issues and scope read | completed |
| G1 | analysis/test | G0 | Performance reproduced and profiled | completed |
| G2 | implementation/test | G1 | Exact cache/rollback tests and measured evidence | completed |
| G3 | implementation/test | G0 | Rendered routes, focus, zoom and Settings repaired | completed |
| G3a | implementation/test | G0 | Identical pending read regression and chart checks | completed |
| G4 | review | G2,G3,G3a | Independent review findings resolved | completed |
| G5 | integration | G4 | Reviewed PRs merged, issues closed | completed |
| G6 | test | G5 | Full merged packaged app workflows pass | completed |
| G7 | implementation/test | G6 | Windows CI configured and outcome checked | running |
| G8 | documentation/review | G7 | Final evidence and unresolved gates reported | pending |

Implementation ownership was isolated: root owned UI/integration; the worker owned performance and then navigation in separate worktrees. Benchmarks, builds and desktop tests were serialized. No shared source writes or source access occurred.

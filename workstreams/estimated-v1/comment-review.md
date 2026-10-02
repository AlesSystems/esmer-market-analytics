# EV1 pre-review comments pass

Scope is added code/tests in `f705ec1...a9edb9b`, including `playwright.config.ts`, plus public `workstreams/estimated-v1/reconcile.py`. Read the canonical Skills-worktree Poteto wrapper/adapter, bundled no-comments and Comment Sicko prompts. Inspected added comment/suppression lines and their surrounding live code. This is report-only, not final acceptance.

## Findings

Four trivial deletions are recommended.

| Location | Comment | Reason |
| --- | --- | --- |
| `tests/desktop/source-estimate.test.ts:18` | `Public evidence only uses the synthetic fixture.` | Narrates the surrounding test, whose input is visibly `estimateSnapshot`/`estimatePackage`. No external constraint exception. |
| `tests/desktop/source-estimate.test.ts:29` | `No private row assertions or screenshots; trace/video must remain disabled for this opt-in.` | The test's name/body and `playwright.config.ts` already encode these choices. That configuration sets trace/video/screenshot off. This is an internal privacy rule rather than a forced external behavior. Preserve the actual controls. |
| `workstreams/estimated-v1/reconcile.py:2` | Module docstring describing the independent oracle/private outputs/no app imports. | Describes implementation and file purpose. It does not define a public callable API contract. |
| `workstreams/estimated-v1/reconcile.py:116` | `140-digit exact multiplication within documented operand bounds.` | Narrates an explicit operand and assertion immediately below. |

No added lint/TypeScript suppressions were found. No actionable correctness/safety suppression or workaround symbol requiring `MUST KILL` was identified in this narrow comments scope.

## Report

Application/test edits and actual deletions are zero. Recommended deletions are four. No comments were restored. No rerun or architect sketch is required for these trivial deletions. No encoding offer or unenforced constraint is left open. The Python shebang is an interpreter directive and remains. Documentation/contract prose is outside the code-comment scope. No private artifact reads, SQL, Docker, application verification or commits were performed.

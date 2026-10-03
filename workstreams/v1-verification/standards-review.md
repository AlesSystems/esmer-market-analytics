# REV-01 Standards review

Reviewed `git diff f7f3ae5a84ee880b77ac2b5b15e71e8fc62f042b...HEAD` through `8b22392`, plus uncommitted DESIGN.md, the overview surface record, page-control-desks contract and task evidence. Unrelated `outputs/` was excluded. No application edits or test runs were performed.

Standards sources were AGENTS.md, PRODUCT.md, DESIGN.md, foundation specification/audit/acceptance, current workspace contract and the code-review skill. The available user request and audit trail establish non-Windows v1 verification and removal of all decorative 3D. The raw full transcript was unavailable; no finding depends on inferred authorization.

## Documented standards

No actionable hard violation found. The patch preserves read-only source boundaries, explicit financial uncertainty, existing calculation ownership and task controls. The financial and release fixes have focused regression commits before implementation. The DAG records the four ENOENT failures separately from application behavior and retains platform/private-source exclusions. The revised design records reflect the user's later removal instruction.

No new comment or correctness/safety suppression was found in the later release-tool or executable-path changes. Regex delimiters in release inventory and HTTP request interception are code, not comments.

## Judgment finding

**P3. Possible Duplicated Code in packaged executable resolution.** The baseline defines this smell as “the same logic shape appears in more than one hunk or file in the change.” `tests/desktop/option-b.test.ts:8`, `shadcn-ui.test.ts:10` and `workspace-subviews.test.ts:8` now each copy the complete resolver beginning `process.env.ESMER_EXECUTABLE ?? (process.platform === "darwin" ? resolve(...) : process.platform === "win32" ? ...)`.

The preceding suite failure demonstrates the maintenance consequence. Four otherwise applicable tests selected a Windows path on macOS. A small shared desktop-test resolver, used by these three changed files, would make the repaired platform policy consistent at its source. This is a nonblocking maintainability judgment, not a documented-standard breach. It does not justify migrating every existing test or reopening Windows acceptance.

## Validation scope

Inspected full-suite, harness-retest, focused-fix, lint and typecheck receipts. They record 50 unit and 324 integration passes, 72 desktop passes followed by four successful repaired checks, and eight intentional exclusions. These results are recorded evidence, not reruns by this reviewer. Final PR/evidence completion remains parent-owned.

## REV-02 disposition

P3 resolved in `219cfac`. Reviewed `git diff 8b22392..219cfac`, the shared `desktop-executable.ts` constant and all four callers. Override and platform behavior remain identical. The retest receipt records six passes and three intentional Windows exclusions. No new findings. No tests rerun by this reviewer.

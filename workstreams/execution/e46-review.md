# E46 documentation pilot review

Status **PASS** for the documentation-only insufficient-evidence handoff. Independent merge verdict **mergeable at the pinned head**, while issue #39 stays open and real financial activation stays blocked. No actionable Standards or Spec findings were identified within this bounded review. This verdict does not validate private SQL measurements, approve semantic mappings, or pass application acceptance.

Reviewed on 2026-10-01 by an independent reviewer, with no implementation changes, commits, GitHub writes, source access, or nested agents.

## Artifact identity and scope

- PR https://github.com/AlesSystems/esmer-market-analytics/pull/46.
- Head `85d4645555cdac4fc0a244152837cf8904d5a39e`.
- Base `9923427afa1716105b5ced224783bfa6189cccfe`.
- Stable patch ID `c041806202a65512d6602920a1f33740d3ca90be`, from `git diff BASE...HEAD | git patch-id --stable`.
- Exact diff SHA-256 `ab47064596369cf30667c0155cba86ddc8bb9c3d80e11a01b2088f32ea09be16`.
- Commits `63229b1` and `85d4645`, both scoped documentation commits.
- Four files, 72 additions and no deletions. `docs/contracts/calculations.md`, `docs/contracts/privacy.md`, `docs/contracts/source.md`, and `docs/evidence/issue-39-source-profit.md`.

The shared checkout was dirty `main` before review, with changes to `src/ui/App.tsx` and `tests/desktop/startup.test.ts`, plus untracked `workstreams/`. Those application files were not edited. Repository inspection used `git show HEAD:path` at the review SHA, rather than treating the dirty checkout as the reviewed artifact. The only authored artifact is this report.

## Workflow and requirements

Read the assigned standing orders, Poteto wrapper, Codex adapter, upstream Investigation playbook, code-review leaf, no-comments leaf, technical-writing leaf, and unslop leaf. The pilot explicitly requires both review axes in one bounded reviewer and no nested agents. The parallel review and Comment Sicko dispatch steps were therefore skipped. No fixes, prototypes, application tests, source probes, PR creation, or shipping steps were applicable. Throughput checkpoint is n/a for a read-only investigation.

Read the head revision of `AGENTS.md`, the issue-tracker instructions, relevant foundation specification and audit, A01/A02/A03/A05/A07/L01 acceptance obligations, implementation-plan tasks 2.1 and 2.2, and P01's separate financial source scope. Read issue #39 with comments and JSON body/labels. The issue is OPEN with the `enhancement` label. P01 #38 is its completion prerequisite, and its exit gate expressly allows an insufficient-evidence blocker handoff.

## Standards

**PASS. No actionable findings.**

The diff contains documentation only. It enables no mapping, modifies no extractor or runtime allowlist, changes no schema or dependency, and adds no package or release artifact. The privacy grant is explicitly restricted to a named private evidence batch and does not imply runtime permission. The existing preview lists 13 header fields, 10 line fields and two currency fields. Adding one historical-cost field and `STOK.ID` produces the documented 27 distinct table-column grants.

The patch contains aggregate counts, opaque batch identities, digests, field names, procedural placeholders and public vendor links. No raw rows, private exact transaction amounts, source locators, credentials, customer records, employee records, supplier records or product display values appear in the added content. The self-signed certificate limitation is disclosed in evidence lines 7 and 46. The permanent lineage, original backup identity and clean-schema limitations remain open in lines 7, 21 and 54. The review did not inspect private outputs or certify the safety of the historical execution itself.

`git diff --check` passed. All 40 local Markdown link and anchor occurrences across the four head-revision documents resolved against the pinned Git tree, including P01's financial-scope anchor. The source-code smell baseline is not applicable to a prose-only patch; no speculative runtime abstraction or copied implementation appears.

## Spec

**PASS. No actionable findings for the authorized insufficient-evidence outcome.**

Issue #39 requires independent source meaning for enabled rules and enforced capability limits for unresolved cases. Its exit gate states that insufficient evidence should deliver blockers and keep activation blocked. Evidence lines 3, 17, 21 through 28, 36 and 54 through 58 preserve that result. The record distinguishes raw transport from sales recognition, historical cost and profit. It preserves unknown financial exposure, non-TRY exclusion, null operands, unresolved units and returns outside the selected month. It approves neither a universal 0.01 tolerance nor treating recorded zero cost as genuine zero.

The current capability claims are supported by the pinned source tree. `src/source/contract.ts` still declares real financial rules unsupported. `src/source/sql-server.ts` selects fixed raw columns without the historical-cost candidate. `src/source/sql-package.ts` delegates to `writeRawPackage`, whose implementation in `src/source/raw-package.ts` enforces `sql-backup-preview-v1`, isolated-backup provenance and `sourceReconciled:false`. `src/store/store.ts` writes `source_preview` separately from `active_dataset`. `src/source/package.ts:90` accepts only the three synthetic mappings and synthetic provenance. `src/reports/query.ts:34` returns `UNSUPPORTED_MAPPING` when only raw preview records exist. The three linked integration test files contain corresponding preview-separation, raw-report-readiness and state-preservation contracts. Their contents were inspected, not rerun.

Historical synthetic test counts, private September transport assertions and the packaged Mac import/restart are explicitly described as bounded earlier evidence in lines 40 through 50. The patch does not equate those results with real financial acceptance, Windows acceptance or source completeness. The old October batch and new September batch remain separate. Current PR metadata matches the documentation-only scope and says issue #39 stays open.

## Commands and results

Use `BASE=9923427afa1716105b5ced224783bfa6189cccfe` and `HEAD=85d4645555cdac4fc0a244152837cf8904d5a39e` as review placeholders below.

| Command or procedure | Actual result |
| --- | --- |
| `pwd`, `git status --short`, `git branch --show-current` | Correct repository, dirty `main`, protected application changes present. |
| `git rev-parse BASE HEAD` | Both exact commits resolve. |
| `git log --oneline BASE..HEAD` | Two scoped documentation commits. |
| `git diff --stat BASE...HEAD`, `git diff --numstat BASE...HEAD` | Four files, 72 added lines, zero deleted lines. |
| `gh issue view 39 --comments`, `gh issue view 39 --json number,title,body,labels,state,url` | Issue and dependency/exit contract read successfully; no comments were emitted by the comments command. |
| `gh pr view 46 --json number,title,body,headRefOid,baseRefOid,headRefName,baseRefName,state,url,files`, `gh pr diff 46` | OPEN PR; exact assigned base/head; four documentation files. |
| `git show HEAD:path` for changed documents, governing contracts and named runtime/test files | Historical claims scoped against requirements; current unsupported mapping and preview separation confirmed by static inspection. |
| `git diff --check BASE...HEAD` | Exit 0, no whitespace errors. |
| In-memory Python Markdown-link scan using `git show HEAD:path` and `git ls-tree -r --name-only HEAD` | 40 local link/anchor occurrences checked, zero missing targets or anchors. |
| `git diff BASE...HEAD` supplied to `git patch-id --stable` and Python SHA-256 | IDs recorded above. |
| Public web opens and text searches for the three BAY.t citations | All three links returned content. [Dealer list](https://bay-t.com.tr/bayiler/) lists Aladağ Büroteknik. [Retail product page](https://www.bay-t.com.tr/flex-kolayshop/) exists. The [Entegre Pro PDF](https://bay-t.com.tr/download/Entegre_Pro/YeniNeVar_Entegre_PRO.pdf) contains dated 2016 entries and discount discussion. These sources do not prove the installed product or database meanings. |
| Final `gh pr view 46 --json headRefOid,baseRefOid,state` | OPEN PR still at the assigned head and base. |
| Final `git status --short` | Existing dirty application paths remain present; no application edits by this reviewer. |

An initial text-search command found no package-format literal in `sql-package.ts` and stopped before its dependent searches. Inspection followed the wrapper's actual `writeRawPackage` call into `raw-package.ts`, then completed the source checks. This was a search miss, not a failing application check.

No historical app tests or private permission, copying, SQL, Decimal, hash, packaging or desktop procedures were rerun. Private receipts and historical review outputs were unavailable to this bounded review. Their success claims remain attributed historical assertions. This review independently verifies the changed documentation, local links, visible privacy content, static runtime boundaries and unchanged artifact identity.

## Remaining issue #39 gate

#39 must remain open. Completion still requires independent product/version-specific evidence for completed sales, type-11/type-35 economic identity, void/deletion handling, conversions, market-local dates, TRY dependencies, units/multipliers, tax and discount basis, rounding, transaction-time historical cost and original-sale return attribution. Each enabled rule needs representative private examples and independent Decimal expectations, supported/excluded populations and signed exposure when measurable. Unknown exposure remains unknown.

Permanent lineage/original backup identity, clean-source comparison and full source lifecycle proof remain unestablished. P03 financial mapping remains blocked. Windows packaging and desktop acceptance, full-population financial reconciliation, owner acceptance, source permission and production rollout are separate remaining gates. Merging this documentation cannot satisfy them.

Standards findings 0. Spec findings 0. Review is valid only for the pinned patch identity above.

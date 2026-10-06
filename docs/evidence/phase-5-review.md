# Phase 5 independent reviews

These separate reports were returned by two read-only reviewers using GPT-6 Astra. They are independent same-family reviews, not cross-family evidence.

## Standards

Reviewed `git diff 4452fd9...HEAD` with initial HEAD `838061f`, branch `codex/phase-5-sales-analytics`. Read AGENTS.md, the then-current repository workflow guidance, PRODUCT.md, the foundation specification/audit/acceptance documents, Phase 5 plan/design/contracts, issue #8 and comments. Applied all twelve Fowler baseline heuristics as judgment calls; repository requirements override them.

### Documented-standard finding

**P2 — Keep comparison boundaries beside product growth.** At `838061f`, `src/ui/SalesWorkspace.tsx:98` rendered `.comparison-boundaries` only inside the overview branch, while the product table at line 74 displayed `previousMonthChange`. After navigating to products, a partial-month percentage no longer disclosed either matched interval. Foundation specification §5.2 requires that a matched elapsed-period comparison “states its actual boundaries”; D16 and PRODUCT.md require explicit incomplete-period coverage. Move the existing boundary block into the shared comparison-bearing views and assert its presence after category navigation.

**Resolved:** Regression assertion `67e746c` and fix `84d550d` move the existing block outside the overview branch, retaining it on overview/products and omitting it from transactions. This reviewer inspected the committed fix. The main agent reported packaged sales tests 2/2, typecheck and lint passing after the fix; this reviewer did not rerun them.

### Other findings and evidence limits

No other actionable correctness, security, regression, or hard-standard breach found. No baseline smell justified a separate change. Named IPC validation, bounded synthetic fields, service-side decimal arithmetic, preserved recorded tax, explicit exclusions, snapshot pinning and additive migration follow the relevant AGENTS.md rules.

The draft audit trail identifies independent review within the same model family. Real-source semantics, Windows acceptance and full-volume performance remain open. Final evidence references require the main agent’s handoff check.

Captured `git log 4452fd9..HEAD --oneline` at initial HEAD: `838061f fa3cd01 a8d9311 d95e833 56964e0 fad8b7c 485bf68 d56aed2 32b43a2 95f68bf 32ed8f2 8df7b38 b20576b 6050049 6555197 0d52dbf 2e2ac8d`.

### Excluded-evidence follow-up

Read-only recheck of the uncommitted report contracts/query, UI and packaged regression additions found no new safety or Standards issue. `input` copies the existing validated `SalesLine` allowlist; it exposes no database capability or unreviewed source object. The detail uses the same pinned snapshot, explicitly separates recorded amounts from uncomputed contributions, and preserves back navigation/focus. The test verifies IDs, mapping, recorded amounts, exclusion wording and return navigation. Full-suite execution remains with the main agent.

No application edits, commits or tests performed by this reviewer. One original Standards finding, resolved; no remaining Standards finding.

## Spec

Original review: `4452fd9...838061f` on `codex/phase-5-sales-analytics`. Read issue #8/body/comments, foundation specification/audit/acceptance, Phase 5 plan, PRODUCT, sales UI design, decisions and applicable contracts. Same-model-family review, not cross-family evidence. This follow-up checks only the two reported findings and their fixes.

- **Resolved — matched comparison boundaries on product breakdowns.** The original products view showed prior-month percentages without disclosing their matched dates, although the displayed net amount could cover additional March days. Foundation §5.2 requires matched comparisons to “state its actual boundaries”; the UI brief requires “retain coverage warnings for comparisons.” Fix `84d550d` moves the existing boundaries outside the overview-only branch, exposing them on both overview and product pages. Inspected the fix; the parent independently observed the packaged 2/2 regression pass. No remaining issue for this finding.

- **Resolved in current working tree — excluded-line source evidence.** The original excluded lines lacked the required “Kaynak detayını göster” route “for each line.” `src/reports/query.ts:97` now copies original quantity, signed recorded net and the allowed sales fields from the retained snapshot. It does not recalculate excluded amounts or replace unknown units. `src/ui/SalesWorkspace.tsx:30`, `:104` and `:106` select excluded evidence and render it in the existing panel with exclusion reason, original amounts, dataset/batch/lineage, cutoff and method. “Hesaplanmadı” distinguishes these facts from computed contributions; the zero-valued excluded document totals are not displayed as financial results. Entry and back change only `lineId`, retaining the same detail, period, filters and pinned context. The focused query test checks unknown-unit return evidence and unchanged signs; the desktop test checks unknown-meaning evidence, original amounts and return to excluded detail. No remaining source-level issue for this finding.

Remaining validation: the parent reports eight focused query tests, typecheck and lint passing; the excluded-evidence packaged rerun is still pending at this review. Windows/full-data acceptance remains explicitly open. No application edits, commits, source access or Windows execution performed by this reviewer.

## Coordinator verification

Both fixes are committed in `84d550d` and `7ea6e64`. After reviewer follow-ups, the coordinator ran the final full suite: 12 unit, 131 integration and 7 actual packaged macOS desktop tests passed; typecheck and lint passed. This closes the local validation pending in the reports above. Windows/full-data acceptance remains open.

One original Standards finding and two original Spec findings; all resolved. No remaining finding in either axis.

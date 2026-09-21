# Independent Phase 6 review

Reviewed on Windows on 2026-09-20. Initial application branch tip was `014281c11d07752e5dcfedb88bb7945a3b4968e0`. Base `origin/main` resolved to `56d0d35e632e1d4796fffd916c9b747225ca2891`. Scope was `git diff origin/main...HEAD`, plus related contracts, issue #9 and its dependencies, PR #20, foundation documents, and Phase 6 evidence.

The reviewer kept application and test files unchanged. The parent owns fixes, packaging, installer work, and desktop verification. This is an independent review using the same model family, not a different-model review.

## Standards

No additional actionable documented-standard violation found in the inspected code. The new financial calculations remain in the service, use decimal strings and deterministic decimal arithmetic, and retain unsupported states. Schema 4 is additive. The named purchasing IPC read reuses sender and exact context validation. No new dependency was introduced in this diff.

The review inspected costs, purchasing, package validation, report queries, schema migration and persistence, main/preload/worker request wiring, formatting, and the purchasing workspace. This finding count does not certify source semantics, release contents, Windows lifecycle, or full-data performance.

## Spec

### P2. Replacement prices can lose their linked dispatch evidence

Initial location is `src/reports/query.ts:99`, together with `src/analytics/purchasing.ts:69`. Replacement rows retain only `documentId`. The query adds linked source IDs from period-scoped purchase history, but only the invoice ID from replacement rows.

Reproduction used a canonical package accepted by `store.importPackage`. Both synthetic sales were dated 2025-08-31. Invoice P1 and its matching dispatch D1 were dated 2025-09-03. D1 had `convertedTo: "P1"` and `invoiced: true`. Coverage was August through September, with cutoff 2025-09-30. Opening August produced the following actual values.

```json
{
  "replacementCost": "50",
  "replacementDocumentId": "P1",
  "history": [],
  "evidenceDocuments": ["P1", "S1", "S2"]
}
```

D1 is absent. The price legitimately comes from the imported cutoff, so excluding it from August history is correct. Dropping its linked dispatch evidence is not. The invoice has no reverse `convertedTo` link, and the owner cannot inspect the second source document for this displayed replacement price.

The acceptance checklist G07 requires both documents to remain traceable. A03 requires source evidence for every released KPI. Preserve the recognized purchase's source-document IDs through replacement results and source navigation. Add a regression where the replacement purchase falls outside the selected sales month.

### P2. Prior-period original-sale evidence has no UI navigation

Initial location is `src/ui/purchasing/PurchasingWorkspace.tsx:56`. The return detail renders `originalSaleLineId` as plain text under `Özgün satış satırı`. `SalesReports.purchasing` includes the original sale's document and lines in the pinned evidence, including an earlier reporting month. However, no source button opens that original document from the return detail.

For a September return linked to an August sale, the owner can inspect the return but cannot follow its original-sale attribution within the pinned report. Changing the selected month replaces the report context. This leaves G04 attribution evidence and A03 traceability incomplete despite the relevant records already being present.

Resolve the original line to its document inside the returned evidence and provide linked navigation with the established focus-restoration behavior. Keep the dataset and method context unchanged.

## Verification and limitations

The replacement reproduction ran the actual package writer, importer, in-memory SQLite store, and report query on Node 24 through an esbuild in-memory bundle. It did not bypass package validation. Expected source documents included P1 and D1. Actual source documents omitted D1 as recorded above.

Focused commands completed with exit code 0.

| Command through `work/windows-phase-6/runtime/npm.cmd` | Actual result |
| --- | --- |
| `run test:unit -- tests/unit/cost-coverage.test.ts tests/unit/return-cost.test.ts tests/unit/purchasing.test.ts` | 3 files, 10 tests passed |
| `run test:integration -- tests/integration/cost-provenance.test.ts tests/integration/supplier-return.test.ts tests/integration/purchasing-report.test.ts` | 3 files, 14 tests passed |

These existing tests did not cover either reported navigation gap. The second finding was confirmed by code inspection, not a launched desktop reproduction. No desktop application, installer, source container, private backup, or credential was accessed by this reviewer.

The Poteto Prove It Works principle changed the review from a static suspicion to a valid-package runtime reproduction for the first finding. The code-review skill supplied the separate Standards and Spec axes. Recursive delegation and comment edits were omitted because this was the parent's bounded read-only review assignment.

Initial verdict has zero Standards findings and two Spec findings, both P2 provenance gaps. The parent has assigned their shared evidence-navigation fix. This record does not claim that the fixes have passed review yet.

## Fix review at bb74a3f

Reviewed test commit `df8aeea` and implementation commit `bb74a3fb0a1a081784c0ad21527fbd28d0f5fc8d`. Replacement results now carry the recognized purchase's complete `sourceDocumentIds`. The report includes those documents and their lines even when purchase history is outside the selected month. Invoice details expose reverse dispatch links. Return details resolve the original sale line inside the same pinned evidence and provide its document button. Linked navigation retains the original opener for focus restoration.

The reviewer reran `run test:integration -- tests/integration/purchasing-report.test.ts` through the Node 24 wrapper. All five tests passed with exit code 0. The new valid-package regression verifies an empty August history, a September replacement price, and both invoice and dispatch documents and lines. The reviewer inspected the packaged desktop regression for keyboard navigation to a prior-month original sale and Escape focus restoration. Execution of that desktop regression remains the parent's recorded evidence, not a desktop run by this reviewer.

Both initial findings are resolved in the inspected implementation. No additional actionable finding arose from the fix diff. Full source semantics, final distribution inventory, lifecycle, scaling, physical disconnect, and full-volume performance remain outside this review verdict.

## Additional golden proof

The reviewer created and ran `work/windows-phase-6/golden-proof.mjs` with Node 24. The final run passed 100 literal assertions across 31 canonical synthetic fixtures. `golden-proof.json` records each expected and actual result, fixture hashes and sizes, runtime, commit, source hashes, and the preserved accepted synthetic output hash. It covers G02 cost populations and denominators, G03 replacement and historical-correction preservation, G04 attribution exclusions, and G07 recognition and conflict boundaries. It records `ownerAcceptance: false` and does not claim real owner acceptance or source-semantic validation.

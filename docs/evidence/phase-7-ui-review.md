## verdict

Final bounded verdict at `552af6eb8f3cfd9073578a177386f3e6328248e4`. The six original capture paths were re-read, together with `phase-7-expenses-retry.png`; all seven are valid. This verdict covers the five scored fixes, not the whole surface or Windows acceptance.

1. Resolved — Empty, preview and history captures explicitly label both totals as recorded gross movements and explain that owner contributions are included and zero recorded amounts do not establish no expense.
2. Resolved — History and small captures identify revisions 1–3 as previous versions, preserve the void status on revision 3, and identify only revision 4 as current.
3. Resolved — The retry capture shows the failure and “Giderleri yeniden yükle”, without a persistent loading message; the patch connects the button to the read and clears loading in the guarded finally path. Parent reports the packaged retry contract and all five expense desktop tests pass.
4. Resolved — The expanded operating capture explains 40 TRY covered gross profit minus 10 TRY expense, names the historical cost method and both calculation versions, identifies the pinned application/expense revisions, and shows the immutable expense record with source reference, batch/row and tax/support evidence.
5. Resolved — The expanded narrow empty capture exposes the Turkish workbook guide with accepted classification/tax/loss values and date, decimal, identity, labour-period and evidence conventions.

## remaining

Clear for the five scored fixes. No material regression introduced by the fix batch is visible in the recaptures. Windows validation remains outside this review's authorization and evidence.

disposition: ship

---

Original review below is retained as historical evidence; its `fix` disposition is superseded by the final verdict above.

Original disposition: fix

Input limits: no new-world comp, quality-bar card or concept seed applies to this incumbent extension; DESIGN.md was already absent. The reviewer saw no comments in `gh issue view 10 --comments`; the parent also confirmed the issue had no comments. All six named packaged captures and the incumbent capture were inspected; all are valid. No application, detector, context-loader, screenshot or Windows run was performed.

## persistence

Pass for this extension: PRODUCT.md and the Phase 7 Operate brief exist; the brief explicitly preserves the incumbent world and records the pre-existing absence of DESIGN.md. No design-system replacement or new raster asset was introduced.

## fidelity

| Element | Result | Evidence |
| --- | --- | --- |
| TYPE | Match | Existing system UI typography, navy hierarchy and tabular figures remain consistent with the Phase 6 capture; the brief pins incumbent preservation. |
| MATERIAL | Match | Flat, functional white sections and native form controls preserve the existing application; no simulated physical material. |
| GROUND | Match | The pale blue workspace and white sections match the incumbent and the brief's OWN-WORLD. |
| Preview → validate → confirm | Match | Preview and rejected captures show an explicit confirmation control, row errors and separate completeness review. |
| Narrow desktop reflow | Adaptation | Small captures show the labelled correction form in two columns and readable tables at the brief's 680px target. |
| Financial meaning | Contradicted | The headline labels all recorded incurred movements as expenses; empty records are presented as an unqualified expense total. |
| Revision history | Contradicted | History capture labels superseded revisions 1 and 2, as well as current revision 4, “Etkin sürüm”. |
| Error recovery | Missing | Initial expense-load rejection shows an error but leaves the loading state indefinitely and supplies no direct query retry. |
| Pinned result explanation | Missing | Operating capture shows 30 TRY and 10 TRY expenses but no gross component, pinned expense records or method/revision provenance. |
| Workbook completion guidance | Missing | The generated workbook has only column headings and the workspace has no accepted-value or required-evidence guide. |

## ceiling

Reached for incumbent Operate composition. Further decorative devices, motion or a new typeface would exceed this extension's contract. Core labels, focus treatment and native inputs are present; the material issues below concern truth and recovery.

## material_fixes

1. P2 — Truth / financial meaning, `src/ui/ExpensesWorkspace.tsx:49`: rename the incurred metric to an explicitly **recorded movement** total (for example, “Oluşma tarihine göre kayıtlı brüt hareketler”), because the supplied service contract includes non-expense movements such as owner funds; qualify both totals as recorded amounts and state that a zero recorded sum does not establish that the period had no expense. A zero sum of known rows is not itself a calculation defect and need not be replaced with unknown; the existing incomplete-evidence warning must remain.
2. P2 — Inspectable history, `src/ui/ExpensesWorkspace.tsx:67`: mark only `item.revision === row.revision` as the current version; label other non-voided entries as previous versions and retain the historical void state. The history/small captures currently mark revisions 1, 2 and 4 all “Etkin sürüm”, making the operative record ambiguous.
3. P2 — Real failure state / recovery, `src/ui/ExpensesWorkspace.tsx:19-28,47`: after an initial `queryExpenses` rejection or unavailable result, end the loading presentation and expose a labelled retry that invokes the read again. Currently `view` stays undefined, so “Giderler yükleniyor…” persists beside “Yeniden deneyin” without a retry action.
4. P2 — D15 / explainable pinned result, `src/ui/OperatingSummary.tsx`: expose the pinned gross component, relevant expense records and the report's method/version/revision context in a compact disclosure using the returned `gross`, `expenseRecords`, `calculationVersion`, `grossCalculationVersion`, `expenseRevision` and `context`. The visible 30 TRY result and 10 TRY expense subtotal alone cannot explain the 40 TRY gross-minus-expenses computation or identify the immutable records that support it; a live expense editor is not a substitute for the report's pinned records.
5. P2 — STORY / usable primary entry workflow, `src/expenses/template.ts:2-4` and `src/ui/ExpensesWorkspace.tsx:44`: provide a concise Turkish workbook-help disclosure before import with exact parser-accepted classification, tax-treatment and loss-treatment values plus required date, amount, labour-period and evidence conventions. The downloaded sheet contains headings only, so “Şablonu doldurun” leaves the owner unable to discover the constrained values or evidence rules until rejecting the workbook. Reuse existing labels; a new sheet or parser feature is unnecessary.

## keep

Preserve explicit duplicate consent, import/completeness separation, unavailable-profit wording, estimated-result qualification, native labelled forms, and the incumbent visual system.

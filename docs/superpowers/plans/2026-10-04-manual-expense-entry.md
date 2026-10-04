# Owner manual expense entry

Date 2026-10-04. Planning stage before application implementation, as requested. Base branch `codex/live-mock-tracking`, commit `dae315b21f6605443612d7db41cfcddaedc0e0d2`. No application source, database, dependencies, commits, or external publications changed during planning.

## Recommended owner flow

Add secondary **Elle gider ekle** beside the existing primary **Excel’den gider ekle** action on Giderler. Excel remains the main workflow under D11. Manual entry records one occasional expense, such as an omitted bill. It creates app-owned analysis data with the same classification and completeness rules as imported expenses.

Choose a form within the existing page. Opening it selects an **Elle giriş** task beside Kayıtlar, Excel hazırlığı, and Tamlık incelemesi. The form replaces the records area and focuses its heading. The owner fills the fields and presses **Gideri kaydet**. An ordinary valid entry saves immediately. Only possible duplicates require another explicit confirmation.

The empty state also offers **Elle gider ekle**, with copy **Giderleri Excel’den veya tek tek ekleyin. Kayıt bulunmaması, gider olmadığı anlamına gelmez.** The existing Excel template and import flow remain available.

After success, return to records, focus the opener, refresh the current query, and notify the hosting report workspace. Show **Gider kaydedildi. Dönemin giderlerini yeniden inceleyin.** Mark the new record **Elle girildi**. Existing correction, void, restoration, and history actions apply to it. Saving never confirms period completeness.

If the incurred or payment date puts the new record outside the displayed period, name its incurred month and offer **İlgili aya git**. Do not silently change the owner’s selected month.

## Form and defaults

Use the current white sections, existing Input/Button controls, borders, spacing, and focus styles. Use two columns where space permits and one column on narrow windows. No new UI library is needed.

| Field | Entry behavior |
| --- | --- |
| Gider tarihi | Required. Initially blank. The selected month is context, never an invented date. A valid date determines the incurred period. |
| Ödeme tarihi | Optional and blank. Explain that it affects payment-dated movements separately. |
| Kategori | Required and blank, up to the existing 80-character limit. Example hint can name elektrik or kira. |
| Sınıflandırma | Default Sınıflandırılmamış. Keep all existing classification choices. Unknown funds must not become an operating expense by default. |
| Net tutar, KDV tutarı, Brüt tutar | Required and blank. TRY only. Accept Turkish text such as `1250,50` and `1.250,50`. Explicit zero is allowed. Blank KDV is not zero. |
| KDV işlemi | Default Bilinmiyor. Known treatment requires a KDV kanıtı code. A zero KDV amount does not establish treatment. |
| KDV kanıtı | Required and visible for known treatment. Under Bilinmiyor it may remain as an optional reference in details. Switching treatment does not discard a typed code. |
| Kayıt referansı, Destek referansı | Optional and blank, in a collapsed Referanslar section. Existing opaque-code syntax applies. Explain that a stable record reference connects the same expense across manual entry and Excel. |
| İşçilik dönemi | Only for İşçilik. Derive from the entered incurred date and show its month. The service validates the match. Show monthly aggregate guidance. |
| Kayıp kanıtı, Kayıp işlemi | Only for Stok kaybı. Evidence is required. Recognition starts with Seçin, requiring a choice between separate expense and already included in cost. |

Creation reason is service-owned **Elle kayıt oluşturuldu**. The owner does not have to invent a correction reason for a new record. Later changes require the existing reasoned correction workflow.

Use the caption **Kaydetmek, dönemin giderlerinin eksiksiz olduğunu onaylamaz.** Show **KDV işlemi bilinmiyorsa faaliyet kârı hesaplanamaz.** beside the tax choice. Explain aggregate labour and opaque references where those fields appear. Do not add employee, customer, supplier, or product-name fields.

Net plus KDV must equal gross exactly. The local service validates this. React does not calculate gross, tax rates, recoverability, or operating costs. Keep all source precision and use existing TRY formatting only for display.

## Validation and interaction states

Use a tagged form state rather than independent flags for editing, submitting, duplicate review, uncertain result, and saved result. Keep the draft in memory. Busy saving disables edits, repeat submission, and navigation until its outcome is resolved.

- Field errors keep the entered values. Focus the first invalid field and associate its Turkish error with the input. Do not echo rejected sensitive values into errors or logs.
- An active record with the same stable reference and identical canonical fields returns **Bu gider zaten kayıtlı.** Offer its existing review action. It creates no expense revision and does not invalidate completeness.
- A changed or voided stable reference requires the existing correction or restoration action. Creating a new record must not overwrite or resurrect it.
- Same incurred date and exact gross amount only suggests a duplicate. Return at most five safe summaries, plus the full match count. The owner must tick **Benzer kayıtları inceledim; bu ayrı bir gider** and press **Ayrı gider olarak kaydet**. An edit clears acknowledgement. A changed match set requires a renewed review.
- Reused active loss evidence blocks saving even if the owner acknowledges a possible repeated expense.
- A clean cancel writes nothing and returns focus. Dirty cancellation, task changes, page navigation, and period changes show **Kaydedilmemiş bilgileri bırak?** with **Düzenlemeye devam et** and **Bilgileri bırak**.
- Guard changes before the child unmounts in `App.tsx`, `SourceWorkspace.tsx`, and `SalesWorkspace.tsx`. Their current keyed period changes can otherwise destroy a draft before the child can intervene.
- A transport failure with an unknown save outcome retains its request identity and offers **Kaydı kontrol et**. Do not allocate a new identity or report that nothing saved merely because a reply failed.
- Capture form generation and period for each request. Stale validation replies cannot replace a newer draft. A committed mutation still refreshes shared analytics without navigating to an old period.

No persistent draft store is added. Before submission persist only the opaque pending request ID in renderer local storage. Resolve it when Giderler opens after restart. A resolved committed receipt shows the saved record. A definite not-saved response explains that the unsaved form contents did not survive restart. The receipt check runs through the same serialized local service queue as saving.

After restoring a backup older than an uncertain submission, an absent receipt describes only that restored database. Require review of current records before re-entry. Do not automatically replay a pre-restore command.

## Data shape and ownership

The existing `ExpenseFields` remains the canonical internal financial shape. A new bounded transport input carries localized amount strings. Exact key and value validation runs at both desktop IPC and worker boundaries. Normalize amounts in the expense service using the text parser already used by `decimalCell`, then apply `validFields` and `Exact`.

Use the same Turkish interpretation as Excel text. `1.234` means `1234`; `1,234` means `1.234`. Reject malformed grouping, negatives, unsupported precision, impossible dates, and unknown enum values. Do not introduce a second dot-decimal convention or round input to two decimals.

One new named operation hides creation and retry resolution. Proposed signatures are design contracts, not existing implementation.

```ts
type ManualExpenseInput = Omit<ExpenseFields, "net" | "tax" | "gross"> & {
	net: string; tax: string; gross: string;
};
type CreateExpenseRequest =
	| { action: "save"; requestId: string; fields: ManualExpenseInput;
		duplicateReview: null | { fingerprint: string; keepSeparate: true } }
	| { action: "resolve"; requestId: string };

type DuplicateSummary = {
	entityId: string; revision: number; date: string;
	category: string; gross: string;
};

type CreateExpenseResult =
	| { status: "saved" | "already-saved" | "already-present";
		entityId: string; revision: number; incurredPeriod: string }
	| { status: "not-saved" }
	| { status: "invalid"; fieldErrors: Partial<Record<keyof ExpenseFields, string>> }
	| { status: "duplicate-review"; fingerprint: string;
		totalCount: number; candidates: DuplicateSummary[] }
	| { status: "reference-conflict"; entityId: string }
	| ExpenseFailure;

type ExpenseOrigin =
	| { batchId: string; row: number }
	| { kind: "manual"; requestId: string };

window.esmer.createExpense(request): Promise<CreateExpenseResult>;
Expenses.create(request): CreateExpenseResult;
```

`ManualExpenseInput` shares the field keys with `ExpenseFields`, but its money strings are raw Turkish text until service normalization. Use a distinct named input type in the implementation to keep that boundary visible. No renderer-provided origin, evidence, revision, filesystem path, SQL, or database handle is accepted.

The service creates manual origin, creation reason, and evidence. Preserve every old `{batchId,row}` origin and all existing stored JSON. Corrections preserve the original origin. Manual entry never fabricates an Excel row or inserts an Excel import batch. History and report details render both origin variants honestly.

Use the existing Excel stable-reference identity exactly, including its current case and field-comparison rules. A fresh request ID without a stable reference permits a legitimate separate expense after any required duplicate review.

## Atomic save, retry, and recovery

Add an immutable `expense_commands` receipt table in an additive migration from schema 7 to schema 8. Its unique request ID records canonical field digest, resolved entity ID, original revision, and a `created` or `identified` outcome. It contains no draft field contents. Update the migration target list and exact restore-schema validation.

Within one SQLite transaction:

1. Look up a prior receipt. The same request ID and canonical fields returns its original outcome. Different fields under a committed ID fail. Retry resolution precedes duplicate and current-record checks, including after a later correction or void.
2. Resolve an optional stable reference. Identical active fields resolve the existing record. Changed or voided fields return a conflict.
3. For a new record, inspect the complete current date/gross match set and active loss evidence. Validate duplicate acknowledgement against a service-computed fingerprint of canonical fields and all sorted matching identities and revisions. Bound only the returned summaries, not the checked set.
4. Insert one immutable expense revision for a new record and its receipt atomically. An identical-reference no-op inserts only its receipt. A validation, concurrency, or disk failure inserts neither.

Receipt-only inserts must mark `recovery_state.changed` through a receipt-table backup trigger. The existing revision trigger already marks new expenses. Include receipts in encrypted backup, restore link/digest validation, and recovery metadata. Validate digest against the identified original historical revision. Allow `identified` receipts to refer to Excel-origin records. For `created` receipts, validate the manual-origin creation link in both directions. Replay retains the original outcome and never claims another insertion or completeness change. Preserve old-schema restore through the existing migration path. Old app versions reject the newer schema safely.

Do not add an unsaved-intent ledger or persist form contents. One durable receipt table covers retry safety for new records and identical-reference no-op saves. Origin-only lookup cannot associate a new retry ID with an existing Excel record.

New incurred-period revisions naturally invalidate the existing completeness confirmation. Payment-month display remains separate. Report pins and accepted outputs retain their original revisions and values. Source activation preserves manual expenses and receipts because both are app-owned.

## Alternatives and Poteto decisions

| Design | Benefits | Costs | Decision |
| --- | --- | --- | --- |
| A. Existing in-page task and direct save | Full-width fields, existing navigation/focus pattern, one ordinary save action. | Records are temporarily replaced; parent navigation needs draft protection. | Recommended base. |
| B. Drawer and review-before-save | Records remain visible; service-reviewed values appear before every save. | Overlay focus/scroll handling, extra review action, four operations, persistent intent lifecycle. | Reject the drawer and draft ledger for this slice. |

Graft B’s explicit service-owned normalized values, stale-response protection, and outside-period feedback into A. Retain A’s conditional duplicate review and receipt ledger. Add the reviewer’s bounded summaries, all-parent guards, and receipt-only backup trigger.

Experience First changed the choice to an in-page form with visible field guidance. Laziness Protocol kept one named operation and existing correction/history rather than a separate ledger product. Model the Domain changed provenance to an explicit origin union and the form to tagged states. Exhaust the Design Space produced two candidates and a switchable visual sketch before production code. Separate Before Serializing Shared State gave each candidate an exclusive artifact. Prove It Works required driving and inspecting the prototype rather than inferring layout from its source.

Independent comparison used configured GPT-6.1 worker and reviewer agents within one model family. No cross-family review is claimed.

## Implementation graph and acceptance

```text
M01 Contracts/tests → M02 Atomic command + provenance + migration
→ M03 Recovery and report compatibility
→ M04 In-page UI + all-parent navigation guards
→ M05 Packaged regression + independent review
→ M06 Windows packaging, scaling, lifecycle, recovery → handoff
```

M03 follows M02, and M04 follows M03. Serialize application changes under one implementation owner. An independent reviewer checks the finished diff. No node is complete merely because its code exists.

| Node | Dependencies | Type and allowed areas | Acceptance | State |
| --- | --- | --- | --- | --- |
| M01 | Reviewed plan | Test. Expense unit/integration tests and desktop boundary fixtures. | Observe missing create behavior, separately from any toolchain failure. Independent literal money/date expectations. | Pending implementation stage. |
| M02 | M01 | Implementation. Expenses contracts/parser/service, store schema/migrations/revisions, domain bridge, desktop preload/request allowlists, worker dispatch. | Exact values, reference interoperability, immutable origins, atomic receipts, repeated save/restart correctness, rollback, bounded duplicate responses. | Pending. |
| M03 | M02 | Integration. Recovery validation/metadata, report origin consumers, preservation tests. | Old/new backup restore, receipt-only backup scheduling, accepted report equivalence, source activation preserves records and receipts. | Pending. |
| M04 | M03 | Implementation. ExpensesWorkspace, existing styles, App/SourceWorkspace/SalesWorkspace navigation gates. | Accessible creation, conditional fields, errors, cancel, duplicates, uncertain-save recovery, dirty navigation, and narrow layouts. | Pending. |
| M05 | M02, M03, M04 | Test and review. Focused tests, packaged desktop tests, evidence. | All required checks pass; independent findings resolved; synthetic screenshots and audit history recorded. | Pending. |
| M06 | M05 | Test and documentation. Windows package and evidence/handoff. | Actual Windows packaged behavior, scale checks, migration/lifecycle/recovery recorded. Unperformed acceptance remains open. | Pending. |

Each node consumes predecessor code, contracts, and evidence and outputs its changed files plus verification record. Financial persistence and recovery risk is medium. The throughput checkpoint is grounding before design; independent candidate files; one owner for shared writes; and one bounded implementation workstream with separate review. No parallel application writers are needed.

Start with `tests/integration/manual-expense.test.ts`, a new planned file. Cover create, same-ID retries across restart, changed payload, lost reply, no-op reference receipts, concurrency, failure rollback, duplicate acknowledgement invalidation, loss collisions, Excel/manual references in both directions, and correction/void after save. Include more than five duplicate matches and a changed match outside the visible sample invalidating acknowledgement. A verified backup followed only by an identical-reference save must become pending; backup/restore must preserve its original outcome after correction or void. Malformed receipt links/digests must fail safely. Add G05/G06, owner contribution exclusion, completeness invalidation, source activation, old/new restore, and accepted report preservation. Test privacy by absence of employee fields and synthetic malformed payloads, not real identities.

Planned checks after implementation:

```sh
npm run test:unit -- tests/unit/expense-validation.test.ts tests/unit/operating-profit.test.ts
npm run test:integration -- tests/integration/manual-expense.test.ts tests/integration/expense-import.test.ts tests/integration/adjustment-history.test.ts tests/integration/import-activation.test.ts tests/integration/recovery-equivalence.test.ts
npm run typecheck
npm run lint
npm run build
npm run test:desktop
npm run package:win
```

Packaged desktop tests must exercise the actual save/restart/history path, keyboard and focus, all three Giderler hosts, dirty period changes, and both existing Excel and manual entry. Windows checks cover 100%, 125%, and 150% scaling, packaged startup/upgrade, offline operation, and receipt-aware recovery. macOS checks do not satisfy Windows A07. No real expense sample, source permission, or owner completeness attestation is assumed.

Keep commits coherent. Use `test(expenses)` for missing contracts, `feat(expenses)` for command/storage, separate recovery and UI changes, regression coverage where needed, and `docs(expenses)` for evidence. Before any commit verify the repository remote. Link phase 7 tasks 7.1–7.2 and [issue #10](https://github.com/AlesSystems/esmer-market-analytics/issues/10) as existing context. This planning stage does not create a new issue or PR.

## Planning evidence and limits

The local Poteto artifacts live at `work/poteto/manual-expenses/`. They include the inspectable planning DAG, grounding, two candidate packages, review, a throwaway `prototype.html` switcher, a replayable `probe.mjs`, screenshots, and `prototype-evidence.json`. They are ignored local working artifacts.

The probe drove conditional labour/loss/KDV fields, mock completion, cancellation focus return, and 1440px/390px layouts. Both variants measured a 390px document width at a 390px viewport after repairing the drawer’s prototype grid sizing. The sketch uses synthetic values and does not persist expenses, enforce the final financial contract, implement all accessibility/navigation behavior, or prove application acceptance. The full plan governs defaults where the example sketch has populated fields.

Poteto dependency verification passed at pin `7366ac128bdf95f45e6734f412b49a4031800169`. Final plan review is recorded in the local review artifact. Application suites, migrations, financial saves, Windows packaging, and acceptance gates have not been run during planning. Implementation is the next stage.

## Implementation record

The user subsequently authorized implementation on the existing branch. M01–M04 are implemented through `f3a3d67`; the planning statements and Pending rows above describe the earlier planning boundary. [Verification and handoff](../../evidence/2026-10-04-manual-expense-entry.md) records commits, observed failures, repaired review findings, packaged captures, final checks, and open platform gates.

Final result metadata additionally includes `paymentPeriod: string | null`, derived by the service from the original receipt revision, so payment-only outside-period notices can link to the relevant month. An absent receipt now retains the opaque pending ID and enters a disabled review-required state across remount/restart. Only explicit successful loading of current records clears that gate. No persisted draft contents or additional gate ledger were introduced.

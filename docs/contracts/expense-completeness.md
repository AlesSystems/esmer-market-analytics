# Expense and operating-result contract

Phase 7, issue [#10](https://github.com/AlesSystems/esmer-market-analytics/issues/10), plan tasks 7.1–7.2. Synthetic evidence only. The first release reads no live source. Windows acceptance is separate.

## Manual entry

The owner can also create an expense through **Gider ekle**. Issue 72 retains one manual-entry route and one **Excel’den aktar** route. It uses the same financial fields, exact amount validation, classification, provenance, correction history and completeness rules as Excel entry. Saving invalidates the affected incurred-period review; it never confirms completeness. Stable references remain shared with Excel import.

The service records an idempotent request receipt with the expense revision. A lost reply is resolved by its original request ID. After restoring an older backup, an absent receipt requires current-record review before re-entry. The renderer guards an unsaved draft during page, task and period changes. [The approved manual-entry plan](../superpowers/plans/2026-10-04-manual-expense-entry.md) and [packaged evidence](../evidence/2026-10-04-manual-expense-entry.md) record the detailed flow and open Windows checks.

## Canonical workbook

The native save action writes one `Giderler` sheet with fourteen Turkish columns. Use opaque references without customer or employee identities. The importer accepts no additional columns, employee payroll columns, extra worksheets, formulas (including cached/shared/array forms), macros or external relationships. It never retains the original workbook, path or filename. Invalid headers are rejected before any row contents are returned. Row validation errors name the column and rule without echoing rejected values. A rejected row blocks the entire workbook.

| Column | Contract |
| --- | --- |
| Kayıt referansı | Optional store-wide stable opaque identifier. Reuse requires identical financial fields; changes use a reasoned correction. |
| Gider tarihi | Required business date; controls incurred-period reporting. |
| Ödeme tarihi | Optional business date; controls payment-dated gross movements separately. |
| Kategori | Required category, at most 80 characters. Labour is a monthly aggregate, never an individual employee record. |
| Sınıflandırma | Faaliyet gideri, İşçilik, Stok kaybı, Varlık alımı, Vergiler, Finansman / kredi, İşletme sahibinin katkısı, İşletme sahibinin çekişi, Transfer, Sınıflandırılmamış. |
| Net tutar / KDV tutarı / Brüt tutar | Nonnegative exact decimals; net plus KDV must equal gross without hidden rounding. |
| KDV işlemi | İndirilebilir, İndirilemez or Bilinmiyor. Unknown remains explicit. |
| KDV kanıtı | Required opaque evidence for known tax treatment. No jurisdictional tax rule is inferred. |
| Destek referansı | Optional opaque supporting identifier. |
| İşçilik dönemi | Required YYYY-MM for labour, matching incurred date; empty for other classes. |
| Kayıp kanıtı / Kayıp işlemi | Required for stock loss; opaque evidence and Ayrı gider or Maliyete dahil. Empty for other classes. |

The equivalent internal classification/tax/loss enum strings are accepted for synthetic fixtures. Turkish text decimal `1.234,567` means `1234.567`; text `1.234` means `1234`. A numeric OOXML decimal lexeme `1.234` means `1.234`. Scientific numeric lexemes are normalized only within the 40 integer/30 fraction digit limit. Negative amounts require correcting/reversing the original record, not importing a signed cash entry.

Dates accept ISO `YYYY-MM-DD`, Turkish `DD.MM.YYYY`, and whole Excel day serials under the workbook's 1900/1904 date system. Serial 60 under 1900 is rejected because Excel's fictional leap day is not a business date. Time fractions, impossible calendar dates and locale-ambiguous dates are rejected. All conversions use UTC calendar arithmetic.

Limits are 4 MiB compressed, 16 MiB expanded, 64 archive entries, 5,000 expense rows, fourteen columns and bounded XML depth/nodes/cell text. Central-directory metadata is preflighted before streaming inflation; actual output and archive completion are checked. XML parser warnings, declarations/entities and ambiguous duplicate relationships or cell values fail closed.

## Confirmation, identity and history

Preview writes no financial revisions. The service retains one parsed preview in memory and returns an opaque token. Confirm accepts only that token and explicit selections for every suggested duplicate; financial rows are never trusted back from the renderer. Cancelling or restarting requires a new preview. Exact workbook bytes determine the batch identity, recorded uniquely in schema version 5's immutable batch ledger. Identical reimport is idempotent across restart. Rows without a supplied reference use batch hash plus row identity. Duplicate lookup uses a date/amount index and retains at most one representative identity per preview row, bounding preview output even for 5,000 matching rows. Same date/amount only suggests a duplicate; an owner can explicitly retain legitimate repeated rows. A changed existing reference requires correction, never silent replacement.

All revision inserts and the batch ledger entry commit in one transaction. Failed writes leave no partial history or ledger. Intervening app revisions invalidate an uncommitted preview. A successful import does not confirm completeness.

Corrections append the same entity with a mandatory reason and prior-revision link. Original batch/row origin and stable reference remain unchanged. Void and restoration also append versions, with optimistic revision checks. Existing pre-Phase-7 expense shapes remain readable and immutable but cannot count as supported operating evidence.

The owner separately reviews and confirms each incurred period. The confirmation records the latest relevant expense revision, not an automatically assumed zero. Explicit revocation is supported. Relevant revisions are derived from full history, including both periods when a correction moves an expense. A stale review is rejected atomically. Unrelated periods do not invalidate confirmation. The report's history query is bounded by the report pin, so later corrections do not leak into old results.

## Operating result

The service computes all arithmetic with the existing 100-digit `Exact` decimal configuration. Presentation rounds through existing Turkish TRY formatters. The literal synthetic oracle is eligible gross 200 minus expense 50 equals estimated operating result 150. An owner contribution of 500 is excluded and leaves 150 unchanged.

Eligibility requires full period source coverage, reconciled sales, supported gross mapping, no excluded cost lines, resolved expense treatment/classification and a current explicit completeness confirmation. A rounded cost percentage of 100 is insufficient. Missing confirmation yields exactly `Faaliyet kârı hesaplanamıyor — gider verileri eksik.` Other unresolved prerequisites also withhold the value. Supported output is labelled `Tahmini yönetim faaliyet kârı`, never statutory net profit. The estimate edition's separate `Tahmini net kâr` waives only the source prerequisites (full source coverage, reconciled sales, supported gross mapping, no excluded cost lines). It subtracts expenses under the classification and KDV-treatment rules below: excluded classifications stay out, and unknown treatment or nonzero unclassified values withhold the figure. See [calculations](calculations.md#separate-recorded-source-estimates).

Operating expense and aggregate labour subtract net when evidenced recoverable, gross when evidenced non-recoverable. Unknown treatment blocks. Separately evidenced stock loss subtracts once; loss already included in cost does not subtract again. Repeated loss evidence blocks review. Asset purchases, taxes, financing/loans, owner contribution/withdrawal and transfers remain visible exclusions. Nonzero unclassified values block the headline. Incurred totals and payment-dated gross movement totals include visible classifications and are not claims about net operating cost or signed cash flow.

Sales, purchasing and operating use the same retained dataset/app-revision context. Operating includes calculation versions, gross components and pinned expense records. A later expense edit marks the report stale while retaining its original values until reopening. Accepted reports retain their original output and pin. Source-linked adjustment fingerprints continue flagging changed/missing targets; expense corrections do not masquerade as source adjustments.

## Executable evidence

- `tests/unit/operating-profit.test.ts` covers G05/G06, independent literal arithmetic, classifications, KDV basis, labour, loss treatment, legacy evidence and revoked confirmation.
- `tests/unit/expense-validation.test.ts` covers exact decimal/date handling, canonical workbook roundtrip, formulas, payroll headers and malformed workbooks.
- `tests/unit/expense-workbook-boundary.test.ts` independently covers malformed cell values, relationships and archive boundaries.
- `tests/integration/expense-import.test.ts` covers preview, atomic confirmation, duplicates, stable references, safe row errors and stale previews.
- `tests/integration/adjustment-history.test.ts` covers reasoned history, old/new periods, reversal/restore, rollback/restart, v4 migration, pinned/accepted results and every named IPC boundary.
- Existing `tests/integration/import-activation.test.ts`, “A/B overlap preserves concurrent app writes, exact report pins and original adjustment targets,” covers changed and deleted source targets. Existing source adjustment semantics remain unchanged.
- `tests/desktop/expenses.test.ts` exercises the packaged local UI, template save, native picker stubs, empty/cancel/rejected/duplicate states, history, owner confirmation and pinned operating reopening.

Windows packaging, real native dialogs, Windows lifecycle and scaling checks remain unperformed here. Follow the [Windows handoff](../operations/windows-phase-7-handoff.md) on the same branch. No real expense spreadsheet or owner completeness attestation was supplied; synthetic tests do not satisfy source-dependent acceptance.

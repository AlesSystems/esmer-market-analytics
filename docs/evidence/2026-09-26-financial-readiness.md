# Bounded real financial reporting investigation

Date: 2026-09-26. PR #30, DATA-01 / #26 R1. Repository baseline `72996bc`, branch `codex/issue-14-live-sync`. Investigation environment: macOS, Python 3 Decimal, Docker/OrbStack, restored SQL Edge `15.0.2000.1574`. No application mapping or calculation changed in this investigation.

**Real financial reporting is not complete.** The authorized read-only investigation reproduced specific financial evidence gaps. A subset of arithmetically matching records is not yet a validated population of completed economic sales. Raw record charts and better report readiness remain independently deliverable.

## Source safety and private evidence

The user explicitly authorized renewed inspection of the existing isolated restored backup. Earlier disposable copies had been removed. A new task-owned cold copy was made with the original data volume mounted read-only. Only the copy was started, on an internal Docker network with no published ports. The original container was stopped before and after the investigation.

Queries used an existing administrative identity from protected configuration on the disposable copy. Only projected SELECTs and catalog-definition reads were issued. No stored procedure was executed, and no SQL DDL, DML, permission, database-setting or source-configuration change was made. This is an investigative read, **not a new restricted-extractor acceptance proof**. The query client was sqlcmd from the existing tools image. Startup naturally writes the disposable copy's own files. The original data volume was never mounted writable by a task-created container.

Private batch `ee8c5b67-e8cb-40cf-a39f-3bf20c9c64eb` retains the query text, projected records, source definitions, Decimal checks and receipts outside Git. Files are mode 0600 in a mode-0700 batch directory. No customer, personnel, payment identity, supplier display or product display values were selected. Source definitions were inspected as evidence only; none was copied into application code. Real amounts and source IDs remain private.

Final private receipt SHA-256: `77260e310f952c80afc5baa1fde5681af6fe694d5ef9c903ba334dd1c2d2891b`. It binds query/check hashes and cleanup results. The disposable container, volume and network were removed; its anonymous volumes were removed with the container. The temporary credential file was deleted. No full before/after original-file hash comparison was performed in this run; the preservation evidence is the read-only mount and stopped-state checks.

## Bounded population and observations

Window: source-recorded `FIS_TARIHI` from 2025-10-01 inclusive through 2025-10-12 inclusive. The date is historical and partial. This does not establish market-local coverage or completeness.

| Type | Headers | Lines | Observed meaning / boundary |
| --- | ---: | ---: | --- |
| 11 | 5,204 | 17,222 | Retail receipt dictionary entry; three headers have no current lines |
| 12 | 8 | 10 | Retail return dictionary entry; line role is 2 |
| 35 | 2 | 10 | Retail invoice dictionary entry; economic independence from receipts remains unresolved |
| 4 | 1 | 5 | Customer-return invoice |
| 8 | 1 | 5 | Customer-return dispatch; invoiced flag is 1 and counterparty-impact flag is 0 |
| **Selected projection** | **5,216** | **17,252** | Not a completed-sale count |

All selected headers have `DURUM=1` and `AKTIF=1`. All selected type-11/12/35 POS closing timestamps are null. These observations do not independently define completion. The three empty type-11 headers retain nonzero recorded gross totals.

The source dictionary classifies the five types under sales reporting (`TIP=2`), with the return flag on types 4, 8 and 12. The existing monthly source-report definition filters `FATRALANDIRILMIS_IRSALIYEMI=0` and `FIS_CARIYI_ETKILERMI=1`, then signs returns using the dictionary. All selected types except type 8 satisfy the observed counterparty-impact flag. Source report code supports an inclusion hypothesis; it is not independent evidence of every event's business identity.

Selected lines have role 0 except type-12 lines, which have role 2. POS source views distinguish role 0 sales, role 1 complimentary items and role 2 returns. The existing raw preview does not project this role field. There are 314 retail lines labelled `Kg`, 16,901 labelled `Adet` and seven labelled `P`. The meaning of `P` was not inferred. All selected line timestamps equal their header timestamps, but this does not verify timezone or business-calendar semantics.

## Reconciliation and identity findings

| Check | Actual result | Consequence |
| --- | --- | --- |
| Fresh SQL COUNT/SUM versus independent Python Decimal, precision 100 | 30 checks pass across the five types: counts plus header gross/KDV and line base/KDV sums | Proves exact extraction of those fields, not financial meaning |
| Type-11 sum(line base + KDV) versus header gross | 5,081 exact matches; 123 differences, including the three empty headers; 14 differences exceed 0.01 TRY | A complete financial total cannot silently pick header or line figures |
| Type-11 header rounding field | Zero on every selected header | That field does not explain the observed gross differences |
| Type-11 header KDV versus summed line KDV | 3,990 exact matches; all differences are at most 0.000001 TRY | Precision differences exist. No tolerance was approved by this check |
| Type-12 and type-35 gross reconciliation | All selected headers exactly match line base plus KDV | Arithmetic agreement does not prove event identity/completion |
| Type-4 gross reconciliation | Nonzero difference at most 0.000001 TRY | Preserve exact evidence; do not silently round it away |
| Selected amount/discount evidence | Every line's `TUTAR × (1 − ISKONTO_HESAP/100)` equals recorded tax base; discount rates and header rounding are zero in this window | Supports this recorded amount relationship only; does not validate nonzero discount or rounding rules |
| Selected exchange rates | All equal one | No foreign-currency conversion is needed for this bounded selected projection |
| Conversion evidence | Five type-4/type-8 line links in the window; no type-11/type-35 links in the inspected conversion table | Supports investigating the return pair; does not prove that every retail invoice is independent |
| Type-11/type-35 identity probe | Two same-day/equal-gross candidate pairs; neither has identical timestamps or product/quantity/base/KDV line signatures | Neither duplicate nor independent classification is established |

The source net-amount function uses original line amount, discount rate, exchange rate, recorded tax rate and allocated header rounding. Its definition is a useful hypothesis, not a justification for assigning synthetic unit prices or a zero discount to arbitrary real records. The existing synthetic calculator's formula and reconciliation rule cannot be enabled merely by changing provenance.

## Practical remaining evidence

1. Establish the economic relationship of the two selected type-35 invoices to the type-11 receipt population using a source relationship or independently reviewed reduced document examples. Amount/time similarity and missing conversion links are insufficient. Excluding invoices alone would not prove the retained receipts are a completed, nonduplicated population.
2. Establish what `DURUM`/`AKTIF` mean for completed receipts and how to treat the three nonzero-gross headers without lines. The uniformly null POS closing field does not provide that proof.
3. Explain the 123 gross differences, especially the 14 above 0.01 TRY, using source calculation/persistence semantics or independently checked reduced examples. Select and version a rounding/reconciliation policy only after that evidence. The tested threshold is diagnostic, not an accepted tolerance.
4. Resolve the seven `P` unit lines or explicitly exclude their affected documents with monetary exposure and count coverage. Do not relabel them pieces. Validate business-date semantics rather than inheriting the developer timezone.
5. Verify the observed type-4/type-8 links and recognition flags for the actual return event before choosing one financial representation. Original-sale historical cost attribution remains separate and unavailable.

A future versioned real sales mapping can reuse the existing staged dataset activation, pinned report revisions and Excel exporter after these rules are supported. Costs, purchasing settlement and operating profit remain separate unresolved prerequisites. No real package was relabelled synthetic, no financial gate was weakened, and no candidate report was accepted from this investigation.

## Reproduction and limitations

Private query identities are `schema.sql`, `population.sql`, `definitions.sql`, `semantics.sql`, `rules.sql`, `financial-projection.sql` and `identity-oracle.sql`. They use fixed projections and the declared date window. `check.py` produces aggregate reconciliation counts; `verify-oracle.py` independently compares ten SQL type/stream groups with Python Decimal and asserts unique projected IDs. Rerun the latter against the retained private artifacts without source access. The private receipt binds their hashes.

An initial stdin-driven sqlcmd attempt repeated its final result set. The final extraction used a mounted SQL input file and returned exactly 5,216 unique headers and 17,252 unique lines with zero repeated rows. An attempted long `-Q` argument failed with a syntax error and contributed no evidence. The first aggregate query used a locally scoped `COUNT_BIG(*)` inside a JSON subquery; changing it to the explicit outer record ID fixed the count oracle. Final 30-check results use the corrected query. These were investigation harness defects, not application financial failures.

Focused existing verification: `npm run test:integration -- tests/integration/sales-package.test.ts tests/integration/sales-reconciliation.test.ts tests/integration/report-revisions.test.ts tests/integration/excel-report.test.ts` passed 4 files / 24 tests. These remain synthetic application contracts. No Windows acceptance, full-history capacity, restricted production read, owner expense confirmation or real financial-report acceptance is claimed.

Related: [page audit](2026-09-26-page-audit.md), [source contract](../contracts/source.md), [earlier isolated validation](issue-26-source-validation.md), [raw preview](real-sql-preview.md), [foundation](../superpowers/specs/2026-09-04-esmer-market-rebuild-design.md).

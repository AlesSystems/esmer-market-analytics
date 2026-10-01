# R39 bounded value design

Design only, 2026-10-01. Root owns query review, execution, and the DAG. No SQL was executed and no source or container was opened for this design. The current branch contains coordinator work, which remains untouched.

The approved catalog has 233 columns. Its SHA-256 is `36fa412f30fa778fecc3f15499fe4eafad2ae08c168c47ca6182998c99f54d9a`. The supplied receipt reports 118 ms, matching GUID, READ_ONLY before/after, and stopped-copy/client/credential cleanup. This design checked the catalog file hash and column metadata only. It does not independently attest those execution results.

Read alongside [P01](../../docs/contracts/monthly-product-profit.md), [source scope](../../docs/evidence/issue-39-renewed-scope.md), and [privacy](../../docs/contracts/privacy.md). The prior task-local `work/poteto/issue-39/second-pass-design.md` in the source-evidence worktree supplies older candidate observations. Current metadata confirms the fields below, including exact cost endpoints. Names establish projection eligibility only, not financial meaning.

## Freeze the sample and execution envelope

Reuse retained September rows to select IDs privately where their pinned provenance is verified. Do not re-extract those same fields merely to select a sample. Select up to 20 earliest headers by exact bigint ID for each raw type 11, 12, and 35, within `2025-09-01 <= FIS_TARIHI < 2025-10-01`. Permit substitution within each 20-header quota to include a fractional quantity, nonzero discount, null/zero cost, or different `(DURUM, AKTIF)` combination. Record every substitution and reason. These are raw strata, not completed-sale classes. If no such case exists in retained data, record it absent from the sample; do not seek another month automatically.

Freeze at most 60 distinct header IDs before execution. Fetch every current line of those headers, up to 1,000 lines. Select no product attributes. Unit coverage may need a second reviewed sample if the resulting IDs contain only one dictionary unit. Do not infer kg from fractional quantities or piece from integer quantities.

Bind parameterized bigint IDs using the existing restricted query runner. Each draft below uses `@h01` through `@h60`, with unused parameters null. Relationship queries reuse a `selectedLines` CTE limited to those same 60 header parameters. They select rows touching any sample line, without additional line parameters. Do not accept renderer-supplied SQL or identifiers. Root must materialize the fixed SQL, explicit projections, safe type conversions, and hashes before value execution. The query templates are review drafts, not executable scripts as written.

Reuse the approved M0/M2 live identity/read-only checks, expected GUID, 15-second request timeout, 60-second pass deadline, cancellation/connection cleanup, and private atomic output. Each phase fails on excess or missing essential relationships before publication. Retain exact IDs and decimal strings, source datetime strings, nulls, and actual currency codes. Public evidence uses synthetic examples and reviewed aggregate receipts only.

## Exact value projections

| Query | Fields and ceiling | Required checks |
| --- | --- | --- |
| V-H | `FIS.ID,FIS_TURU,FIS_TARIHI,DOVIZ_AD,DURUM,AKTIF,SATIR_TOPLAM,SATIR_ISKONTO_TOPLAM,FIS_ISKONTO_TOPLAM,YUVARLAMA,KDV_TOPLAM,OTV_TOPLAM,TEFKIFAT_TOPLAM,GENELTOPLAM`; 60 headers | Every requested ID resolves once and remains inside the September window. Preserve zero-line headers. |
| V-L | `FIS_DETAY.ID,FIS,STOK,FIS_TURU,FIS_TARIHI,STOK_BIRIM,CARPAN,MIKTAR_FIS,MIKTAR_GIRIS,MIKTAR_CIKIS,FIYAT,DAHIL_FIYAT,TUTAR,DAHIL_TUTAR,TOPLAM_SATIR_ISKONTOSU,TOPLAM_FIS_ISKONTOSU,TOPLAM_KDV_MATRAHI,TOPLAM_KDV,TOPLAM_OTV,TOPLAM_TEVKIF,BELGE_TARIHINDEKI_SON_ALIS_FIYATI,FATRALANDIRILMIS_IRSALIYEMI`; 1,000 lines | Unique line IDs, one selected parent, matching raw type, exact product reference existence via `STOK.ID` only. Do not inner-join away broken rows. |
| V-U | `STOK_BIRIM.ID,AD,CARPAN,NOKTALI`; at most 16 exact unit IDs used by V-L | Minimal dictionary label review is required before this read. `AD` is catalogued `nvarchar(50)`, not proven unit meaning. Export privately only a trimmed 1–16-character label from a reviewer-fixed set such as `ADET`, `AD`, `KG`, `KİLO`, `KILO`, `KİLOGRAM`, `KILOGRAM`, matched without broad free-text export. Unknown labels fail closed with the ID and `unsupported-label`, never the text. A label supports a source dictionary classification, not cost-unit equivalence. |
| V-B | `FIS_DETAY_BELGE_DETAY.ID,FIS,FIS_DETAY,BELGEID,BELGE_DETAY,MIKTAR_FIS`; combined relationship ceiling below | Preserve both endpoint roles as raw candidates. No `SATIR`, free text, or extra quantities. |
| V-C | `FIS_DETAY_MALIYET.ID,STOK,FIS_DETAY_GIRIS,FIS_DETAY_CIKIS,MIKTAR_GIRIS,MIKTAR_CIKIS,MIKTAR,MIKTAR_KALAN`; combined relationship ceiling below | Do not select `MASRAF_STOK`. Incoming/outgoing names are endpoint hypotheses, not accepted chronology or cost policy. |

V-H and V-L remain raw, even where column names resemble net or cost. Header spelling `TEFKIFAT_TOPLAM` and line spelling `TOPLAM_TEVKIF` are intentional. V-U dictionary labels are the sole proposed short-text exception and stay private. Product/customer/employee/supplier names, identifiers for those parties, descriptions, POS receipt keys, archive/cancellation values, and change SQL remain excluded.

## Fixed query shapes and relationship closure

Use these WHERE clauses with the explicit projections above. For V-B/V-C, `selectedLines` selects `FIS_DETAY.ID` for `FIS_DETAY.FIS IN (@h01,...,@h60)` only. Expand the fixed parameter slots before hashing. Sentinel TOP limits detect excess and reject the entire phase; they never authorize truncation.

```sql
-- V-H selection, with the V-H explicit SELECT list.
FROM dbo.FIS AS f
WHERE f.ID IN (@h01, /* fixed remaining slots */ @h60)
 AND f.FIS_TARIHI >= CONVERT(datetime,'20250901',112)
 AND f.FIS_TARIHI < CONVERT(datetime,'20251001',112)
ORDER BY f.ID;
-- V-L uses SELECT TOP (1001) and the V-L explicit SELECT list.
FROM dbo.FIS_DETAY AS l
WHERE l.FIS IN (@h01, /* fixed remaining slots */ @h60)
ORDER BY l.ID;
-- V-B uses SELECT TOP (2001) and the V-B explicit SELECT list.
FROM dbo.FIS_DETAY_BELGE_DETAY AS b
WHERE EXISTS (SELECT 1 FROM selectedLines AS l
 WHERE l.ID=b.FIS_DETAY OR l.ID=b.BELGE_DETAY)
ORDER BY b.ID;
-- V-C uses SELECT TOP (2001) and the V-C explicit SELECT list.
FROM dbo.FIS_DETAY_MALIYET AS c
WHERE EXISTS (SELECT 1 FROM selectedLines AS l
 WHERE l.ID=c.FIS_DETAY_GIRIS OR l.ID=c.FIS_DETAY_CIKIS)
ORDER BY c.ID;
```

The two-hop closure allows at most 2,000 combined distinct V-B/V-C rows, 200 outside-month headers, 1,000 outside-month lines, 500 distinct products, and 2 MiB dependency output for the whole pass. The sample output has its separate 2 MiB ceiling. Query by exact referenced IDs only. No `WHERE STOK IN (...)` history scan, nearest purchase search, or amount/date similarity match is permitted.

Validate V-B candidate joins as `b.FIS=l1.FIS` with `b.FIS_DETAY=l1.ID`, and `b.BELGEID=l2.FIS` with `b.BELGE_DETAY=l2.ID`. Validate V-C endpoints as `c.FIS_DETAY_GIRIS=l1.ID`, `c.FIS_DETAY_CIKIS=l2.ID`, with `c.STOK=l1.STOK=l2.STOK`. A missing, multiplied, mismatched, or cyclic endpoint records an unsupported relationship, never an invented repair. Do not use a joined flat stream that multiplies line quantities or amounts.

Fetch referenced endpoint lines by exact ID and their headers by exact `FIS`. Project the same V-H/V-L fields. Raw dependency timestamps must lie within `2005-01-20` inclusive through `2025-10-13` exclusive, derived from the [previous raw bounds](../../docs/contracts/source.md#observed-isolated-copy-on-2026-09-25). These are not proof of current cutoff. Out-of-bound dependencies invalidate the affected hypothesis. They never contribute to September totals.

For an exact candidate original-sale line reached by an observed relationship, query the same V-B/V-C endpoints once more by that line ID to detect other linked returns within the fixed cutoff. Record observed cumulative quantities without asserting completeness of return capture. Stop after two hops. A return with no direct evidenced original-sale relation stays unattributed. V-C may describe inventory allocation rather than a customer-return link; V-B may describe only invoice/dispatch conversion. Neither becomes an original-sale mapping from its name.

## Falsifiable checks and permitted conclusions

| Hypothesis | Literal independent check | Failure or surviving limitation |
| --- | --- | --- |
| A source unit label denotes piece or kg | Match fixed dictionary labels to exact line unit IDs. Compare `MIKTAR_FIS`, `CARPAN`, and dictionary `CARPAN` using Decimal, including fractional cases. | Unknown labels or inconsistent multipliers remain unsupported. Even matching arithmetic cannot prove till behavior or the cost unit. |
| Raw types 11/12/35 have distinguishable completion flags | Group selected exact `(FIS_TURU,DURUM,AKTIF)` and parent/line dates. Preserve counterexamples. | All active flags cannot establish completion or void handling. No archive/POS cancellation query is in this slice. |
| Recorded amounts reconcile under a candidate discount order | Compute separately `MIKTAR_FIS*FIYAT`, `TUTAR-TOPLAM_SATIR_ISKONTOSU-TOPLAM_FIS_ISKONTOSU`, and recorded matrah. Compare line matrah+KDV+OTV−tevkif to recorded header gross and `YUVARLAMA`. Evaluate a formula only if its own operands exist. | Never coalesce null operands, invent signs, assign a tolerance, or claim legal tax basis. Exact equality proves that hypothesis on those rows only. |
| A cost row connects a purchase-side line to a sale-side line | Validate endpoint cardinality/product/unit/currency, compare raw types and dates, and independently recompute proposed quantities. | Reverse chronology, currency/unit mismatch, overallocated quantity, or missing endpoint falsifies use. A surviving relation does not prove snapshot tax basis, method completeness, or that it should override historical cost. |
| A return relates to an exact original sale | Require a direct observed endpoint path, matching product/unit/currency, earlier original date, and cumulative quantity not exceeding the original magnitude. | Similar values or same product are insufficient. A surviving relation remains a candidate until native documented endpoint rules or independent business evidence establish its role. |
| Type-11/type-35 conversion is represented by V-B | Identify direct endpoint type pairs and quantities without treating them as two independent sales. | Absence of links does not prove independence. Partial/conflicting links remain exclusions. |

Compute every expectation with Python Decimal independently of application calculators. Retain input IDs, exact operands, hypothesis version, expected/actual strings, and exceptions privately. No enabled financial population follows from these checks alone.

Source-native vendor rules could provide stronger independent evidence than correlation if their exact object, provenance, operative call path, and bounded definition projection are separately reviewed. This value scope excludes module definitions, triggers, views, stored procedures, and execution of native routines. Do not silently widen it to obtain such evidence. With only the approved table values, completion meaning, market-local timestamp interpretation, discount policy, cost KDV/unit basis, genuine zero, and undocumented original-sale identity may remain unsettled. Record that outcome precisely rather than enabling P03 by default.

## Design verification

The approved catalog hash and every newly proposed field were checked locally against metadata. Local links/anchors and whitespace must pass before handoff. SQL execution, query timings, reader permissions, actual dictionary labels, endpoint values, native rules, source semantics, and Windows remain unverified by this design.

## Current execution boundary

Full user authorization covers necessary bounded isolated setup; no routine permission question remains. The fixed first-pass artifacts received independent pre-execution review. The first value attempt failed its effective-permission audit before business values. Subsequent metadata diagnostics matched nine unresolved system-grant tuples to the pinned engine baseline. The final value retry is being prepared; successful value collection, analysis, and financial-rule proof are not yet claimed. [Value review](r39-value-review.md), [failed attempt](r39-value-attempt-1.json), and [permission diagnosis](r39-permission-diagnosis.md) retain that sequence.

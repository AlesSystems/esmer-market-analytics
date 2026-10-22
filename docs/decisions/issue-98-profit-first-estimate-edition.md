# Profit-first estimate edition (v1 re-baseline)

Date: 2026-10-22. Approved by the project owner.

Implements [issue #98](https://github.com/AlesSystems/esmer-market-analytics/issues/98) under [plan #111](https://github.com/AlesSystems/esmer-market-analytics/issues/111). Product names ([#99](https://github.com/AlesSystems/esmer-market-analytics/issues/99)) were approved the same day.

## Context

The owner cannot see per-product margin or monthly profit. The validated financial path accepts only synthetic mappings, so the recorded-source estimate is the only path that shows real data. Primary screens carry per-number caveats and *katkı* wording that the owner does not read as profit. Seven source-evidence items needed for verified real-source profit cannot be obtained.

## Decisions

1. **The estimate is v1 financial truth.** The `source-estimate-v1` estimate (cost = `BELGE_TARIHINDEKI_SON_ALIS_FIYATI`, last purchase price on the document date) is what v1 shows as profit. Quality stays `unverified-estimate` internally and the estimated nature is disclosed once per page; it is never presented as verified or "Güvenilir". Missing, zero and negative cost stay excluded. A02/A03 "trusted"/verified real-source profit, L01 live sync and evidence-gated operating profit move to post-v1. The validated synthetic financial pipeline stays as-is and is not extended for v1.
2. **Plain wording.** Primary screens say *Satış*, *Tahmini brüt kâr* and *Marj*. *katkı*, *aday*, *kapsanan* and source codes (for example `FIS_TURU` or column names) leave primary screens; they may remain in Rapor method details, exports and internal identifiers.
   - Satış = candidate sale amount (recorded `TOPLAM_KDV_MATRAHI` basis, unchanged).
   - Tahmini brüt kâr = covered sale contribution (covered sale amount − candidate cost, unchanged formula).
   - Marj = Tahmini brüt kâr ÷ covered sale amount, same population; null when covered sale amount ≤ 0 or there are no covered lines. Display may round to two decimals and never feeds amounts.
   - Internal identifiers such as `contribution` may stay English.
3. **One trust chip per page** replaces per-number caveats, for example "Tahmini kâr · maliyeti bilinen satış %98,3" (the existing cost-coverage percentage). It opens a short explanation: estimate basis, excluded costs, returns not netted out of kâr, unknown amounts. Detailed exclusion reasons and counts move to Rapor. This supersedes the 2026-10-13 `Doğrulanmamış tahmin` badge and the "beside the affected number" rule. Rendering rules stay: null or unknown is never drawn or shown as zero, unknowns are gaps or hatched, valid zero and losses stay distinct, and every chart has a numeric table alternative.
4. **Tahmini net kâr** = Tahmini brüt kâr − total of the expenses the owner entered and marked complete for that month (existing expense-completeness review), counted under the existing expense classification and KDV-treatment rules. Asset purchases, taxes, financing, owner funds and transfers stay out; unknown treatment or unclassified values withhold the figure. If the month's expenses are not marked complete, no net figure is shown and the existing message `Faaliyet kârı hesaplanamıyor — gider verileri eksik.` stays; exact copy for that state is a #106 detail. It inherits the estimate's limits (returns' cost excluded, uncovered sales excluded). It is not the validated operating result and needs no source-evidence gate.
5. **Freeze the visual world.** Keep the current market-ledger look (green rail, paper, Manrope; see DESIGN.md "Owner workspace revision (2026-10-19)"). No new visual systems until v1 ships.
6. **Gates.** A06 for v1 = encrypted backup file plus documented restore. A07 for v1 = one Windows smoke test, deferred to #109. The 2 s full-dataset benchmark is dropped unless prepared packages exceed 100,000 rows. The A02/A03 "trusted"/verified real-source parts and L01 move out of v1. Original checklist items are preserved as post-v1 requirements; nothing is ticked as passed.

## Preserved rules

- Missing, zero or negative cost is never treated as zero.
- Arithmetic stays deterministic decimal in the service layer (decimal precision 200 for this estimate version). The renderer does no financial arithmetic.
- Estimates are labelled as estimates once per page.
- Source access stays read-only.
- No customer or employee-level data.
- Accepted reports stay reproducible.

## What this changes

- [Recorded-source estimates](../contracts/recorded-estimates.md)
- [Page control desks](../contracts/page-control-desks.md)
- [Calculations](../contracts/calculations.md)
- [Privacy](../contracts/privacy.md)
- [Product record](../../PRODUCT.md)
- [Acceptance checklist](../superpowers/specs/2026-09-04-esmer-market-rebuild-acceptance.md)
- [Expense completeness](../contracts/expense-completeness.md) and [monthly product profit](../contracts/monthly-product-profit.md) (pointers only)
- [Evidence index](../evidence/index.md), [README](../../README.md), [domain glossary](../../CONTEXT.md) and the [Turkish known limitations](../operations/known-limitations-tr.md)

Foundation D18 (two-second target) and the D09 clean-machine recovery proof are deferred past v1 for this edition. The [foundation specification](../superpowers/specs/2026-09-04-esmer-market-rebuild-design.md) text is unchanged.

## Not changed

- No application code changes in this decision.
- The validated synthetic financial pipeline and accepted reports keep their contracts.
- Source access stays read-only.
- Production access and installation on the owner's computer still need separate authorization.
- Windows testing is deferred to #109.

## Unblocks

#101, #102, #106.

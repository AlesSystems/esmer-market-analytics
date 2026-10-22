# Esmer Market analytics

Terms used when discussing the owner's local reports and their evidence. These definitions describe business meaning, not implementation.

## Language

**Satış:** v1's sale amount on the recorded `TOPLAM_KDV_MATRAHI` basis. It is not verified revenue or KDV-exclusive net sales.
_Avoid_: Kapsanan satış adayı, verified revenue

**Tahmini brüt kâr:** v1's estimated gross profit: covered sale amount minus estimated cost at the last purchase price on the document date. Lines with missing, zero or negative cost are excluded, never counted as zero.
_Avoid_: Katkı, verified profit

**Marj:** Tahmini brüt kâr divided by the covered sale amount of the same population. Unavailable when that amount is zero or less, or no covered lines exist.
_Avoid_: Margin over all sales

**Tahmini net kâr:** Tahmini brüt kâr minus the expenses the owner entered and marked complete for the month, under the expense classification rules (asset purchases, taxes, financing, owner funds and transfers stay out). Not shown when expenses are not marked complete. It is not the validated operating result.
_Avoid_: Faaliyet kârı, verified net profit

**Trust chip:** The single per-page disclosure that figures are estimates, for example "Tahmini kâr · maliyeti bilinen satış %98,3". It opens a short explanation; detailed exclusion reasons live in Rapor.
_Avoid_: Per-number caveats

**Data cutoff (veri sonu):** The latest source business time represented by an imported dataset. It is different from the time the package was prepared or imported.
_Avoid_: Live time, current data, last import time

**Report period (dönem):** The business-date interval whose activity a report describes. Its actual covered boundaries may be shorter than a calendar month.
_Avoid_: Import period

**Covered population (kapsanan kapsam):** The records and monetary contribution for which a metric's required evidence is available. Excluded or unresolved records are outside that metric, not zero-value contributions.
_Avoid_: All sales, complete month when only some records are supported

**Historical cost estimate (tarihsel maliyet tahmini):** The supported last-purchase-based estimate attached to historical sold or returned quantities. It is distinct from present replacement cost and exact inventory valuation.
_Avoid_: Exact cost, inventory value

**Replacement cost (ikame maliyeti):** An estimate using the latest validated purchase cost available by the dataset cutoff. It does not revise historical cost.
_Avoid_: Historical cost, inflation-adjusted cost

**Expense completeness (gider tamlığı):** An owner-reviewed statement about whether expense evidence for a period has been supplied. Import success or an empty record list does not establish completeness.
_Avoid_: Import complete

**Report version (rapor sürümü):** A reproducible view of a period's calculations, data and app-owned revisions. An accepted version remains recoverable when newer data or methods produce another candidate.
_Avoid_: Latest data, mutable report

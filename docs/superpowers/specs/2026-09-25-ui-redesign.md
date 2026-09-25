# Esmer Market UI redesign — design specification

Status: Design direction confirmed by the user on 2026-09-25. Documentation only; implementation and Windows acceptance are separate work.

This document covers every current user-facing workspace in the first-release desktop app. It supersedes the **visual styling and information density** selected in the [Phase 5 sales UI brief](2026-09-18-phase-5-sales-ui-design.md) and preserved by later phase design notes. It keeps their approved workflows, metric meanings, evidence obligations and safety states. The [foundation specification](2026-09-04-esmer-market-rebuild-design.md), [source audit](2026-09-04-esmer-market-rebuild-audit.md) and [acceptance checklist](2026-09-04-esmer-market-rebuild-acceptance.md) still govern product truth. If this design conflicts with a financial or data requirement, the foundation wins and the conflict must be resolved visibly before implementation.

## 1. Decision and job

Eralp opens the app on a Windows computer to learn **this month's net sales and how they changed from the previous month**, then follows an unusual figure to its supporting records. The UI is an **Operate** surface: fast to scan, calm enough for repeated use, and explicit about uncertainty. The first view shows key figures; method, population and provenance open on demand.

Confirmed direction: a **sharp, high-contrast financial statement**. Deep navy anchors navigation and headings; white carries the figures; electric blue identifies the active path and primary action. Crisp ledger rows replace long stacks of explanatory cards. This is a replacement visual world, not an extension of the pale blue shell. It must work on the monthly overview, detailed tables, review flows, empty states and recovery pages as one system.

Design goals:

1. Put the primary answer above the fold at a normal desktop window: month, net sales, month-over-month change and a short evidence status.
2. Let the owner read a page in three layers: **answer → supporting breakdown → source and method**.
3. Remove repeated prose from default views while keeping material caveats adjacent to the affected figure.
4. Make the selected period, actual data cutoff, synthetic-data warning when applicable, and incomplete/unavailable states unmistakable.
5. Keep every existing action and report context available without making import and recovery controls compete with daily analysis.

The redesign changes presentation, navigation grouping and Turkish microcopy. It does not change calculations, confidence rules, source access, report-version semantics or expense completeness requirements. No live-data claim, tax conclusion or verified-profit claim may be introduced.

The present [monthly capture](../../evidence/windows-phase-8-monthly.png) shows several status bands and method lines before the first amount. The [expense preview](../../evidence/windows-phase-7-native-preview.png) puts import, period review and completeness work into one long scroll. The [recovery capture](../../evidence/phase-9/phase-9-recovery-1120.png) shows operational instructions competing with the active task. These are evidence of the density problem; their pale styling is not the new design baseline.

## 2. Shared visual and interaction system

### Visual roles

| Role | Proposed treatment | Use |
| --- | --- | --- |
| Shell | Deep navy `#0B1830` with white labels | Persistent app header and primary navigation; makes the product feel grounded rather than washed out. |
| Content | White `#FFFFFF` on restrained cool gray `#F3F5F8` | Figures and tables remain legible; the canvas is subordinate to the navy shell. |
| Primary action | Electric blue `#0057D9`, with a darker hover/focus treatment | Active navigation, links, selected filters, primary confirmation. Blue never denotes financial gain. |
| Main text | Ink `#10213A`; secondary text `#475569` | Strong hierarchy without tiny low-contrast captions. |
| Positive / negative | Deep green `#147D52` / deep red `#B42318` | Signed movement only, paired with `+`/`−`, labels and accessible text. |
| Attention | Amber `#9A6700` on a light amber field | Partial coverage, unresolved reconciliation, review needed. |

These are design targets, not a claim that contrast has been measured. Before implementation, check contrast for text and control states, including Windows 150% scaling and forced-colors mode. Use a workhorse sans-serif with tabular numerals, a clear Turkish glyph set and at least 14px body text at 100% scale. Large numbers carry the hierarchy; do not rely on all-caps labels or tiny metadata. No decorative gradients, glass effects, glow or color-only status coding. Use squared or modestly rounded corners and visible dividers to make rows read like a statement.

### Shell and navigation

```text
ESMER MARKET                 [Dönem: Eylül 2025 ▾]       [Veri: 30.09.2025] [İşlemler ▾]
Özet   Satışlar   Alışlar ve maliyet   Giderler             Raporlar
────────────────────────────────────────────────────────────────────────────
Page title          short state if material                       page action
Primary answer
Supporting detail
```

- Primary destinations: **Özet**, **Satışlar**, **Alışlar ve maliyet**, **Giderler**, **Raporlar**. Keep the month in the same position and preserve it through drill-down. The current separate report-version page lives under Raporlar, not as another equally weighted daily-analysis tab.
- Group **Veri paketi içe aktar**, **Yedekleme ve kurtarma** and import history under an explicit **İşlemler** menu. A first-run empty state may also put `Veri paketi içe aktar` in its main action position. During an active job, show its progress and cancel action in a persistent, compact job region.
- Show the **actual data cutoff** in the shell for every loaded dataset. Label it `Veri: 30.09.2025`; the detail opens package preparation, import time, dataset identity and calculation versions. `Canlı bağlantı kapalı` belongs in this detail or a data-status menu, not as a competing headline. A synthetic demonstration keeps `Sentetik veri` visibly beside the cutoff on every analysis page.
- Keep page title and period once. Do not repeat period, TRY, full source dates, method version and dataset identity in multiple strips before the first figure.
- At 680px and Windows 150% scaling, keep period, cutoff and current destination usable. Allow the five destinations to wrap or move to one labelled navigation control; never truncate financial status or amount text. Detail panels may take over the content area with a visible back action. No horizontal page overflow; wide ledgers may scroll inside their own region with row identity fixed or repeated.

### Information and copy rules

Each figure has a label, value or explicit unavailability, and a short status. The status is a control that opens **Bu sayı nasıl oluştu?** with population, comparison boundaries, coverage, method, warnings and provenance. The same information remains accessible in the exported report. Status vocabulary is consistent across pages:

| Short status | Meaning at a glance | Detail must reveal |
| --- | --- | --- |
| `Kaynakla uzlaşıyor` | Reconciled against the validated source population | Source scope, batch, cutoff and remaining real-world limitations. |
| `Tahmini · %… kapsam` | Estimate for a stated covered population | Method, included/excluded amounts and records, missing cost. |
| `Kısmi dönem` | The period is not fully covered | Actual start/end dates and whether comparison is valid. |
| `Kanıt eksik` | A prerequisite or reconciliation is unresolved | What is missing and the affected figure/population. |
| `Hesaplanamıyor` | No justified numeric result | Why the value is withheld and the next useful action, if any. |

Never use a bare `0` for missing cost, expenses, source coverage or unknown tax treatment. Never let a green indicator imply that the month or profit is fully trusted. Every amount has a semantic label; color supplements signed values and words. Prefer one sentence per warning. Remove generic reassurance and repeated formula prose from the default view; put it in the figure's detail. Keep irreversible-action consequences next to the action, not in a distant help panel.

When several figures share a problem, show one compact page-level alert with the affected scope and retain a short status on each affected figure. Avoid stacking multiple banners that restate the same issue. Success messages disappear after acknowledgement or navigation; failures and stale-context actions persist until resolved. Loading uses a stable skeleton or progress region, without replacing valid figures with invented zeros.

## 3. Page designs

### 3.1 Start, no data and service failure

The loaded application opens directly to **Özet** for the latest available report period, never to a general gateway. Startup shows one clear `Yerel veriler açılıyor` state. With no package, show `Henüz veri yok`, one short explanation that a prepared package is needed, and one primary `Veri paketi içe aktar` action. Secondary links lead to expenses and recovery where usable. On local-service failure, show `Yerel veriler açılamadı`, a useful retry/restart message and `Yedekten geri yükle` if available. Do not show a false current period or sample figures. If the loaded data is historical, open its actual latest covered period and display its cutoff.

### 3.2 Özet — monthly market summary

First viewport: month and data status; a dominant **Net satış** figure with **Önceki aya göre** signed change; then completed-sale count and average basket. Comparison is shown only if the actual periods are comparable. If not, show `Karşılaştırılamıyor` and the coverage reason instead of a percentage. A compact trend and category list follow as paths into Sales. Cost, expenses and operating result form a second financial section below, each with its own status. An unavailable operating result retains the required statement: `Faaliyet kârı hesaplanamıyor — gider verileri eksik.`

Do not put report-state prose, synthetic caveat, full method paragraph and two coverage banners ahead of the sales answer. Put `Açık / Geçici / Güvenilir` beside the page title, separate from per-metric confidence. Put report version and detailed source/method under `Rapor kanıtı`. `Raporu yenile` appears only when a newer candidate exists; the currently pinned report remains identifiable.

### 3.3 Satışlar — overview, category/product and transactions

- **Satış overview:** same net-sales definition as Özet, then the daily trend and top categories. Three figures maximum in its headline row. Place the month/year comparison selector near the trend; reveal exact comparison boundaries in the status detail. A category row leads to its products; `Tüm işlemler` leads to the transaction list.
- **Category and product:** one search field and a `Kategori / Ürün` switch or breadcrumb. Default categories sort by net sales. Rows show name, net sales, share and change; product rows show quantity with unit. Keep kilograms and pieces separate. One selection opens matching transactions with a visible scope chip and back path.
- **Transactions:** newest first, with `Tümü / Satışlar / Müşteri iadeleri`. Rows show date, stable document ID, type, **selected scope contribution**, and a short status. Return amounts carry a minus sign and `Müşteri iadesi`. A row opens the full receipt without losing month and filters. Distinguish a filtered line contribution from the whole document total in both list and receipt.
- **Receipt and source detail:** a focused side panel on wide screens; full-content detail on narrow screens. Header shows document type/date/ID and full totals. Lines show quantity/unit, net and any discrepancy. A line opens `Kaynak detayı`, leading with a one-sentence contribution explanation and evidence status. Technical IDs, batch, cutoff and method/version stay in an expandable `Kaynak ve yöntem` section. Back returns to the same receipt and list position.

### 3.4 Alışlar ve maliyet

Begin with **Kapsanan tahmini brüt kâr**, estimated cost and **Maliyet kapsamı** as three concise figures, only when their populations are supported. Put `Tarihsel son alış maliyeti tahmini` in the section title/status; do not imply exact inventory valuation. If cost is unavailable, show one explicit missing-evidence state while leaving eligible sales analysis available.

Use local subviews rather than five consecutive large tables: **Alış geçmişi**, **Tedarikçi iadeleri**, **İkame maliyeti**, **Stok ve fire**, plus `Kapsam ve dışlananlar` in evidence detail. Product and supplier filters retain context within relevant subviews. A supplier-return row separates `Fiziksel iade`, `Talep`, and `Tanınan alacak`; unknown settlement remains `Bilinmiyor`. The replacement-cost view states `Güncel ikame maliyeti` and keeps it separate from historical estimated cost. Stock/waste remains a read-only observation with completeness status. Each row opens its validated document evidence and conversion links.

### 3.5 Giderler

The everyday view starts with **Dönem giderleri**, labour total where supplied, and **Tamlık durumu**. Show a short list of imported records and corrections with category, incurred date, amount and status. A zero-row period says `Bu dönem için gider kaydı yok`; it does not say there were no expenses.

Make spreadsheet import a focused sequence: **1. Şablonu indir / dosya seç → 2. Önizle ve hataları düzelt → 3. İçe aktarmayı onayla**. Show row counts and affected periods before confirmation; surface duplicate decisions at the relevant rows. Import success returns to the list with the batch identified. Corrections open the selected record in a focused editor and preserve the original plus reason/history. Keep **Gider tamlığını onayla** as a separate review action after the owner inspects the period; it cannot be inferred from a successful import. The completeness action shows exactly which period and coverage it confirms. Classification, KDV treatment and payment-date distinctions remain visible in record detail and export, not compressed into a misleading total.

### 3.6 Raporlar — versions, comparison and Excel export

Default to a version list for the selected month. Each row shows creation/review date, `Aday / İncelenmiş` state, dataset cutoff and a brief reason for difference. Selecting two versions opens a **Değişenler** view with old/new values, changed coverage and warnings before full report detail. `İncele ve kaydet` is clearly separated from `Excel indir`; saving an estimated report does not relabel its figures as exact. A selected version opens the same monthly report layout, with a persistent version marker, rather than embedding a second full monthly page beneath the list. Export uses that pinned version and includes cutoff, method, confidence, coverage and warnings.

### 3.7 İşlemler — data import, jobs, backup and recovery

The menu opens a small operations hub: dataset status and cutoff; `Veri paketi içe aktar`; recent import outcome/history; `Yedekleme ve kurtarma`. Package import uses a single active-job region with progress, cancel where supported, and a final result. A failed import leaves the last valid dataset visible and says so. A historical or unchanged package outcome explains that active data did not switch.

Recovery has two clear areas, **Yedekleme** and **Geri yükleme**. The former shows setup/healthy/failure status, last verified backup and a concise list with pin actions. The latter is a guided `Yedek ve anahtar seç → İçeriği incele → Geri yüklemeyi onayla` flow. The preview names backup date, dataset cutoff, report and revision counts, and plainly states that confirmation replaces current working data while a protected copy is kept. `Vazgeç` remains adjacent. Backup/key separation and recoverability instructions remain visible at setup and restore decision points. Never imply that a requested backup has been verified until verification completes.

## 4. State coverage and handoff checks

| State | Required visible behavior |
| --- | --- |
| No matching rows | Say the filter has no matches; retain the distinction from missing source coverage. |
| Partial or stale dataset | Keep cutoff and affected figure statuses visible; offer refresh only when available, without silently changing a pinned report. |
| Missing cost or expense evidence | Withhold unjustified profit; explain missing input beside the figure and in its detail. |
| Unresolved source/line discrepancy | Mark affected row and total; preserve access to excluded population and source evidence. |
| Long import/export/backup job | Keep navigation responsive and show progress, cancellation and outcome in a stable place. |
| Error | Use one actionable Turkish message; preserve the last valid data and the current user context where possible. |
| Keyboard and narrow window | Every nav item, status detail, ledger row and panel is reachable by keyboard; focus returns to its opener. |

Design acceptance before UI implementation: review static page designs for every section above at a typical desktop width and the 680px/150% Windows case; check first-viewport hierarchy, text contrast and Turkish copy. Implementation acceptance: verify the documented drill-down and state paths with synthetic fixtures, then run the repository's desktop and Windows gates. The design document alone does not close A03 or A07 and does not authorize source inspection, owner contact or installation.

## 5. Current-to-new mapping and implementation order

| Current surface | New location | Main simplification |
| --- | --- | --- |
| `App.tsx` loaded gateway | Özet | Open the latest available monthly report directly. |
| `MonthlyOverview` | Özet | Sales answer first; finance sections and evidence beneath. |
| `SalesWorkspace` overview/products/transactions/detail | Satışlar | One drill path, short inline statuses, pinned context. |
| `PurchasingWorkspace` | Alışlar ve maliyet | Separate subviews for unlike table tasks. |
| `ExpensesWorkspace` | Giderler | Everyday list separated from import, correction and completeness review. |
| `ReportVersions` | Raporlar | Version list and differences before pinned report detail. |
| `RecoveryWorkspace`, import controls and progress | İşlemler | Operations grouped away from daily analysis; restore remains a deliberate flow. |

Implement the shared shell, status vocabulary and figure-detail pattern first; then Özet and Sales; then Purchasing, Expenses, Reports and Recovery. Migrate only presentation and navigation in coherent slices against the existing report contracts. When implementation is requested, expose changed behavior with focused tests, preserve the approved financial and evidence rules, and record Windows visual and task evidence. Do not mark this documentation as UI acceptance.

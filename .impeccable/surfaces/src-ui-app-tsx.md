---
version: 1
slug: "src-ui-app-tsx"
primary_target: "src/ui/App.tsx"
related_targets: ["src/ui/AppShell.tsx","src/ui/pages/MonthPage.tsx","src/ui/pages/ProductsPage.tsx","src/ui/ExpensesWorkspace.tsx","src/ui/theme.css"]
---

# Desktop analysis

Mode: Operate. Eralp, a non-technical grocery owner, opens the app to learn what the month made, which products need a look, and to close the month's expenses. One remembered month drives three destinations. All figures come from the local store; the estimate is disclosed once per page.

## Direction contract

THESIS: The owner picked prototype B "Üç sekme" on 2026-10-29 after a seven-prototype bakeoff and two council rounds. Three top tabs (Bu ay, Ürünler, Giderler) replace the four-section sidebar. Each figure has one home; nothing is repeated across cards. It refuses the dashboard of KPI tiles and the dark-rail ledger it replaces.

OWN-WORLD: Cool neutral page #f5f7fa, white cards with soft shadow, line #e3e7ee, ink #18212e. One azure accent #0b6bcb for action, selection and focus only; green and red only for gain and loss; amber only for warnings. Figtree packaged locally, tabular numerals.

STORY: Bu ay answers in one sentence and one large gross-profit figure, then up to four attention rows and the net state. Ürünler is a sortable ledger with a push drawer. Giderler shows four group totals from the stored lines and closes the month without ever treating a blank as zero.

FIRST VIEWPORT: Top bar with logo, three tabs, month stepper, Excel'e aktar and the Ayarlar gear. Bu ay's hero and attention fit above the fold at 1100×560.

FORM: Native buttons, tables, disclosures and SVG charts; popovers for the trust chip, the calculation bridge and the Ayarlar menu; overlays for recovery, live connection and source documents.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

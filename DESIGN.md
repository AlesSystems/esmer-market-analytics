---
name: Esmer Market
description: The approved A workspace: quiet side navigation, a broad monthly answer, plum actions and flexible analysis sections.
colors:
  page: "#f4f5f8"
  card: "#ffffff"
  ink: "#252b39"
  ink-muted: "#5b6472"
  line: "#e0e2e9"
  edge: "#c5ccd6"
  field: "#8792a2"
  soft: "#eef1f5"
  hover: "#f2f5f9"
  track: "#e7ebf1"
  mute: "#a3abb7"
  accent: "#6c3d78"
  accent-hover: "#563060"
  accent-wash: "#f1eaf4"
  accent-selection: "#e7d8ed"
  chart-bar: "#a17cad"
  gain: "#0f7b51"
  loss: "#bf2f2a"
  loss-wash: "#fdecea"
  warn: "#965a00"
  warn-wash: "#fff4e2"
  warn-line: "#ecd2a0"
typography:
  hero:
    fontFamily: "Figtree Variable, Segoe UI, system-ui, sans-serif"
    fontSize: "3.5rem"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "-0.03em"
  net:
    fontFamily: "Figtree Variable, Segoe UI, system-ui, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Figtree Variable, Segoe UI, system-ui, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  lead:
    fontFamily: "Figtree Variable, Segoe UI, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 500
    lineHeight: 1.4
  title:
    fontFamily: "Figtree Variable, Segoe UI, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1.35
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Figtree Variable, Segoe UI, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
    fontFeature: "tnum"
  label:
    fontFamily: "Figtree Variable, Segoe UI, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.5
  chart-label:
    fontFamily: "Figtree Variable, Segoe UI, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 600
  chart-tick:
    fontFamily: "Figtree Variable, Segoe UI, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 400
rounded:
  bar: "3px"
  xs: "4px"
  sm: "8px"
  md: "10px"
  lg: "12px"
  xl: "14px"
  full: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "20px"
  xl: "28px"
  page-x: "24px"
  section-gap: "20px"
---

# Design System: Esmer Market

## Approved direction

The project owner selected **Prototype A — Aylık çalışma alanı** on 2026-11-14 and explicitly requested implementation with room for later charts and graphs. [Decision #143](https://github.com/AlesSystems/esmer-market-analytics/issues/143#issuecomment-6876945959) records the feedback. The [implementation contract](docs/superpowers/specs/2026-11-14-prototype-a-implementation.md) governs the current change. The concrete reference is A in [the comparable prototype](prototypes/visual-directions/README.md) at `23aab64`.

This replaces the 2026-10-29 azure, three-top-tab visual prescription. It does not change financial meaning, source permissions, supported workflows or Windows acceptance. Approval of the visual direction is not a claim that Eralp performed a usability walkthrough.

## Composition

A quiet white navigation rail anchors the store identity. The content opens with the selected month and actual period, then a broad monthly result: Tahmini brüt kâr and its explanation on the left, aligned supporting amounts on the right. Product observations and the next expense action follow. Related analysis, including existing charts, uses normal document flow below the core answer.

Keep the answer, evidence and next action distinct through alignment, spacing and type. Avoid grids of equally prominent KPI tiles. A large gross-result amount is the primary focus; supporting amounts are smaller. Product rows keep money right aligned. Preserve written explanations of loss, unknown cost, incomplete expenses and partial periods.

Bu ay, Ürünler and Giderler remain the three business destinations. The selected month follows navigation and restarts. Product investigation retains search, filter, sorting, scroll position and focus when returning from evidence. Supporting operations remain under Ayarlar and use the established full-page overlays and return behavior. Navigation and period changes retain expense draft protection.

## Color

| Token / role | Value | Use |
| --- | --- | --- |
| Page | `#f4f5f8` | Quiet workspace background |
| Surface | `#ffffff` | Rail, content sections, menus and forms |
| Ink | `#252b39` | Headings, figures and body text |
| Rule | `#e0e2e9` | Section, row and rail separation |
| Plum | `#6c3d78` | Actions, selection and keyboard focus |
| Plum wash | `#f1eaf4` | Selected navigation and rows |

The exact supporting tokens live in [theme.css](src/ui/theme.css). Muted text remains readable; disabled color is never used for required information. Green/red mean gain/loss, amber means attention. A large amount is not green merely because it is important. Unknown is written as unknown and is never represented by zero.

Use flat surfaces with quiet rules and restrained shadows. Menus and popovers may lift above the workspace. No decorative gradients, glows, perspective, 3D quantitative marks or attention-seeking animation.

## Type and spacing

Use locally bundled Figtree Variable, with Segoe UI and system sans fallbacks. Turkish characters and tabular numerals are required. Body copy and controls use the shared `--t-*` scale; the owner's Normal/Büyük/Çok büyük preference uses Electron zoom. Do not shrink text to fit a desktop layout at larger zoom.

The headline and gross-result amount lead the hierarchy, followed by section titles, supporting facts, labels and contextual detail. Use sentence case, readable line heights and short lines of explanatory copy. Form labels remain explicit; placeholders do not replace them.

Use a consistent 4/8/12/20/28 spacing rhythm, generous section padding, and small gaps within related information. Actual responsive geometry belongs in shell/page styles; do not impose fixed heights on variable content. Corners remain gently rounded and quantitative marks remain flat 2D.

## Components and behavior

- **Navigation:** labelled business destinations with a persistent active state, visible focus and a readable store identity. On narrow windows the rail reflows so essential navigation and actions remain reachable.
- **Month controls:** selected month stays visible; previous/next buttons preserve the existing availability and draft guards. The period and actual data cutoff must not imply that historical imports are current activity.
- **Monthly answer:** one explicit Tahmini brüt kâr label, gross amount or meaningful unavailable state, aligned Satış / Tahmini ürün maliyeti / Marj, and access to calculation detail. Use the same service-provided population and formatted values.
- **Trust disclosure:** one accessible estimated-results disclosure per page, opening the existing basis, exclusions and cost coverage. Do not repeat long caveats beside every number.
- **Product list/detail:** full-result search, existing filters and sort, keyboard-operable rows, preserved units, and available cost/margin/source detail. A name is a real button; the row may also be clickable. Missing cost and unknown margin remain explicit.
- **Expenses:** Excel import/template remains the primary entry workflow with preview, validation and duplicate decisions; manual entry is secondary. Keep classification/KDV evidence, reasoned corrections, reversal/restoration and history. Saving never implies completeness.
- **Net result:** current explicit review and eligible expense treatment determine availability. Empty records are not a zero-expense declaration. Later changes/revocation withdraw the result using the existing service states.
- **Utilities:** import, source details, export, recovery, connection status, text size and limitations remain discoverable. Overlay dismissal returns to the originating task. A failed update retains the last valid data.
- **Forms/actions:** shared Button and field styling, meaningful Turkish labels, visible validation, at least 40px tap/click targets, and no hidden essential action at narrow sizes.

## Charts and future growth

The owner explicitly requested room for later charts. The monthly page must be composed from independent semantic sections in a responsive grid. Full-width and split-width sections should work in the same normal document flow, with intrinsic height and `minmax(0, ...)` columns. Later charts can be added as sections without changing the shell, month ownership or financial operations.

Use the existing chart components and service-provided data. Every chart must carry its period, units, meaningful title and a numeric/table alternative. Unknown values remain gaps or distinct unknown marks; zero and negative values remain valid signed values. Kilograms and pieces cannot become one physical total. Do not infer an unsupported comparison or forecast.

Chart geometry can map supplied values to pixels; it must not calculate business metrics. Keep legends and labels readable at the owner's zoom level. Wide numeric tables scroll within their section rather than widening the application. Avoid fixed chart heights imposed on surrounding text, CSS placement based on child order, and absolute positioning of content sections.

No widget registry, configurable dashboard, new chart library, new source fields or speculative metric API is required. Add a chart only when its question and existing/newly approved data contract are clear. Existing six-month bars, product margin history and calculation bridge remain supported.

## Accessibility and retained boundaries

- Native controls, meaningful headings/landmarks, keyboard paths, a skip-to-content action, visible focus and predictable return from menus, detail and overlays.
- Text-size changes, narrow-window reflow, internal table scrolling, forced-colors outlines and reduced-motion support. Test real content, long names and unavailable states.
- Meaning must survive removal of color. All money uses Turkish formatting and TRY; units remain explicit.
- The renderer presents service results and never changes tax rules, expense eligibility, precision or rounding. Source access remains read-only and separately authorized.
- Source-only and financial-only installations and reproducible historical reports retain their existing routes. No redesign may erase a supported capability.
- Synthetic screenshots and host tests do not establish owner hardware, actual Windows scaling, source semantics, release or installation acceptance. Evidence records identify the tested build and remaining checks.

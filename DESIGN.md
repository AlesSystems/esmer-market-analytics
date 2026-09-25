---
name: Esmer Market
description: A light, restrained desktop analysis system for an offline market owner.
colors:
  background: "#ffffff"
  foreground: "#202124"
  primary: "#27272a"
  primary-foreground: "#ffffff"
  secondary: "#f4f4f5"
  secondary-foreground: "#3f3f46"
  muted-surface: "#fafafa"
  muted: "#62626b"
  accent: "#e6f2ef"
  accent-foreground: "#215e54"
  accent-border: "#bddbd2"
  line: "#e1e1e5"
  input: "#b7b7bf"
  ring: "#28796b"
  positive: "#236c59"
  positive-chart: "#3a8a7a"
  negative: "#b42318"
  warning: "#fff8e9"
  warning-foreground: "#80580b"
  warning-border: "#e4cea4"
  selection-background: "#cae7df"
typography:
  chart-label:
    fontFamily: "Segoe UI, system-ui, sans-serif"
    fontSize: "11px"
  status:
    fontFamily: "Segoe UI, system-ui, sans-serif"
    fontSize: "12px"
  supporting:
    fontFamily: "Segoe UI, system-ui, sans-serif"
    fontSize: "13px"
  headline:
    fontFamily: "Segoe UI, system-ui, sans-serif"
    fontSize: "clamp(25px, 2.3vw, 32px)"
    fontWeight: 650
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  amount:
    fontFamily: "Segoe UI, system-ui, sans-serif"
    fontSize: "clamp(34px, 3.3vw, 48px)"
    fontWeight: 650
    lineHeight: 1.15
    letterSpacing: "-0.035em"
  title:
    fontFamily: "Segoe UI, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 600
    lineHeight: 1.35
  body:
    fontFamily: "Segoe UI, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.5
  ledger-value:
    fontFamily: "Segoe UI, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 600
  brand:
    fontFamily: "Segoe UI, system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 700
  panel-title:
    fontFamily: "Segoe UI, system-ui, sans-serif"
    fontSize: "22px"
  total:
    fontFamily: "Segoe UI, system-ui, sans-serif"
    fontSize: "24px"
  operating-total:
    fontFamily: "Segoe UI, system-ui, sans-serif"
    fontSize: "25px"
    fontWeight: 600
  metric:
    fontFamily: "Segoe UI, system-ui, sans-serif"
    fontSize: "30px"
    fontWeight: 650
  amount-compact:
    fontFamily: "Segoe UI, system-ui, sans-serif"
    fontSize: "36px"
    fontWeight: 650
    lineHeight: 1.15
  label:
    fontFamily: "Segoe UI, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 500
rounded:
  control: "6px"
  notice: "8px"
  surface: "10px"
spacing:
  compact: "8px"
  control-inline: "12px"
  field: "16px"
  surface: "22px"
  section: "24px"
  page-inline: "32px"
components:
  button-default:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.control}"
    padding: "8px 12px"
    height: "40px"
  button-outline:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.control}"
    padding: "8px 12px"
    height: "40px"
  input:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.control}"
    padding: "8px 12px"
    height: "40px"
  badge-secondary:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.secondary-foreground}"
    rounded: "{rounded.control}"
    padding: "4px 8px"
  badge-warning:
    backgroundColor: "{colors.warning}"
    textColor: "{colors.warning-foreground}"
    rounded: "{rounded.control}"
    padding: "4px 8px"
---

# Design System: Esmer Market

## Overview

**Creative North Star: "The Quiet Market Ledger"**

This is a light desktop operating system for reading a market month without turning the work into a dashboard spectacle. White working space, soft zinc surfaces, charcoal actions, a restrained teal selection, and visible rules let the figures, evidence, and Turkish labels do the work.

The sidebar keeps the working context close while the content area stays broad, dense, and calm. Colour carries state sparingly: teal locates the current path, green and red support signed values, and amber keeps incomplete evidence visible. The system is intentionally light-only and uses native controls where they already serve the workflow.

**Key Characteristics:**

- Light zinc shell with charcoal primary actions and restrained teal selection.
- Segoe UI hierarchy, tabular figures, visible rules, and compact operational density.
- Native tables, selects, disclosures, and SVG trend chart retained beside three shared controls.
- Explicit warning, unavailable, synthetic, and report-evidence states.

## Colors

The palette is neutral first: charcoal directs action, teal establishes location, and financial state colours remain supporting signals.

### Primary

- **Charcoal action:** primary buttons and the strongest interactive commitment.
- **Teal focus and selection:** the current destination, focus ring, caret, progress accent, and selected local state.

### Secondary

- **Zinc support surface:** quiet controls, neutral markers, and subdued table structure.
- **Teal selection wash:** selected navigation and related active states, paired with darker teal text.
- **Teal selection border:** the boundary for pressed local navigation; it keeps the selected state legible on paper.
- **Selection wash:** the browser text-selection background, paired with dark teal selected text.
- **Amber evidence state:** incomplete, synthetic, partial-period, and unavailable operating-result context, always with its border and written explanation.
- **Positive green and negative red:** signed comparisons and returns; the daily chart uses its dedicated positive bar green. These are never the only carrier of financial meaning.

### Neutral

- **Paper canvas:** the application background and standard control surface.
- **Charcoal text and muted text:** primary reading order, then supporting metadata and explanation.
- **Fine zinc line:** the recurring separator around controls, surfaces, tables, and ledger rows.

**The Accent Is Location Rule.** Teal marks focus, selection, and progress. It does not certify profit or a favourable financial result.

## Typography

**Interface Font:** Segoe UI with system-ui and sans-serif fallbacks.

**Character:** The system uses the Windows-native reading face already present in the build. Hierarchy comes from compact size and weight changes, while tabular numerals make financial comparison stable.

### Hierarchy

- **Amount:** the monthly result uses the largest, tightly tracked role; it is a figure, not a promotional headline.
- **Headline:** page titles use the responsive headline role.
- **Title:** section headings use the sturdy 18px role.
- **Body:** ordinary workspace copy uses the 15px body role; explanatory paragraphs open their line-height to 1.6.
- **Label:** 14px labels anchor controls, table headers, and metadata; supporting text is 13px, status markers are 12px, and chart ticks are 11px.
- **Financial scale:** ledger values use 17px; brand, panel, total, operating-total, and metric roles use 20px, 22px, 24px, 25px, and 30px respectively. The monthly amount has a 36px compact-width fallback.

**The Comparable Figures Rule.** Amounts, totals, and tables use tabular numerals; numeric table columns align right and retain their units and signs.

## Layout

The desktop shell is a 208px sticky sidebar beside a flexible main area. The workspace is capped at 1660px and uses 28px top, 32px inline, and 48px lower padding. Reused spacing moves from 8px inside compact controls through 16px fields and 22–24px surface groups.

The monthly workspace uses a two-to-three-column grid: answer and daily trend first, a full-width attention row, then finance and category regions. At 1050px it becomes a single sequence. At 800px the sidebar becomes a wrapping top strip; at 650px summary and attention groups simplify to one column; at 500px the ledger values return beneath their labels. Dense tables scroll within their own region.

The evidence panel is 390px wide on large screens. At 1250px it becomes a fixed overlay with viewport-safe inset behavior. Popovers open beside their sidebar triggers and become fixed within the compact sidebar layout.

## Elevation & Depth

The working surface is flat: borders and tonal differences establish ordinary structure. Only a popover, operations hub, or compact evidence panel receives depth, because it temporarily overlaps the ledger.

### Shadow Vocabulary

- **Sidebar overlay:** `0 8px 28px #20212426` for data and operations popovers.
- **Compact evidence panel:** `0 10px 32px #20212426` when the detail panel is fixed below the wide layout.

**The Overlap-Only Depth Rule.** Shadows explain an overlay. Standard cards, rows, and figures stay flat.

## Shapes

Controls and compact status markers use a 6px radius. Notices and attention groups widen to 8px; reusable workspace blocks, recovery sections, and overlays use 10px. Borders are fine and visible. Tables, ledgers, and charts are defined by alignment and separators rather than decorative containers.

## Components

### Button

The shared native button is the system's primary action primitive. It has a 40px minimum height, a 6px corner, 8px by 12px padding, and default, outline, ghost, link, and destructive variants. Default is charcoal with white text; outline keeps the paper surface and visible line; ghost stays quiet until hover. The normal palette uses the teal focus ring and the global 2px outline with a 3px offset; forced colours replace it with a 2px `Highlight` outline. Disabled actions reduce opacity and keep the not-allowed cursor.

### Input

The shared native input fills its available width with the same 40px minimum height and 6px corner. It uses paper, the input border, readable foreground text, placeholder muting, the teal focus ring, and the same global outline policy as buttons. Native selects and textareas retain the same visual family through the global stylesheet.

### Badge

The shared native span badge is a compact 12px status marker with 4px by 8px padding and a 6px corner. Default, secondary, outline, destructive, and warning variants cover the build's reusable status language. Warning is reserved for the amber evidence state.

### Native Working Elements

Tables, select controls, `details` disclosures, and the existing SVG chart remain native or purpose-built. They are not replaced with generated data, select, disclosure, or chart frameworks; their existing state ownership and interaction semantics are part of the system.

## Do's and Don'ts

### Do:

- **Do** keep the period, cutoff, synthetic identity, and evidence state readable where the owner works.
- **Do** use the light paper-and-zinc surfaces, visible separators, and tabular figures to support scanning.
- **Do** use teal for the current path and keyboard focus, and pair positive, negative, and amber colour with written context.
- **Do** preserve native table scrolling and disclosure behavior when extending an existing workflow.

### Don't:

- **Don't** restore the superseded navy rail, electric-blue action system, or dark component variants.
- **Don't** use teal, green, or red alone to assert financial meaning.
- **Don't** replace missing evidence with a zero or hide it to make a compact view cleaner.
- **Don't** add a generated control framework where the native table, select, disclosure, or chart already owns the task.

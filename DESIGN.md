---
name: Esmer Market Option B
description: A navy working desk and crisp financial statements for offline store analysis.
colors:
  navy: "#0B1830"
  blue: "#0057D9"
  ink: "#10213A"
  muted: "#475569"
  paper: "#FFFFFF"
  canvas: "#F3F5F8"
  line: "#D5DCE5"
  control-border: "#8295af"
  blue-wash: "#eaf3ff"
  sidebar-text: "#DCE6F5"
  sidebar-hover: "#192C49"
  sidebar-field: "#172A46"
  sidebar-border: "#566781"
  positive: "#147D52"
  negative: "#B42318"
  attention-text: "#795000"
  attention-bg: "#FFF7E2"
  attention-border: "#C9AE6C"
typography:
  display:
    fontFamily: "Segoe UI, system-ui, sans-serif"
    fontSize: "clamp(36px, 3.6vw, 56px)"
    fontWeight: 650
    lineHeight: 1.15
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Segoe UI, system-ui, sans-serif"
    fontSize: "clamp(25px, 2.4vw, 34px)"
    fontWeight: 650
    lineHeight: 1.2
    letterSpacing: "-0.03em"
  title:
    fontFamily: "Segoe UI, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 700
  body:
    fontFamily: "Segoe UI, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Segoe UI, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
  ledger-value:
    fontFamily: "Segoe UI, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 600
rounded:
  surface: "4px"
  control: "5px"
  marker: "3px"
spacing:
  compact: "8px"
  control-gap: "12px"
  field-gap: "16px"
  group-gap: "20px"
  section-gap: "24px"
  page-inset: "32px"
components:
  button-primary:
    backgroundColor: "{colors.blue}"
    textColor: "{colors.paper}"
    rounded: "{rounded.control}"
    padding: "8px 11px"
  button-secondary:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "8px 11px"
  button-secondary-hover:
    backgroundColor: "{colors.blue-wash}"
  row-link:
    backgroundColor: "transparent"
    textColor: "{colors.blue}"
    padding: "3px 0"
    rounded: "0"
  input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "8px 11px"
  navigation:
    backgroundColor: "transparent"
    textColor: "{colors.sidebar-text}"
    padding: "12px"
    rounded: "{rounded.surface}"
  navigation-current:
    backgroundColor: "{colors.blue}"
    textColor: "{colors.paper}"
  attention-marker:
    backgroundColor: "{colors.attention-bg}"
    textColor: "{colors.attention-text}"
    typography: "{typography.label}"
    padding: "6px 10px"
  sheet:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.surface}"
    padding: "24px"
  figure-status:
    textColor: "{colors.blue}"
    typography: "{typography.label}"
---

# Design System: Esmer Market

## Overview

**Creative North Star: "The Working Desk"**

A deep navy navigation rail holds the period, data cutoff and operations beside white financial sheets on a cool gray canvas. The interface is compact and direct: a Turkish label explains each figure, tabular numerals support comparison, and visible rules separate ledger rows.

Blue identifies actions and the selected path. Material uncertainty stays beside the affected figure; fuller methods and source records open through labelled disclosures. This records the implemented Option B world, selected by the user, rather than every historical style still present in the stylesheet.

**Key Characteristics:**

- Navy navigation and white financial sheets.
- Large primary amounts, compact ledger rows and tabular numerals.
- Turkish labels and explicit evidence states.
- Modest corners, visible dividers and restrained overlay depth.

Source of truth: [stylesheet](src/ui/style.css), [shell](src/ui/AppShell.tsx), [monthly overview](src/ui/overview/MonthlyOverview.tsx) and the [approved direction](.impeccable/surfaces/src-ui-app-tsx.md). The [redesign specification](docs/superpowers/specs/2026-09-25-ui-redesign.md) governs the intended experience; the tokens above describe the final CSS cascade. This document does not close acceptance gates or establish actual Windows 150% scaling acceptance.

## Colors

The palette pairs cool, dark navigation with bright paper and a blue action accent.

### Primary

- **Electric blue:** active primary navigation, primary buttons, links, keyboard focus and evidence disclosures. It is an interaction color, not a gain indicator.
- **Deep navy:** the persistent navigation rail and selected local subviews.

### Secondary

- **Positive green / negative red:** supplement signed comparisons and return information. Keep the sign, label or accessible textual amount.
- **Attention amber:** partial periods, missing evidence and unavailable operating results use attention text, background and border together.

### Neutral

- **Ink / muted:** primary figures and text versus supporting explanation.
- **Paper / canvas / line:** white sheets against the cool gray workspace, separated by visible rules.
- **Sidebar text / hover / field / border:** the pale text, darker field and restrained hover treatment that keep controls legible inside the rail.
- **Control border / blue wash:** field edges and secondary-button hover.

**The Action Blue Rule.** Blue identifies a path or a control; it does not certify financial performance.

## Typography

**Interface Font:** Segoe UI with system-ui and sans-serif fallbacks. This is the explicitly selected Windows workhorse face; there is no separate decorative display face.

### Hierarchy

- **Display:** the dominant monthly amount, using the frontmatter's fluid size and tight tracking. This role names a financial figure, not a marketing headline.
- **Headline:** the page title, using a restrained fluid scale.
- **Title:** section headings. Smaller section headings use the implemented 16px size; ledger values use a separate medium-weight role.
- **Body:** ordinary interface text and prose. The recorded line height applies to paragraphs; controls inherit the font with their native line-height behavior.
- **Label:** table text, metadata, disclosures and status text. Status meaning remains written out.

**The Comparable Figures Rule.** Use tabular numerals for amounts, totals and tables; align numeric table columns to the right and retain their units.

## Layout

The desktop shell uses a 220px rail and a flexible content column. The rail is sticky and fills the viewport height. Content is capped at 1600px, with 32px top and horizontal insets and a 48px lower inset. Shared sections use the spacing scale above; forms wrap instead of forcing the page wider.

The monthly overview places the main answer beside a ledger and category table, with the daily trend spanning both columns. This composition belongs to that surface; other workspaces use the shared sheet, table and disclosure vocabulary without copying its arrangement.

At 1100px and below the rail narrows to 190px, the monthly columns stack and the horizontal workspace inset becomes 24px. At 800px and below navigation becomes a wrapping labelled strip, the period and operations wrap with it, and horizontal padding becomes 20px. At 500px and below sheet padding is 20px and the financial ledger stacks its labels and values.

Sales detail uses a 390px evidence panel. At 1250px and below it becomes a fixed overlay; at 500px and below it uses 12px viewport insets. Sales overview columns stack at 900px, metric groups at 650px. Wide tables scroll within their own region and keep the row-identity column sticky. These CSS breakpoints do not substitute for checking physical Windows display scaling.

## Elevation & Depth

Sheets are flat, with a thin line defining their edges. Depth appears only where a surface overlays other content: the data popover, operations menu and compact-window evidence panel. Neither sheet hover lifts nor animated transitions are defined in the current stylesheet.

### Shadow Vocabulary

- **Popover:** `0 12px 32px #0B18301F` for the data and operations overlays.
- **Evidence overlay:** `-8px 12px 30px #224b7630` for the fixed detail panel.

**The Overlay Depth Rule.** Use shadow to explain overlap; ordinary financial sheets keep borders and no shadow.

## Shapes

Sheets and navigation items have modest surface corners, controls use the control radius, and report-version markers use the smaller marker radius. Ledger rows and attention bands stay square. Borders remain visible; the statement character comes from alignment, rules and type rather than decorative surface effects.

## Components

### Buttons

Primary buttons use electric blue with white text. Secondary buttons use paper, ink and a visible control border; their hover becomes blue wash. Both have a 40px minimum height and the control padding in the frontmatter. The current primary hover keeps its blue fill. Keyboard focus uses a blue 3px outline with 3px offset; disabled controls use 0.6 opacity and a not-allowed cursor. Text row links retain their compact padding and underline on hover.

### Inputs / Fields

Inputs and selects use paper, ink and a visible control border, with the same minimum height and padding as buttons. Sidebar period input uses its darker field and border palette, white text and native dark color scheme. Textareas have surface corners, a line border, 10px padding and vertical resize. Focus uses the shared visible outline.

### Navigation

Primary navigation combines an inline outline SVG with a Turkish destination label. Desktop rows have a 46px minimum height; the selected row is blue and hover is sidebar-hover. Focus is white against navy. Compact navigation retains labels, hides the icons and uses a 42px minimum height. Local subviews use bordered buttons and a navy selected state.

### Chips / Status Markers

Partial-period markers are square amber labels, not interactive filter pills. Synthetic identity remains visible in the sidebar with its dark amber variant. The report marker is a neutral bordered label. Meaning comes from text as well as color.

### Cards / Containers

A sheet has paper fill, a line border, surface corners and section padding. The monthly answer uses a larger inset. The financial ledger and category region share the statement rhythm without creating an additional outer card around each row.

### Figure Evidence

A concise blue status is a native disclosure summary. Its expanded content contains the explanation and relevant source or method; the status itself stays beside the figure. Unavailable values remain explicit text. Disclosure movement is immediate; no motion token is established.

### Tables and Operations

Tables use compact rows, right-aligned numeric columns and visible separators. Row links lead to evidence. The operations menu and data cutoff open white overlays from the sidebar; compact layouts position them below their triggers. Long values wrap or remain inside the table's scroll region.

## Do's and Don'ts

### Do:

- **Do** keep the period, actual cutoff and synthetic identity readable alongside navigation.
- **Do** pair financial color with signs, labels and accessible textual amounts.
- **Do** preserve explicit unavailable and estimated states beside the affected figures.
- **Do** use visible borders, tabular numerals and aligned rows to make comparisons easy.
- **Do** retain labelled keyboard focus and the implemented forced-colors treatment.

### Don't:

- **Don't** use blue as a gain signal or treat an estimate as verified profit.
- **Don't** replace missing financial evidence with a zero.
- **Don't** add gradients, glass, glow or color-only status.
- **Don't** turn every ledger row into a separate raised card.
- **Don't** hide period, cutoff or financial caveats to make a narrow layout fit.

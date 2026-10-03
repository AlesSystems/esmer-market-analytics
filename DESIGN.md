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
  overview-blue: "#2459d5"
  overview-ink: "#182644"
  overview-muted: "#5c6980"
  overview-line: "#dce3ee"
  # Settings surface (Glazed Tile Panel): scoped to the Ayarlar page and the sidebar live badge.
  settings-glaze: "#fbfaf6"
  settings-grout: "#e4ddce"
  settings-grout-light: "#efeae0"
  settings-ink: "#18233f"
  settings-ink-hover: "#26365f"
  settings-ink-soft: "#4a5470"
  settings-cobalt: "#1f3f9a"
  settings-turquoise: "#0a665e"
  settings-coral: "#b03a25"
  settings-saffron: "#d99a1b"
  settings-amber-wash: "#fff3d6"
  settings-amber-ink: "#5c3d00"
  settings-amber-seal: "#f2b84b"
  settings-error-wash: "#fbe9e4"
  settings-error-ink: "#8a2614"
  settings-choice-line: "#cfc7b6"
  settings-selection: "#c9d6f2"
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
  settings-display:
    fontFamily: "Segoe UI, system-ui, sans-serif"
    fontSize: "clamp(28px, 2.6vw, 36px)"
    fontWeight: 650
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  settings-intro:
    fontFamily: "Segoe UI, system-ui, sans-serif"
    fontSize: "15px"
  settings-tile-title:
    fontFamily: "Segoe UI, system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 650
    lineHeight: 1.3
    letterSpacing: "-0.012em"
  settings-band-line:
    fontFamily: "Segoe UI, system-ui, sans-serif"
    fontSize: "13.5px"
    lineHeight: 1.45
  settings-status:
    fontFamily: "Segoe UI, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 600
    lineHeight: 1.5
  settings-subhead:
    fontFamily: "Segoe UI, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 650
  settings-body:
    fontFamily: "Segoe UI, system-ui, sans-serif"
    fontSize: "14px"
    lineHeight: 1.55
  settings-fact-label:
    fontFamily: "Segoe UI, system-ui, sans-serif"
    fontSize: "13px"
  settings-fact-value:
    fontFamily: "Segoe UI, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 600
    fontFeature: "tnum"
  settings-coverage-lead:
    fontFamily: "Segoe UI, system-ui, sans-serif"
    fontSize: "28px"
    fontWeight: 650
    lineHeight: 1.1
    letterSpacing: "-0.02em"
    fontFeature: "tnum"
  settings-action:
    fontFamily: "Segoe UI, system-ui, sans-serif"
    fontSize: "14.5px"
    fontWeight: 600
rounded:
  control: "6px"
  notice: "8px"
  surface: "10px"
  settings-tile: "6px"
  settings-track: "4px"
  settings-pill: "999px"
spacing:
  compact: "8px"
  control-inline: "12px"
  field: "16px"
  surface: "22px"
  section: "24px"
  page-inline: "32px"
  settings-grout: "6px"
  settings-action-gap: "10px"
  settings-tile-compact: "16px"
  settings-tile-block: "18px"
  settings-tile-inline: "20px"
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
  settings-tile:
    backgroundColor: "{colors.settings-glaze}"
    textColor: "{colors.settings-ink}"
    rounded: "{rounded.settings-tile}"
    padding: "18px 20px 20px"
  settings-band-ink:
    backgroundColor: "{colors.settings-ink}"
    textColor: "{colors.primary-foreground}"
    typography: "{typography.settings-tile-title}"
    padding: "18px 20px 16px"
  settings-band-cobalt:
    backgroundColor: "{colors.settings-cobalt}"
    textColor: "{colors.primary-foreground}"
    typography: "{typography.settings-tile-title}"
    padding: "18px 20px 16px"
  settings-band-turquoise:
    backgroundColor: "{colors.settings-turquoise}"
    textColor: "{colors.primary-foreground}"
    typography: "{typography.settings-tile-title}"
    padding: "18px 20px 16px"
  settings-band-coral:
    backgroundColor: "{colors.settings-coral}"
    textColor: "{colors.primary-foreground}"
    typography: "{typography.settings-tile-title}"
    padding: "18px 20px 16px"
  settings-band-saffron:
    backgroundColor: "{colors.settings-saffron}"
    textColor: "{colors.settings-ink}"
    typography: "{typography.settings-tile-title}"
    padding: "18px 20px 16px"
  settings-status-pill-stale:
    backgroundColor: "{colors.settings-amber-wash}"
    textColor: "{colors.settings-amber-ink}"
    typography: "{typography.settings-status}"
    rounded: "{rounded.settings-pill}"
    padding: "4px 11px"
  settings-action-primary:
    backgroundColor: "{colors.settings-ink}"
    textColor: "{colors.primary-foreground}"
    typography: "{typography.settings-action}"
    rounded: "{rounded.settings-tile}"
    padding: "9px 16px"
    height: "42px"
  settings-action-primary-hover:
    backgroundColor: "{colors.settings-ink-hover}"
    textColor: "{colors.primary-foreground}"
  settings-action-outline:
    textColor: "{colors.settings-ink}"
    typography: "{typography.settings-action}"
    rounded: "{rounded.settings-tile}"
    padding: "9px 16px"
    height: "42px"
  settings-action-quiet:
    textColor: "{colors.settings-ink}"
    rounded: "{rounded.settings-tile}"
    padding: "9px 4px"
    height: "42px"
  settings-view-switch:
    backgroundColor: "{colors.settings-grout-light}"
    rounded: "{rounded.settings-tile}"
    padding: "4px"
  settings-view-switch-pressed:
    backgroundColor: "{colors.settings-ink}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.settings-track}"
    padding: "7px 14px"
    height: "38px"
  settings-size-choice:
    backgroundColor: "{colors.background}"
    textColor: "{colors.settings-ink}"
    rounded: "{rounded.settings-tile}"
    padding: "10px 6px"
    height: "84px"
  settings-size-choice-checked:
    backgroundColor: "{colors.settings-ink}"
    textColor: "{colors.primary-foreground}"
  settings-coverage-track:
    backgroundColor: "{colors.settings-grout-light}"
    rounded: "{rounded.settings-track}"
    height: "16px"
  settings-seal:
    rounded: "{rounded.settings-pill}"
    size: "22px"
  settings-notice-warning:
    backgroundColor: "{colors.settings-amber-wash}"
    textColor: "{colors.settings-amber-ink}"
    rounded: "{rounded.settings-tile}"
    padding: "10px 12px"
  settings-notice-alert:
    backgroundColor: "{colors.settings-error-wash}"
    textColor: "{colors.settings-error-ink}"
    rounded: "{rounded.settings-tile}"
    padding: "10px 12px"
  settings-live-badge:
    textColor: "{colors.muted}"
    rounded: "{rounded.control}"
    padding: "4px 10px"
    height: "34px"
  settings-live-badge-on:
    textColor: "{colors.settings-turquoise}"
  settings-live-badge-stale:
    textColor: "{colors.warning-foreground}"
---

# Design System: Esmer Market

## Selected Özet surface · Kontrol masası

The owner selected prototype C and its blue palette on 2026-10-03. This direction governs the monthly overview and its active shell. Other workspaces and the settings panel retain their existing rules below. The website logo replaces the text brand across the shared shell, using a packaged local image.

The first reading level is a four-column matrix of net sales, covered historical estimated cost, covered estimated gross profit, and the eligible operating result. The daily net-sales chart and category ranking occupy the main column. A narrow evidence column carries the blue 3D stack, cost coverage, source status, and method. Existing detailed reports remain below the overview.

Use cobalt `#2459d5`, ink `#182644`, muted ink `#5c6980`, separators `#dce3ee`, and white. Manrope Variable is packaged locally for this surface, including Turkish characters, with Segoe UI and system fallbacks. Amounts use tabular numerals. Blue indicates actions and selection; financial signs and evidence text retain their meanings.

The fixed-camera 3D stack selects sales, cost, or expense explanations. It never represents proportional amounts. Equivalent HTML buttons remain available during initialization failure or context loss. Render on demand at a bounded pixel ratio, with no automatic motion. Narrow windows stack the evidence column below the chart and use a two-column metric matrix.

The `MonthlyDisplay` report remains the authority for every amount, comparison, coverage state, chart height, and category share. Prototype fixtures and their comparison controls are excluded from the production entry. See [the implementation contract](workstreams/ozet-control-desk/CONTRACT.md).

## Overview

**Creative North Star: "The Quiet Market Ledger"**

This is a light desktop operating system for reading a market month without turning the work into a dashboard spectacle. White working space, soft zinc surfaces, charcoal actions, a restrained teal selection, and visible rules let the figures, evidence, and Turkish labels do the work.

The sidebar keeps the working context close while the content area stays broad, dense, and calm. Colour carries state sparingly: teal locates the current path, green and red support signed values, and amber keeps incomplete evidence visible. The system is intentionally light-only and uses native controls where they already serve the workflow.

**Key Characteristics:**

- Light zinc shell with charcoal primary actions and restrained teal selection.
- Segoe UI hierarchy, tabular figures, visible rules, and compact operational density.
- Native tables, selects, disclosures, and SVG trend chart retained beside three shared controls.
- Explicit warning, unavailable, synthetic, and report-evidence states.

### Settings surface — Glazed Tile Panel

**Scoped North Star: "The Glazed Tile Panel"**

Ayarlar is an approved second visual world, deliberately not consistent with the ledger. It is a panel of glaze-white çini tiles set in warm grout. Each tile is one job: a saturated glaze band names it, a round eight-point seal carries its condition, and its body holds only the facts and the next action. Colour is louder here than in the ledger, but it stays on the bands and seals; every pressable control in the panel is deep ink.

The world is scoped. Its tokens carry the `settings-` prefix and apply inside the settings page, plus the live badge in the sidebar footer. The Quiet Market Ledger remains the system for every other surface.

**Key Characteristics:**

- Glaze tiles separated by a 6px warm-grout gap on a grout page ground.
- Five glaze bands (ink, cobalt, turquoise, coral, saffron), one per job, with a seal and an optional status pill.
- Deep ink as the only colour on pressable controls; primary, outline, and quiet underlined variants.
- A coverage strip drawn to exact date proportion up to today, with a hatched coral gap.
- Segoe UI and tabular figures, inherited from the ledger.

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

### Settings surface — Glazed Tile Panel

The settings palette is glazed earthenware: warm grout and glaze-white for the material, deep ink for words and actions, and four saturated glazes that identify the tiles.

- **Glaze white** (`settings-glaze`): every tile surface.
- **Warm grout** (`settings-grout`): the page ground behind the panel, which shows through the gaps as grout lines.
- **Light grout** (`settings-grout-light`): inset wells within a tile: the coverage track, the view switch, the empty-coverage note, and history dividers.
- **Deep ink** (`settings-ink`, hover `settings-ink-hover`): text, the active-data and about bands, every pressable control, the focus outline, checked choices, and the source-coverage bar.
- **Soft ink** (`settings-ink-soft`): supporting copy, fact labels, and captions.
- **Cobalt glaze** (`settings-cobalt`): the import band and the cutoff marker on the coverage strip.
- **Turquoise glaze** (`settings-turquoise`): the live-connection band, the active entry in import history, and the sidebar live badge when the connection is on or checking.
- **Coral glaze** (`settings-coral`): the backup and recovery band and, at reduced alpha, the hatched coverage gap.
- **Saffron glaze** (`settings-saffron`): the display band. It is the only band that carries ink text instead of white.
- **Amber wash and amber ink** (`settings-amber-wash`, `settings-amber-ink`, seal disc `settings-amber-seal`): stale and failed state on the status pill, the seal, and the written warning note.
- **Error wash and error ink** (`settings-error-wash`, `settings-error-ink`): alert notes and failed import-history lines.
- **Choice line** (`settings-choice-line`) and **ink selection** (`settings-selection`): the resting border of text-size choices and the text-selection wash.

**The One Glaze Per Job Rule.** Each tile has exactly one glaze, and the glaze identifies the job. Ink is used for the active-data and about tiles; cobalt, turquoise, coral, and saffron are used only for import, live connection, backup, and display.

**The Ink-Only Controls Rule.** Pressable controls inside the panel are deep ink: filled, outlined, or underlined. Glaze colours never fill or outline a button, switch, or choice.

**The Amber Is Stale Rule.** Stale and failed state replaces the band's status pill and seal with amber and always arrives with a written line. Coral identifies the backup tile and the coverage gap; it never signals failure on its own.

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

### Settings surface — Glazed Tile Panel

The settings world keeps Segoe UI and steps its own ramp around the tile.

- **Settings display:** the "Ayarlar" page title, larger than the ledger headline, followed by one 15px intro sentence in soft ink.
- **Tile title:** the 20px/650 name in each glaze band, with a 13.5px band line beneath it, capped at 60ch.
- **Status pill:** 13px/600 condition text at the band's trailing edge.
- **Subhead and body:** 16px/650 for a named group inside a tile; 14px at 1.55 line-height for tile copy.
- **Facts:** 13px soft-ink labels over 17px/600 tabular values; secondary detail sits beneath at 13px/400.
- **Coverage lead:** the day count since the last record at 28px/650 tabular. When there is no gap, the sentence that replaces the count drops to 18px.
- **Actions:** 14.5px/600 on every pressable control in the panel; view-switch segments use 14px/600.

**The Counted Days Rule.** The coverage lead is the only large figure on the page. It counts days, not money, and it stays tabular.

## Layout

The desktop shell is a 208px sticky sidebar beside a flexible main area. The workspace is capped at 1660px and uses 28px top, 32px inline, and 48px lower padding. Reused spacing moves from 8px inside compact controls through 16px fields and 22–24px surface groups.

The monthly workspace uses a two-to-three-column grid: answer and daily trend first, a full-width attention row, then finance and category regions. At 1050px it becomes a single sequence. At 800px the sidebar becomes a wrapping top strip; at 650px summary and attention groups simplify to one column; at 500px the ledger values return beneath their labels. Dense tables scroll within their own region.

The evidence panel is 390px wide on large screens. At 1250px it becomes a fixed overlay with viewport-safe inset behavior. Popovers open beside their sidebar triggers and become fixed within the compact sidebar layout.

### Settings surface — Glazed Tile Panel

The panel is a six-column grid with a 6px grout gap. The page heading sits above it with the title and intro on the left and the close action at the trailing edge, wrapping when needed. The active-data tile spans all six columns. Import and live connection share the next course at three columns each. Backup, display, and about follow at two columns each. Each tile spans two subgrid rows, so bands and bodies align across a course regardless of band-line length.

Bands use 18px top, 20px inline, and 16px bottom padding; bodies use 18px top and 20px inline and bottom padding, with a 16px stack gap. Actions sit at the foot of the body with a 10px gap.

At 1050px, import and live each take the full width, backup and display share a course, and the last tile spans the full width. At 800px, the sidebar footer becomes a wrapping row alongside the compact sidebar. At 650px, every tile spans the full width and both band and body padding drop to 16px. The band is a size container: at 400px or narrower, the status pill moves under the band line instead of competing with the title.

**The Aligned Courses Rule.** Tiles in one course share subgrid rows. A longer band line pushes down every body in that course, never just its own.

## Elevation & Depth

The working surface is flat: borders and tonal differences establish ordinary structure. Only a popover, operations hub, or compact evidence panel receives depth, because it temporarily overlaps the ledger.

### Shadow Vocabulary

- **Sidebar overlay:** `0 8px 28px #20212426` for data and operations popovers.
- **Compact evidence panel:** `0 10px 32px #20212426` when the detail panel is fixed below the wide layout.

**The Overlap-Only Depth Rule.** Shadows explain an overlay. Standard cards, rows, and figures stay flat.

### Settings surface — Glazed Tile Panel

Tiles sit flat in the grout; the grout gap, not a shadow, separates them. The only depth is the glaze itself: each band carries a top-down white sheen and a hairline inner bottom edge, so it reads as fired glaze on the tile. The cutoff marker carries a 2px glaze-white ring so it stays visible where it crosses the ink coverage bar. In forced-colours mode, tiles gain a 1px `CanvasText` border, bands become `Canvas` with a `CanvasText` rule, and checked controls take a 2px `Highlight` border.

**The Glaze Is The Depth Rule.** Depth belongs to the band's glaze sheen. Tiles never take a drop shadow.

## Shapes

Controls and compact status markers use a 6px radius. Notices and attention groups widen to 8px; reusable workspace blocks, recovery sections, and overlays use 10px. Borders are fine and visible. Tables, ledgers, and charts are defined by alignment and separators rather than decorative containers.

### Settings surface — Glazed Tile Panel

Tiles, controls, notices, and size choices share one small tile corner (`settings-tile`). Inset pieces (the coverage track and its source bar, and view-switch segments) use the tighter `settings-track` corner. Status pills are fully round (`settings-pill`). The seal is a 22px circle with a 1.5px rim and an eight-point star built from two overlaid 8px squares, one rotated 45°; in the sidebar badge it shrinks to 14px with 5px squares. Outline controls use a 1.5px ink border. The coverage gap is a 135° hatch of 2px coral lines every 7px.

## Components

### Button

The shared native button is the system's primary action primitive. It has a 40px minimum height, a 6px corner, 8px by 12px padding, and default, outline, ghost, link, and destructive variants. Default is charcoal with white text; outline keeps the paper surface and visible line; ghost stays quiet until hover. The normal palette uses the teal focus ring and the global 2px outline with a 3px offset; forced colours replace it with a 2px `Highlight` outline. Disabled actions reduce opacity and keep the not-allowed cursor.

### Input

The shared native input fills its available width with the same 40px minimum height and 6px corner. It uses paper, the input border, readable foreground text, placeholder muting, the teal focus ring, and the same global outline policy as buttons. Native selects and textareas retain the same visual family through the global stylesheet.

### Badge

The shared native span badge is a compact 12px status marker with 4px by 8px padding and a 6px corner. Default, secondary, outline, destructive, and warning variants cover the build's reusable status language. Warning is reserved for the amber evidence state.

### Native Working Elements

Tables, select controls, `details` disclosures, and the existing SVG chart remain native or purpose-built. They are not replaced with generated data, select, disclosure, or chart frameworks; their existing state ownership and interaction semantics are part of the system.

### Settings surface — Glazed Tile Panel

These components belong to the settings world and are styled only inside the settings page, except the sidebar live badge.

#### Tile

One job per tile: a glaze band on top and a glaze-white body below, clipped to the tile corner. The band places the seal at the leading edge, the name and band line in the middle, and an optional status pill at the trailing edge. The status pill is a translucent dark wash on the band (an ink wash on saffron); stale and failed states switch it to amber. The body stacks facts, notes, and an action row anchored to the foot.

#### Seal

A round eight-point-star seal that carries the tile's condition without a glyph icon. It is a filled disc with a star cut out in the band colour when the state is on, ready, pending, or running. It turns amber with an amber-ink star when stale or failed, has a dashed rim when unknown, and is an open rim with a solid star when off, empty, or not set up. While checking or running, it rotates once every 2.4s (linear). State changes fade the disc and star over 240ms. Under reduced motion, the rotation stops.

#### Pressable Controls

Deep ink only, with a 42px minimum height, 9px by 16px padding, and the tile corner.

- **Primary:** ink fill with white text; the hover state deepens to the ink-hover tone. One primary action per tile.
- **Outline:** transparent, with a 1.5px ink border and ink text; hover adds a 7% ink wash. It is also used for the "Ayarları kapat" close action in the heading.
- **Quiet:** borderless underlined ink text with 4px inline padding, 1px underline offset 4px, thickening to 2px on hover. Used for secondary configuration.
- **States:** colours transition over 160ms ease-out; press nudges down 1px over 120ms; disabled drops to 45% opacity with a not-allowed cursor. Focus is a 2px ink outline with a 3px offset everywhere in the panel.

#### Coverage Strip

A 16px light-grout track drawn to exact date proportion from the start of the data to today. The ink bar marks the source span, with a 4px minimum width. A 4px cobalt marker with a glaze-white ring marks the financial cutoff. Hatched coral fills the gap from the last record to today. The coverage lead above states the gap in days, and a tabular caption below labels the start and "Bugün". The track is an image with a full Turkish accessible description. Without data, it is replaced by a light-grout note.

#### View Switch

A segmented pair in a light-grout well with 4px padding and a 4px gap. Segments are transparent at rest with a 7% ink wash on hover; the pressed segment (`aria-pressed`) fills with ink and white text. Background and text transitions take 180ms ease-out.

#### Text-Size Choices

Three radio tiles in an auto-fit grid (96px minimum, 8px gap) under a 14px/600 legend. Each tile is white with a 1.5px choice-line border. It previews "Aa" at 17px, 21px, or 26px above its label. Hover turns the border ink; the checked choice fills with ink and white text. The native radio covers the tile invisibly, so focus shows as the ink outline on the tile. While preferences load, the group is disabled at 50% opacity with a progress cursor.

#### Notes and History

Warning notes use the amber wash and amber ink; alert notes use the error wash and error ink; both have 10px by 12px padding. Import history is a native disclosure with a CSS chevron that rotates over 180ms. Inside, the history list scrolls at 240px, has a 96px date column and light-grout row rules, shows the active entry in turquoise, and shows failure detail in error ink.

#### Sidebar Live Badge and Ayarlar Entry

The sidebar footer holds a full-width live badge above the Ayarlar entry. The badge is a 34px transparent button with 13px text and a 14px seal. Its text is muted when off, turquoise when on or checking, and incumbent warning amber when stale, with a darker amber seal. Hover adds a 6% ink wash, and focus is a 2px ink outline with a 2px offset. Its status changes are announced politely. The Ayarlar entry is the incumbent ghost navigation button with a stroked slider icon; it is marked as the current page while settings are open. At 800px, the footer wraps into a row and the badge shrinks to its content.

#### Motion

The panel has one entrance movement: the coverage gap reveals left to right with a clip-path inset over 900ms on `cubic-bezier(.16, 1, .3, 1)` after a 160ms delay. Everything else is state feedback: 120–240ms ease-out transitions and the checking seal's rotation. Reduced motion removes both the reveal and the rotation.

## Do's and Don'ts

### Do:

- **Do** keep the period, cutoff, synthetic identity, and evidence state readable where the owner works.
- **Do** use the light paper-and-zinc surfaces, visible separators, and tabular figures to support scanning.
- **Do** use teal for the current path and keyboard focus, and pair positive, negative, and amber colour with written context.
- **Do** preserve native table scrolling and disclosure behavior when extending an existing workflow.

### Don't:

- **Don't** restore the superseded navy rail or dark component variants. Cobalt actions are authorized within the selected Özet surface.
- **Don't** use teal, green, or red alone to assert financial meaning.
- **Don't** replace missing evidence with a zero or hide it to make a compact view cleaner.
- **Don't** add a generated control framework where the native table, select, disclosure, or chart already owns the task.

### Settings surface — Glazed Tile Panel

The ledger Do's and Don'ts above govern surfaces outside settings and the selected Özet control desk. The deep ink and cobalt here are scoped to the settings panel; they do not restore the superseded navy rail or blue action system elsewhere. Inside the panel, the ink focus outline replaces the teal ring.

#### Do:

- **Do** give each settings job its own tile, glaze, seal, one plain band line, and only its next action.
- **Do** keep every pressable control deep ink: primary fill, 1.5px outline, or quiet underline.
- **Do** pair every stale, failed, or unknown seal with written state in the status pill or a note.
- **Do** draw the coverage strip to true date proportion up to today and state the gap in days.
- **Do** align tiles within a course on shared subgrid rows and keep the 6px grout gap at every width.

#### Don't:

- **Don't** fill or outline a button, switch, or choice with cobalt, turquoise, coral, or saffron.
- **Don't** carry glaze tokens, the grout ground, or tile bands onto ledger workspaces; only the sidebar live badge leaves the settings page.
- **Don't** give tiles a drop shadow; the grout gap and the band's glaze carry the depth.
- **Don't** imply financial meaning for source rows on a tile or the coverage strip; source coverage stays labelled as record counts.

## Sales, purchasing, expenses and reports extension

The user approved the overview visual system for all four workspaces on 2026-10-03. These pages inherit its white ground, cobalt actions, Manrope Variable typography, fine separators and evidence rail. The selected structures and data boundaries are recorded in [the workspace contract](docs/contracts/page-control-desks.md). Each page owns a distinct procedural 3D object and accessible task controls. Geometry never encodes financial values. Settings keeps the Glazed Tile Panel and the overview keeps its existing object.

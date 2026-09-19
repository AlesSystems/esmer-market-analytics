---
name: Esmer Market sales journey prototype
description: Temporary visual record of the unselected A/B/C wireframes
colors:
  accent: "#285847"
  ink: "#243a32"
  muted: "#59665f"
  workspace: "#f4f5f1"
  surface: "#fff"
  line: "#d5dcd6"
  control-border: "#9caea2"
  selected: "#eaf1ec"
  control-active: "#dbe7df"
  warning-surface: "#fff7e8"
  warning-text: "#674b1c"
  trend: "#759686"
typography:
  body:
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    fontSize: "14px"
  headline:
    fontSize: "1.9rem"
    fontWeight: 650
    lineHeight: 1.2
    letterSpacing: "-.025em"
  title:
    fontSize: "1.1rem"
    fontWeight: 650
  metric:
    fontSize: "2rem"
    fontWeight: 650
    lineHeight: 1.3
    letterSpacing: "-.035em"
rounded:
  control: "5px"
  container: "7px"
spacing:
  control-gap: "8px"
  container-inset: "20px"
  section-gap: "24px"
  workspace-gap: "26px"
components:
  button:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "9px 12px"
  button-hover:
    backgroundColor: "{colors.selected}"
  button-active:
    backgroundColor: "{colors.control-active}"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "8px 10px"
  container:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.container}"
    padding: "{spacing.container-inset}"
---

# Design System: Esmer Market sales journey prototype

## Overview

**Prototype scope only.** This is an extracted record of the throwaway clickable wireframe in this worktree, not an approved production identity. No A/B/C variant has been chosen. It inherits the existing system-sans/green shell in Operate mode; its denser controls and tables do not replace the production shell's styles.

The [direction contract](docs/superpowers/specs/2026-09-19-sales-prototype-brief.md) and [confirmed journey](docs/superpowers/specs/2026-09-18-phase-5-sales-ui-design.md) govern this experiment. The implementation references are [prototype CSS](src/ui/sales-prototype.css), [prototype UI](src/ui/sales-prototype.tsx) and [existing shell](src/ui/style.css). The frontmatter records current prototype values only. No new creative metaphor, brand system or owner preference is approved.

## Colors

Restrained green marks navigation and chart bars. Charcoal-green text sits on white content and a pale neutral workspace. Muted text carries supporting context; thin neutral lines divide tables and metrics. Pale green identifies selected scope. Amber warnings include explicit text and never depend on color alone.

## Typography

One installed system-sans stack serves headings, controls and tables. The headline and title roles establish a compact desktop hierarchy. Financial values use tabular figures; right-aligned amounts retain their Turkish formatting and currency/unit labels. The metric token describes variant A's wide layout; B uses smaller values and C an intermediate size. These differences are experimental density choices.

## Layout

The workspace is centered at a maximum width of 1600px, with 36px horizontal padding on wide windows. Period, breadcrumbs and source cutoff remain above the investigation. Tables may scroll horizontally.

- **A:** horizontal three-metric strip, then trend and category table in a 1:1.2 split.
- **B:** compact metric rows, then category table and trend in a 1.65:1 split.
- **C:** 270px summary rail beside vertically ordered trend and categories.

The receipt/source panel is 420px wide beside the content on wide windows. At 1200px and below it becomes a fixed overlay. At 850px, A/B content stacks and C's rail narrows; at 600px, all compositions become one column. These are prototype observations, not accepted Windows display requirements.

## Elevation & Depth

Content surfaces are flat, separated by borders and background tone. Only the development switcher and narrow-window detail overlay have shadows. There are no animated transitions or imagery. No shipping raster assets require provenance.

## Shapes

Controls and notices use modest corners; content blocks and the detail panel use slightly larger corners. Table links and breadcrumbs are flat, underlined or clearly interactive. Native inputs, selects and disclosure controls retain familiar operation.

## Components

- **Buttons and fields:** bordered white controls, pale hover/pressed states, and a visible green focus outline. Disabled buttons lower opacity. Search has a visible text label.
- **Metrics and tables:** values lead; definitions, comparison boundaries and evidence status remain adjacent. Category and product names are buttons that continue the journey.
- **Trend:** three labelled bars share a baseline and represent the synthetic daily values proportionally. Numeric labels and an accessible description supplement the bars.
- **Notices:** neutral context and amber discrepancies wrap text rather than hiding it. Status is written explicitly.
- **Receipt/source panel:** full document lines, highlighted matching scope, separate document and scoped totals, and a source explanation with technical details behind a native disclosure. Close/back controls preserve navigation context.
- **Prototype controls:** the fixed A/B/C switcher and scenario selector belong only to the development experiment. They are not proposed production navigation.

## Do's and Don'ts

- **Do** preserve the Turkish labels, keyboard focus, units and visible synthetic-data warning when modifying this prototype.
- **Do** compare compositions using the same fixture and journey state.
- **Don't** treat these extracted values or an unselected variant as a durable production decision.
- **Don't** infer verified financial behavior, production acceptance or Windows validation from a clickable wireframe.

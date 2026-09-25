---
name: Esmer Market UI comparison prototype
description: Provisional statement, sidebar and ledger variants; prototype scope only.
colors:
  shell: "#0B1830"
  ink: "#10213A"
  paper: "#FFFFFF"
  canvas: "#F3F5F8"
  action: "#0057D9"
  positive: "#147D52"
  negative: "#B42318"
  attention-text: "#805600"
  muted: "#475569"
  divider: "#DCE2EA"
typography:
  body:
    fontFamily: "Segoe UI, Arial, sans-serif"
    fontSize: "15px"
  status:
    fontFamily: "Segoe UI, Arial, sans-serif"
    fontSize: "14px"
    fontWeight: 500
  display:
    fontFamily: "Segoe UI, Arial, sans-serif"
    fontSize: "clamp(36px, 4.5vw, 60px)"
    fontWeight: 650
    lineHeight: 1.1
    letterSpacing: "-0.04em"
rounded:
  control: "4px"
  sheet: "5px"
spacing:
  desktop-gutter: "44px"
  narrow-gutter: "20px"
components:
  button-primary:
    backgroundColor: "{colors.action}"
    textColor: "{colors.paper}"
    rounded: "{rounded.control}"
    padding: "10px 15px"
---

# Design System: Esmer Market prototype

## Overview

Provisional direction: a financial statement with a clear first answer and inspectable evidence. These are observed prototype choices, not a user-approved brand system. A is the recommended fit to the brief; B tests sidebar/two-column navigation and C tests a dense ledger. The final preference remains open.

## Colors

Navy anchors the shell; ink on white carries figures, with cool gray around the content. Blue means action or selection, never financial gain. Green and red accompany signed movements and words. Attention text uses the darker `attention-text` token for short warning statuses; the brief's amber target is not treated as measured acceptance.

## Typography

Segoe UI supports the Windows context and Turkish copy. Body text is 15px; statuses and secondary labels are 14px. Tabular numerals align financial comparisons. A's net-sales amount leads at up to 60px; B uses 46px and C uses a 24px headline ledger row. Narrow A uses 46px. Page titles are 29px, reducing to 26px below 760px.

## Layout

A uses a 1440px maximum content width and 44px desktop gutters. B uses a 235px sidebar and 34px content gutters; at 1100px the sidebar becomes 215px and its two-column statement stacks. C limits content to 1320px. Below 760px, navigation wraps, content stacks and gutters become 20px. Wide ledgers scroll inside their own region. Evidence drawers use up to 610px and become full-width in narrow windows.

## Elevation & Depth

Content sheets are flat, divided by borders. Shadows identify the temporary evidence drawer, toast and prototype switcher. These overlays do not redefine the production app's elevation system.

## Shapes

Controls and notices use 4px corners; sheets use 5px, tags 3px and the temporary prototype bar 8px. Visible dividers establish rows. There are no decorative gradients or glass surfaces.

## Components

Primary buttons use blue with white text; their hover is darker blue. Keyboard focus is a 3px outline with 4px offset, with a lighter outline in the navy shell. Status links open evidence adjacent to each figure. Missing cost, incomplete expenses and unknown settlement stay explicit. Drawers retain a close/back path; the prototype implements focus handling and reduced-motion styles. Expense and restore flows use three steps, with consequences beside confirmation. All controls change demonstration state only.

## Do's and Don'ts

- Do retain the selected period, actual fixture cutoff and synthetic label.
- Do distinguish scope contribution, full receipt total and per-metric evidence status.
- Do preserve Turkish presentation, TRY and explicit unavailable states.
- Don't imply calculated or verified profit from these hard-coded fixtures.
- Don't promote this local design record to the production system without the user's decision and implementation verification.
- Don't treat CSS viewport checks as Windows scaling, forced-colors or packaged-app acceptance.

---
name: Esmer Market
description: A clean light desktop answer sheet for one market owner: three top tabs, one azure accent, every figure in one place.
colors:
  page: "#f5f7fa"
  card: "#ffffff"
  ink: "#18212e"
  ink-muted: "#5b6472"
  line: "#e3e7ee"
  edge: "#c5ccd6"
  field: "#8792a2"
  soft: "#eef1f5"
  hover: "#f2f5f9"
  track: "#e7ebf1"
  mute: "#a3abb7"
  accent: "#0b6bcb"
  accent-hover: "#0959ab"
  accent-wash: "#e9f2fc"
  accent-selection: "#d4e6f8"
  chart-bar: "#5b97d9"
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
  topbar: "64px"
components:
  tab:
    backgroundColor: "transparent"
    textColor: "{colors.ink-muted}"
    typography: "{typography.body}"
    padding: "0 14px"
    height: "64px"
  tab-active:
    textColor: "{colors.ink}"
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.card}"
    rounded: "{rounded.md}"
    padding: "0 18px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.accent-hover}"
  button-secondary:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0 18px"
    height: "44px"
  button-secondary-hover:
    backgroundColor: "{colors.hover}"
  button-top:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0 14px"
    height: "40px"
  chip-trust:
    backgroundColor: "{colors.soft}"
    textColor: "{colors.ink-muted}"
    rounded: "{rounded.full}"
    padding: "0 12px 0 9px"
    height: "32px"
  chip-trust-open:
    backgroundColor: "{colors.accent-wash}"
    textColor: "{colors.accent-hover}"
  card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    padding: "24px 28px"
  card-hero:
    backgroundColor: "{colors.card}"
    rounded: "{rounded.xl}"
    padding: "28px 32px 22px"
  inset-tile:
    backgroundColor: "{colors.page}"
    rounded: "{rounded.lg}"
    padding: "16px 18px 14px"
  inset-tile-missing:
    backgroundColor: "{colors.warn-wash}"
    textColor: "{colors.warn}"
  input-search:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0 42px"
    height: "46px"
  segmented:
    backgroundColor: "{colors.track}"
    textColor: "{colors.ink-muted}"
    rounded: "{rounded.md}"
    padding: "3px"
  segmented-selected:
    backgroundColor: "{colors.card}"
    textColor: "{colors.accent}"
    rounded: "{rounded.sm}"
    height: "36px"
  month-stepper:
    backgroundColor: "{colors.soft}"
    rounded: "{rounded.md}"
    padding: "3px"
    height: "40px"
  menu:
    backgroundColor: "{colors.card}"
    rounded: "{rounded.xl}"
    padding: "8px"
    width: "352px"
  drawer:
    backgroundColor: "{colors.card}"
    width: "440px"
  ledger-row-selected:
    backgroundColor: "{colors.accent-wash}"
    height: "48px"
---

# Design System: Esmer Market

## Overview

**Creative North Star: "The Clean Counter"**

The owner approved this world on 2026-10-29 (prototype B, "Üç sekme") and it replaces every earlier look. A cool off-white page, white cards that lift on a faint shadow, near-black ink, and one azure accent for action, selection and focus. It reads like a tidied shop counter: the answer is laid out in front of Eralp, and everything else is a step behind a click.

Structure follows one rule: each figure has one home. Bu ay gives one sentence and one large gross-profit figure, then up to four attention rows and the net state. Ürünler is a sortable ledger with a push drawer. Giderler shows four group totals built from the stored lines. Explanations (how it was calculated, why it is an estimate, what the app cannot know) sit behind a popover, the gear menu or an overlay instead of repeating as captions. Colour never carries a figure on its own: green and red belong to gain and loss, amber to warnings, and an unknown amount is written "bilinmiyor", never drawn as zero.

**Key Characteristics:**
- Three top tabs (Bu ay, Ürünler, Giderler); no sidebar, no welcome page, no dashboard of KPI tiles.
- One azure accent, rare by design; semantic colours only for gain, loss and warning.
- Soft tonal cards over a cool page; no card borders at rest; shadows are ambient.
- Figtree, packaged locally, tabular numerals everywhere; the large figure is the only loud type.
- Native buttons, tables, disclosures and flat 2D SVG marks; unknowns stay visible and distinct from zero.
- Settings are a gear popover; recovery, live connection and source documents are full-page overlays with "Ana sayfaya dön".

History: the market-ledger (green rail, paper, Manrope), Özet control desk, welcome stage and Glazed Tile settings worlds are gone from the code and are not rules here. The 2D-only rule for quantitative marks (no perspective or 3D, owner request 2026-10-03) carries over. The packaged macOS review of 2026-10-22 described the superseded world; Windows acceptance is still a separate gate.

## Colors

A cool neutral page and white cards, one azure, and three signal colours kept for meaning.

### Primary
- **Counter Azure** (`accent`, #0b6bcb): action, selection and focus. Primary button, active tab underline, current-month bar, margin line, selected segment text, links, focus ring, text caret, form accent.
- **Deep Azure** (`accent-hover`, #0959ab): hover for the azure button and links; text on a washed selection.
- **Azure Wash** (`accent-wash`, #e9f2fc): the selected ledger row, an open chip, the hovered chip.
- **Azure Selection** (`accent-selection`, #d4e6f8): text selection only.
- **Chart Azure** (`chart-bar`, #5b97d9): past-month bars, margin bars and the bridge totals; the current month takes the full azure.

### Neutral
- **Cool Page** (`page`, #f5f7fa): the app background, table header ground, inset tiles and the drawer's fact blocks.
- **Card White** (`card`, #ffffff): top bar, cards, menus, drawer, popovers.
- **Counter Ink** (`ink`, #18212e): headings, figures, body on cards.
- **Soft Ink** (`ink-muted`, #5b6472): supporting text, table headers, inactive tabs and labels.
- **Hairline** (`line`, #e3e7ee): dividers between rows, sections and the top bar.
- **Control Edge** (`edge`, #c5ccd6): secondary button outline and scrollbar thumbs.
- **Field Edge** (`field`, #8792a2): input borders, the zero line and dashed empty bars; dark enough for a 3:1 boundary.
- **Soft Fill** (`soft`, #eef1f5): month stepper and chip ground.
- **Hover Fill** (`hover`, #f2f5f9): row and menu hover.
- **Track** (`track`, #e7ebf1): segmented control well and margin-bar track.
- **Mute** (`mute`, #a3abb7): decorative or disabled marks only (the attention chevron, a disabled month step); never text a reader needs.

### Signal
- **Gain Green** (`gain`, #0f7b51) and **Loss Red** (`loss`, #bf2f2a, wash `loss-wash` #fdecea): a gain or a loss, nothing else. Loss colours a negative figure, a loss chip and a negative bar; a positive figure stays ink.
- **Warning Amber** (`warn`, #965a00; wash `warn-wash` #fff4e2; edge `warn-line` #ecd2a0): missing data, a blank expense group, a stale confirmation, a loss-of-margin chip. The amber hatch marks an unknown amount in the bridge.

### Named Rules
**The One Azure Rule.** Azure marks what can be pressed, what is selected and where focus is. It is never decoration, and no second accent exists.
**The Signal Rule.** Green and red mean gain and loss, amber means attention. A figure that is merely large or important stays ink.
**The Unknown Is Not Zero Rule.** A missing amount is "bilinmiyor" in soft ink or an amber tile, never a zero and never a bar of height zero; the empty bar is a dashed outline.

## Typography

**Display, headline and body font:** Figtree Variable (with Segoe UI, system-ui, sans-serif), packaged locally in latin and latin-ext, weights 300–900 available, 400–700 used.

**Character:** A friendly geometric sans with open numerals; hierarchy comes from size and weight, with tight tracking only on large figures. Tabular numerals are on for the whole body so columns of money line up. Text size is the owner's Electron zoom preference (Normal, Büyük, Çok büyük); the scale is `--base` (16px) multiples, so sizes stay proportional.

### Hierarchy
- **Hero** (700, 3.5rem / 56px, 1.05, -0.03em): the single gross-profit figure on Bu ay; the kuruş part is set at .5em in soft ink. 2.75rem under 560px.
- **Net** (700, 2.25rem / 36px, 1.15, -0.02em): Tahmini net kâr.
- **Headline** (700, 1.75rem / 28px, 1.2, -0.02em): page and overlay `h1`, the drawer product name; expense group amounts scale between 1.125rem and 1.75rem with their tile.
- **Lead** (500, 1.25rem / 20px, 1.4): the one-sentence answer under which the hero figure sits; also the net-same line at 700.
- **Title** (700, 1.125rem / 18px, 1.35, -0.01em): card `h2`, drawer facts values.
- **Body** (400, 1rem / 16px, 1.5; 1.6 in paragraphs): table cells in the ledger, rows, forms. Paragraphs run at most about 64–84ch.
- **Label** (600, 0.875rem / 14px, 1.5): table headers, buttons in tables, chips, captions (`small`), menu sub-lines. No uppercase, no wide tracking.
- **Chart label** (600, 13px; axis labels 13px) and **chart tick** (400, 12px): inside SVG only.

### Named Rules
**The One Loud Figure Rule.** Only one figure per page is set in Hero or Net size. Everything else steps down to Title or Body.
**The Quiet Label Rule.** Labels are sentence case at 14px/600. No kickers, no eyebrows, no uppercase tracking.

## Layout

A sticky 64px top bar (logo, three tabs, then month stepper, "Excel’e aktar" and the gear) over a single centred workspace, 1248px max, 24px side padding, 28px top and 56px bottom. Pages are two-column grids of cards with a 20px gap: Bu ay is 7fr / 5fr (hero and attention left; net and six-month bars right); Giderler stacks full-width cards with a four-up tile grid of group totals; Ürünler is one full-width ledger card.

Spacing runs on a 4/8/12/20/28 rhythm: card padding 24–28px, tile padding 16–18px, control gaps 8–14px. Cards never nest; inset tiles on the page tone sit inside them. The drawer is a non-modal push panel (440px) that gives the workspace room instead of covering it; below 760px it starts at the top of the window.

Responsive: under 1360px with the drawer open the ledger drops its margin-bar column and the toolbar re-flows; under 1060px the top bar buttons collapse to icons; under 920px the Bu ay columns stack (hero, net, chart) and the attention detail column hides, Giderler tiles go two-up; under 760px the tabs wrap onto a second 48px row; under 560px tiles go single-column and padding shrinks. Wide tables scroll inside their card.

## Elevation & Depth

Tonal layering with ambient shadow. The page is the lowest tone, cards are white and lifted by one soft two-layer shadow, and transient surfaces (popovers, the gear menu, toasts, the leave-draft prompt) carry a larger one. Cards have no border; hairlines only divide inside them.

### Shadow Vocabulary
- **Card** (`box-shadow: 0 1px 2px rgb(16 24 40 / .06), 0 8px 24px rgb(16 24 40 / .06)`): every card, state panel and note.
- **Popover** (`box-shadow: 0 2px 6px rgb(16 24 40 / .08), 0 18px 44px rgb(16 24 40 / .14)`): trust and bridge popovers, gear menu, toast, leave prompt.
- **Drawer** (`box-shadow: -2px 0 6px rgb(16 24 40 / .05), -18px 0 48px rgb(16 24 40 / .12)`): the product drawer's left edge.
- **Selected segment** (`box-shadow: 0 1px 2px rgb(16 24 40 / .1), 0 2px 6px rgb(16 24 40 / .05)`): the raised white thumb in a segmented control and the hovered month step.

### Named Rules
**The Ambient Shadow Rule.** Shadows are soft, blurred and low-contrast (cool ink at 5–14%). No hard offsets, no coloured glows. In forced-colors mode every elevated surface gets a 1px outline instead.

## Shapes

Gently rounded and consistent: cards 14px, popover menu 14px, inset tiles and notes 12px, buttons, inputs, steppers and segmented wells 10px, selected segment thumbs and menu rows 8px, small chips 999px, bars, the tab underline and margin-bar fills 3px (`bar`), bridge bars 4px. Corners are always rounded, never sharp, and never a pill except chips. Quantitative marks are flat 2D: rounded-rectangle bars with a 3px radius, a 2.5px azure line with white-filled dots, a dashed outline for an empty month, and an amber hatch for an unknown amount.

## Components

### Top bar and tabs
- A white bar, 1px hairline below, 64px high. Logo image left (30px tall), tabs, then tools right.
- **Tab:** 16px/600 soft ink; hover or current turns ink. The current tab has a 3px azure underline pinned to the bar's bottom edge, inset 10px each side. Focus ring sits inside the tab.
- **Month stepper:** soft-fill 40px group, chevron steps (34px) and a 112px bold label; a step beyond the data range stays visible but is aria-disabled in mute.

### Buttons
- **Primary** (`btn btn-primary`): azure, white text, 44px, 10px radius, 16px/600, a 1px azure-tinted shadow; hover deep azure. One per view.
- **Secondary** (`btn btn-secondary`): white with an inset 1px edge ring; hover hover-fill with field-edge ring.
- **Top-bar button** (`btn-top`): 40px; below 1060px it collapses to an icon.
- **Link** (`link`): azure 16px/600 text button, underline on hover; inline variant underlines at 40% azure.
- **Icon button:** 40px, soft ink, soft-fill on hover and while its menu is open.
- Disabled is 50% opacity, `not-allowed`.

### Chips and popovers
- **Trust chip:** 32px pill on soft fill with an info icon and "Tahmini"; hover or open turns azure wash. Opens a 380px popover under it that discloses the estimate once per page. "Nasıl hesaplandı?" is a link-style trigger opening the calculation bridge.
- **Popover:** white, 12px radius, popover shadow, 14px text; Escape closes and returns focus to the trigger.

### Cards / containers
- **Card:** white, 14px radius, card shadow, 24px 28px padding; `h2` with a 12px margin. The Bu ay hero card is 28px 32px.
- **Inset tile:** page-tone block, 12px radius, 16px 18px padding, used for Giderler group totals and the drawer's three facts. A missing group becomes an amber tile with an amber hairline above its hint.
- **State panel:** card shape, 640px max, for loading, empty and unavailable messages with a primary or outline action.
- **Note:** a soft card strip; the warning variant is amber wash with no shadow.

### Ledger and tables
- **Products ledger:** header row sticky and white, 44px; body rows 48px, 16px text, hairline dividers; the whole row is the target but the name is the real button. Row hover is hover-fill; the selected row is azure wash and its name turns deep azure. Money is right-aligned and tabular; an unknown cost spans the profit and margin cells in italic soft ink.
- **Margin bar:** a 6px track with a 3px-radius fill in chart azure (loss red when negative), capped at 140px.
- **Loss and drop chips:** 22px pills beside a product name, red wash or amber wash.
- **Sort button:** text button in the header; the active column goes ink-bold with an azure arrow.

### Inputs / fields
- **Search:** 46px, 10px radius, 1px field-edge border, 16px text, a leading search icon and a trailing clear button; focus turns the border azure with a 2px azure outline.
- **Form fields** (expense forms): 44px, field-edge border, 10px radius; hover darkens to soft ink; focus azure; invalid red border plus red message text.
- **Segmented control:** a track-tone well of 36px buttons, selected shown as a white raised thumb with azure text and the count in azure. Used for the product filter and for text size.

### Navigation
- Top tabs only. Bu ay attention rows are full-width buttons that jump to a product or to the missing-cost filter, with a chevron that turns azure on hover.
- **Gear menu:** a 352px white popover with 10px-rounded rows: Veri paketi içe aktar, Yedekle / Geri yükle, Yazı boyutu (segmented), Canlı bağlantı, Kaynak belgeler, Hakkında ve bilinen sınırlar. Rows show a soft-ink sub-line; "Hakkında" swaps the menu content in place with a back row. Escape returns focus to the gear.
- **Overlay page:** replaces the workspace under the same top bar with an "Ana sayfaya dön" secondary button, an `h1` and 640px panels.

### Product drawer
A white, 440px right push panel under the top bar. Sticky head with category, product name in Headline, and a close icon; body has a lead sentence, three inset fact tiles (sale price, purchase cost, margin), conditional notes (red wash for a loss, page-tone for missing cost), a six-month margin line, and an outline "Kaynak satırlar" button.

### Charts
Six-month gross-profit bars (past months chart azure, current month full azure, negative red, empty months a dashed outline with the zero line dashed in field-edge) and a margin line; the bridge in the "Nasıl hesaplandı?" popover is a labelled row list with a horizontal track, azure total bars, grey minus bars and the amber hatch for unknown.

## Do's and Don'ts

### Do:
- **Do** give every figure one home; link to it instead of repeating it.
- **Do** use `accent` (#0b6bcb) only for what can be pressed, what is selected and focus; keep one primary button per view.
- **Do** write unknown amounts as "bilinmiyor" in soft ink or an amber tile, and keep blank expense groups explicit until the owner confirms them.
- **Do** put explanations in the trust chip popover, "Nasıl hesaplandı?", the Hakkında menu or an overlay, not in always-visible captions.
- **Do** build new surfaces from `--page`, `--card`, `--line` and the shadow vocabulary above; size type with the `--t-*` scale so the owner's text-size setting works.
- **Do** keep tap and click targets at 40px or more, give every control a visible focus ring (2px azure, 2px offset) and keep forced-colors outlines.
- **Do** keep charts flat 2D, signed and unknown-safe.

### Don't:
- **Don't** bring back a sidebar, a welcome page, a four-section dashboard of KPI tiles or the dark-rail market-ledger look.
- **Don't** add a second accent or use green for anything but gain.
- **Don't** show a missing cost, expense or tax treatment as zero, in text or in a chart.
- **Don't** colour a figure red or green for emphasis; only gain and loss do that.
- **Don't** use hard offset shadows, glow, gradients on surfaces, or 3D.
- **Don't** add uppercase labels, kickers or eyebrows above headings.
- **Don't** repeat the same number on the same page in a card, a caption and a chart label.

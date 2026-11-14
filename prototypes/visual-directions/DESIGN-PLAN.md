# Comparable visual directions

Input: [resolved brief #142](https://github.com/AlesSystems/esmer-market-analytics/issues/142#issuecomment-6876635009) and [local brief](../../docs/prototypes/2026-11-14-visual-brief.md). These are hypotheses for project-owner review, not accepted preferences.

All directions use the same selected-month fixture, product examples and expense state. The prototype review controls sit outside the proposed application.

## A — Aylık çalışma alanı

Palette: plum `#6c3d78`, plum wash `#f1eaf4`, slate ink `#252b39`, cool page `#f4f5f8`, white `#ffffff`, grey rule `#e0e2e9`.

Figtree gives Turkish labels and tabular figures a consistent, open shape. A quiet vertical navigation anchors the store identity. Left-aligned headings and a broad monthly answer precede a two-column product/expense workspace; amounts align right.

```text
store / nav | month + tools
            | monthly answer             supporting amounts
            | product observations        expense next action
```

Memorable choice: a calm fixed navigation rail and generous proportions; plum appears on navigation and actions rather than quantitative meaning.

## B — Ayın hesabı

Palette: blue `#2457a6`, blue wash `#eaf0fa`, navy ink `#23344d`, page `#eef2f7`, white `#ffffff`, divider `#dce3ed`.

Figtree throughout, with slightly tighter headings and stronger numerical rows. A compact top navigation and centered statement align the month's facts in one reading sequence. The main result is a ruled statement row, not a hero tile. A product ledger follows the financial statement.

```text
store                 nav                  tools
             month / period
             sales ................ amount
             estimated gross ...... amount
             expense review ....... action
             product ledger
```

Memorable choice: the monthly statement is the organizing surface. This is an application statement, not a newspaper imitation: no serif display, dense columns or decorative rules.

## C — Odaklı görünüm

Palette: teal `#126b68`, pale teal `#e4f1ee`, ink `#203734`, pale grey `#f1f6f5`, white `#ffffff`, divider `#d9e6e2`.

Figtree keeps the same content comparable. A small top navigation opens a split workspace: one broad answer and product observations on the left, a contextual expense panel on the right. Supporting amounts sit beneath the answer as an aligned line rather than repeated KPI cards.

```text
store                     compact nav / tools
month
monthly answer / context            next expense action
sales / cost / margin               recorded expenses
product observations                review status
```

Memorable choice: a clear answer/action relationship across the split, with the expense step visible beside the result.

## Pre-build critique and revision

A generic grid of equal KPI cards would obscure the relation between the main result and the remaining work, so it is excluded. A palette swap would not test composition; each direction changes the position of navigation, the monthly-answer structure, and the product/expense relationship. Decorative charts are omitted because this first decision needs populated tables and clear financial states more than another historical graph. Each direction uses one accent plus written semantic labels; red is reserved for an actual loss. No gradients, external photography, stock avatars, invented activity feeds or marketing copy.

The first implementation checks a real monthly transition through the browser UI. Later checks cover explanations, literal zero/loss/unknown/partial states, representative product detail, focus return and narrower/larger-text layouts. Aesthetic selection stays with the project owner.

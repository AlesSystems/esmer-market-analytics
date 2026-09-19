# Throwaway sales journey wireframe

Question: Can the owner follow monthly sales through categories/products, transactions, receipt lines and source evidence without losing context?

This is a development-only exploration on `codex/phase-5-ui-prototype`. It is not the Phase 5 implementation, a real report, or a chosen visual identity. No production entry imports it. All values are synthetic, precomputed examples; no source, database, storage or external service is accessed. Refreshing the browser resets the journey; the variant remains in the URL.

## Run

From this worktree, after `npm ci --ignore-scripts`:

```sh
npm run prototype:sales
```

Open [the wireframe](http://127.0.0.1:4175/?variant=A). The preview binds only to 127.0.0.1. Stop its terminal with Ctrl+C. Restart after editing (no watch server).

- A — Dengeli özet: metric strip with trend/category split.
- B — Yoğun tablo: compact metric rows, broad category ledger and smaller trend.
- C — Rehberli okuma: summary rail next to the trend/category reading area.

Use the bottom arrows or keyboard left/right to change variants. The shortcut does not intercept text inputs, selects, disclosures or editable content. Layout switching preserves the open journey.

## Try the journey

1. Choose `İçecekler`, then `İçme suyu · 1,5 L`.
2. Open `DEMO-S002`: the selected product contributes 60,00 ₺, while the document totals 130,00 ₺ net.
3. Open the water line's `Kaynak detayını göster`: source `DEMO-S002 / L003`, batch and method remain visible.
4. Return to the document, close the panel, and use the category breadcrumb to choose `Maden suyu · 200 ml`.
5. Filter to `Müşteri iadeleri` and inspect the −35,00 ₺ return.
6. Try `Belge farkı` and `Yeni veri sürümü` in the prototype-only scenario control.

Search is across the four synthetic products. August has no detailed report in this fixture. Empty, loading and failure scenarios can be reset with their visible controls. The v2 notice demonstrates a pinned v1 report; it does not implement importing or accepting revisions.

## Fixture reference

| Example | Net | Recorded KDV | Gross |
| --- | ---: | ---: | ---: |
| S001: water 40 + bread 30 | 70.00 | 3.50 | 73.50 |
| S002: water 60 + soda 70 | 130.00 | 6.50 | 136.50 |
| S003: bread 120 + apples 80 | 200.00 | 10.00 | 210.00 |
| R001: soda return | -35.00 | -1.75 | -36.75 |

Net sales are 365.00; three completed sales total 400.00 before returns; average basket is 133.33 at display precision. Net quantities are 11 pieces and 2 kg. Category amounts are bread 150, drinks 135 and produce 80. These recorded KDV examples assert no jurisdictional tax rule.

Comparison summaries are fixed illustrative values: previous month net 320, three completed sales totaling 360; previous year net 300, two completed sales totaling 320. Category prior-month net values are 140/110/70 (bread/drinks/produce); products are 140/80/70/30 (bread/water/apples/soda). All comparisons use matched first-three-day boundaries; historical detail is not supplied.

The discrepancy scenario changes S002's header net to 132.00, leaves its lines at 130.00 and shows incomplete reconciliation. It deliberately preserves the line-based report and exposes the difference.

## Repeat the focused check

Keep the preview running. With Playwright's Chromium installed:

```sh
npm run prototype:check
```

The same exported check was executed against all three variants through the Codex browser adapter. It covers scope/full totals, drill-down, source identity, preserved variant state, return filtering and discrepancies. This is a small prototype smoke check, not the application's test suite or Windows acceptance.

## Outcome

The journey is runnable for review. A preferred variant has not been selected; no prototype code should be promoted directly into production. Keep the decision and rewrite the implementation against real report contracts after the design choice.

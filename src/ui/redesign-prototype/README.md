# UI redesign prototype

Throwaway design comparison on `codex/ui-redesign-prototype`, scoped to the [redesign brief](../../../docs/superpowers/specs/2026-09-25-ui-redesign.md). This standalone entry uses in-memory synthetic fixtures only: no financial calculation engine, application services, database or persistence. Reloading resets the demonstration. All actions are simulated; no real export, import, backup or restore occurs.

Run from the repository root:

```sh
npm run prototype:ui
```

The static preview listens only on `127.0.0.1:4178`. Open [A](http://127.0.0.1:4178/?variant=A), [B](http://127.0.0.1:4178/?variant=B) or [C](http://127.0.0.1:4178/?variant=C). The bottom controls and left/right arrow keys also change the variant. Its standalone HTML/JS/CSS entry is unreferenced by the production build; the packaged app uses `src/ui/App.tsx` and files under `dist`.

| Variant | Design question | Current assessment |
| --- | --- | --- |
| A · Finansal özet | Does a financial statement hierarchy make net sales the first answer? | Recommended as closest to the brief: dominant net sales, then trend/categories and financial caveats. |
| B · Çalışma masası | Does a sidebar with two content columns aid frequent switching? | Gives costs/categories immediate space, but sacrifices trend visibility above the fold. |
| C · Hesap cetveli | Does a denser ledger help comparison? | Compact and scannable, with less emphasis on the dominant net-sales number. |

**Verdict: awaiting the user's preference.** This is a comparison artifact, not an approved production design or UI/Windows acceptance.

All brief sections are represented: start/empty/service failure, Özet, Satışlar, Alışlar ve maliyet, Giderler, Raporlar, İşlemler and recovery. Use Eylül 2025 / Standart görünüm for the complete example paths:

- Category → product → transaction → receipt → source detail, with scoped contribution separate from full document total.
- Expense template/sample selection → preview and duplicate decision → simulated confirmation; correction and completeness remain separate actions.
- Report version comparison → pinned report → separate simulated review/export actions.
- Operations → package preview/job outcome; recovery → sample backup/key → contents → explicit restore confirmation.

The scenario selector exposes partial coverage, missing cost, empty data, service failure, a new report candidate, a line discrepancy, startup and import failure. August, partial-period and v1 report detail fixtures are deliberately limited; a visible unavailable notice prevents borrowing September details. The trend is schematic. Synthetic status labels are interaction examples, not source reconciliation evidence.

Source access remains read-only and live integration disabled. This prototype does not authorize source inspection, production access, owner contact or installation. Renewed inspection still requires separate authorization and an isolated restored backup. No original backup, credential, customer or payroll data is used here.

Session verification: Node syntax checks and live browser checks at 1440, 680 and 453 **CSS pixels**; captures are in [evidence](evidence/), including [A desktop](evidence/A-desktop.png), [B desktop](evidence/B-desktop.png), [C desktop](evidence/C-desktop.png), [680px receipt](evidence/receipt-680.png), [453px partial state](evidence/partial-453.png), [expense preview](evidence/expense-preview-desktop.png) and [restore confirmation](evidence/restore-confirm-desktop.png). These checks do not cover Windows OS 150% scaling, forced-colors rendering or packaged Electron. No UI or Windows gate is closed.

The local [DESIGN.md](DESIGN.md) and [design.json](design.json) describe this prototype only. Root product/design documentation and its historical phase prose are outside this experiment.

# Prototype verification

Task UI-PROTOTYPE, 2026-09-25. Baseline `9af7305`; artifact is the commit containing this record on `codex/ui-redesign-prototype`. Fixture identity `demo-em-2025-09`, `demo-batch-01`. Every value is synthetic. This record closes no A03, A07 or Windows gate.

Environment: Windows host, Node 22.19.0 for the dependency-free preview server, Codex in-app Chromium browser. Production still targets the repository's Node 24 engine. No dependency versions changed.

| Procedure | Expected and observed | Evidence and limits |
| --- | --- | --- |
| `npm run prototype:ui` | Loopback server opens the preview on port 4178. | No application service, source database or data mutation. |
| `node --check src/ui/redesign-prototype/prototype.js` and `node --check src/ui/redesign-prototype/serve.mjs` | Both parse successfully. | Syntax only. No production test suite run for the throwaway artifact. |
| Browser A/B/C switching | Three distinct structures, reload-stable `variant` URL, same prototype state. | `evidence/A-desktop.png`, `B-desktop.png`, `B-chart.png`, `C-desktop.png`. |
| Browser 1440px, 680px and 453px inspection | Primary amounts and navigation remain readable; measured document width equals viewport at checked overview sizes. | `A-680.png`, `partial-453.png`. CSS pixels, not physical Windows scaling. |
| Sales drill-down | Category, product, transaction, full receipt and source open; selected contribution differs from full receipt. Escape returns focus to the transaction opener. | `receipt-680.png`. Example lists are subsets, not a complete financial fixture. |
| Expenses | Preview shows duplicate decision and affected period; confirmation returns to list without granting completeness. | `expense-preview-desktop.png`, `expenses-desktop.png`. File selection and edits are simulations. |
| Reports and recovery | Version comparison shows amounts and coverage; restore preview leads to explicit consequences and adjacent cancel. | `reports-desktop.png`, `restore-confirm-desktop.png`. No Excel file or backup generated. |
| Failed import from empty | Empty shell remains empty, no cutoff or figures invented, persistent error displayed. | `empty-import-failure.png`. |
| Discrepancy and filtering | `S-025930` / `demo-line-003` retains warning; its contribution is withheld. Receipt distinguishes recorded amount. Unaffected return opens its own evidence. | `discrepancy-evidence.png`, `discrepancy-source.png`, `discrepancy-receipt.png`, `unaffected-document-evidence.png`. |
| Browser console | No error entries returned after the exercised paths. | In-app browser console observation. |
| Diff and local links | `git diff --check`, local Markdown links and JSON parsing pass. | Production entry remains `src/ui/App.tsx`; prototype is unreferenced by `scripts/build.mjs`. |

Computed palette contrast on declared colors is 16.15:1 for ink on white, 7.58:1 for secondary text on white, 6.24:1 for blue on white, 5.14:1 for green on white, 6.57:1 for red on white, and 6.02:1 for warning text on its field. These are color-pair calculations, not full accessibility acceptance. Forced-colors rules exist but OS forced-colors rendering and actual 150% Windows scaling remain unperformed.

The design detector reported one thick-bottom-border warning for the rectangular stepper indicator. This is an intentional active-step rule, not a rounded card accent. The independent review required corrections to empty-import preservation and discrepancy propagation. The final review scores those findings only.

Several initial full-page browser captures were distorted while the live page was correct. They were replaced with settled viewport captures. `B-chart.png` is a supplemental scrolled capture. The screenshot set is visual prototype evidence, not packaged-app acceptance.

Poteto principles applied: Model the Domain keeps all demonstration state in one in-memory object; Exhaust the Design Space provides three structural alternatives; Prove It Works requires live interaction and screenshot evidence. The recommendation is A. The user's variant decision and production implementation remain separate.

# Issue 27: lighter monthly workspace

Implementation on `codex/shadcn-monthly-ui` starts from `dc99905821d9d265670787c067a8ec01910974c7`. The user authorized implementation and a PR on 25 September 2026 after the planning-only issue. This evidence contributes to U1–U6 and A03/A07; it does not certify owner, real-source or rollout acceptance.

The monthly overview now presents sales and the daily trend together, followed by missing expenses and costs with direct actions. All existing destinations share the lighter system. Only Button, Input and Badge were added as shared shadcn controls; native tables, selects, disclosures and the existing SVG chart retain their behavior. Financial calculations, database schema, IPC authority and source access are unchanged.

## Build and fixtures

The final tested application source is `88d3a207f416f278b8e6e31aecb0ece42b77bce0`. Subsequent commits retain tests, screenshots and documentation only. Its `app.asar` SHA-256 is `cc2850b9b8fbb57949949be38ecb60b2974a292f58ddae104696a5a4e859c690`. [Build manifest](build.json) records installer, portable and screenshot hashes. Every image in this directory was recaptured against this final package; earlier captures were replaced.

The [representative fixture](../../../tests/helpers/shadcn-fixtures.ts) contains September 2025, 30 daily entries, five categories, long Turkish labels, mixed units and a negative return day. Independent expected values are sales 2,875 TRY, estimated covered cost 600 TRY, and covered gross profit 900 TRY. The [stress fixture receipt](stress-fixture.json) identifies 204 documents/lines, a large amount and paginated narrow tables. Sparse, unavailable, import, expense and recovery states use the existing synthetic desktop fixtures. No real business records or source backups were used.

[Environment](environment.json): packaged Electron 44.3.0 / Chromium 152 on Windows 10.0.26200 x64, physical display 2560×1440, scale factor **1.0**. CSS viewports include 1440×900, 680×900 and 453×900; restore captures additionally use 1120px. Forced colors and reduced motion were emulated. Offline verification blocks the browser context and aborts external requests; no physical network-disconnect claim is made. Host test tooling used Node 24.19.0; the packaged Electron runtime reports its own Node version separately.

## Commands and observed results

Run from the isolated checkout with Node 24 on PATH and `npm_config_script_shell` set to `ComSpec` on this host. Its default PowerShell 5 script shell initially rejected `&&`; changing only the invocation environment allowed the existing scripts to run.

| Stage / gate | Command or procedure | Expected and observed result |
| --- | --- | --- |
| U3 / A03 | New packaged overview journey against the prior UI package | Expected missing expense action; failed at `Giderleri incele` before implementation. [Baseline failure](red/baseline-context.md). |
| U6 / A07 | New forced-colors focus journey against the pre-fix package | Expected visible keyboard outline; observed `outline-style: none`. [Failure](red/forced-colors-context.md). Removing `outline-none` restored the global outline; final packaged check passes. |
| U2–U5 | `npm run typecheck`, `npm run lint` | Both passed after the final UI corrections. |
| U3–U5 / A03 | `npm run test:unit`, `npm run test:integration` | 29 unit tests and 229 integration tests passed. Existing arithmetic, expense, export, report-version and recovery contracts remain covered. |
| U3–U6 / A03, A07 | `npm run test:desktop` | Full packaged suite passed: 32 tests before the final focus regression was added. This included sales/purchasing, imports, expenses, report parity, recovery and performance. |
| U2 / A07 | `npm run package:win` (includes build) | Final NSIS and portable artifacts built. Ten dependency notices verified, 77 package files and 344 archive files inspected, zero inventory violations. Both distributions match the inspected payload. Installer signature is `NotSigned`; no release was published or installed on the owner's machine. |
| U3–U6 / A03, A07 | Final selected packaged run below | All 10 tests passed in 43.6s against the final package, including the newly added focus regression, representative month, stress table, all destinations, source refresh, saved report/export selection, failure/retry, cancellation, encrypted restore and performance. |
| U6 / D18, A07 | Three fresh processes, 25,000 synthetic documents and lines | Ordinary interactions 10.1–474.5ms, below 2s. Startup separately 2.63–2.82s. [Complete timings and hardware](performance.json). OS caches were not cleared. |

Final selected command (does not rebuild the already inspected package):

```powershell
node node_modules/@playwright/test/cli.js test tests/desktop/shadcn-ui.test.ts tests/desktop/monthly-overview.test.ts tests/desktop/unavailable-states.test.ts tests/desktop/clean-install-restore.test.ts tests/desktop/full-dataset.test.ts
```

Keyboard checks cover navigation, evidence disclosures, restored focus and shared actions/period fields in forced colors. Representative computed text contrasts were 16.10:1 for heading and period, 14.89:1 for primary action. All five destinations at 453px avoid document-level horizontal overflow; dense tables scroll internally. These are focused checks, not a comprehensive accessibility certification.

## Retained visual evidence

Before: [prior overview](../ui-option-b/images/overview-1440.png). The [composition and inventory](plan.md) explain the selected layout and [component provenance](components.md) records exact registry inputs and local adaptations.

| Area / state | Final captures |
| --- | --- |
| Monthly hierarchy, sales/trend, explicit gaps | [Desktop](images/overview-1440.png), [680px](images/overview-680.png), [453px](images/overview-453.png) |
| Sales and evidence | [Summary](images/sales-summary.png), [products](images/sales-products.png), [transactions](images/sales-transactions.png), [receipt](images/sales-receipt.png), [source](images/sales-source.png) |
| Purchasing | [History](images/purchasing-history.png), [returns](images/purchasing-returns.png), [replacement cost](images/purchasing-replacement.png), [stock](images/purchasing-stock.png) |
| Expenses | [Records](images/expenses-records.png), [completeness](images/expenses-completeness.png), [import](images/expenses-import.png), [preview](images/expenses-preview.png) |
| Reports | [List](images/reports-list.png), [candidate](images/reports-candidate.png), [saved](images/shadcn-saved-report.png) |
| Operations and recovery | [History](images/operations-history.png), [busy import](images/shadcn-import-progress.png), [cancelled](images/phase-8-cancelled.png), [recovery](images/recovery.png), [restore preview](images/phase-9-restore-preview-680.png) |
| Important data states | [Empty](images/empty-1440.png), [error/retry](images/shadcn-monthly-error.png), [partial](images/shadcn-monthly-partial.png), [unavailable](images/phase-8-unavailable.png), [stale source](images/shadcn-stale-source.png) |
| Accessibility and limits | [Forced-colors keyboard focus](images/forced-colors-keyboard-focus.png), [forced colors/reduced motion](images/forced-colors-reduced-motion.png), [offline reload](images/offline-reload.png), [long labels](images/stress-long-category-453.png), [paginated stress](images/stress-transactions-453.png) |

Receipt/source images show the scrolled detail context. The short loading state is asserted by the regression test but was not retained as a screenshot because the capture would race its 700ms delay. Other failure, validation, comparison and export details retain the existing regression coverage; this table does not imply a screenshot of every possible state.

## Review and remaining acceptance

Independent Standards review identified the forced-colors focus defect; it was reproduced and fixed. Independent finish review inspected the original and final captures, then confirmed the negative baseline and explanatory text, left-aligned navigation, separated footer, narrow labels and visible focus. The documenter updated [DESIGN.md](../../../DESIGN.md) to replace the old navy design. The parent [detector pass](detector.json) found no primary findings and 26 advisory token-inventory omissions; these prompted documentation synchronization, not a UI change. The final review receipt is recorded alongside this evidence.

In the independent unprompted reading task, the reviewer identified September 2025, cutoff 30.09.2025, sales 2,875 TRY, an unavailable comparison due to missing period/reconciliation evidence, and unavailable profit due to expenses and cost coverage. The reviewer identified the supporting-record routes from captures and code; packaged journeys separately exercised those routes. This is developer review, not Eralp's acceptance.

Still open:

- **Actual Windows 150% scaling:** repeat desktop, 680px and 453px checks at OS scale 1.5; record Electron display scale and captures separately from CSS dimensions. Current evidence is scale 1.0 only.
- **Owner/hardware acceptance:** Eralp has not reviewed this build; no owner-machine installation or contact occurred.
- **Real-source reconciliation and volume:** issue #26 retains those gates. Synthetic timing and values do not close them. Conditional live integration and rollout under #14 remain unauthorized.
- **Release acceptance:** artifacts are unsigned; no distribution or deployment was performed.

Continue any remaining checks on `codex/shadcn-monthly-ui` and identify the exact tested package hash. Do not mark A03/A07 globally complete from this UI evidence alone.

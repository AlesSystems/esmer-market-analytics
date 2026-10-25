# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

[AGENTS.md](AGENTS.md) is the authoritative rule set (start-here reading order, execution graphs, product/data boundaries, verification and handoff). Read it first; this file only adds commands and architecture orientation. [README.md](README.md) lists the governing contracts and [CONTEXT.md](CONTEXT.md) defines the domain terms (Satış, Tahmini brüt kâr, Marj, trust chip…). Use those terms; do not rename them.

## Commands

Node `>=24.15 <25`, npm 11. Dependencies are exact-pinned; check licences and Windows packaging when changing them.

```sh
npm ci
npm run typecheck
npm run lint
npm run test:unit                              # vitest, tests/unit
npm run test:integration                       # vitest, tests/integration
npx vitest run tests/unit/charts.test.ts       # single vitest file (filters work on both scripts)
npx vitest run -t "name pattern"               # single test by name
npm run test:desktop -- tests/desktop/startup.test.ts   # package:local, then Playwright against the packaged app
npm run build                                  # esbuild → dist/ (main/preload/worker as CJS, UI bundle, CSS)
npm run package:local                          # unpacked host app
npm run package:win                            # unsigned Windows NSIS + portable; only Windows acceptance counts
npm run package:mac                            # Apple Silicon demo ZIP (does not satisfy Windows acceptance)
```

`tests/desktop/**` is excluded from vitest and runs only through Playwright against a packaged build (`ESMER_EXECUTABLE` overrides the executable, as in CI). CI (`.github/workflows/ci.yml`) runs everything on `windows-latest`. `dist/`, `release/`, `work/` and `test-results/` are git-ignored; `work/` and `workstreams/` hold prototypes, plans and evidence scratch, not product code.

## Architecture

Offline Electron app with three bundles built by `scripts/build.mjs`: main process, preload, and a Node `worker_threads` service worker, plus a browser React bundle (`src/ui/App.tsx`).

- **Renderer (`src/ui`)** has no Node, DB or SQL access. It calls only the named operations exposed by `src/desktop/preload.ts` (`DesktopApi` in `src/domain/contracts.ts`), each a single `ipcRenderer.invoke("esmer:request", operation, payload)`.
- **Main (`src/desktop`)** validates sender, operation and payload (`requests.ts` — strict `exact()` field-set validators), then forwards to the worker via `requestService` in `main.ts`, wrapped in `OperationJobs` for progress/cancel. It also owns native dialogs, preferences, live/recovery config files and atomic file writes. The UI is served from the `esmer://app` custom protocol.
- **Service worker (`src/service/worker.ts`)** owns SQLite and does all heavy work. Adding an operation means touching the contract type, the validator in `requests.ts`, preload, `main.ts` (overload + handler) and the worker dispatch.
- **Domain/analytics (`src/domain`, `src/analytics`)**: finances use `decimal.js` with explicit rounding and preserved source precision. Missing cost/expenses/tax treatment must stay explicit, never zero.
- **Source (`src/source`)**: read-only ingestion of prepared packages (`package.ts`, `raw-package.ts`) and optional live SQL Server via `tedious` (`sql-server.ts`, `live.ts`, `sql-package.ts`; disabled by default). `estimate.ts` produces the recorded-source estimates that drive v1 pages; these are distinct from validated financial reports (`src/reports`, `docs/contracts/monthly-product-profit.md`).
- **Store (`src/store`)**: one SQLite store with migrations and app revisions. Source refreshes must preserve expenses, adjustments, settings, audit history and accepted report versions; a failed import keeps the last valid dataset.
- **Reports/expenses/recovery**: `src/reports` (query, versioned accepted reports, display shaping, Excel export), `src/expenses` (Excel template/import, manual entry, completeness validation), `src/recovery` (encrypted backup/restore).
- **UI copy** is Turkish; identifiers are English; currency is TRY only. For UI work also read [PRODUCT.md](PRODUCT.md) and [DESIGN.md](DESIGN.md).

## Working notes

- Foundation docs (`docs/superpowers/specs/*`) govern scope; the implementation plan's paths/checkboxes are historical. Check `docs/evidence/index.md` for open gates and `docs/contracts/` + `docs/decisions/` before changing behavior.
- Expose a missing contract with a focused failing test first; use Conventional Commits with the contract test separate from implementation.
- Never commit source backups, credentials, customer records or employee payroll; use synthetic fixtures (`scripts/create-*-fixture.mjs`, `tools/synthetic-sql.ts`).
- Do not copy legacy runtime code, and do not start source inspection or production access without separate authorization.

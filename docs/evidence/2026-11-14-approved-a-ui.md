# Approved Prototype A implementation

Workstream [#154](https://github.com/AlesSystems/esmer-market-analytics/issues/154), [PR #153](https://github.com/AlesSystems/esmer-market-analytics/pull/153), [implementation contract and graph](../superpowers/specs/2026-11-14-prototype-a-implementation.md). The owner selected A and explicitly requested implementation with capacity for later charts; [the actual feedback](https://github.com/AlesSystems/esmer-market-analytics/issues/143#issuecomment-6876945959) resolves the earlier visual-review pause. No uncoached owner walkthrough is inferred.

## Build and scope

Integration branch: `codex/ui-prototype-review`. Previous prototype milestone: `23aab64`. Production base: `3520ce0`. Implemented UI: `c75588d`, followed by bounded settings, coverage-label and loading-state corrections; final tested production commit: `9421f5a9c7ef9482f5a819add550a705e321bc67`. App version remains 1.0.1; these are review builds, not a new release tag.

The real React UI now uses A's plum/white palette, local Figtree, side navigation, month/period heading, broad gross-result section, aligned supporting figures, product observations and expense next step. Existing flows and service results remain in use. No schema, dependency, financial formula, privileged IPC, source permission or packaging configuration changed. The original checkout and unrelated worktrees were preserved.

`MonthPage` uses a responsive `month-layout` grid with intrinsic-height sections. `section-wide` spans the columns; ordinary sections use split width. Existing history bars occupy a full-width section with a bounded graphic. Later charts can follow the same pattern and retain a numeric alternative. `WorkspaceHeader` keeps controls in normal document flow. No chart framework, empty chart placeholder or new metric API was added.

The monthly label **Paketin kapsadığı son gün** uses the pinned report's coverage end. It is distinct from the last recorded document date shown by existing source/settings details. This avoids mixing separately refreshed source metadata into a pinned monthly result.

## Verification receipt

Date: 2026-11-14. Environment: macOS/Darwin arm64, Node 24.15.0, npm 11.12.1, locked Electron 44.3.0. Fixtures are synthetic: `monthProfitPackage`, `richEstimatePackage`, `businessPackage`, `richBusinessPackage` and existing expense/recovery fixtures. No private source was accessed.

| Procedure | Expected / actual result |
| --- | --- |
| `npm run test:unit` | 185 passed after replacing superseded top-bar/logo/azure assertions with the approved A contract; behavioral navigation/focus assertions retained |
| `npm run test:integration` | 314 passed, 17 environment-dependent isolated SQL checks skipped |
| `npm run typecheck`, `npm run lint`, `git diff --check` | Passed |
| `npm run test:desktop` with capture variables below | Rebuilt and launched the actual packaged Mac app: 71 passed, 4 skipped in 1.4 minutes at `9421f5a` |
| `npm run build`, `npm run package:local` | Passed as part of the packaged desktop command |
| `npm run package:win` on this Mac | Windows app staging completed, but NSIS could not spawn its bundled Mac `makensis` executable (`Unknown system error -86`); no successful Windows distribution verification is claimed from this attempt |

The four desktop skips were the Windows lifecycle test and three optional alternative capture cases. The run included the three enabled visual-capture profiles (source, financial-only, rich financial-only), keyboard/zoom traversal, the monthly/product/expense walkthrough, import validation/duplicates/history, explicit completeness and withdrawn net results, draft protection, export, recovery, retained-data failures and source-document return context.

Reproduce the integrated capture run:

```sh
ESMER_CAPTURE_VISUAL=/tmp/esmer-ui-a-integrated-visual ESMER_CAPTURE_OWNER=/tmp/esmer-ui-a-integrated-owner npm run test:desktop
```

During implementation, focused tests exposed missing period/supporting figures (`41dab1a`), the legacy narrow-screen order placing observations before the result (`98bc8a4`), and a settings popup extending to 768px in a 560px viewport (`b8a4637`, fixed `54d8ab0`). The first full run then caught missing month controls while the expense period resolved; `9421f5a` fixed the loading branch and the existing assertion passed unchanged. Two old unit visual assertions were updated in `36e5cd5`. The final complete desktop run passed.

## Visual evidence

These are screenshots of the packaged application using synthetic data at `9421f5a`, not pictures of the disposable prototype. The parent inspected wide monthly/product/expense screens, narrower reading order and the settings popup; keyboard/zoom capture includes visible focus.

- [Monthly workspace](images/2026-11-14-ui-a/month-wide.png)
- [Product ledger](images/2026-11-14-ui-a/products-wide.png)
- [Expense workspace](images/2026-11-14-ui-a/expenses-wide.png)
- [Narrow monthly workspace](images/2026-11-14-ui-a/month-narrow.png)
- [Monthly view at 200% zoom](images/2026-11-14-ui-a/month-zoom200.png)
- [Settings](images/2026-11-14-ui-a/settings-wide.png)

Capture sizes include 1440×900 and 1120×760 native windows, 680×800 content size, and 1440×1000 at Electron zoom 2. macOS window chrome can reduce the content area of native-size captures; 200% is an Electron host test, not evidence of actual Windows display scaling.

## Review and remaining verification

Independent Standards and Spec review is pending on this implementation. The final review and Windows CI receipts belong on [PR #153](https://github.com/AlesSystems/esmer-market-analytics/pull/153) and [#154](https://github.com/AlesSystems/esmer-market-analytics/issues/154); later receipts identify the exact reviewed/tested commit.

The existing Windows workflow must run `npm run package:win` and the packaged desktop suite against this branch. Actual Windows 100%/125%/150% display scaling, native picker/export/recovery interactions and owner hardware/readability remain manual checks for the new UI. Earlier Windows receipts describe earlier builds. No production access, Eralp contact, installation, publication or merge was performed.

The standalone simulated-prototype tickets #149–152 were deferred after the explicit request to implement A. They are not falsely marked complete; #144–145, the design map and source specification remain open for their unperformed human acceptance criteria.

# Compact app copy

Task COPY01 follows the user's October 8, 2026 request to analyze and remove unnecessary app text and create a PR. It refines [issue 72's page responsibilities](../contracts/page-control-desks.md) and [Phase 8 Task 8.1](../superpowers/plans/esmer-market-implementation-plan.md#task-81--complete-the-monthly-experience).

## Change and acceptance boundary

Repeated record counts, repeated action text inside metric buttons, explanations already carried by headings or column labels, and narration about the coverage strip are removed. Manual entry, invoice browsing, product search, saved reports and Settings use shorter supporting text.

Financial caveats, missing-cost and expense warnings, source qualifications, synthetic identity, cutoff, period and recovery guidance remain. Settings retains its tile layout and band lines. Existing controls, labels, state ownership, calculations, exports, IPC, schemas and dependencies retain their contracts.

## Build and inputs

- Branch `codex/simplify-app-copy`, base `46f654b`.
- `4ff25e6` exposes the compact-copy contract; `c07afc2` implements it.
- Environment macOS 27.0 build 26A428, arm64, development Node 24.15.0.
- Inputs `businessPackage()` and `rawSnapshot()`, synthetic fixtures only. No private packages or source connections were used.
- The tested application is the actual unpacked macOS Electron application produced by `npm run package:local`.

## Verification

| Procedure | Expected result | Actual result |
| --- | --- | --- |
| Baseline `npm run package:local` and `v1-simplicity.test.ts` | Existing financial/source journeys work before edits | Passed, 2 packaged tests |
| `compact-copy.test.ts` against the baseline package | Expose redundant source actions and report prefixes | Both cases failed on the targeted copy |
| `npm run test:desktop -- tests/desktop/compact-copy.test.ts` | Compact copy retains actions and material qualifications | Passed, 2 tests |
| `npm run test:unit` | Domain behavior stays valid | 53 passed |
| `npm run test:integration` | Existing service, persistence, calculation and export contracts stay valid | 346 passed, 14 skipped for optional isolated SQL configurations |
| `npm exec -- playwright test` against the rebuilt packaged application | Existing desktop workflows remain usable | 104 passed, 11 skipped for Windows or private/isolated source environments |
| `npm run typecheck`, `npm run lint`, build and local package | Valid source and runnable host artifact | Passed |
| Impeccable detector over all 11 changed UI files | No new mechanical design findings | Returned `[]` |
| Wide and narrow synthetic journeys | Navigation, labels and warnings remain readable without page overflow | Passed at 1440, 1120, 680 and 390 px |
| Independent review and compact packaged rerun | No lost context, accessibility or behavioral regression | No actionable findings; 2 tests passed |
| Pre-review comment check | No new comments or suppressions | None introduced or touched |

The desktop suite covers drafts, completeness review, source filtering, invoice details, saved versions, exports, recovery, failure states and keyboard return navigation. It verifies that unavailable values, excluded returns and partial cost coverage keep their existing meanings. Source metric buttons still have native button semantics and names; the removed table-toolbar totals remain visible in the metric cards.

Raw command logs and the execution graph are retained in the ignored task directory `work/poteto/simplify-app-copy/`. The screenshots below are public synthetic evidence. Settings' final capture waits for the selected text-size preference and disables capture-time animation so the coverage strip is shown in its settled state.

| Surface | Before | After |
| --- | --- | --- |
| Source overview, 1440 px | [Before](images/compact-copy/before-source-1440.png) | [After](images/compact-copy/after-source-1440.png) |
| Settings, 390 px | [Before](images/compact-copy/before-settings-390.png) | [After](images/compact-copy/after-settings-390.png) |

## Windows continuation and open gates

`npm run package:win` built the renderer and Windows unpacked application but failed before completing the distributions. The cached NSIS `makensis` executable is Mach-O x86_64 and failed to spawn with system error `-86` on this arm64 Mac. This is a host tooling failure, not a passing Windows packaging result. Distribution verification did not run.

On a Windows development host, check out this branch, run `npm ci`, `npm run package:win` and `npm test`. Also run typecheck and lint, inspect the installer and portable application, and check the affected pages at the supported display scaling. Use the synthetic fixtures; no renewed source access is required for this copy change.

Actual Windows execution, current-build installer/portable acceptance, owner acceptance, real-source semantics and production rollout remain open. This receipt does not close A01–A07 or L01. No installation or owner contact was performed.

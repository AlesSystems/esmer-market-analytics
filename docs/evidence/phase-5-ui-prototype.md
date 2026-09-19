# Phase 5 UI prototype evidence

- Date: 2026-09-19.
- Task: exploratory wireframe supporting Phase 5 / issue #8. No A02/A03/A07 gate is claimed complete.
- Branch: `codex/phase-5-ui-prototype`.
- Fixture: `SYNTHETIC-ONLY`, `DEMO-BATCH-001`, `DEMO-DATA-1`, `DEMO-v1`.
- Environment: macOS development host, Node 24.15.0, Codex in-app browser. No packaged Windows run.
- Source boundary: no source, database or private data access; application entry and service unchanged.

## Procedure and results

| Check | Expected | Actual |
| --- | --- | --- |
| `npm run prototype:sales` | Serve isolated wireframe on loopback | Passed, 127.0.0.1:4175 |
| `npm run typecheck` | No TypeScript errors | Passed |
| `npm run lint` | No lint errors | Passed |
| `git diff --check` | No diff whitespace errors | Passed |
| `impeccable detect --json src/ui/sales-prototype.tsx src/ui/sales-prototype.css` | No mechanical findings | Returned `[]` |
| `checkSalesWireframe(page.playwright)` through Codex browser | Complete journey, source identity, selected/full totals, variant state, return filter and discrepancy | Passed for starting variants A, B and C |
| Manual browser scenarios | Empty/loading/failure/no-match/missing-period/refresh states understandable and recoverable | Exercised successfully |
| Viewport checks | Usable wide and narrow compositions, no page-wide horizontal overflow at checked widths | Inspected 1440×1000, 1000×850 and 390×844; narrow widths returned document width equal to viewport |

Screenshots are under `.impeccable/review/` in the prototype worktree. They are viewport captures: the in-app browser's full-page capture returned incorrectly scaled blank margins, so those were replaced with valid viewport captures. They are prototype evidence, not packaged application screenshots. Final review is recorded below when returned.

## Limitations

- Option A is selected; owner display/scaling verification remains open.
- Four documents and fixed comparison summaries do not demonstrate real-data coverage, performance or financial correctness of a production engine.
- Browser verification is not Windows packaging, keyboard acceptance or assistive-technology certification.
- Prototype scenario controls simulate data states and perform no imports or persistence.
- No production build, application test suite or Phase 5 acceptance gate was executed for this isolated prototype.

## Finish review

- Prototype code commit: `4b6e3e5`; context/design commit: `5b7936b`.
- An independent reviewer inspected the three compositions, detail/evidence views and narrow captures. One material issue was found: flex shrinking distorted chart proportions.
- Corrected by reserving a nonshrinking plotting height and positioning labels outside it. Measured bar heights for A/B: 59.390625 / 110.296875 / 140 px; C: 47.5078125 / 88.2421875 / 112 px. These reproduce 70:130:165 within the smoke check's tolerance.
- The final verdict was `ship` for that scored fix, with no visible regression from the correction; this was not a second full-surface review.
- Available reviewer/worker roles substituted for Impeccable's named finish-reviewer/documenter roles, which were not exposed by this harness.
- Captured the actual in-app viewport at 1280×720 as `user-desktop.png`. Arrow shortcuts and text-input non-interception were exercised; browser warning/error logs were empty during the three-variant journey run.

## Design outcome

On 2026-09-19, the user selected Option A after the palette refinement, stating “Option A is best.” The design baseline is the horizontal summary strip and trend/category split, with the existing detail/evidence journey and brighter blue/green/red palette. Reference prototype commit: `227ea94`; capture: [Option A](../../.impeccable/review/palette-desktop-a.png). B/C remain historical alternatives. This preference does not constitute production or Windows acceptance. Prototype files and the updated design decision live on the throwaway branch.


## Palette refinement — 2026-09-19

The user requested a slightly shinier palette with more red and blue alongside green. The prototype now uses blue navigation/information, green positive comparisons, red decreases/returns and labelled category accents, with brighter white surfaces and soft elevation. No calculations or navigation logic changed.

- Typecheck, lint and the existing browser journey/geometry check passed.
- Computed text/background checks for 14 representative roles ranged from 4.95:1 to 11.74:1. Signed values and written return labels remain; color is supplementary.
- Chart highlight and control borders were darkened slightly to meet 3:1 against white (final contrast checked separately).
- The design detector reported color/type documentation advisories. Newly introduced color roles were documented; inherited typography was not redesigned.
- Updated captures use the `palette-` prefix in `.impeccable/review/`; initial wireframe captures remain historical evidence. This is still browser-only prototype verification, not Windows acceptance.

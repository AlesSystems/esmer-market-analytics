# First visual prototype verification — #148

Date: 2026-11-14. Environment: macOS, Node 24.15.0, existing locked Playwright 1.63.0 Chromium headless. Base: integration brief commit `19dbc18`, application baseline `3520ce0` (origin/main). Prototype implementation: `5b3631a`, readability/context revision `15b724e`; test contract `4837fd5`, boundary coverage `33ee113`; narrow synthetic-label regression `8f8bae2` / fix `af01717`. These are synthetic browser checks, not Eralp or Windows acceptance.

## Fixture identity and oracle

`visual-directions-literals-v1` is a handwritten synthetic presentation fixture. It is not derived from a real backup or production application output. The following literal expected states were specified before they were placed in the UI. Browser tests assert those known values, not a second implementation of the application's formulas. The renderer displays prepared strings and does no financial calculation.

| Scenario | Recorded sale | Cost-covered sale | Estimated cost | Estimated gross result | Margin | Coverage / comparison |
| --- | --- | --- | --- | --- | --- | --- |
| September 2025 | 1,286,420 | 1,282,620 | 998,000 | 284,620 | 22.19% | 99.70%; gross result +11.18% against August |
| August 2025 | 1,184,000 | 1,184,000 | 928,000 | 256,000 | 21.62% | 100%; previous zero prevents percentage change |
| July 2025 | 100,000 | 100,000 | 100,000 | 0 | 0% | 100%; previous loss prevents percentage change |
| June 2025 | 200,000 | 200,000 | 214,000 | −14,000 | −7% | 100%; previous missing cost prevents comparison |
| May 2025 | 24,600 | unknown | unknown | unavailable | unavailable | 0%; previous month absent |
| April 2025 | unavailable | unavailable | unavailable | unavailable | unavailable | outside package, never zero |
| October 1–18, 2025 | 680,000 | 670,000 | 530,000 | 140,000 | 20.90% | 98.53%; partial month suppresses amount comparison and net result |

All amounts are TRY. Fixture cutoff is 18 October 2025, distinct from the selected report period and today's date. No return rows are in the fixture; the general estimate explanation retains the actual contract limitation that return contribution is excluded without original-sale attribution. The September product table contains five representative rows, not an implied complete partition of monthly totals. Other months use their own literal representative record rather than stale September product results.

September expense examples are 48,000 rent, 18,400 utilities and 20,000 operating expenses: literal recorded total 86,400. Labour remains unreviewed; completeness is unconfirmed. No net amount is shown or calculated. Other months explicitly have no entered expense example, which is not a no-expense declaration. There are no employee, customer or supplier identities.

## Observed checks

- The first browser test failed against the placeholder interface because the visual-direction control did not exist; it passed after implementation. An earlier startup attempt exposed an incorrect test-host relative path, which was corrected before the behavioral red/green check.
- Six public-interface browser tests pass: month/result atomic transition in all directions; valid zero versus unknown/absent/partial states; product search/detail/focus return; honest expense previews; all directions at 680 × 800 with larger text and keyboard dialogs; existing 40 × 40 px minimum hit areas for visible buttons at both 1440 and 680 px.
- Larger text visibly increases the dialog heading as well as the workspace. Escape returns focus to the original control. The page has no horizontal overflow at the tested narrow size; product tables have labelled internal horizontal scrolling.
- The coordinating agent separately checked gross/margin pairs and September’s percentage change using Python Decimal; the literal values agree. This is fixture arithmetic sanity checking, not source-semantic proof.
- Standards review identified application action targets below the existing 40 px minimum. The accessibility revision raises product-name, trust, calculation, text-link, review and navigation buttons to at least 40 px, preserving the three compositions. Review-strip buttons also use 40 px. A public browser hit-area regression failed against the prior stylesheet (34 px review control), then passed after the revision. The six-test browser suite was rerun and screenshots recaptured after this revision.
- JavaScript syntax checks, focused ESLint and `git diff --check` pass.
- Reproducible screenshots cover all directions at 1440 × 900, plus A at 680 × 800 with larger text and an enlarged explanation. The captured image can extend below the viewport to show the actual scrollable page.

## Review still required

The project owner has not selected a direction or approved visual satisfaction. Full connected product/expense/support journeys are blocked on that selection, per the approved graph. Hardware, display scaling and Eralp's preferences remain unknown. Actual packaged desktop, Windows build/smoke/scaling and persistence/financial test suites were not run because this disposable prototype does not alter the production application. They remain obligations for later production implementation. No gate A01–A07 or L01 is passed here.

# Visual prototype brief

Source: [specification #147](https://github.com/AlesSystems/esmer-market-analytics/issues/147), [brief decision #142](https://github.com/AlesSystems/esmer-market-analytics/issues/142), and the project owner's conversation on 2026-11-14.

## Confirmed brief

The previous designs' visual style and composition feel wrong. The new interface should look good, be easy to read and help its user understand what to do. The owner reopened the entire interface and approved three evaluation tasks: understand the selected month, investigate a product, and add/review expenses to understand the remaining result. A specification and clickable prototype precede any production rebuild. The latest instruction is to start implementation, then wait for review of the prototype before continuing.

No preferred palette, font, density or navigation pattern has been supplied. No specific navigation defect has been observed. These remain hypotheses to evaluate in concrete alternatives, rather than further prerequisites for drawing them. This brief uses the preferences already given; it does not record acceptance of a visual direction.

## Observable criteria

- The selected month, its result and its next useful action have a readable order.
- Sales, estimated gross profit and the expense/net state have distinct roles.
- Product names and amounts scan comfortably in a populated table; detail is reachable and dismissible.
- The primary expense route is evident, with incomplete review visible before any net amount is shown.
- Explanation is available at the relevant figure without dominating the composition.
- Navigation and controls use understandable Turkish labels; amounts use TRY and Turkish formatting.

Reject a direction if its composition still feels wrong to the project owner, if figures compete without clear priority, if readable labels depend on color alone, or if it disguises unknown values as zero. Automated tests cannot decide aesthetic satisfaction.

## Three design hypotheses

1. **Aylık çalışma alanı:** a stable side navigation and spacious main workspace make the monthly answer and follow-up work easy to locate. Explore a plum accent, cool white surfaces, and a restrained sans-serif hierarchy.
2. **Ayın hesabı:** a wide, aligned monthly statement with a compact navigation bar makes the relationship between sales, cost and expenses easy to read. Explore a blue ink palette, generous ruled rows, and a quiet typographic composition.
3. **Odaklı görünüm:** an answer-led split workspace with a contextual action column reduces the initial reading burden while keeping product and expense examples nearby. Explore teal, pale grey surfaces and a more compact navigation treatment.

These are proposals, not owner preferences. Use the same literal synthetic results in every direction, with genuinely different composition rather than palette swaps. Maintain flat 2D quantitative marks.

## Review prompts

Without explaining the interface first: identify the month and what its main result means; open a product and find its missing-cost or loss explanation; locate the expense import/review route and explain why the net result is unavailable. Then compare composition, readability, density and visible actions. Ask which direction is worth developing and what should change. Representative product/expense interactions are sufficient for this first review; the full connected workflows follow the visual-direction decision.

## Constraints and evidence limits

Use synthetic data only. Literal expected states cover positive, zero, loss, missing cost, partial month and absent comparison. Do not introduce a second finance implementation. Keep current application code, financial contracts, source permissions and app-owned records untouched.

Review at 1440 × 900 and 680 × 800, including larger text and keyboard/focus behavior. These are test conditions, not new minimum hardware requirements. Eralp's hardware, scaling and personal preferences remain unknown. Project-owner review is not Eralp or Windows acceptance.

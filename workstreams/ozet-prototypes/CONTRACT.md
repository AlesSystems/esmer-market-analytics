# Özet visual prototypes

Question: Which information hierarchy makes the monthly result easiest for the owner to understand?
Three disposable React renderings beside the existing overview. One isolated browser entry at /?variant=A|B|C, real navigation vocabulary, in-memory synthetic presentation data. Production entry and report queries unchanged. The current monthly workspace fetches a MonthlyDisplay through narrow IPC, chooses v1/v2, and renders without financial calculations. This experiment replaces only presentation with a separate entry because Electron IPC is unavailable in browser previews. No live or backup access.

## Directions
A. Ayın panoraması. Calm mineral-green analysis desk. A continuous wide trend and a narrow financial reading column. Useful for a quick monthly scan.
B. Market defteri. Warm ivory editorial ledger with burgundy ink, financial equation and ruled detail. Useful for following where the result comes from. No card grid.
C. Kontrol masası. White and cobalt operations board, compact numerical matrix, evidence status at the front. Useful for deciding what to inspect next.
Each includes a small true 3D ceramic stack with selectable Sales/Cost/Expenses layers. This is a navigation object, not a proportional financial chart. Stable HTML equivalents and fallback required. No automatic motion.

Impeccable direction seed 4b75a2a9 assigned fourth grounded candidate. Grounded candidates: analysis desk, shop ledger, closing checklist, monthly panorama, shelf labels, receipt roll, purchasing register. A is the assigned panorama. Lexicon challenger competitive for traceable reading, informing B. Timetable challenger competitive for compact status, informing C. Other challengers declined for unfamiliarity or reduced clarity. Raises: fixed columns from split-flap; paired claim/evidence from monochrome; grouping discipline from cassette; one focal area from feed. User requested three completed alternatives, so no intermediate direction approval is inserted. Existing DESIGN.md stays authoritative for production; no winner chosen.

## DAG
| ID | Type | Objective / allowed writes | Depends | Acceptance | State |
| --- | --- | --- | --- | --- | --- |
| P0 | analysis | Inspect requirements, current screen, renderer | none | Product truth and scope recorded | completed |
| P1 | design | Shared synthetic presentation shape and variant contracts | P0 | Three different structures, no fabricated real claims | completed |
| P2 | implementation | Variant A, entry, server, shared components, 3D | P1 | Runs with one command, URL and keyboard switcher, fallback | completed |
| P3 | implementation | Variant B and B CSS only | P1 | Editorial ledger, actions, narrow layout | completed |
| P4 | implementation | Variant C and C CSS only | P1 | Operations matrix, actions, narrow layout | completed |
| P5 | integration | Assemble A/B/C | P2,P3,P4 | Same fixture, distinct structure, scoped CSS | completed |
| P6 | test | Browser evidence and project static checks | P5 | Desktop/narrow, actions, keyboard, WebGL loss, reduced motion | completed |
| P7 | review | Independent review | P6 | Material defects resolved or disclosed | completed |
| P8 | documentation | Capture branch, screenshots and handoff | P7 | Runnable URLs, commit, limitations | completed |

Throughput: root owns shared state, server and A. Workers own B and C files exclusively. Review follows integration. No source or production changes, deployment, merge, or Windows acceptance. One batch visual review plus one correction round.

## Poteto Prototype checklist
1. Scope the decision the prototype exists to make. Complete above.
2. Gather references when the design space is open. Current UI and product records inspected; three alternatives requested, no direction-selection gate.
3. Build throwaway in an isolated scratch dir, separate from production source. Separate prototype entry beside overview; no production imports of prototype.
4. When comparing alternatives, build them behind one switcher (buttons or a keypress), each variant labeled.
5. Verify on the matching surface.
6. Present alternatives, tradeoffs, and a recommendation.
Swarm: Frame completed; Fan out to exclusive B/C files; Aggregate at P5; Report at P8. No production Feature/TDD or full architecture tournament for this throwaway design artifact. Runtime observations replace prototype tests.

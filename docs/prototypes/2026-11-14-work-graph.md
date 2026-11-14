# Prototype implementation work graph

Scope: [#148](https://github.com/AlesSystems/esmer-market-analytics/issues/148), the first prototype frontier of [#147](https://github.com/AlesSystems/esmer-market-analytics/issues/147). The user explicitly requests review before continuation. No production implementation is included.

Integration branch: `codex/ui-prototype-review`, based on `3520ce0821f6b90a1f0ed903beb2e08fa837584f` (origin/main). Original checkout and unrelated worktrees stay unchanged. One implementer owns the isolated prototype directory in its own worktree; the merger alone integrates its commits.

| ID | Type | Objective / artifact | Depends on | Acceptance | State |
| --- | --- | --- | --- | --- | --- |
| P01 | analysis | Read current specification, graph, contracts and repository state | — | Known scope and review boundary; remote/base verified | completed |
| P02 | design | Record existing confirmed visual brief and explicitly labelled hypotheses; resolve #142 | P01 | No invented preferences or aesthetic acceptance; three comparable directions defined | running |
| P03 | implementation | Implement #148 in its own branch/worktree | P02 | Clickable comparable month journeys, representative products/expenses, safe literal scenarios and local launch | pending |
| P04 | integration | Merge #148 onto integration branch through merger | P03 | Clean merge, intentional commits, original work preserved | pending |
| P05 | test | Browser behavior, keyboard, narrow/large-text and screenshot verification | P04 | Named scenarios pass and limitations recorded | pending |
| P06 | review | Standards and specification review; fix findings, rerun affected checks | P05 | No unresolved blocking findings | pending |
| P07 | documentation | Review assets, evidence and tracker handoff | P06 | Runnable local preview, screenshots, launch instructions, exact commits and checks | pending |
| H01 | review | Project owner selects/refines visual direction (#143) | P07 | Explicit feedback/approval of a concrete direction | blocked: awaiting prototype and user review |
| P08 | implementation | Connected product, expense and operations tickets #149–151 | H01 | Respective ticket acceptance criteria, integrated prototype | blocked: H01 |
| H02 | review | Connected-flow decision #144 | P08 | Human walkthrough and agreed flows | blocked: P08 |
| P09 | documentation | Handoff #152 | H02 | Final specification/coverage/evidence artifact | blocked: H02 |
| H03 | review | Final acceptance #145 | P09 | Explicit project-owner acceptance | blocked: P09 |

Every node runs only after its predecessors succeed. P06 fixes are serialized in one implementer. The scope for P03 is `prototypes/visual-directions/` plus related prototype documentation/tests; no production source, schema, service, package dependency or source-data changes. P05 reviews the isolated browser prototype, not production Electron or Windows acceptance. UI tests cover behavior, not styling preferences. Financial fixtures are literal expected outputs, not calculation logic.

Risks: an aesthetically unsuccessful design still needs human revision; prototype behavior does not prove persistence or Windows operation. After H01, overlapping shared-shell writes in #149–151 must be serialized or assigned explicit stable interfaces. This graph pauses at H01 for the present user instruction.

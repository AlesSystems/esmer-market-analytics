# Planning evidence for the Esmer Market release cycle

Recorded on 2026-10-01. These are planning checks, not application acceptance.

## Follow the selected planning workflow

The following is the verbatim checklist from the pinned multi-phase-plan playbook. The Codex adapter and the user's instructions govern host-specific substitutions.

- [ ] 1. When the change is one or two files with an obvious approach, skip the plan. Say so and stop.

- [ ] 2. Settle open questions by prototype before you write. Run `playbooks/prototype.md` for each. Keep the branch, the SHA, and the screenshots for Appendix A. Ask the operator only about a product or preference call that no run can settle. Give options (the **never-block-on-the-human** principle skill).

- [ ] 3. Explore in subagents with `subagent_type: "poteto-agent"` and an explicit model per the Subagents section (the **guard-the-context-window** principle skill). Each returns file pointers, conventions, test commands, and entry points. No inlined dumps.

- [ ] 4. Copy the skeleton below into the plan file and fill every placeholder. Unless the operator names a path, write the file under the agent store's `docs/`. Keep every heading and every sub-block in the order shown. One section per PR. One PR is one change with its own evidence (the **sequence-verifiable-units** principle skill). Name the execution playbook in **How to read this**. Pick between `playbooks/autopilot-full.md` and `playbooks/autopilot-stack.md` per the rule at the end of `playbooks/autopilot-stack.md`. A standing program takes `playbooks/orchestrate.md`.

- [ ] 5. Write under `/technical-writing` in full, then `/unslop`. The body is one Diátaxis mode, how-to. Appendices hold explanation and reference. Each heading states the task or the finding. No long dashes. No mid-sentence colons.

- [ ] 6. Run `node pstack/skills/poteto-mode/scripts/check-plan.mjs <plan.md>` and fix every line it prints (the **encode-lessons-in-structure** principle skill).

- [ ] 7. Hand back. Post the plan path and the script's output, then stop. Execution starts on the operator's explicit go, under the execution playbook the plan names.

Step 1 does not apply because this is a cross-issue release cycle. Step 2 skips new prototypes because #38 already approves the composition and business contract. No permitted synthetic prototype could establish SQL semantics. Step 3 used two independent read-only workers. Step 4 produced the plan and graph in the user-requested workstreams folder. Step 5 applied technical-writing and unslop. Step 6 passed after review and validation below. Step 7 is the plan-only handoff.

The runtime template is adapted deliberately. No goal or automation was requested. No cloud VM or independent model family is assumed. Source inspection and owner installation keep their separate permission boundaries. Implementation and merge authorization already exists and must not be requested again. Existing synthetic UI decisions need working evidence, not a fresh design-permission ritual.

## Inspect the current repository and tracker

| Item | Observed state |
| --- | --- |
| Local checkout | `main` at `11ed6e993f0165b807fc77850492f9f7a335469b` |
| Remote main after fetch | `9923427afa1716105b5ced224783bfa6189cccfe`, merged #45 / approved #38 contract |
| Existing user changes | `src/ui/App.tsx`, `tests/desktop/startup.test.ts` |
| Existing-change diff SHA-256 | `5df5e4ce83f91b45872634485e31d533ce28f17d7c0c82236d26062ed5255c8d` |
| PR #46 | Open, head `85d4645555cdac4fc0a244152837cf8904d5a39e`, base main `9923427`, four documentation files, no GitHub reviews or checks |
| PR #47 | Open, head `d2a83cb`, base main `9923427`, synthetic implementation, no GitHub reviews or checks |
| Delivery issues | #38 closed; #39, #40, #41, #42, #43 open |
| Trackers | #3 and #36 open; historical checklist text is not current implementation proof |

Commands included `git status --short --branch`, `git worktree list`, `git fetch origin`, `git show`, `gh issue view NUMBER --comments --json ...`, `gh pr view ...`, `gh pr diff`, and read-only `gh api` requests. Issue bodies, comments, labels, and dependencies were read. Both PRs target main independently.

The two workers read disjoint source/import and report/UI/Windows areas. Their findings were reconciled by the coordinator against the approved contract, the actual source/import entry points, package scripts, and the release acceptance record. Neither worker changed files or ran application/source tests.

The mandatory cross-repository recorded-row plan was read through the authenticated GitHub API. Its raw-preview privacy boundary still applies. Its historical claim that `prepareSqlCandidate` throws is superseded by current code, which writes a raw package.

## Separate evidence from inference

PR #46 records an authorized 2026-09-30 isolated observation pass. It does not admit any real financial population. Completion, units, tax/discount basis, historical cost, conversions, and return attribution remain unproven. Its value scope excludes the additional unit, product-label, archive/cancellation, and conversion-link values needed for broader proof. Further reads need an exact reviewed proposal and applicable explicit permission.

PR #47's full 44 unit, 289 integration, and 34 packaged macOS pass record describes `9d9d356`. It is historical evidence. This planning run did not rerun those suites or validate current `d2a83cb` behavior.

The existing release record explicitly leaves independent recovery, physical storage failures, clean/default-profile lifecycle, offline acceptance, full admitted real-volume performance, and some native Windows behavior open. Old synthetic receipts are not promoted to the final build.

The plan uses the approved fallback product label when names are not separately approved. It preserves gross estimates before operating expenses, return-month attribution, at most three graphs, old accepted reports, raw preview separation, and disabled production live access.

## Record the planning DAG

| Node | Type | Dependencies | Acceptance | State |
| --- | --- | --- | --- | --- |
| PLAN-00 | analysis | None | Scope, dirty-work preservation, and graph recorded before delegation | completed |
| PLAN-01 | analysis | PLAN-00 | Source/issue evidence and exact remaining blockers cited | completed |
| PLAN-02 | analysis | PLAN-00 | Current reporting/UI/Windows code and checks mapped | completed |
| PLAN-03 | design | PLAN-01, PLAN-02 | Whole-cycle contracts, graph, verification, and merge/release rules saved | completed |
| PLAN-04 | review | PLAN-03 | Independent requirements/evidence review findings resolved | completed |
| PLAN-05 | test | PLAN-04 | Structure, graph, local links, and preserved diff checks pass | completed |

The initial graph was saved before the workers were spawned. Only the coordinator writes `workstreams`. PLAN-01 and PLAN-02 were read-only. All implementation nodes in `graph.json` describe future execution, not completed work.

## Validate the artifacts

Poteto dependency verification passed at pinned commit `7366ac128bdf95f45e6734f412b49a4031800169`, reporting 68 skills, 187 files, and 95 routes.

The helper was prepared in `/tmp/esmer-market-poteto-plan-20261001`. Skill/library/cache files and application dependencies were not changed. The first structure check found one case-sensitive required marker, `read pinned workflow`. The plan was corrected without changing its behavior.

Run the structure check with the following command.

```sh
python3 /Users/altanesmer/agent-library/skills/also/poteto-mode/scripts/poteto.py run --work-dir /tmp/esmer-market-poteto-plan-20261001 check-plan /Users/altanesmer/Desktop/Ales/esmer-market-analytics/workstreams/esmer-market-release-plan.md
```

The final structure checker output is `6 PR sections, 0 problems`. The graph check passed for 29 unique acyclic nodes with required contracts and states. Thirteen local links resolve. `BASE` is the only ready node; `R39-AUTH` is explicitly blocked. No delivery node is marked completed.

All four untracked planning files passed `git diff --no-index --check` against an empty file. The initial whitespace wrapper incorrectly expected exit zero for a no-index difference; it was corrected to accept exit zero or one only when both diagnostic streams are empty. This was a check-wrapper failure, not whitespace damage or an application failure.

The existing application diff hash still equals `5df5e4ce83f91b45872634485e31d533ce28f17d7c0c82236d26062ed5255c8d`. `git status` contains the same two modified application files and the new untracked `workstreams/` directory. No commit or branch was changed.

To check graph structure again, run this from the repository root.

```sh
python3 - <<'CHECK'
import json
from pathlib import Path
rows = json.loads(Path('workstreams/graph.json').read_text())['nodes']
nodes = {n['id']: n for n in rows}
assert len(nodes) == len(rows)
required = {'id', 'type', 'objective', 'dependencies', 'state', 'inputs', 'allowed_files', 'outputs', 'acceptance_criteria', 'verification', 'risk'}
for n in rows:
    assert required <= n.keys()
    assert set(n['dependencies']) <= nodes.keys()
    assert n['state'] in {'pending', 'ready', 'running', 'blocked', 'completed', 'failed'}
    assert n['state'] != 'blocked' or n.get('blocked_reason')
    if n['state'] in {'ready', 'running', 'completed'}:
        assert all(nodes[d]['state'] == 'completed' for d in n['dependencies'])
seen = set()
while len(seen) < len(nodes):
    ready = {i for i, n in nodes.items() if i not in seen and set(n['dependencies']) <= seen}
    assert ready, 'cycle'
    seen.update(ready)
print(f'PASS: {len(nodes)} acyclic work contracts')
CHECK
```

## Independent review and limitations

Reviewer `gpt-6.1-sol` returned PASS for the plan-only handoff with no unresolved P1/P2 findings. The reviewer found one P2 in R47's performance gate. The original draft lacked numeric ceilings for added aggregation and report readiness. The repaired plan uses the named 25,000-document/25,000-line synthetic fixture and five samples, with proposed 5,000 ms aggregation, 60,000 ms cold-report, and under-2,000 ms ordinary-page gates. These are acceptance proposals, not claimed measurements. The reviewer re-read and accepted the repair.

The review also checked source boundaries, current PR heads, the approved contract, graph structure, existing-file preservation, and the decision trail. Available agents use one model family. No cross-family review is claimed. Review covers observable artifacts and tool findings; a raw transcript export is unavailable. Canonical log entries record the checker correction, review repair, and final validation.

No application implementation, source reconnection, database start/restore, tests against real records, Git commit, PR creation/merge, release upload, or owner contact happened during planning. No application test pass or release readiness is claimed.

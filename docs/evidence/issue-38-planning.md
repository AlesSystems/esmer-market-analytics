# P01 planning evidence

Gate [#38](https://github.com/AlesSystems/esmer-market-analytics/issues/38) covers the [monthly product-profit contract](../contracts/monthly-product-profit.md) and [static diagram/page sketch](../diagrams/monthly-product-profit.html). It excludes source inspection, application changes and release acceptance.

## Identity and decisions

- Date/environment: 2026-09-29, local macOS documentation workspace.
- Branch: `codex/monthly-profit-contract`, based on `11ed6e9`.
- Fixture identity: P01 synthetic examples E01–E12 in the contract. No real records or private evidence used.
- User confirmed gross product profit before operating expenses and returns in the recorded return month in this chat.
- The user then approved the complete contract and diagram, including source scope, interface, states and composition. This records planning approval only.
- Existing uncommitted UI/test changes in the original checkout were excluded through a managed worktree.

## Checks

| Procedure | Expected result | Actual result |
| --- | --- | --- |
| Independent decimal arithmetic below | Literal E01–E12 outputs and product/day/month equality | Passed. |
| Resolve relative links and Markdown anchors in changed documents and sketch | All local targets exist | Passed after final revisions; 36 targets/anchors. |
| `git diff --check` | No whitespace errors | Passed on the documentation diff. |
| Diagram skill `scripts/self_check.py docs/diagrams/monthly-product-profit.html` | Accessible single-file static HTML | Passed. |
| Browser inspection | Readable diagram, no clipped text, correct synthetic values | Passed in installed Chrome through Playwright; no clipped diagram labels. |
| Independent contract review | No unresolved semantic or scope findings | Passed after one unknown-unit clarification; no outstanding findings. |
| Owner review | Explicit agreement on remaining P01 decisions | Passed; user answered “Approve the contract and diagram” on 2026-09-29. |

The repository has application test/build/package scripts, but none is required for this documentation-only change. No failing behavior test, source validation, application regression, Windows test or release acceptance is claimed. P02 real semantics and P03–P06 implementation/acceptance remain open.

## Reproduce the independent arithmetic

Run from any directory with Python 3. These literal expectations use the standard-library decimal module and do not import application code. Counts, unknown-value handling, UI interactions and version preservation remain future behavioral tests.

```sh
python3 - <<'PY'
from decimal import Decimal as D, ROUND_HALF_UP
ratio = lambda n, d: (D(n) / D(d) * 100).quantize(D('.01'), rounding=ROUND_HALF_UP) if D(d) > 0 else None
assert 2 * D(100) - 2 * D(60) == 80 and D(50) - D(30) == 20
assert D(250) - D(150) == 100 and ratio(100, 250) == 40
assert D(200) - D(100) - (D(120) - D(60)) == 40
assert D(150) - D(90) == 60 and ratio(350, 390) == D('89.74')
assert D(150) + 40 == 190 and ratio(60, 150) == 40
assert D(-100) - D(-60) == -40 and ratio(-40, -100) is None
assert ratio(0, 100) == 0
assert D(100) - D(100) == 0 and D(100) - D(120) == -20
assert D('1.250') * 80 * D('.9') == 90 and D('1.250') * 50 == D('62.5')
assert 2 * D(20) - 2 * D(12) == 16
assert D(130) - D('86.5') == D('43.5') and ratio('43.5', 130) == D('33.46')
assert D(200) - D(60) - D(80) == 60
assert D('.015') + D('.015') == D('.030')
assert D(0) - D(0) == 0 and D(0) - D(5) == -5 and ratio(0, 0) is None
assert D(100) - D(100) - (D(60) - D(60)) == 0 and ratio(200, 200) == 100
assert ratio(250, 250) == 100
assert D(80) + D(20) - D(40) == D(40) + D(20) == 60
print('PASS: independent E01–E12 arithmetic and day/product/month equality')
PY
```

The default Playwright browser launch failed because its bundled Chromium executable was absent. The same render check passed with installed Chrome; no browser installation was needed. The diagram geometry verifier is absent from the installed skill; connector routes and text bounds were inspected directly. Computed font families were Instrument Serif, Geist and Geist Mono, with declared system fallbacks.

## Workflow choices

Poteto's Laziness Protocol selected the existing calculators, report/session ownership, formatter and UI sections; no new calculation engine or design system is proposed. Prove It Works selected literal independent arithmetic, rendered artifact inspection and separate review. One read-only code inventory identified version selectors, paged evidence and cross-period return dependencies before the draft. The finite work DAG and decision trail are task-local scratch artifacts, not a new framework.

## Independent review

An independent reviewer checked the issue, documents, calculation/report code, diagram source and rendered screenshot. The review found one planning mismatch: unknown units invalidate the current whole document, rather than only its cost. The contract now preserves that behavior and explicitly defers partial recognition. Re-review found no outstanding findings. Arithmetic, 36 local links/anchors and whitespace checks passed after repair.

Review used the same model family, not a cross-family panel. The reviewer checked the task-local trail against artifacts and supplied task context; a complete conversation transcript was unavailable. Application-comment review was not applicable because this change contains no application code or code-comment changes.

P01 is complete as a documentation gate. P04 synthetic groundwork has its P01 prerequisite satisfied; P05 still requires the P04 contract, and P03 still requires P02. Further task authorization and all real-source, Windows and release gates remain unchanged. GitHub CLI is used per the repository tracker instructions.

## Owner graph clarification — 2026-09-29

The owner confirmed that the app will include graphs, capped at three. The diagram/page sketch now shows daily covered gross profit, product covered profit and cost coverage, all fed by the same monthly report. Table search does not change the graphs. Synthetic E03 values remain unchanged: daily +100/−40/zero, products A +40/B +20/C unavailable, cost coverage 350/390 (89.74%). Accessible numerical alternatives remain available.

Verification: the diagram skill self-check, independent E01–E12 arithmetic, 36 local links/anchors and `git diff --check` passed. Installed Chrome rendered the revised sketch; visual inspection caught a long architecture-node label, which was shortened before the final render. This follow-up changes planning documents only; application implementation remains a separate task.

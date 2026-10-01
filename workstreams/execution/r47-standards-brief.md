# R47 standards review

Read-only independent review in /Users/altanesmer/.codex/worktrees/profit-source-evidence/esmer-market-analytics. Fixed point1ed1824ec5ee448cf880d20e89d74d1d67d08486. Compare git diff 1ed1824ec5ee448cf880d20e89d74d1d67d08486...HEAD and verify exact final head before verdict; code tested625661b, final evidence commit may follow. No app changes after that code are expected.

Commit list at brief time:
625661b Merge remote-tracking branch 'origin/main' into codex/product-profit-reports
d2a83cb docs(reports): record synthetic P04 evidence and Windows handoff
9d9d356 fix(recovery): group v2 lines and require every product identity
e748961 fix(reports): keep product profit comparisons bounded
6a6ad0a fix(recovery): verify v2 aggregates against pinned lines
e6acd32 fix(profit): mark costless observed days unavailable
4b3a73f fix(reports): bound cross-format comparison to composition summary
7c0bcb6 fix(reports): enforce raw search length at IPC boundary
73b8ca4 test(desktop): verify pinned product profit paging and restart
6233bb0 test(reports): cover v2 paging export recovery and v1 compatibility
bbecf9d feat(reports): expose bounded product evidence and preserve v2 artifacts
5331091 feat(reports): compose immutable monthly product profit v2
8be4364 test(reports): require synthetic product profit in monthly candidate


Read complete preferences.md in this directory, repository AGENTS and relevant foundation docs, /Users/altanesmer/agent-library/skills/code-review/SKILL.md, Poteto wrapper /Users/altanesmer/agent-library/skills/also/poteto-mode/SKILL.md and references/codex.md. No nested agents. User authorized implement/test/PR/merge but root alone integrates. No source/SQL/container/private records, credentials, remote or GitHub writes. Own only r47-standards-review.md here. Do not alter shared branch/build while worker finalizes docs.

Originating spec is approved docs/contracts/monthly-product-profit.md and issue41, read gh issue view41 --comments and saved issue-41.json. Review full current PR47 and body/comments. Evidence receipts /tmp/esmer-market-r47-evidence-20261001; current44unit,289integration+5skips,34Macdesktop+7skips, typecheck/lint/build pass. Ten live lanes and five paired baseline/head performance observations pass proposed local ceilings; Windows belongs to user and real-data issue41 remains open. r47-comments.md found no new comments/suppressions. Probe failures were corrected harness issues, require honest receipt scope. Read live.json, compatibility.json, performance.json and concise new docs/evidence record when available; avoid reading key files/profiles.

Standards and Spec reviewers are independent; do not read sibling report until your verdict is written. Report PASS/ISSUES/BLOCKED, precise findings with file/line and standard/spec quote, separate measured evidence from inference, head/base/patchID, tests actually run versus inspected. Under400words findings plus compact verification metadata. Timebox15min. No code cleanup requests without concrete risk.

Standards axis only. Sources AGENTS.md, foundation D01-D20, docs/contracts/reports.md, privacy.md, calculation precision and desktop boundary rules. Report documented violations with cited rule; smell heuristics are judgment calls and repo rules override them. Skip tooling-enforced issues. Baseline in full: Mysterious Name: name hides purpose ->rename. Duplicated Code: repeated logic shape ->extract shared shape/call both. Feature Envy: method accesses another object's data more than its own ->move logic to owner. Data Clumps: same fields travel together ->bundle one type. Primitive Obsession: raw primitives deserve domain concept ->small type. Repeated Switches: repeated same discriminator ->one map/polymorphism. Shotgun Surgery: one change scattered ->gather in module. Divergent Change: file changes for unrelated reasons ->split responsibilities. Speculative Generality: unused future abstraction ->delete/inline. Message Chains: long navigation ->hide walk in owner. Middle Man: class/function merely delegates ->direct call. Refused Bequest: subtype ignores inheritance ->composition. Distinguish hard rules from possible smells.

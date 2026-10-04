# Source document layout evidence

This presentation refinement supports [issue #8](https://github.com/AlesSystems/esmer-market-analytics/issues/8), plan task 5.2, and the [workspace contract](../contracts/page-control-desks.md). It contributes synthetic local UI evidence to A03 and A07; it does not close those release gates.

## Build and fixture

- Branch `codex/source-document-layout`, based on `bfc0108`.
- Contract test commit `38d8a3b`.
- Implementation commit `da81e6679ffda629ff32e1f0c1f3041ac5ebec64`.
- Environment macOS 27.0 build 26A428, arm64, Node 24.15.0, Electron 44.3.0. Checks launch the packaged app from `release/mac-arm64`.
- Synthetic fixture `fixture:document-layout`, extraction `seven-lines`, generated from `rawSnapshot()` by `tests/desktop/source-document-layout.test.ts`. Fourteen header fields, seven lines, optional cost candidates, high precision, null and zero are deliberate test inputs.
- Screenshots contain synthetic records only. No production source, private backup, customer record or credential was accessed. The initial baseline used the fixture's original total; the final fixture adds a larger total to exercise Turkish thousands grouping.

## Acceptance contracts

| ID | Expected behavior | Actual evidence |
| --- | --- | --- |
| DOC-01 | Header fields form readable groups before the line ledger | Identity/date, currency/status and recorded amounts use scoped grids and separators; desktop and minimum screenshots show the groups. |
| DOC-02 | First line appears in the 1440 by 1000 initial viewport | Baseline failed for both destinations with viewport ratio 0. Focused packaged checks now pass. |
| DOC-03 | Every projected field and source string survives | Tests assert all 14 header label/value pairs, full quantity and cost strings, and nonzero decimal precision. Null stays distinct from recorded zero. |
| DOC-04 | The owner can read all seven lines and move horizontally by keyboard | All seven rows appear in ordinary page scrolling, with no nested vertical clipping. ArrowRight moves the focused narrow table. |
| DOC-05 | Small windows preserve content and filters | 1120 by 720 and 390 by 844 have no whole-page horizontal overflow. Returning to documents retains the type and product filters. |
| DOC-06 | Source corrections remain visible | The capture test asserts the corrected primary value and exact raw string within the same header field. |

The directed work graph is requirements/assessment, layout decision, failing packaged contract, implementation, verification, independent review, and PR handoff. One worker owns all coupled UI/test changes. Git and packaging operations are serialized. The detailed graph and command logs remain in `work/poteto/source-document-layout/` in the task worktree.

## Verification

- Baseline packaged `source-workspace.test.ts` passed 2 tests.
- New contract on the unchanged baseline failed at the first-row viewport assertion on both destinations. [Baseline screenshot](source-document-layout/before.png) shows the one-column header and clipped table.
- `npm run test:unit` passed 50 tests.
- `npm run test:integration` passed 312 tests; 14 opt-in SQL/source checks skipped.
- Final focused packaged checks passed 4 tests after the bounded visual confirmation.
- `npm run typecheck`, `npm run lint`, `npm run build`, and `git diff --check` passed.
- Full final `npm run test:desktop` passed 75 tests; 11 Windows, private-data and isolated-SQL checks skipped. The first broad run exposed one stale combined-value assertion, which was updated to assert the readable value and exact raw string separately.
- Independent single-model review found no actionable correctness, regression, security or accessibility issue in the final code diff. Its comment review found no introduced comments or suppressions. The reviewer inspected the diff and synthetic evidence; the parent ran the suites.
- Packaged `app.asar` SHA-256 `7b914089e1f3b32de436428341524bdd6bad4f10916ef7e01363ddfd4e5f4aba` binds these tests to the packaged artifact.
- The mechanical design scan reported only incumbent muted-color advisories. The final CSS uses the existing palette variables. Two batched visual inspections covered desktop, minimum, narrow and raw display states; no additional polish loop was run.

## Synthetic screenshots

[Desktop](source-document-layout/desktop.png), [minimum window](source-document-layout/minimum.png), [exact source strings](source-document-layout/raw.png), and [narrow window](source-document-layout/narrow.png).

## Remaining acceptance

Windows installer/portable execution, Windows text scaling, full-volume performance and real-source acceptance remain open. No schema, dependency, IPC, source access, privacy projection or deployment change is included. The isolated SQL selector adaptation is typechecked but its opt-in test was not executed.

Continue on this branch on the authorized Windows test machine. Run `npm run package:win`, select the packaged executable with `ESMER_EXECUTABLE`, and run `npm run test:desktop -- tests/desktop/source-document-layout.test.ts tests/desktop/source-workspace.test.ts tests/desktop/live-tracking.test.ts`. Inspect the grouped header, raw toggle and horizontal table at the actual Windows scaling settings. Record that evidence separately before closing A07.

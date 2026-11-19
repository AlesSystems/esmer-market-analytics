# Giderler draft confirmation

The owner selected the centered dialog on November 19, 2026, after comparing the treatments saved in local prototype commit `f39313b`. The application change is `a11da59` on `codex/expense-draft-dialog`. It follows the draft guard established in [issue #72](https://github.com/AlesSystems/esmer-market-analytics/issues/72) and the [expense contract](../contracts/expense-completeness.md).

## Packaged checks

Environment was macOS 27.0 arm64, Node 24.15.0, and Electron 44.3.0. The screenshots use a disposable profile with two synthetic November 2026 expenses, Kira and Elektrik, and an unsaved category of Su.

| Check | Expected | Observed |
| --- | --- | --- |
| Focus and draft retention | Open **Elle ekle**, edit **Kategori**, and select **Vazgeç**. Focus starts on **Düzenlemeye dön** and stays in the dialog. Escape or the backdrop keeps the draft and returns focus. | The focused test failed on `d7c26e7` because the background field accepted focus. The revised packaged UI passed focus containment, Tab order, Escape, backdrop dismissal, and opener restoration. |
| Discard and navigation | **Taslağı sil** clears the draft and performs the requested action. A second input during exit cannot change the decision. | The packaged suite passed form, month, page, and recovery paths. A direct packaged check sent keep and discard in the same event turn. Keep won and the draft remained. The in-flight save notice continued to block departure without offering discard. |
| Motion and responsive layout | Open and close with Prototype A timing. An interrupted opening continues from its current opacity. Reduced motion removes the transition. | Chromium reported 205 ms for the panel and 185 ms for the backdrop on entry. Both reported 140 ms on a full exit. Immediate close kept opacity at 0 before and after the request. At 390 × 740, both actions were visible with reduced motion and Escape restored focus without starting a transition. |

`npm run typecheck`, `npm run lint`, and the production build passed. `npm run test:unit` passed 185 tests. `npm run test:integration` passed 314 with 17 skipped. `npm run test:desktop` passed 72 packaged macOS tests with seven skipped.

## Screenshots

- [Previous dialog at 1280 × 900](images/2026-11-19-expense-draft-dialog/baseline.png)
- [Centered dialog at 1280 × 900](images/2026-11-19-expense-draft-dialog/desktop.png)
- [Centered dialog at 390 × 740](images/2026-11-19-expense-draft-dialog/narrow.png)

## Windows handoff

On macOS arm64, `npm run package:win` built the unpacked payload and stopped when the host could not launch NSIS `makensis` (spawn error -86). The Windows workflow packages and tests the PR head on a Windows runner.

For a native walkthrough, use the matching Windows build with a disposable profile. At 100%, 125%, and 150% display scaling, open a draft, change its category, and try leaving by **Vazgeç**, a month change, and a tab change. Verify that Keep, Escape, and clicking the backdrop put you back at the trigger with the draft values intact. Verify that **Taslağı sil** completes the intended action and that a fresh form opens blank. Toggle reduced motion and check the same decisions. Record that walkthrough separately under [#151](https://github.com/AlesSystems/esmer-market-analytics/issues/151).

# Execution checkpoint

The real-data profit release remains blocked by source semantics and user-run Windows acceptance. Only the existing isolated backup is available. No renewed source read, container action or production access occurred.

| Work | Result | Evidence |
| --- | --- | --- |
| Existing source observations, PR #46 | Merged `1ed1824ec5ee448cf880d20e89d74d1d67d08486` | Independent docs PASS at `85d4645`; 40 local links/whitespace. |
| Synthetic reports and recovery repair, PR #47 | Merged `df7387dab8a7c1e9b0caea215cc216e513a57fe9` | Final reviewed head `328453e1`; Standards and Spec PASS after reproduced mutation fix; 44 unit / 291 integration / 34 Mac desktop tests; 5 + 7 skips. |
| Bounded source metadata proposal, PR #48 | Merged `c2f8ee050911f17d704f203269285a19d7375f36` | Exact reviewed patch `1c586634`; 5 links, SQL-block hashes, whitespace. Proposal only; no execution or semantic promotion. |
| One-page synthetic profit UI, PR #49 | Merged `5a91017728c027732aac5912aab8c4681ba16215` | Final reviewed head `3219c0c`; both reviews PASS; repaired44unit/294integration/47Mac desktop passed,5+7skips;10lanes and5paired measurements. |
| Windows continuation | Exact branch/head and commands prepared | Candidate `codex/monthly-profit-page@3219c0c`; user execution pending. |

At merged main `c2f8ee0` the application/test trees match reviewed PR #47. Root ran the existing packaged product-profit and clean-install-restore checks against the unchanged verified archive; 2 passed. Receipt `/tmp/esmer-market-r47-evidence-20261001/post-merge-smoke.log`. The archive remains `c7220ece53cea49594d264ce73e2368fef84ef8bffcb2b80e7c7daa73fb750fe`. No rebuild was needed because integration changed only documentation.

The verdict ledger retains failed `9ba93b3` and passed `328453e1` separately. Its conservative `type-check-only` label for PRs #46/#48 means documentation validation only: upstream has no docs-verification enum. No TypeScript, SQL or runtime test is claimed for those documentation-only changes. Repository gh/merge-commit rules override upstream Origin/squash preference. Reviewers share one model family.

## Throughput checkpoint after R47

The measured repaired suite took 0.97 seconds for unit tests, 6.44 seconds for integration and 37.0 seconds for packaged desktop execution, excluding build/probe preparation. Review required one concrete recovery repair cycle; both reviewers independently reproduced the same defect. No merge conflict occurred across the three merged PRs. Reliable review wall-clock duration was not captured, so no numerical review-speed claim is made.

R42 has more interaction/state cases than R47 and uses one exclusive writer plus independent downstream reviews. Extra writers would overlap the shared page and report-display contract. Keep that ownership, reuse the existing package and fixtures, and surface packaging/network delays separately from app failures. Source and user-run Windows lead time remain external; no completion-date promise follows from these local test durations.

## R42 working checkpoint

At implementation head `98f129d1c89d34de9a006d782593e5dbe4092c29`, 44 unit, 294 integration and 47 packaged macOS checks passed, with five SQL-dependent and seven desktop conditional skips. Typecheck, lint, build and packaging passed. Both independent reviewers identified the same missing repeat-selection transition: keyboard activation of an already selected product did not return focus to the detail heading. Test commit `90174ad` reproduced the packaged failure; one-line fix `d7df4c9a7ba7b8cb08f61dc5dd79f1255be89e51` directly focuses the existing detail without refetching. The repaired package passes all 14 focused product-profit checks plus typecheck/lint/build/package. Its archive is `9feefe30dca562f7d972b44fd8b95d399802563fabfcad482591a38d417fa492`.

Final [evidence](../../docs/evidence/r42-monthly-profit-page.md) records all ten synthetic lanes,201-line mixed-document scope,101-product bounds, five paired measurements including coherent month changes and navigation during import, original-calculator v1 workbook equality, screenshots and30.68second video. Root presented top/detail screenshots and video before merge. Both [Standards](r42-standards-recheck.md) and [Spec](r42-spec-recheck.md) passed at final docs-only head `3219c0c`. Repaired full suites repeated:44unit/294integration/47packagedMac passed with5+7skips. The initial failed reviews remain separate.

At merge `5a91017728c027732aac5912aab8c4681ba16215`, application/test trees match the reviewed head. Root ran the E03 owner journey and saved v1-shape compatibility checks against the unchanged repaired archive:2passed in1.7seconds, `/tmp/esmer-market-r42-evidence-20261001/post-merge-smoke.log`. The remote reviewed branch is retained for user-run Windows continuation. The local owned UI worktree was fast-forwarded to the merge; dirty main was not changed.

The default packager stalled downloading the Electron checksum file. The worker uses the existing locked local Electron 44.3.0 distribution via `npm run package:local -- --config.electronDist=node_modules/electron/dist`, followed by direct packaged Playwright checks. UI code was written while the original wrapper waited; the behavioral packaged red was subsequently demonstrated against the immutable pre-R42 package. This sequencing exception stays explicit. The network stall was not a failing application test.

Focused regressions exposed omitted labour detail and a partial-month warning that checked only the declared interval's completeness; both were repaired. One raw-source fallback test correctly retained its old heading. Literal E03 values are 60 monthly profit, daily100/-40,89.74percent cost coverage. No cosmetic redesign or dependency/configuration change was introduced. The exact-header correction permits the existing documentId field in the documents IPC validator; no endpoint is added.

## Publication boundary

This execution record is published separately from the application. Its independent final docs review and PR identify the final snapshot. The snapshot cannot include its own future merge SHA; confirm publication using that PR state. This bookkeeping boundary does not imply a ready real-profit release. Source, real reconciliation and Windows acceptance remain open.

Post-merge image audit found the committed native-zoom screenshot blank. The keyboard/zoom test assertions remained passing. Same-package capture reproduced the blank Playwright image; Electron native capture produced a visible680×720 viewport at zoom2 with focused detail in view. Coordinator inspected it. The documentation PR replaces that image and records the unconfirmed screenshot-transport cause in `docs/evidence/r42/zoom-capture.json`; no application/test change or new Windows claim follows.

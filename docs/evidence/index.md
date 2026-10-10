# Acceptance evidence

## Current capabilities and open gates

Reviewed on 2026-10-05 against `main` at `ff21492`, after [PR #68](https://github.com/AlesSystems/esmer-market-analytics/pull/68). This index points to existing receipts; the documentation review ran no application, Windows or source tests.

The application includes synthetic financial reporting, isolated raw-record browsing, separately labelled recorded-source contribution estimates, Excel and manual expense entry, Excel export and encrypted recovery. The optional isolated SQL connection starts disabled. Successful raw reads and unverified estimates do not activate a validated real financial dataset.

[Recorded-source estimates](../contracts/recorded-estimates.md) have real arithmetic reconciliation over retained authorized September 2025 operands. The source meanings remain assumptions. Return contribution, unsupported costs and unknown amounts stay explicit. Estimates are transient and cannot become accepted financial-report versions.

[Issue #67](https://github.com/AlesSystems/esmer-market-analytics/issues/67) tracks the remaining real-data product gross-profit and margin path. Historical delivery issues, including #14, #26 and #39–#43, are closed. Their closure does not establish source semantics, current-build Windows acceptance or production rollout. [PR #69](https://github.com/AlesSystems/esmer-market-analytics/pull/69) is separate synthetic groundwork and is not included in this baseline.

The original A01–A07 and L01 proof requirements remain in [the acceptance checklist](../superpowers/specs/2026-09-04-esmer-market-rebuild-acceptance.md). The [Phase 10 release matrix](release-acceptance.md) records an older synthetic build. Later receipts below describe bounded extensions, not blanket release acceptance. Current-build Windows/distribution checks, independent recovery, real-source financial proof and full admitted-volume performance require their specified evidence. Production access and owner installation remain separately authorized.

## Later implementation evidence

The October 10 [publication and main integration receipt](2026-10-10-v0.5-main-integration.md) distinguishes the immutable v0.5.0 Mac tag from the PR branch that also preserves the later compact-copy update. It records uploaded asset digests and integration verification.

The October 9 [v0.5 Mac demo receipt](2026-10-09-v0.5-demo.md) records a single imported-source workspace, preserved SQLite storage, automatic source priority and a Mac demo artifact. It supersedes the manual financial/source selector in the October 6 UI. Calculation caveats and Windows/source acceptance boundaries remain in force. [The demo guide](../operations/demo-v0.5-tr.md) gives the presentation flow.

The October 8 [compact-copy receipt](2026-10-08-compact-copy.md) records a further presentation refinement on main `46f654b`. It includes synthetic before/after screenshots, packaged workflow checks and the unresolved Windows packaging boundary.

The October 6 [business navigation simplification](2026-10-06-issue-72-simplification.md) starts at main `afe93cd`, which includes PRs #69 and #71. It records the approved page responsibilities, remembered month, supported invoice browsing and build-specific checks. Its local synthetic results do not close Windows, real-source financial or owner acceptance gates.

| Work | Evidence and continuation |
| --- | --- |
| v0.5 publication and main integration | [Published artifact and branch continuation](2026-10-10-v0.5-main-integration.md) |
| v0.5 unified Mac demo | [Scope and work contracts](../superpowers/plans/2026-10-09-v0.5-demo.md), [verification receipt](2026-10-09-v0.5-demo.md), [Turkish demo guide](../operations/demo-v0.5-tr.md) |
| Business navigation simplification | [Approved plan](../superpowers/plans/2026-10-06-issue-72-simplification.md), [implementation and platform handoff](2026-10-06-issue-72-simplification.md) |
| Prepared-package recovery | [PR #68 receipt](2026-10-04-estimate-package-recovery.md) |
| Manual expense entry | [Plan](../superpowers/plans/2026-10-04-manual-expense-entry.md), [local packaged evidence and open Windows checks](2026-10-04-manual-expense-entry.md) |
| Synthetic SQL update tracking | [Packaged verification](live-mock-tracking.md), [disposable SQL procedure](../operations/synthetic-sql-environment.md) |
| Recorded-source estimates | [Contract](../contracts/recorded-estimates.md), [real arithmetic and packaged evidence](../../workstreams/estimated-v1/evidence.md), [Windows continuation](../../workstreams/estimated-v1/windows-handoff.md) |
| Monthly product-profit UI | [Contract](../contracts/monthly-product-profit.md), [synthetic packaged evidence](r42-monthly-profit-page.md), [historical Windows checklist](../../workstreams/windows-handoff.md) |
| Synthetic product-profit reports | [Independent oracle/report evidence](issue-41-synthetic-product-profit.md) |
| Source-profit scope | [Observation evidence](issue-39-source-profit.md), [renewed scope](issue-39-renewed-scope.md) |
| UI workspaces | [Workspace contract](../contracts/page-control-desks.md), [overview](../../workstreams/ozet-control-desk/EVIDENCE.md), [source](../../workstreams/source-control-desk/EVIDENCE.md), [settings](../../workstreams/settings-page/evidence.md) |
| Source layouts | [Document layout](source-document-layout.md), [filter layout](../../workstreams/source-filter-layout/evidence.md) |

## Original phase evidence

These are point-in-time records. Their branches, issue states, test counts and stop instructions describe the recorded phase. Use their tested build identities and limitations; use the current assigned task for authorization.

| Phase | Local evidence | Windows evidence | Retained procedure or contract |
| --- | --- | --- | --- |
| 1. Desktop foundation | [Local receipt](phase-1-local.md) | [Windows receipt](windows-phase-1.md) | [Handoff](../operations/windows-phase-1-handoff.md), [runtime](../decisions/runtime.md), [desktop boundary](../contracts/desktop.md) |
| 2. Source and fixtures | [Local receipt](phase-2-local.md) | [Windows receipt](windows-phase-2.md) | [Handoff](../operations/windows-phase-2-handoff.md), [source](../contracts/source.md), [oracles](golden-oracles.md), [privacy](../contracts/privacy.md) |
| 3. Extraction and packages | [Local receipt](phase-3-local.md) | [Windows receipt](windows-phase-3.md) | [Handoff](../operations/windows-phase-3-handoff.md), [package contract](../contracts/analytics-package.md), [preparation](../operations/prepare-package.md) |
| 4. Durable imports | [Local receipt](phase-4-local.md) | [Windows receipt](windows-phase-4.md) | [Handoff](../operations/windows-phase-4-handoff.md), [persistence](../contracts/persistence.md) |
| 5. Sales | [Local receipt](phase-5-local.md) | [Windows receipt](windows-phase-5.md) | [Handoff](../operations/windows-phase-5-handoff.md), [decision](../decisions/phase-5-sales.md) |
| 6. Costs and purchasing | [Local receipt](phase-6-local.md) | [Windows receipt and follow-up](windows-phase-6.md) | [Handoff](../operations/windows-phase-6-handoff.md) |
| 7. Expenses | [Local receipt](phase-7-local.md) | [Windows receipt](windows-phase-7.md) | [Handoff](../operations/windows-phase-7-handoff.md), [expense contract](../contracts/expense-completeness.md) |
| 8. Reports and export | [Local receipt](phase-8-local.md) | [Windows receipt](windows-phase-8.md), [performance follow-up](windows-phase-8-performance.md) | [Handoff](../operations/windows-phase-8-handoff.md), [report contract](../contracts/reports.md) |
| 9. Recovery | [Local receipt](phase-9-local.md) | Later [Phase 10 recovery boundary](phase-10-windows-recovery-files.md) | [Handoff](../operations/windows-phase-9-handoff.md), [decision](../decisions/phase-9-recovery.md), [Turkish procedure](../operations/recovery-tr.md) |
| 10. Release preview | [Release matrix](release-acceptance.md) | [Windows receipt](windows-acceptance.md), [command proof](phase-10-proof.json), [performance samples](phase-10-performance.json) | [Licences](licences.md), [install procedure](../operations/install-tr.md) |

## Source and capacity evidence

- [Synthetic import capacity and limits](issue-26-import-capacity.md), [profile receipts](issue-26-import-profiles.json), [capacity decision](../decisions/issue-26-import-capacity.md), and [profiling procedure](../operations/profile-import.md).
- [Isolated source validation](issue-26-source-validation.md), [verification receipt](issue-26-orbstack-verification.json), and [evidence collection procedure](../operations/collect-source-evidence.md).
- [Raw SQL preview](real-sql-preview.md), [source workspace](source-workspace.md), and [preview preparation](../operations/prepare-sql-preview.md).
- [Isolated connection evidence](live-acceptance.md) and [Windows continuation](live-windows-acceptance.md).
- Historical [owner-workspace follow-up](2026-09-26-owner-workspace.md), [financial-readiness investigation](2026-09-26-financial-readiness.md), and [page audit](2026-09-26-page-audit.md).

Private packages, source values and recovery material stay outside Git. A passing calculation proves its declared formula, not the financial meaning of its source fields. A local or historical receipt cannot substitute for current-build Windows or production evidence.

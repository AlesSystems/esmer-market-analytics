# Owner workspace investigation register

Scope expanded on 2026-10-19 to cover every verified issue found across categories, not only the initial design and chart slices. Severity reflects consequence, not cosmetic visibility.

| Category | Evidence / seam inspected | Finding / status | Next gate |
| --- | --- | --- | --- |
| Financial integrity | Actual CoverageBridge return-only rendering and geometry | High: negative returned cost incorrectly shown/subtracted as positive cost, #82 fixed in merged #83 | Packaged Windows rendering |
| Functionality | Actual DailyNetSales table, ready zero-net day | Medium: real activity labelled inactive, #80 fixed in #83 | Packaged Windows rendering |
| Reliability | Actual SourceEstimate React DOM, rejected reads and delayed responses | Medium: no same-context retry, #79 fixed in merged #84 | Independent exact-head review |
| Accessibility | Keyboard focus entry, chart text/table alternatives, responsive CSS | Skip-to-content added in design draft; no claim of a fully audited defect yet | Browser keyboard, 200% zoom, narrow view, contrast |
| UX / design | Existing fragmented welcome/settings/analytics surfaces | #81 coherent Turkish owner workspace redesign in progress | Hosted synthetic visual review before merge |
| Security | Electron boundary, IPC validation, navigation and source handling | Boundary/source privacy/live/recovery tests 20/20; no verified boundary defect. Dependency advisory #86 remediated in #89; no exploitable app format-string path found | Repro before issue/fix |
| Performance | Query scope and owner renderer paths | #85 repeated high-volume pages measured at 1.7–3.4 seconds; #90 bounded cache reduces warm pages to 18–23 ms; cold max-diversity ~2.7 seconds remains | Exact-head review; cold-load optimization remains open |
| Deployment | Linux packaging and Chromium launch | Build/package succeeds; UI launch blocked by cloud socket policy before app startup, environment gate rather than application defect | Supported browser preview; Windows acceptance |
| Preview privacy | Whitelisted static assets generated from synthetic service fixture | No database, secrets, source maps or backend; persistent synthetic labels and desktop-only boundaries | Artifact manifest and hosting approval |
| Source validity | Existing ERP12-compatible estimate contract | Real market costs, stock and source controls unverified; historical field semantics are estimates | Authorized source acceptance, outside current synthetic run |

All findings are tracked even when they fall outside the first implementation slice. Suspicions are not promoted to defects without an actual caller/repro. Shared daily-table negativeUnknown concern was not an owner-flow reproduction and is not reported as a fixed user bug.

Recovery helper correctness: #87 reproduced EEXIST deleting a pre-existing target; fixed in merged #88 with four synthetic regressions. Normal restore callers use fresh directories, so routine owner data loss was not established.

## Tested user-flow coverage

These are synthetic service/integration or DOM seams, not end-to-end Windows acceptance.

| Flow | Passing suite coverage | Remaining gate |
| --- | --- | --- |
| Source import, preview, activation and history | import-activation, import-failures, import-history, raw-preview, source-workspace, source-readonly | Real ERP12 field/source acceptance |
| Sales, product detail and purchase analysis | sales-reconciliation, product-detail, purchasing-report, supplier-return, cost-provenance | Desktop interaction and actual source semantics |
| Expenses and corrections | manual-expense, expense-import, expense-headlines, adjustment-history | Windows UI entry/review |
| Reports and Excel | report-display/jobs/revisions/cache, excel-report, source-estimate | Packaged export dialogs and filesystem behavior |
| Backup and restore | encrypted-backup, recovery-equivalence/files/worker/boundary, restore-failures, ownership regression | Windows encrypted restore acceptance |
| Live connection configuration | live-config/boundary/mapping/failure/store/worker mocks | Isolated SQL tests skip without explicit test credentials; no real SQL attempted |
| Privacy/security | desktop-boundary, source-privacy, source-readonly, recovery-boundary | Bounded test evidence only; no whole-product security guarantee |
| Release contents | release-inventory and Linux package notice verification (79 dependencies) | Windows package/signing/runtime and Mac-specific test |
| New visual system | React skip-focus, token contrast, synthetic preview whitelist | Actual browser screenshots, keyboard traversal and zoom |

Cold-load review additionally found #92: ambiguous comma-joined key signatures admitted a malformed raw row and caused estimate failure. Writer/reader regressions reproduce it; strict array signatures are under review. First-load optimization must retain this validation protection.

# Source control desk

The owner requested the PR #54 blue control desk on the SQL backup source overview, then a PR, merge, and local relaunch. This presentation change implements Task 8.1 without promoting raw records to financial reports. Baseline is 22387f5. Requirements remain the foundation specification, audit, acceptance checklist, and recorded SQL rows plan.

## Data and design

Use the existing SourceView discriminated result. SourceWorkspace owns queries, period, loading, source changes, filters, and navigation. A source overview component consumes the view and named navigation callbacks. Reuse control-desk CSS and compose source-only counts, daily document records, type-code ranking, and source evidence. Keep SourceEstimate intact below the overview. No financial MonthlyDisplay adapter, schema, service, IPC, new dependency, source read, product name, supplier, customer, or payroll field.

architect skipped: the owner selected the existing blue control desk, and the existing SourceView boundary supports this presentation. A financial-report adapter would misstate raw source semantics. No novel architecture or interaction needs competing sketches.

## Feature checklist

- [x] `how` over the affected subsystem.
- [x] `architect` for parallel design exploration. Skip for the selected existing design and source-only boundary above.
- [x] Write the throughput checkpoint as four todo items.
  - Blocking first steps. Ground the existing source path and expose its missing layout with a packaged regression before implementation.
  - Independent workstreams. Root owns tests, evidence, Git, and packaging. Worker owns source overview and scoped UI styles.
  - Shared mutable state. Exclusive file ownership. Serialize packaging and all Git mutations.
  - Smallest safe decomposition. One UI worker keeps counts, charts, evidence, and navigation together. Independent reviewers follow verification.
- [x] Delegate code-writing to a subagent using the configured worker role.
- [x] Verify on the matching surface.
- [x] Rebase into small, ordered commits. Preserve test, implementation, and evidence commits.
- [x] If the design is contested, `interrogate` before shipping. Skip because the user selected PR #54's layout.
- [ ] Run Opening a PR.

## Work graph

| ID | Type | Objective and allowed files | Dependencies | Acceptance and evidence | State | Risk |
| --- | --- | --- | --- | --- | --- | --- |
| S0 | analysis | Trace SourceView and source navigation | none | Grounded ownership and synthetic fixture, no source inspection | completed | low |
| S1 | test | tests/desktop/source-control-desk.test.ts | S0 | Packaged baseline fails at missing source matrix; exact counts and warnings asserted | completed | low |
| S2 | implementation | src/ui/SourceWorkspace.tsx, source overview TSX and scoped CSS | S1 | Blue counts, daily records, type-code drilldown, evidence rail; estimate unchanged | completed | medium |
| S3 | integration | Packaged UI and static/full tests | S2 | Exact synthetic counts, navigation, outside period, no overflow at 1440/1120/680/390; financial desk unchanged | completed | medium |
| S4 | review | Standards axis | S3 | Independent documented standards and code-smell review, findings resolved | completed | medium |
| S5 | review | Spec axis and runtime proof | S3 | Independent source semantics and actual packaged feature check | completed | medium |
| S6 | documentation | workstreams/source-control-desk | S4,S5 | Evidence, synthetic screenshots, limitations, passing patch identity | completed | low |
| S7 | integration | PR and merge | S6 | PR attached, remote head and checks verified, reviewed patch merged | ready | medium |
| S8 | test | Main package and relaunch | S7 | Main includes merge, rebuilt app running; saved user profile retained. Unmet dependency S7 merge | blocked | low |

Windows runtime acceptance remains open. Mac packaged checks do not close Windows or real-source gates. Testing uses disposable synthetic profiles. Relaunch retains the owner's local data.

The earlier recorded-rows program limited chart work and held merge for operator review. This follow-up explicitly authorizes the chart layout update, PR, and merge. Its source-safety and financial-label boundaries still apply. GitHub CLI is the forge per the repository issue-tracker rule.

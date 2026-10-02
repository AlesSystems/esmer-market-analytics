# Estimated V1 delivery

## Workflow checklist

- [x] Read the Principles section of the poteto-mode skill.
- [x] Phase A: Frame
- [x] Phase B: Design the workflow
- [x] Phase C: Run the loop
- [x] Phase D: Keep the audit trail
- [ ] Phase E: Verify and hand back

Feature execution uses how, architect, a throughput checkpoint, delegated implementation, packaged verification, coherent commits, independent review and Opening a PR. Architect phases are Ground, Sketch, Agree, Implement, Scrap. Arena phases are Frame, Fan out, Cross-judge, Pick, Graft, Verify. Agree has no human checkpoint because implementation is authorized. Scrap only applies if the selected design fails.

## Outcome

The owner can import an isolated real-data package and see useful, explicitly estimated product/day/month values offline. Every number has a declared formula, population and assumptions. Reconciliation proves extraction and the chosen formula; it does not prove unknown POS or tax meanings. Verified profit remains a separate capability. Windows acceptance remains user-run.

The user authorized estimated V1 values on 2026-10-02. This changes the previous requirement that unknown sales/cost meanings block every numerical estimate. It does not authorize presenting assumptions as validated source rules or treating missing cost as zero. Record the precise contract after design.

## Throughput checkpoint

- Blocking first steps. Trace the current importer and reporting lifecycle, then choose a reviewed estimate contract before behavior changes.
- Independent workstreams. Source import and report lifecycle investigation have separate read-only scopes and output files. Two design candidates follow that shared grounding.
- Shared mutable state. One implementation owner writes application files. The root alone operates the isolated SQL copy and prepares private evidence. Reviewers do not modify application files.
- Smallest safe decomposition. One owner implements the connected data flow to avoid competing changes to types, validation, reports and UI. Source reconciliation and synthetic desktop verification can proceed independently after implementation.

## Design rubric

Compare two structurally distinct candidates on truthful estimates, minimal implementation, import/recovery compatibility, visible limitations and rerunnable reconciliation. Reuse the existing platform and dependencies.

## Exclusions

No production POS connection, owner installation, live-source rollout or claims of Windows acceptance. No private transaction values, IDs, credentials, locators or backup contents in Git or screenshots. Prior timed-out native-writer investigation remains inconclusive, rather than proof that no native rule exists.

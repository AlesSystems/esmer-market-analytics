# Independent estimated-V1 review

Both reviewers used the configured `gpt-6.1-sol` reviewer role with high reasoning. They were separate from the implementer and independently scoped, within one model family. No cross-family claim is made.

Initial reviewed head `dfc5577e6971c8f582f6912a7698affac41c2059`, base `f705ec1a6e3b365b6e4e0a709a7b405aca416959`, stable patch ID `6ad38f22674cae9b829249f0d37631baa0b0bee5`.

## Standards

Reviewer `estimate_standards_final`: PASS+NOTES. No actionable documented-standard or smell findings. Independently checked exact IPC validation/sender restrictions, strict versioned package projection, canonical-byte/hash/reference checks, store hash pinning, decimal precision, null/zero/negative exclusions, renderer boundaries and exact-text workbook metadata. Five unit tests, six relevant integration tests and the independent Python self-check passed. Private reconciliation was reviewed as a documented root receipt, not independently rerun. Windows remains open.

## Spec

Reviewer `estimate_spec_final`: initial FAIL for one P3 finding. The method's unbroken source hash caused 13px document overflow at the supported 680px native window and 125 percent zoom (544px viewport; 557px document). The new paragraph lacked the existing wrapping class. Contract provenance and zoom requirements apply. No other missing, unrequested or incorrect estimate behavior was identified.

The independent packaged synthetic journey passed import, loss/return warnings, product lookup/drilldown, export, restart and unavailable period. Default-width 125 percent layout had equal 896px viewport/document widths and contained table scrolling. Parent comparison used source-level inspection: the baseline had no estimate paragraph and already supplied the wrapping utility. No parent runtime pass is claimed. Dialog choices were scripted; OS dialog interaction remains a Windows/manual check.

The apparent clipping in the first full-page Playwright screenshot was a zoom capture artifact, independently distinguished from the actual narrow-method overflow using DOM measurements and native capture. Repair `c7f7a64` uses existing wrapping, and `6a64159` exposes the failing packaged regression; the graph preserves this failure before the repair/retest nodes.

The rebuilt packaged regression passed at 125 and 200 percent. Root repeated the private workflow and independent workbook check on the final build. Final exact-head verdicts are recorded in the PR and publication receipt.

# Phase 5 sales report design

The selected Option A layout consumes one calculation path for summaries, breakdowns and document evidence. Issue #8 tasks 5.1 and 5.2 define the test boundaries. Implementation stops before Windows validation.

## Data and ownership

Extend existing document and line records with typed sales fields under a distinct `synthetic-sales-v1` mapping. Preserve the exact legacy `synthetic-relational-v1` representation. Legacy records lack unit, product and tax meaning, so their sales reports are unavailable. No real source rule becomes supported through this change.

Use an additive store migration for the extension. Preserve legacy adjustment fingerprints and accepted reports. New sales fields participate in package validation, hashes, source differences and adjustment fingerprints.

The pure calculator receives explicit normalized facts and calculation context. It returns decimal-string metrics, signed quantities by unit, component lines, exclusions and reconciliation evidence. Reuse the installed decimal.js with an isolated precision configuration sufficient for bounded inputs and sums. Document the synthetic rounding policy separately from unresolved real-source semantics.

The worker retains one immutable snapshot for the open report session. Each query carries its session identity, dataset, app revision and calculation version. Imports can change the active dataset without changing the open report. Explicit refresh replaces the session; stale contexts fail closed. Browsing never calls `acceptReport`. Restart opens the active dataset afresh.

Named report operations validate the sender and exact payload before querying. The renderer receives report views and source evidence, never raw store snapshots or database capabilities. It formats amounts and navigates. It does not calculate financial totals, percentages or reconciliation.

## Alternatives and synthesis

Two independent candidates explored extending existing records and adding a separate sales-evidence stream. An independent reviewer scored semantic honesty, retention, validation, interface depth and migration risk. Both designs used the same model family.

The separate evidence stream scored 22/25; the initial extension design scored 20/25 because it proposed retaining browsing sessions through accepted reports. Choose the extension design's storage representation to avoid duplicated identities, with the separate-stream design's worker-owned session. Reject automatic report acceptance. Reuse decimal.js rather than implementing new decimal arithmetic.

The simpler representation requires a migration and careful legacy fingerprint compatibility. The in-memory session retains one dataset and loses the browsing session on restart. Both costs are bounded and tested. Full-data Windows performance remains a separate acceptance gate.

## Verification order

1. Prove synthetic package validation and migration preservation.
2. Prove G01, basket/return, exclusions, exact decimal arithmetic and deterministic ordering through `calculateSales`.
3. Prove query totals, comparison coverage and pinned drill-downs across refresh and pruning through the durable store.
4. Prove Option A through the packaged desktop application and validate IPC rejection paths.
5. Review the implementation independently, then hand the same branch to Windows validation.

Model the Domain determined the explicit report context and document eligibility states. Laziness Protocol selected the existing package/store ownership and installed decimal library. Sequence Work into Verifiable Units determined the test and commit order. Prove It Works requires packaged desktop evidence before handoff.

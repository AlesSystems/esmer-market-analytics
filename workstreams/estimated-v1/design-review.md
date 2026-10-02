# EV1 independent design cross-judge

Reviewed both complete candidates and their plan/input/report grounding on 2026-10-02. Read the Poteto wrapper/adapter, bundled architect/arena and design red flags. This is an independent same-model-family judgment. No application edits, SQL, Docker or private evidence reads were performed.

## Scores

Scores are out of five. Reconciliation scores assess the proposed verification design, not completed real-data evidence.

| Criterion | A | B | Reason |
| --- | --- | --- | --- |
| Truthful estimates | 4 | 3 | A explicitly separates covered sales contribution from unmatched return exposure. B requires root to settle signs and permits zero quantity in cost coverage. |
| Minimal implementation | 5 | 2 | A extends the existing raw singleton and exposes one pure capability. B introduces dataset tables, migrations, accepted formats and lifecycle branches for unrequested saved estimates. |
| Compatibility | 5 | 2 | A preserves established synthetic/financial guards and accepted report invariants. B must prove migration, activation, snapshot and recovery dispatch across existing callers. |
| Visible limitations | 3 | 4 | Both have explicit provenance/assumptions. A's sketch lacks unsupported-population counters and unknown exposure states and includes an unsafe per-product quantity sum. |
| Rerunnable real reconciliation | 4 | 4 | Both specify independent golden/recovery/export checks. Neither artifact yet contains a completed real formula reconciliation. |

Choose A as the base. The new user scope supports transient estimates with export, so durable estimate datasets do not earn their migration and validation cost. Graft B's explicit unknown amount exposure and fixed assumption-version semantics. Reject B's estimate activation/accepted-history design for V1. A's source hash and distinct format already provide the appropriate transient identity.

## Required corrections before implementation

1. Remove aggregate `recordedQuantity` from product/month/day results. Unknown units can differ even for the same product. Individual recorded quantities may appear in existing row drilldown, with unit unknown. No physical quantity total is justified by CARPAN=1.
2. Define decimal precision for the raw domain explicitly. `src/source/raw-package.ts` accepts up to40 integer and30 fractional digits per operand. Quantity multiplied by cost can require140 significant digits, plus five digits when summing the100000-row cap. `src/domain/money.ts` currently uses precision100. Use a local precision200 clone with suitable exponent display bounds, or enforce documented smaller input caps at the new package boundary. Do not silently use the shared precision100 context. Add a literal independent expected product/sum that exceeds100 significant digits.
3. Expand scope results with supported/unsupported document and line counts, deterministic exclusion reasons for type35/other type, foreign/null currency and status, and an explicit known-exposure plus unknown-amount count/state. Candidate revenue and return exposure must not display0 as a complete amount when all recorded amounts are missing or rejected. A known subtotal of0 is allowed only when labeled partial and paired with missing exposure counts; alternatively return null for an unavailable total. An unsupported population with unknown monetary exposure must not acquire a0 exposure. These semantics apply to summary, products, days and export.
4. Define amount, quantity, multiplier and cost classification precedence so diagnostic counts are deterministic and coverage percentages do not imply completeness. Preserve null, zero and negative cost as distinct exclusions. Require positive quantity for covered sales. Amount-valid but cost-ineligible sales remain visible as uncovered revenue. Preserve actual negative and zero covered contributions; all-uncovered contribution and cost remain null.
5. Keep type12 contribution/cost excluded and type35 wholly excluded. Show a nearby warning that covered sales contribution omits return effects, including unknown return amounts. A negative return revenue candidate is a declared sign assumption, not independently established return identity. Do not subtract it from the covered sales headline or present that headline as net profit.
6. Use exactly the same eligible membership and accumulation for product/day/month scopes, with full sums independent of product paging/filtering. Days outside the retained extraction range remain gaps. In-range empty days describe absence of candidate records, not proven absence of business sales. Verify null states, losses, tiny contributions and all scope equalities independently.
7. Retain old raw v1 compatibility without enabling estimates for it because it lacks cost. New v1 requires the cost key even when null and rejects any unrelated columns. Share validated raw reading with recovery, preserve failed-import rollback, invalidate stale hashes, and keep the existing verified `SalesReports.open` guard. Avoid relabeling old preview as estimate-capable.
8. Real reconciliation must be a rerunnable independent harness over retained private operands and the new actual application package/results. Compare exact selected membership, formula totals, exclusions, product/day/month full sums and export inputs. Retain hashes/counts and public pass/failure evidence without private values/identifiers. Reconciliation of the declared formula does not close unproved POS completion/tax/unit/cost/return semantics. Add packaged synthetic UI and encrypted recovery checks; actual private source output must stay outside screenshots and Git. Windows remains user-run.

## Verdict

PASS for A's architecture after the eight concrete corrections above are incorporated into the implementation contract. This is not implementation acceptance or source-semantic validation. No additional human approval is required for this authorized scope.

## Root synthesis contract assessment

Also read `docs/contracts/recorded-estimates.md`. It incorporates A's architecture and resolves the principal corrections through precision200, no physical quantity totals, positive quantity/cost coverage, return separation, type35 exclusion, old-v1 compatibility, source-hash invalidation, encrypted recovery and independent real formula reconciliation. Covered contribution null/zero/loss semantics are explicit. No renewed SQL read is required by that contract.

Before implementing, clarify two small remaining counting/result rules. Candidate sale/return amount totals with no valid known operands must be null or explicitly labeled known subtotals with an unknown-amount count. Choose deterministic precedence for exclusion reasons or explicitly define them as overlapping diagnostics. Add all-missing sales, all-missing returns, mixed known/null and overlapping-invalid-field fixtures so complete-looking0 exposure and double-counted coverage cannot slip through. The cost-coverage denominator of absolute known sale plus return amounts is a declared formula; unknown amounts need a nearby warning even at100 percent.

With those two clarifications, PASS to implement the synthesized contract. This is a design decision, not a claim that the baseline tests, private package or final feature have been independently exercised by this judge.

Laziness Protocol selected the raw capability over B's unrequested dataset/history expansion. Boundary Discipline keeps strict package/IPC validation and one pure calculation. Prove It Works requires a rerunnable comparison of the actual private package and application results rather than a candidate design or synthetic test alone.

# Issue 67 gate resumption

Date: 2026-10-04. Baseline: `47ec8568a3a6bb646f2cf907993f9c2935e61341`, branch `codex/issue-67-synthetic-proof`, [PR 69](https://github.com/AlesSystems/esmer-market-analytics/pull/69).

The user instructed sequential completion of G01 through G06 and requested questions when blockers arise. Implementation and bounded isolated-source investigation are authorized. The [approved plan](https://github.com/AlesSystems/AlesSystems-Workstreams/blob/main/Esmer%20Market%20Analytics/plans/2026-10-04-real-product-gross-profit.md) still requires independent financial evidence before G02. Deliver the application PR stack for review without merging it.

## Resolve G01 first

The [earlier source investigation](issue-67-source-gate.md) proves historical cost mutability and records the remaining financial evidence requirements. Retained native metadata also names POS closing, costing, cancellation and return-selection routines that were absent from the earlier historical-cost-column search. That search did not exhaust possible finalized-sale writers.

| Required rule | Evidence available at the baseline | Evidence needed for acceptance |
| --- | --- | --- |
| Completed sale, void and conversion identity | Native report policy, archive trigger, stable source record IDs | Operative sale-closing rules and independently reconciled completed, void and converted examples, including type 11/35 handling |
| Business dates, TRY and period completeness | Recorded dates and currency fields | Market-local date convention, cutoff and final-day controls, classified non-TRY exclusions |
| Net sales, discounts, recorded tax and units | Candidate native equations and unit multipliers | Independent receipt controls proving allocation, order, signs, null handling, precision, rounding and compatible units |
| Historical cost | A native refresh procedure can overwrite stored costs and replace null/zero with current price | Supported transaction-time provenance, dated purchase identity, unit/tax basis and documented-zero rules for enabled costs |
| Customer returns | Recorded return populations; sampled links did not establish attribution | Exact original-sale relationship, compatible original cost and complete cumulative return quantities through cutoff |
| Real target and capacity | Existing recorded extracts and synthetic capacity checks | Approved stable product identity and month, complete declared all-products interval, dependencies and exclusions, measured counts/bytes and reviewed projection |

Independent arithmetic over the same recorded operands checks arithmetic. It does not establish economic identity, historical capture or tax/unit meaning. Source-native code can establish implemented behavior, but actual population provenance and reconciled examples remain separate obligations.

The resumed investigation acquired metadata for nine exact retained POS routine names and six hash-pinned definitions. Each body matched the freshly acquired identity, UTF-16 size and SHA-256 hash and was below 64 KiB. Five acquisitions succeeded with before/after identity and read-only guards. Two broader-search attempts failed closed. All seven attempts stopped the isolated copy, removed the temporary client/configuration and preserved the original state. They read no business-row values and executed no native routines. [Sanitized acquisition receipts](issue-67/gate-resumption-receipts.json) record script hashes, body pins and actual cleanup results.

| Native object | New finding | Limit |
| --- | --- | --- |
| `POS_FISI_KAPAT_POS_GECICI` | Selects a temporary POS header only when its closed flag equals one | Does not set that flag, write finalized sale records, or establish their economic identity |
| `POS_FIS_MALIYET` | Calculates temporary POS cost using current positive stock purchase price, otherwise a selling-price operand, then applies recorded retail tax | Does not write historical cost or prove that its unit/tax basis is appropriate for gross profit |
| `POS_FIS_NO_VER_FIS_KAPAT` | Selects a finalized header using supplied date, location, register, counterparty and receipt criteria | Despite its name, it does not close a receipt or write sale records |
| `POS_IADE_FIS_SECIMI_FIS_NO` | Selects positive-price lines using a supplied receipt number | Does not persist an original-sale link or establish unique return attribution and cumulative quantities |
| `POS_ANADATAYA_ISLEDI` | Updates the temporary POS record with a caller-supplied finalized-document ID and posted flag; also updates related links and a blank document number | Does not create the finalized document, validate caller-supplied completion, or capture historical cost |
| `POS_IPTAL` | Deletes temporary POS headers, details and associated temporary records | Has no closed/posted-state precondition in its body; does not prove that every cancellation is pre-completion |

None of these six bodies calls another routine. They add source behavior evidence but do not settle finalized-sale creation or historical-cost capture. Their invocation for the retained population remains unproved.

The broader conventional-writer metadata experiment rejected its result. A diagnostic-only retry distinguished the failure as more than 64 candidates, without changing the SQL or limits. Narrowing the same query to `POS_` names returned 43 candidates within the limit. The posting and cancellation bodies above came from that new catalog. This justified two additional exact-body reads after the first four selectors/costing definitions supplied no event writer.

The catalog query excludes `RAP_` and `RP_` names and uses lexical/dependency predicates. It can miss indirect calls, alternative syntax, dynamic SQL and external-client writers. It does not establish exhaustive absence. Further investigation needs an operative source-client path or a specifically evidenced candidate, not an assumed financial mapping.

Before acquiring a financial population, settle the remaining rules and independent expected results. Then acquire the complete declared interval plus dependency closure under the approved column allowlist. Measure every stream against the 100,000-record and 32 MiB financial limits. Do not truncate dependencies or infer that a raw package proves financial capacity.

## Inputs requested from the user

- A local source-system reference, independently reconciled sales/cost report, or purchase/return controls, with the stable product ID and calendar month they cover. Keep private documents outside Git.
- If no reference is available, identify the source application and version so its posting workflow can be investigated. The key path must explain creation of finalized documents, cost assignment, completion and later cancellation. Reconcile completed, cancelled and dated purchase-to-sale examples before accepting that path for the declared population.
- The Windows test machine to use for G05. This chat has a macOS shell. An advertised remote handoff target is not a verified Windows execution route.

These are missing evidence and execution resources. Additional general permission does not substitute for them. If a requested reference does not exist, record that fact and assess whether authoritative source semantics plus independent examples can provide equivalent evidence. Unsupported cases stay explicit.

## Ordered delivery after G01

| Gate | Required predecessor | Required output |
| --- | --- | --- |
| G01 | Reviewed evidence and approved real population | Frozen financial rule ledger, independent oracle, privacy projection and capacity evidence |
| G02 | G01 | Distinct reviewed financial import with atomic activation and preservation/failure tests |
| G03 | G02 | Exact covered-population gross calculations and immutable report/export/recovery equivalence |
| G04 | G03 | Turkish product/month result, evidence and complete-scope export journeys |
| G05 | G04 and Windows/private input availability | Independent real reconciliation, pinned Windows installer/portable, clean-profile restore, offline lifecycle and measured performance |
| G06 | G05 | Independent review of the exact candidate diff/build and complete acceptance receipts |

S01 remains completed synthetic groundwork. It cannot satisfy G01 or real acceptance. G02 through G06 remain blocked by their predecessors while G01 is unresolved.

## Windows verification preparation

The existing [package scripts](../../package.json), [Windows lifecycle script](../../scripts/windows-lifecycle.ps1), [full-dataset probe](../../tests/desktop/full-dataset.test.ts) and [clean-install restore test](../../tests/desktop/clean-install-restore.test.ts) provide synthetic groundwork. They do not validate the future real financial feature.

At the completed candidate, run `npm run package:win` and record the NSIS, portable, executable and `app.asar` hashes with the commit and hardware. Set `ESMER_EXECUTABLE` to the pinned executable and run the selected suites with `npm exec -- playwright test`. `test:desktop` rebuilds a package, so its output cannot be assumed to be that pinned release.

G05 must add the real-financial opt-in suite and private-safe capture/reporting configuration before opening real inputs. The current [private estimate test](../../tests/desktop/source-estimate.test.ts) verifies a different estimate. Also prove native launch without an installed developer runtime and recovery without the original OS credential store. Extend performance coverage to selected products, daily/original-sale evidence, full dependency closure, import/export, cancellation and memory.

## Verification boundary

The changes record evidence and a blocker-resolution plan. They do not change application behavior, package schemas, source projections or financial mappings. Acquisition client and lifecycle checks used synthetic mocks for bounds, malformed metadata, timeout/cancellation and cleanup failures. Successful actual reads have separate before/after guard and cleanup receipts. The rejected broad searches published no catalog.

Application suites and Windows acceptance were not rerun for this documentation change. The [existing S01 receipt](issue-67-synthetic-proof.md) retains its original tested code revision and limitations. Local document links, JSON receipts, retained script/body hashes and `git diff --cached --check` passed. Separate Standards and Spec reviewers found no actionable defect in this evidence follow-up. They used the same model family. These documentation reviews do not grant G06 acceptance.

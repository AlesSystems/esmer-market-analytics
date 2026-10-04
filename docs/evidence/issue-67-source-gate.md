# Issue 67 source meaning investigation

G01 of [the approved plan](https://github.com/AlesSystems/AlesSystems-Workstreams/blob/main/Esmer%20Market%20Analytics/plans/2026-10-04-real-product-gross-profit.md) remains blocked. The 2026-10-04 investigation found a native procedure that can reconstruct and overwrite the historical-cost field, including substituting current purchase prices for null or zero values. Its existence does not prove invocation for any particular row, capture timing, or transaction-time cost provenance. No real financial mapping is enabled by this evidence.

The user authorized the necessary bounded isolated-source investigation. The remaining dependency is independent financial evidence. [S01 synthetic verification](issue-67-synthetic-proof.md) is complete but does not satisfy that dependency or complete [issue #67](https://github.com/AlesSystems/esmer-market-analytics/issues/67).

## Acquisition and controls

The investigation used the retained isolated restored copy. It read system metadata and four hash-pinned native definitions; it did not read business-row values, execute native routines, change source data, repair accounts, grant permissions, or connect to the original source. Before and after each successful read, the client checked the independently pinned database identity and read-only state. The operator checked the copy's container, volume, internal network, absence of exposed ports, and initial stopped state.

The dedicated reader could not expose the first two definitions and returned `DEFINITION_UNAVAILABLE`. The same bounded definition read then succeeded using the copy's existing administrator credentials for metadata access only. Credentials were held in memory and a temporary mode-0600 client configuration, which was removed. No credential or definition body is included in this repository.

| Attempt | Actual result |
| --- | --- |
| Initial two-definition read with restricted reader | Failed closed because definitions were unavailable; no body published. |
| Same two-definition read with copy metadata administrator | Two hash-matched definitions; before/after identity and read-only guards passed. |
| Bounded native-writer metadata search | 40 candidates, within the 64-result bound; before/after guards passed. |
| Two selected writer definitions | Two hash-matched definitions; before/after guards passed. |

The lexical metadata search was bounded by a sentinel result, response bytes, query timeouts, and wall time. It is not exhaustive evidence against external-client, aliased, or dynamic assignments. Independent preflight review exercised boundary failures and lifecycle cleanup with mocks before acquisition. Actual acquisition receipts report no cleanup errors: the copy was stopped, temporary client/configuration removed, and original state preserved after every attempt.

[Sanitized acquisition receipts and exact script hashes](issue-67/source-read-receipts.json) identify the private artifacts by attempt ID. Private definitions, scripts, configuration pins, and raw acquisition artifacts remain outside Git. These receipts record observed controls; they do not establish the financial interpretation of source values.

## Supported findings

| Native object | Finding and limit |
| --- | --- |
| `FIS_ARSIVLE` | Archives deleted header images while preserving statuses. It does not establish completed-sale recognition, archive completeness, or historical-cost capture. |
| `RP_MALIYET_FIS_DETAY` | Computes report costs using several methods, including a FIFO helper and current-price fallback. Its inserts target its returned table, not source storage. Reporting calculations do not establish transaction-time capture. |
| `BELGE_TARIHINDEKI_SON_ALIS_FIYATLARINI_YENIDEN_AL` | Can update the historical-cost field from the latest qualifying positive incoming line for the same product at or before the target timestamp. It applies recorded discount/exchange operands and source/target multipliers. It subsequently replaces null or zero candidate cost with current stock purchase price scaled by target multiplier. Other branches use discounted own-line or local counterpart price. This proves mutability and a reconstruction policy, not actual invocation or historical correctness for the selected population. |
| `LOKASYON_SEVK_ONAYLA` | Copies existing stored costs into new dispatch detail records. This is cost propagation through a transfer lifecycle; it supplies no independent purchase-cost provenance, completed-sale rule, or original-return relation. |

The cost refresh procedure has no location constraint or explicit KDV normalization in the inspected expression. Multiplier arithmetic does not establish the economic meaning of its units. A positive incoming line cannot be classified as an accepted purchase from this expression alone. Treating zero as a fallback condition also prevents assuming that every recorded zero documents a genuine zero cost.

The following SHA-256 hashes use UTF-16LE definition text, matching SQL NVARCHAR hashing. They identify the privately reviewed bodies without publishing them.

| Object | Definition hash |
| --- | --- |
| `FIS_ARSIVLE` | `54bd0c0b36e1dbb405a2756aafad5fa2ad384df429a7fbcec412f3be6de448a8` |
| `RP_MALIYET_FIS_DETAY` | `9e5e9993fe487f28cc4b6c0464464c55240fc4f4c17018e8258847ba7ceeda8d` |
| `BELGE_TARIHINDEKI_SON_ALIS_FIYATLARINI_YENIDEN_AL` | `b22986b418335df158e3e17069e8491e321b1f4ceabd5f40952f427c54bbdb6a` |
| `LOKASYON_SEVK_ONAYLA` | `6cd34394257ae141aa28f42e6273ed403a604a773de5a50a1c1a2f24358af8c2` |

## Remaining acceptance dependency

G01 needs independently reconciled evidence for the exact approved product/month and complete reporting population:

- Completed, void, and converted document identity; business dates, timezone, and final-day completeness.
- Net-sales allocation, tax/charge ordering, and rounding for recognized events.
- Actual historical-cost population and capture timing, dated input identity, unit/tax basis, documented zero, and whether reconstruction or current-price substitution occurred.
- Original-sale attribution for returns, cumulative quantity controls, and a complete dependency cutoff.
- Stable lineage, approved reduced projection, and full-population capacity evidence.

An operative event writer or authoritative source-product/client semantics with independently reconciled examples could supply the missing evidence. Further FIFO-reporting or sequence-allocation helpers would not resolve these gaps by themselves. The current evidence therefore stops at G01; G02–G06 remain blocked by their predecessors. Source fields retain their existing raw meaning, and unsupported costs remain excluded.

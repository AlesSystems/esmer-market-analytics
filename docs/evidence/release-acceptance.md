# Phase 10 release acceptance record

This is the historical Phase 10 matrix, not a current-build certification. [The evidence index](index.md) links later recorded-source estimates, manual expense entry and current open gates. A prepared estimate package is now usable with explicit assumptions; it does not validate the real financial mapping or replace the proof requirements below.

**First-release acceptance was blocked at this recorded boundary.** Preview 0.2.0 is a tested synthetic development package, not the approved real-data reveal. This record tracks [issue #13](https://github.com/AlesSystems/esmer-market-analytics/issues/13), Tasks 10.1 and 10.2. Do not close the issue solely because the implementation PR merges.

The branch is `codex/phase-10-windows-acceptance`, based on `db776c9`. [Windows evidence](windows-acceptance.md), [the machine-readable proof](phase-10-proof.json), [performance samples](phase-10-performance.json), and [licences](licences.md) identify the exact artifacts and observations. The package files remain local under `release/`. No GitHub release, owner contact, installation on Eralp's computer, or production connection occurred.

## Dataset and reveal decision

No authorized real prepared package was supplied or discovered in the repository's approved fixtures. The importer accepts only synthetic mappings. The demonstration package uses `synthetic-business-v1`, cutoff 30 September 2025, with a visible synthetic-data label. These dates and transactions describe test inputs.

The historical source audit reported business data from 18 January 2022 through 12 October 2025, with a partial October and partial final day. That old audit supplies neither a current prepared package nor renewed source-access authorization. It is not the reveal dataset. Real cost units/KDV, return attribution, invoice/dispatch conversions, type 11/35 identity, supplier display, discounts, business dates, and remaining document populations are unresolved in [the source contract](../contracts/source.md). None was silently mapped during Phase 10.

The no-expense reveal is verified with synthetic data by `monthly-overview.test.ts` and the complete synthetic workload test. Sales and eligible covered estimates remain visible; the operating headline states that expenses are missing. No owner's completeness confirmation was fabricated. [The Turkish walkthrough](../operations/reveal-tr.md) covers sales traceability, costs, returns, expense preview, Excel, and recovery, with [known limitations](../operations/known-limitations-tr.md).

## Acceptance matrix

Item numbers follow the checkbox order in the [foundation acceptance checklist](../superpowers/specs/2026-09-04-esmer-market-rebuild-acceptance.md). `Synthetic` means passing application evidence on synthetic inputs only. It does not pass the whole release gate. `Open` requires the specified external or platform proof. Referenced tests were run in the Windows suite listed in the linked evidence.

| Items | Observed outcome and evidence | Release limitation |
| --- | --- | --- |
| A01.1, A01.3 | Open. No isolated source-account extraction or denied-write report. | Separately authorize the isolated restored source and prove permissions. |
| A01.2 | Synthetic. Extraction/read-boundary integration checks and disabled live startup. | Dependency/source initialization review must cover the eventual real adapter. |
| A01.4 | Synthetic. `desktop-boundary.test.ts`, `recovery-boundary.test.ts` reject invalid sender, operation and payload. | No renderer SQL/credential interface added. |
| A01.5 | Synthetic. Extraction cancellation/bounds and import job tests. | Real query timeout, batching and resource-release traces remain open. |
| A01.6 | Synthetic. Offline prepared-package workflow; release contains no SQL restore tool. | Real preparation remains separately isolated and authorized. |
| A02.1–A02.10 | Synthetic. All golden-oracle, money, sales, cost, purchasing, operating, revision and export tests pass. [Independent oracles](golden-oracles.md) define literal expectations. | Source-supported variants remain open for every unresolved mapping. No KKTC tax rule inferred. |
| A03.1–A03.7 | Synthetic. Sales/purchasing drill-down, report display/revisions, unavailable states, no-expense monthly UI, and Excel tests pass. | Real summary/detail reconciliation, source populations and cost coverage are not accepted. |
| A03.8 | Open for market-local dates. Deterministic fixture dates pass. | Verify source timezone/date semantics on approved reduced examples. |
| A03.9–A03.10 | Synthetic. Accepted versions survive refresh, upgrade and restore; Turkish vocabulary is exercised by desktop tests. | Real-source and owner's acceptance remain separate. |
| A04.1–A04.4 | Synthetic. Idempotence, lineage, validation, interrupted jobs and atomic activation tests pass. | No real paired source snapshots claimed. |
| A04.5 | Synthetic fault injection and malformed-input tests. | Physical disk exhaustion and external-media failures remain open. |
| A04.6–A04.9 | Synthetic. Concurrent app revisions, expense history, duplicate import, source deletion and schema/reference tests pass. | Real supplier/source semantics remain blocked. |
| A04.10 | Synthetic. Pinned accepted report and retention tests pass; upgrade/restore preserve history. | Full source-volume storage growth remains unmeasured. |
| A05.1–A05.5 | Synthetic. Reviewed privacy allowlists, prohibited-field/sentinel tests and aggregate expense contracts. | No real generated package has passed privacy review. |
| A05.6–A05.7 | Synthetic plus actual Windows safeStorage. Narrow IPC tests and packaged encrypted restore pass. | Native dialog automation substitutes file selections; independent computer recovery and Windows ACL proof remain open. |
| A05.8 | Preview artifact inspection. Both compressed payloads equal the inspected unpacked application; all file identities retained. | Filename/marker tests cannot identify every possible personal datum. No private fixture was included. |
| A06.1 | Synthetic. Automatic checkpoint, concurrent-write, coalescing, retention and retry integration tests pass. | Physical failure/ACL evidence remains open. |
| A06.2–A06.3 | Same-host packaged restore passes after deleting the original profile, using exported key and backup and actual Windows key protection. | A clean user/VM or second machine with independently retained media is still required. |
| A06.4 | Synthetic. Wrong key, tamper, truncation, unsupported schema, invalid candidate and migration failure tests pass. | Actual storage failure and power-loss durability remain open. |
| A06.5–A06.6 | Synthetic. Record and workbook equivalence, UI totals, journal interruption and failure preservation tests pass. | Windows directory fsync is unsupported; no namespace power-loss guarantee. |
| A06.7 | [Turkish recovery instructions](../operations/recovery-tr.md) and retention tests reviewed. | Final instructions must be rechecked on the independently recovered installation. |
| A07.1–A07.3 | Packaged Windows launches, imports, restart and versioned upgrade checked. Details and substitutions in [Windows evidence](windows-acceptance.md). | Separate clean OS, default-profile lifecycle, physical network disconnection and failed installer upgrade remain open unless a later receipt explicitly passes them. |
| A07.4 | Synthetic Turkish presentation, search, fractional arithmetic and Excel round-trips pass. | Native Excel/scaling receipts from earlier phases are not silently promoted to this build. |
| A07.5–A07.6 | Three fresh processes measured on the full imported 25,000-document synthetic package. Every ordinary sample below two seconds. | Full market dataset exceeds current validated input scope; no real-volume claim. |
| A07.7–A07.9 | Packaged cancellation/navigation, unavailable states, accepted report and matching export tests pass. | Background work duration is separate from ordinary interaction latency. |
| A07.10 | Locked MIT dependency notices, runtime notices, zero-advisory audit, unsigned artifact status recorded. | Downloaded SmartScreen and publisher UX still need manual acceptance. |
| L01 | Excluded from this release; live access disabled. | Eralp's acceptance, specific source permission and separate rollout direction remain mandatory. |

## Next release boundary

Supply an authorized prepared real package and resolve its mappings/privacy/source-safety evidence before a real-data reveal. Complete independent Windows recovery, physical storage failures, clean/default-profile lifecycle and full-source-volume performance. These are acceptance blockers, not invitations to connect to production. Present the exact re-tested artifacts for the user's release/install direction afterward. This PR requests review of the implementation and evidence only.

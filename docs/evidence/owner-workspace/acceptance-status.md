# Acceptance status: 2026-10-19

## Delivered to main

- #83: signed return-cost bridge and authoritative empty-day labels (#80, #82).
- #84: same-context estimate retry with stale-response protection (#79).
- #88: decryption cleanup only owns newly created output (#87).
- #89: tedious update removes known production sprintf advisory (#86).
- #90: bounded one-source/one-month estimate cache (#85 warm navigation).
- #93: exact raw column shape, malformed import rejection and bounded cold work (#92).

All six changes received independent exact-head review before merge. Main is 64243842a9f13830c705ff136df8e91353e99ce4. A separate verification snapshot matches 370 present remote Git blobs, with no mismatch. Historical binary/evidence files omitted during cloud source retrieval were not rewritten by these PRs.

## Tested seams

Full synthetic unit and integration suites, typecheck, lint and production build have passed in the implementation workspace. Report/Excel fixtures read generated workbooks back; recovery tests round-trip synthetic encrypted files and exercise failures; live SQL adapter tests use mocks. Real SQL tests remain skipped without explicit isolated credentials. Linux packaging and dependency-notice verification passed with 79 dependencies. Tests do not establish Windows filesystem/dialog/runtime behavior.

## Historical open items on 2026-10-19

- #91 is a design draft. Source and preview boundaries are independently reviewed. The artifact is a real renderer with synthetic fixture data, not a screenshot. No visual acceptance is claimed.
- Browser screenshots at wide/narrow/200% zoom and real keyboard traversal are blocked until an authorized HTTP preview is available. Vercel target read returned 403. Linux Chromium fails before UI startup on socket policy. No bypass was used.
- #85 cold-load limit remains: maximum-diversity synthetic first load is still above 2 seconds; warm pages are around 13–23 ms. Broader algorithm/worker changes would need a new measured plan, rather than speculative changes to financial math.
- Windows packaged acceptance, real-source field meanings/costs/stock controls, and live market end-to-end operation remain unverified. No real database or real market records were accessed.

This inventory is bounded evidence, not a whole-product security or production-readiness certification.

## 2026-10-22 follow-up

PR #94 resolves issue #85 with [admitted-volume cache correctness and measured performance](../source-performance-2026-10-22.md). PR #95 fixes overlapping monthly navigation reads with [regression evidence](../monthly-navigation-2026-10-22.md). PR #91 now has [packaged macOS visual and interaction acceptance](2026-10-22-acceptance.md). These receipts supersede the historical visual and performance blockers above within their stated environments. Real-source semantics, owner acceptance and production access remain separate.

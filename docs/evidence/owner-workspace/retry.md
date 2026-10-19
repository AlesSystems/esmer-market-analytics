# Source estimate retry verification

Issue #79. The owner can retry a rejected estimate read without changing the selected source, month, exact product filter or page. Pending reads suppress the retry action. Existing sequence guards reject obsolete responses.

Regression evidence: the original component failed the three initial rendered-DOM retry cases because no retry action existed. Five cases now pass: initial failure, later-page failure with pending duplicate protection, month change, exact product search, and source hash change during a delayed retry. These are React DOM tests, not screenshots or Electron acceptance.

Dependency review: happy-dom 20.0.11 is pinned as a development-only test environment (MIT). It is absent from production dependencies; electron-builder's normal production dependency collection excludes it. It does not participate in renderer bundles or the SQLite/Electron ABI. Version 21 conflicted with the project's locked Node types and was not retained. Linux typecheck, lint and all 109 unit tests pass. Packaged Windows compatibility remains unverified; this receipt does not waive Windows release gates.

The cloud Linux desktop launch is blocked before UI startup by Chromium process singleton socket policy. No workaround was attempted. Financial contracts, IPC payloads, source import and production dependencies are unchanged.

# Offline installation preparation and #139 assessment — 2026-11-14

Scope: Altan prepares the offline review and installs alongside Eralp. #138 stays deferred. Eralp's Windows version is unknown; check it before installation. This receipt does not record owner acceptance, installation on his computer, new source inspection or production permission.

Base/runtime: `3520ce0821f6b90a1f0ed903beb2e08fa837584f`; app 1.0.1. Branch: `codex/eralp-offline-handoff`. [Execution graph](../../workstreams/eralp-offline-handoff.md). Security regression commit: `ad4bb38`.

## #139: concrete non-applicability, no runtime change

Outcome: **no_change** for application runtime/dependencies. The affected code is shipped, but the advisory's authorization-code flow is not reachable through the application's supported entry points. This is not a claim that the upstream library is patched or that all vulnerabilities were assessed.

`npm audit --omit=dev --json` still reports two high transitive entries: `tedious@20.3.8 → @azure/identity@4.13.3 → @azure/msal-node@6.0.1`. They describe one advisory, [GHSA-xcx6-jx8p-x3h5](https://github.com/AzureAD/microsoft-authentication-library-for-js/security/advisories/GHSA-xcx6-jx8p-x3h5): authorization-code input can direct a token request to an attacker endpoint. Upstream identifies 7.1.0 as patched. Audit exit 1 is retained, not suppressed.

Application invariant: configuration and server replies cannot select an OAuth authorization-code flow. Evidence at the base commit:

- [`src/source/sql-server.ts`](../../src/source/sql-server.ts): the only production `new Connection` (line 62) constructs `authentication.type = "default"` with SQL username/password and TLS. It reparses input at line 58. The parser (lines 8–21) rejects unknown own keys; the driver receives no caller-supplied authentication/options object.
- Native file selection, encrypted settings load/save and worker startup/reconfiguration all use this parser: [`live-config.ts`](../../src/desktop/live-config.ts) and [`worker.ts`](../../src/service/worker.ts). Live refresh and CLI package preparation reach the same extractor through [`sql-package.ts`](../../src/source/sql-package.ts) and [`private-files.ts`](../../tools/private-files.ts).
- There are no application Azure Identity/MSAL imports or `acquireTokenByCode` calls. Inclusion of dependency code in the bundle is acknowledged; source-file packaging exclusions do not establish safety.
- Locked `tedious/lib/connection.js` lines 1139–1156 choose standard/FedAuth from the local authentication type. A server's `fedAuthRequired` flag (2324–2325) only sets an echo flag. Standard login (2430–2452) does not consume stored FedAuthInfo; Azure credentials are created only in the FedAuth path (2516–2551). Retry/reroute preserves the local configuration. Always Encrypted defaults off; this app registers no key-store provider or arbitrary driver options.

An independent read-only security investigator confirmed these paths, including retry, reroute and Always Encrypted. No runtime patch or speculative dependency override was justified. Reassess this conclusion if authentication modes, credential providers, driver configuration exposure or the locked dependency graph change.

## Focused execution and verification

[`sql-authentication-boundary.test.ts`](../../tests/integration/sql-authentication-boundary.test.ts) uses the real locked Tedious constructor and intercepts `connect` before any socket is opened. It checks valid SQL credentials (including URL-like text), TLS and both declared certificate modes; rejects injected OAuth/authentication/driver options, JSON-escaped keys and own prototype keys before connection; and proves inherited auth settings do not reach the driver. The legitimate control retains the fixed `SOURCE_UNAVAILABLE` failure contract. No external SQL database or OAuth endpoint is contacted.

| Check | Result |
| --- | --- |
| Focused authentication, live consistency and protected-config tests | 15 passed; 1 optional isolated SQL check skipped |
| Typecheck and lint | Passed |
| Unit suite | 185 passed |
| Full integration suite | 324 passed; 17 optional isolated SQL checks skipped after installing the locked Electron binary |
| Runtime/dependency/package inputs vs base | `git diff 3520ce0 --exit-code -- src package.json package-lock.json scripts tools third-party .github` passed: unchanged |
| Documentation links and delivery hashes | Changed Markdown local links passed; both downloaded EXE files match the CI manifest and pinned delivery hashes |

Environment: macOS arm64, Node 24.15.0, npm 11.12.1. Commands: `npm run test:integration -- tests/integration/sql-authentication-boundary.test.ts tests/integration/live-consistency.test.ts tests/integration/live-config.test.ts`, `npm run typecheck`, `npm run lint`, `npm run test:unit`, `npm run test:integration`.

Initial integration attempt: 323 passed, 17 skipped, one failed because `npm ci --ignore-scripts` had not installed Electron's macOS binary. The failure was `ENOENT` copying that binary in the release-inventory test, not an app failure. `npm exec -- install-electron` followed by the full integration rerun passed. These local checks do not supply new Windows acceptance.

## Delivery and acceptance boundary

The [delivery list](../operations/eralp-offline-delivery.md) identifies unchanged main `3520ce0` installer and portable files from [CI 43055324223](https://github.com/AlesSystems/esmer-market-analytics/actions/runs/43055324223), which passed Windows packaging and 68 desktop tests. The [November 11 receipt](2026-11-11-windows-v1-smoke.md) covers native Windows 11 usage. No changed runtime is being substituted for that evidence.

The local handoff includes the CI inspection manifests, checksum list, synthetic August–October 2025 package and Turkish install/review/recovery documents. The synthetic package comes from the existing rich-estimate fixture, not a real backup. Its generic import success message does not make it real data. A separate demo profile keeps synthetic expenses and completeness statements out of the owner's normal workspace.

Downloaded EXE bytes were SHA-256 verified against the immutable CI inspection record. Synthetic file SHA-256: `cd5930e3153b1ab6c5794d254f872fc6210281000cb81ea487bb8bbd9b7a2b8e`; 2,994 headers and 7,415 lines. An independent Python Decimal sum of the generated October operands gives covered sale 529,051 TRY less cost 384,951 TRY = gross estimate 144,100 TRY; less the walkthrough's 1,000 TRY expense = 143,100 TRY. This matches the existing Windows oracle; it does not establish real financial semantics.

The [review checklist](../operations/reveal-tr.md) records actual Windows configuration, install result, workflows, Excel, backup, unresolved display preferences and Eralp's own decision. It also asks who will provide future offline packages and hold recovery material; no recurring service commitment is invented.

#110 is closed with unchecked acceptance/production items. This preparation records the now-directed supervised offline scope without falsely passing those items or changing that historical issue state. #138 remains deferred; verified financial semantics and L01 remain post-v1. No schema, financial calculation, source access, dependency, IPC or bundled UI change is part of this preparation.

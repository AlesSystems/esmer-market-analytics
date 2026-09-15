# Phase 1 runtime

Implements [issue #4](https://github.com/AlesSystems/esmer-market-analytics/issues/4), tasks 1.1 and 1.2 of the [approved plan](../superpowers/plans/esmer-market-implementation-plan.md#phase-1--independent-foundation), and the foundation of D01, D04, D07, D08, D19, and D20.

## Application boundary

One Electron application owns a React renderer and a local Node worker. The renderer asks for service availability through one named preload method. The main process validates the sender and payload before it calls the worker. No HTTP service, source driver, source credentials, or business schema is needed for this phase.

The worker must prove that its empty local SQLite connection works before reporting availability. Durable storage and migrations belong to Phase 4. Availability distinguishes an empty, ready service from an unavailable service.

## Dependency selections

The direct versions are exact pins in `package.json`; `package-lock.json` locks the complete graph. Selection used public upstream documentation and npm metadata on 2026-09-15. These are independent choices, with no legacy manifest or runtime code imported.

| Dependency | Selection | Licence | Reason |
| --- | --- | --- | --- |
| Electron | 44.3.0 | MIT, with bundled third-party notices | Desktop runtime and Windows target |
| React and React DOM | 19.3.0 | MIT | Approved renderer stack |
| SQLite | 3.53.4 through Electron's bundled `node:sqlite` | SQLite is public domain; Node includes its own notices | Avoid an additional native module and Electron ABI rebuild |
| decimal.js | 10.6.0 | MIT | Parse decimal strings without binary floating-point arithmetic |
| read-excel-file | 9.3.10, development only | MIT declaration; transitive notice unresolved | Check `.xlsx` compatibility with an explicit number parser; not distributed in Phase 1 |
| write-excel-file | 4.1.1 | MIT | Write typed `.xlsx` cells, sheets, and number formats |
| TypeScript | 6.0.3 | Apache-2.0 | Compatible with the selected TypeScript ESLint peer range |
| esbuild | 0.28.2 | MIT | Bundle the desktop, preload, worker, and React without another application framework |
| Vitest | 5.0.1 | MIT | Run filtered unit and integration tests once |
| Playwright Test | 1.63.0 | Apache-2.0 | Launch the packaged Electron executable |
| electron-builder | 26.15.3 | MIT | Produce host smoke packages and Windows outputs |
| ESLint | 10.10.0 | MIT | Lint source, scripts, and tests |
| typescript-eslint | 8.70.0 | MIT | TypeScript lint support |
| Node type declarations | 24.13.4 | MIT | Compile against the Node 24 API |
| React and React DOM type declarations | 19.3.0 | MIT | Match the renderer major version |

Development uses Node 24 and npm 11. The Windows tests used development Node 24.15.0 and npm 11.12.1. The packaged Windows main process and instrumented packaged worker instance both measured Electron 44.3.0, bundled Node 24.20.0, and SQLite 3.53.4. The macOS package measured the same bundled versions in its separate record. TypeScript 7 was not selected because typescript-eslint 8.70.0 declares TypeScript `<6.1.0`. The Excel packages have 2026 updates in their npm metadata. Dependency audit results and tested operating systems are recorded in [the evidence index](../evidence/index.md).

## Decimal and Excel limits

The dependency check uses synthetic values. Financial rules, rounding policy, source semantics, and UI-to-Excel report reconciliation remain later acceptance work.

`read-excel-file` supports a custom `parseNumber` function, so source numeric strings can remain strings until the decimal layer parses them. Its formula reader uses cached spreadsheet results; it does not evaluate formulas. Phase 7 must define how expense imports reject or handle formula cells and missing cached values. `write-excel-file` supports explicit cell types and number formats. Values that cannot be represented safely as Excel numbers need an explicit export policy before reports ship. No financial API accepts JavaScript floating-point values merely because a spreadsheet library can write them.

Windows package inspection found that the reader's transitive dependency `worker-f` 0.1.20 declares MIT but supplies no licence notice. Its [npm metadata](https://registry.npmjs.org/worker-f/0.1.20) identifies upstream commit `32742a0f8a57f19968c73539a09ecb3606efa3f9`. The [exact upstream tree](https://gitlab.com/catamphetamine/worker-f/-/tree/32742a0f8a57f19968c73539a09ecb3606efa3f9) also lacks a licence file. The reader remains pinned as a development dependency for the synthetic compatibility test. No application source imports it, so this excludes the unused reader and its transitive dependencies from the Phase 1 distribution without changing application behavior. Before shipping Excel import, resolve its distribution notices or select and validate a replacement. A manifest licence identifier is not a substitute for a missing notice.

`npm run package:win` checks that every shipped dependency in `app.asar` includes a nonempty licence notice. This checks the current distribution contents; it does not certify future dependencies or replace the Phase 10 licence review.

## Windows and native packaging

Windows is the deployment target. A local macOS package establishes that the build and bundled service work on the development host. It cannot establish Windows compatibility.

Using `node:sqlite` keeps SQLite in the Electron runtime. If a later feature needs an external native module, rebuild it for the exact Electron version and target architecture, inspect its ASAR unpack rules, and repeat the packaged Windows check. An ordinary Node test does not prove that an Electron native module loads.

The [Windows evidence](../evidence/windows-phase-1.md) records the user-approved HP development host, its Windows edition/build and hardware, development and packaged runtime versions, artifact hashes, packaged startup, same-profile restart, portable launch, and NSIS lifecycle observations. The runtime check loads the packaged service module in an additional instrumented worker instance and verifies its actual availability response. It does not add a production diagnostic API.

Windows build, packaging, and the full available suite passed. The Phase 1 exit gate is complete using the recorded Windows checks and the user-reported manual offline startup. The offline report is not an automated-run result. No installation on Eralp's computer or production rollout is authorized by this PR.

## Upstream references

- [Electron security guidance](https://www.electronjs.org/docs/latest/tutorial/security)
- [Electron native modules and ABI compatibility](https://www.electronjs.org/docs/latest/tutorial/using-native-node-modules)
- [Node SQLite API](https://nodejs.org/api/sqlite.html)
- [SQLite public-domain declaration](https://www.sqlite.org/copyright.html)
- [decimal.js API](https://mikemcl.github.io/decimal.js/)
- [read-excel-file documentation and licence](https://github.com/catamphetamine/read-excel-file)
- [write-excel-file documentation and licence](https://github.com/catamphetamine/write-excel-file)
- [Playwright Electron support](https://playwright.dev/docs/api/class-electron)

Retain dependency licences and Electron's third-party notices in distributed artifacts. This selection record does not replace the Phase 10 distribution licence review.

# Leaf-green palette and official wordmark

The owner selected the leaf-green preview on 2026-11-23 and requested the official wordmark in the top-left sidebar. This revision updates the branding of [the approved A workspace](../superpowers/specs/2026-11-14-prototype-a-implementation.md). The [design system](../../DESIGN.md) records the palette and placement.

| Check | Expected | Actual on macOS arm64 |
| --- | --- | --- |
| Theme and contrast | Leaf-green tokens match the approved preview. Tested text pairings reach 4.5:1 and chart bars on white reach 3:1. | 183 unit tests passed, including the palette and contrast assertions. |
| Packaged assets and layout | Bundled logo decodes offline and stays visible in the sidebar and compact header at 200% zoom. | 12 packaged desktop tests passed, covering asset loading without external requests, keyboard and zoom, navigation, monthly charts and encrypted restore. |
| Broader verification | Typecheck, lint, build and applicable integration checks pass. | Typecheck, lint and macOS packaging passed. 323 integration tests passed and 17 were skipped by the suite. |

The comparison uses app version 1.0.1 at baseline `4c2df37` and branding commit `ce76e62` with the compact-header assertion at `88f5061`. Captured on macOS 27.0 arm64 with Electron 44.3.0. The packaged capture tests used `richEstimatePackage` and the existing synthetic workspace fixtures. [Before](images/leaf-green-branding/bu-ay-before.png), [after](images/leaf-green-branding/bu-ay-leaf-green.png), [200% zoom](images/leaf-green-branding/bu-ay-200-percent.png).

Local commands were `npm run typecheck`, `npm run lint`, `npm run test:unit`, `npm run test:integration` and `npm run test:desktop -- tests/desktop/owner-workspace.test.ts tests/desktop/welcome.test.ts tests/desktop/clean-install-restore.test.ts tests/desktop/bu-ay.test.ts tests/desktop/visual-capture.test.ts --grep-invert 'capture financial'` with `ESMER_CAPTURE_VISUAL` and `ESMER_CAPTURE_OWNER` set to temporary output directories. Windows build and packaged runtime verification belong to the PR's Windows validation workflow. Windows display scaling and owner-device acceptance remain separate.

# Özet prototype evidence

Date: 2026-10-03. Branch: `codex/ozet-ui-prototypes`. Base: `2da06ea`. Prototype implementation: `0f454eb`. Fixture: `ozet-visual-2025-09`, synthetic presentation values only. Environment: macOS, Node 24.15.0, installed Chrome driven with Playwright 1.63.0. No source connection or private dataset was used.

## P6 browser and static verification

`node workstreams/ozet-prototypes/verify.mjs` produced [31 passing observations](browser-evidence.json) with zero page errors. All three variants fit 1440, 680 and 390 pixel viewports without document overflow. Screenshots are linked from [README.md](README.md).

The harness exercised layer selection through HTML, expense feedback, report details, Escape and focus restoration in every variant. It exercised keyboard and button variant switching, URL persistence, wraparound, clicking the real mesh, live reduced-motion preference changes, WebGL context loss, retry and renderer unavailability. Idle draw calls remained 24 over a 700 ms observation, so the scene did not draw continuously during that interval. This is a bounded local observation, not a Windows hardware performance claim.

The visible Codex in-app browser also rendered the actual 3D object at 454 by 780 pixels; the document width remained 454. The accessibility tree exposes fallback text within the canvas even while WebGL renders successfully. Visual inspection confirmed that the fallback was not visible.

`npm run typecheck`, `npm run lint`, `npm run build`, and `git diff --check` passed. The production bundle contains none of the prototype heading, font or scene markers. Unit, integration and packaged desktop suites were not run because this is an isolated throwaway browser entry, as requested by the Prototype skill. Windows packaging, touch-device behavior, real data and production acceptance remain unverified.

The first browser capture exposed horizontal overflow in A at 390 pixels. The corrected scene layout passed the next capture. The first mesh-click harness read state before the newly mounted scene settled. A focused probe showed selection working; awaiting the mounted scene and observable selected state fixed the harness. The missing default Playwright browser executable was a toolchain issue; the installed Chrome channel completed verification.

## P7 independent review

A separate reviewer inspected all nine screenshots, code isolation, data labels and runtime evidence. It found one sample basket inconsistency. The fixture was corrected from 329,78 to 324,99, consistent with the simplified example's 1.248.600 / 3.842. The final screenshots and browser evidence were refreshed after this correction.

The reviewer judged the three compositions distinct and readable. It preferred B for explaining the financial equation and missing expenses together. The implementer recommends A for the user's first priority, scanning overall monthly performance. No direction has been selected by the user. Production integration is a later task.

## Asset and dependency evidence

Geometry is authored locally in MonthObject.tsx. There are no model downloads, texture fetches, third-party images or paid assets. The fonts are self-hosted development dependencies. Licences and versions are recorded in README.md. React Three Fiber 9.8.1 declares React >=19 <19.4 compatibility, matching React 19.3.0. See the [official installation documentation](https://r3f.docs.pmnd.rs/getting-started/installation) and [Canvas fallback/demand rendering API](https://r3f.docs.pmnd.rs/api/canvas).

The dependency audit reported eight high findings in the existing Electron packaging dependency chain. None names the new 3D or font packages. No unrelated package upgrade was attempted. These browser-only development packages are not imported by the production entry.

The Impeccable detector reported only advisory differences from the incumbent design system: 38 colour, 3 radius and 24 font-size entries. These are intentional alternative prototype worlds; no production design records were rewritten. The independent documenter recorded palettes and assets in README.md.

## Design principles applied

Exhaust the Design Space led to three different reading structures rather than three palette swaps. Model the Domain led to one typed Layer selection and one synthetic presentation fixture shared by all candidates. Both principles were read from the pinned Poteto bundle.

No open implementation issue was present in the repository. The branch and this evidence retain the experiment locally. No GitHub issue message, PR, deployment or merge was created.

Final reviewer verdict: the single finding was resolved in source and all three desktop captures. The verdict pass closed that finding and approved the prototypes for comparison.

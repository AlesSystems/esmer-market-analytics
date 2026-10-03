# Özet UI prototypes

Three throwaway alternatives answer: **Which layout makes overall monthly performance easiest to understand?** The owner has chosen that reading priority; no visual winner has been selected. These prototypes explore presentation, not production financial behavior.

Run from the repository root:

```sh
npm run prototype:ozet
```

Open [A](http://localhost:4173/?variant=A), [B](http://localhost:4173/?variant=B), or [C](http://localhost:4173/?variant=C). The bottom switcher changes the variant; left and right arrow keys also switch it. Figures open an inspection panel. The 3D stack and its HTML buttons select sales, cost or expenses. The fixed period is Eylül 2025; figures and comparisons are illustrative.

| Variant | Reading approach | Experimental ink / accent | Desktop screenshot |
| --- | --- | --- | --- |
| A — Ayın panoraması | Green analysis desk with a wide daily trend and a financial reading column; suited to a quick monthly scan. | `#233c33` / `#316653` | [A desktop](../../.impeccable/review/ozet/A-desktop.png) |
| B — Market defteri | Warm ivory ledger with serif headings and a ruled financial equation; suited to following how the estimated result is derived. | `#38252d` / `#7d344e` | [B desktop](../../.impeccable/review/ozet/B-desktop.png) |
| C — Kontrol masası | White and cobalt numerical matrix with evidence details; suited to deciding what to inspect next. | `#182644` / `#2459d5` | [C desktop](../../.impeccable/review/ozet/C-desktop.png) |

Narrow captures: [A](../../.impeccable/review/ozet/A-narrow.png), [B](../../.impeccable/review/ozet/B-narrow.png), [C](../../.impeccable/review/ozet/C-narrow.png). Mobile captures: [A](../../.impeccable/review/ozet/A-mobile.png), [B](../../.impeccable/review/ozet/B-mobile.png), [C](../../.impeccable/review/ozet/C-mobile.png). [WebGL fallback capture](../../.impeccable/review/ozet/webgl-fallback.png). Screenshots establish appearance only; runtime checks and their observed results belong in the verification evidence.

## Scope and data

The separate entry in `src/ui/overview/prototype/` uses one synthetic in-memory fixture and local state. It does not call IPC, read SQLite or access a live source or backup. Production `App.tsx` remains the production entry. No financial calculation is added to the UI. Historical cost and gross figures remain explicitly estimated; missing cost coverage and missing expenses remain visible. The 3D object is a navigation aid and does not represent financial proportions.

These experimental palettes do not replace [DESIGN.md](../../DESIGN.md) or its sidecar. [PRODUCT.md](../../PRODUCT.md) and the foundation documents still govern product truth. A chosen direction requires a separate production implementation and acceptance pass. Source inspection, private-data validation, packaging, Windows production checks and deployment are outside this prototype's scope; no production acceptance gate is certified here.

## Assets and dependencies

Manrope Variable and Newsreader Variable are self-hosted through the locked `@fontsource-variable` development dependencies, version 5.3.0, under SIL OFL 1.1. There are no remotely fetched fonts.

The selectable stack is programmatic box and plane geometry built in the repository. It uses React Three Fiber 9.8.1 and Three.js 0.186.1, both MIT licensed. No external model, texture or generated mesh is used. Rendering is demand-driven, with bounded pixel ratio and HTML selection controls; renderer failure offers a retry state.

See [CONTRACT.md](CONTRACT.md) for scope, variant contracts and the execution graph. Keep the prototype on its throwaway branch until a direction is chosen; retain the decision and evidence before implementing it in production.

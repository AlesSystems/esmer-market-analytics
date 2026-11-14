# Esmer Market visual prototypes

Three clickable, comparable proposals for [#148](https://github.com/AlesSystems/esmer-market-analytics/issues/148), based on [specification #147](https://github.com/AlesSystems/esmer-market-analytics/issues/147) and the [resolved visual brief #142](https://github.com/AlesSystems/esmer-market-analytics/issues/142#issuecomment-6876635009). The visual choice remains open in [#143](https://github.com/AlesSystems/esmer-market-analytics/issues/143).

From the repository root, using Node 24:

```sh
node prototypes/visual-directions/serve.mjs
```

Open [http://127.0.0.1:4177](http://127.0.0.1:4177). Stop with Ctrl+C. To use another port, add `--port 4179`. The host binds only to loopback, serves this prototype directory, and has no data operations or APIs. The UI makes no external requests. No dependency installation is needed to view it; the included Figtree font retains its [OFL license](assets/Figtree-LICENSE.txt).

Use the review strip to switch between **A · Çalışma alanı**, **B · Ayın hesabı** and **C · Odaklı görünüm**. The selected month carries across all three. [The design plan](DESIGN-PLAN.md) explains their differing composition and the criteria each explores.

## What to try

Without reading an explanation first:

1. Identify the selected month, its main result and the data cutoff. Explain what the result does and does not mean.
2. Open a product with a loss or missing cost. Close it and find where you left off.
3. Find the expense entry/review route and explain why the net result is unavailable.

Then compare the composition, readability, information density and visibility of actions. Identify a preferred direction and concrete changes; choosing one is not implied by test results.

The month picker includes a positive result (September), zero (July), loss (June), missing cost (May), absent period (April) and partial month (October). Explanations, product detail, representative-product search, navigation and text size work. The tool button contains the larger-text setting; it also enlarges user-facing dialogs.

Expense import, template/manual entry, expense confirmation and Excel export are explicitly labelled previews. No files or expenses are saved. Search only covers the displayed synthetic examples; the full catalogue, filters, sorting, source-record return journey and connected expense/net lifecycle remain later tickets #149–151. This is the agreed first visual-direction review, not the completed connected prototype or a production replacement.

## Verification

With the repository's existing dependencies available:

```sh
node node_modules/@playwright/test/cli.js test --config prototypes/visual-directions/playwright.config.mjs
node prototypes/visual-directions/capture.mjs
node node_modules/eslint/bin/eslint.js prototypes/visual-directions
```

Tests launch a separate loopback host on 4178. The capture script uses 4180 and saves [screenshots](screenshots/). Do not run either command while its port is already occupied. [Verification notes](VERIFICATION.md) record scenarios, literal fixture provenance and limitations.

## Preview images

| A — workspace | B — monthly statement | C — focused split |
| --- | --- | --- |
| [1440 px screenshot](screenshots/a-1440.png) | [1440 px screenshot](screenshots/b-1440.png) | [1440 px screenshot](screenshots/c-1440.png) |

Also review [680 px with larger text](screenshots/a-680-large.png) and [the enlarged explanation](screenshots/explanation-680-large.png).

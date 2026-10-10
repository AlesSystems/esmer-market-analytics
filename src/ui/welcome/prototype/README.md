# Welcome prototypes

Throwaway visual study. The question is which welcome composition should introduce Esmer Market's offline desktop workspace. The user requested two alternatives and confirmed a welcome/launch page rather than an Özet dashboard. The user selected B on 2026-10-10 and requested a separate production implementation after pulling main.

Run `npm run prototype:welcome` from the repository root. Open http://127.0.0.1:4174/?variant=A or change the query to `?variant=B`. The floating bar and left/right arrow keys change the variant. Launch buttons show an in-memory destination preview; they do not open production screens. The guide expands inline. No source access, metrics, persisted state or production integration.

- A, Market defteri. Warm paper, generous whitespace and a book-shaped destination list. A quieter welcome with fewer explanations.
- B, Çalışma masası. Cobalt split composition and a compact launch list with descriptive destination labels. Recommended for clearer wayfinding and fit with the app's cobalt actions.

The Exhaust the Design Space principle shaped the comparison into two different structures rather than two color themes. The alternatives remain historical throwaway evidence. The separate production B implementation scopes its durable welcome palette, radii and Manrope/true Newsreader italic pairing in DESIGN.md; prototype A does not set production styling.

## Evidence

Local macOS browser check on 2026-10-10. Both variants captured at 1440 × 1000 and 390 × 844. No horizontal overflow or browser exceptions. Launch-to-Özet, return, keyboard variant switching and guide expansion passed. `npm run typecheck`, `npm run lint`, `npm run build` and `git diff --check` passed. The Impeccable detector reported advisory palette/type deviations from the production design system. Existing locked dependencies and locally served fonts/logo are reused.

Screenshots are local in `work/welcome-prototype/review/`, named `A-desktop.png`, `A-mobile.png`, `B-desktop.png`, `B-mobile.png`. They contain only branding and generic product copy. Original logo provenance remains in `src/ui/assets/README.md`; Manrope and Newsreader are reused from existing locked Fontsource packages.

This study does not satisfy Windows packaging, financial or release acceptance. This original prototype check changed no production behavior. Prototype-specific automated tests and packaged desktop checks are intentionally omitted. The alternatives are retained on `codex/welcome-prototypes`; production B is implemented separately in `src/ui/welcome/WelcomePage.tsx`.

Independent finish review approved visual prototype handoff after the mobile switcher was moved into normal flow to avoid covering destination links. All four screenshots were inspected. Scoped comment review found no remaining comments or suppressions. That prototype-only review preceded selection. The October 10 B selection and separate production verification are recorded in [the welcome receipt](../../../../docs/evidence/2026-10-10-welcome-b.md).

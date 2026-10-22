# Offline branding assets

`esmer-market-logo.png` is the unchanged 459 × 110 RGBA logo downloaded on 2026-10-03 from https://esmermarket.com/images/MarketLogo.png. The owner explicitly requested this website logo for the application. It is Esmer Market branding; no licence grant or ownership transfer is inferred.

The build copies the logo and the Latin and Latin Extended variable WOFF2 subsets from locked `@fontsource-variable/manrope` 5.3.0 into `dist/ui/assets`. The desktop protocol allows only these named assets. No remote logo or font request is required.

Manrope's SIL Open Font License is copied from the locked package to `dist/licences/manrope-LICENSE`. This notice ships in the application's external `licences` resources directory.

The renderer bundles `scheduler` through React DOM. Its MIT notice and React's are copied from the locked packages into `dist/licences`. Esbuild retains embedded legal comments as well.

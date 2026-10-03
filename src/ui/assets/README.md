# Offline branding assets

`esmer-market-logo.png` is the unchanged 459 × 110 RGBA logo downloaded on 2026-10-03 from https://esmermarket.com/images/MarketLogo.png. The owner explicitly requested this website logo for the application. It is Esmer Market branding; no licence grant or ownership transfer is inferred.

The build copies the logo and the Latin and Latin Extended variable WOFF2 subsets from locked `@fontsource-variable/manrope` 5.3.0 into `dist/ui/assets`. The desktop protocol allows only these named assets. No remote logo or font request is required.

Manrope's SIL Open Font License is copied from the locked package to `dist/licences/manrope-LICENSE`. Three's MIT notice is copied from its locked package. React Three Fiber 9.8.1's npm distribution omits its licence file, so `third-party/react-three-fiber-LICENSE` retains the MIT notice from https://github.com/pmndrs/react-three-fiber/blob/v9.8.1/LICENSE. These notices ship in the application's external `licences` resources directory.

The renderer's browser import chain also bundles `its-fine`, `react-use-measure`, `suspend-react`, `zustand`, `use-sync-external-store`, and `scheduler`. Their MIT notices are copied from the locked packages into `dist/licences`. The React MIT notice covers React and the React reconciler code embedded in React Three Fiber. Esbuild retains embedded legal comments as well. `@babel/runtime`, `buffer`, and `base64-js` are package dependencies but are not imported by React Three Fiber's browser entry or its bundled event module; no new browser notice is needed for these unused paths.

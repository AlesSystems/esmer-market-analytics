# shadcn/ui component provenance

This record covers the three shared controls introduced for Issue 27: `Button`, `Input`, and `Badge`. They live in `src/ui/components/ui`. It does not claim that the local files are byte-identical copies of shadcn/ui registry output.

## Registry retrieval

On 25 September 2026, the official shadcn/ui New York v4 registry returned HTTP 200 for each record below. The SHA-256 values are of the retrieved UTF-8 response content. This makes the exact retrieved input auditable even though the mutable registry URLs may change later.

| Component | Official registry record | Registry source path | Retrieved SHA-256 |
| --- | --- | --- | --- |
| Button | `https://ui.shadcn.com/r/styles/new-york-v4/button.json` | `registry/new-york-v4/ui/button.tsx` | `4b8d7d848742727973c1b088af8d15f0b628272a1316f2d2fa344e73ddff9e9c` |
| Input | `https://ui.shadcn.com/r/styles/new-york-v4/input.json` | `registry/new-york-v4/ui/input.tsx` | `b1fffa12ba72ce30a291749012b47235eda110648b8106725ced22b5b31c8f1b` |
| Badge | `https://ui.shadcn.com/r/styles/new-york-v4/badge.json` | `registry/new-york-v4/ui/badge.tsx` | `0f988b37cf1c56e7ecc83b1dcf24c9af4e73ce4341da5caf2c9d9b07a551319b` |

The official `shadcn-ui/ui` repository `main` ref resolved to `98a1fe67b439324ddc857f47fbdce056600a4329` during the same retrieval. Its [MIT notice](https://raw.githubusercontent.com/shadcn-ui/ui/98a1fe67b439324ddc857f47fbdce056600a4329/LICENSE.md) was retrieved from the official repository, with response SHA-256 `1564074e13439397221ffd522e2e504d56561994a23d371aa5e3ad43e4f5423f`, and retained verbatim in [`third-party/shadcn-LICENSE`](../../../third-party/shadcn-LICENSE).

## Local adaptation

The registry records use the `cn` helper and `class-variance-authority`; these remain in use through `src/ui/lib/utils.ts` and the two variant components. Local controls deliberately render semantic native elements (`button`, `input`, and `span`) and spread their typed native props, including React 19 ref props, to those elements. They do not use Radix `Slot`, `asChild`, or dark-mode utility variants, so no Radix dependency is introduced.

The local styling changes minimum control height, padding, border and focus treatment for the Windows desktop layout. `Button` has the application-needed default, outline, ghost, link, and destructive variants; `Badge` has default, secondary, outline, destructive, and the application's explicit warning variant. This is intentional adaptation for the product's existing semantic controls, not upstream component replication.

Only these three shared controls were selected. Existing native tables, `select` elements, `details` disclosure controls, and the established SVG chart remain in place. This preserves their current state ownership and avoids adding table, select, disclosure, chart, overlay, or Radix dependencies without a user task.

## Licence handling

shadcn/ui is MIT-licensed. The retained upstream notice is the attribution record for the adapted component source; the package notices for `clsx`, `tailwind-merge`, and `class-variance-authority` are recorded in [the dependency licence review](../licences.md). Release packaging must distribute the notices with the application.

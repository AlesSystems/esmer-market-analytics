import { build } from "esbuild";
import { rm, mkdir, copyFile, readFile, writeFile } from "node:fs/promises";
import postcss from "postcss";
import tailwindcss from "@tailwindcss/postcss";
const { version } = JSON.parse(await readFile("package.json", "utf8"));
await rm("dist", { recursive: true, force: true });
await mkdir("dist/ui", { recursive: true });
await build({
  entryPoints: [
    "src/desktop/main.ts",
    "src/desktop/preload.ts",
    "src/service/worker.ts",
  ],
  outdir: "dist",
  outbase: "src",
  bundle: true,
  platform: "node",
  format: "cjs",
  outExtension: { ".js": ".cjs" },
  external: ["electron"],
  target: "node24",
});
await build({
  entryPoints: ["src/ui/App.tsx"],
  outfile: "dist/ui/app.js",
  bundle: true,
  platform: "browser",
  minify: true,
  define: { "process.env.NODE_ENV": '"production"', "process.env.APP_VERSION": JSON.stringify(version) },
});
await copyFile("src/ui/index.html", "dist/ui/index.html");
const stylesheet = await postcss([tailwindcss()]).process(await readFile("src/ui/style.css", "utf8"), {
  from: "src/ui/style.css", to: "dist/ui/style.css", map: false,
});
await writeFile("dist/ui/style.css", stylesheet.css);

await mkdir("dist/licences", { recursive: true });
for (const notice of ["LICENSE", "LICENSES.chromium.html"]) {
  await copyFile(
    `node_modules/electron/dist/${notice}`,
    `dist/licences/${notice}`,
  );
}
await copyFile("third-party/shadcn-LICENSE", "dist/licences/shadcn-LICENSE");
await copyFile("node_modules/tailwindcss/LICENSE", "dist/licences/tailwindcss-LICENSE");

await mkdir("dist/ui/assets", { recursive: true });
await copyFile("src/ui/assets/esmer-market-logo.png", "dist/ui/assets/esmer-market-logo.png");
for (const subset of ["latin", "latin-ext"]) {
  const filename = `manrope-${subset}-wght-normal.woff2`;
  await copyFile(`node_modules/@fontsource-variable/manrope/files/${filename}`, `dist/ui/assets/${filename}`);
}
await copyFile("node_modules/@fontsource-variable/manrope/LICENSE", "dist/licences/manrope-LICENSE");
for (const dependency of ["scheduler", "react"]) {
  await copyFile(`node_modules/${dependency}/LICENSE`, `dist/licences/${dependency}-LICENSE`);
}

for (const subset of ["latin", "latin-ext"]) {
  const filename = `newsreader-${subset}-wght-italic.woff2`;
  await copyFile(`node_modules/@fontsource-variable/newsreader/files/${filename}`, `dist/ui/assets/${filename}`);
}
await copyFile("node_modules/@fontsource-variable/newsreader/LICENSE", "dist/licences/newsreader-LICENSE");

import { build } from "esbuild";
import { rm, mkdir, copyFile, readFile, writeFile } from "node:fs/promises";
import postcss from "postcss";
import tailwindcss from "@tailwindcss/postcss";
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
  define: { "process.env.NODE_ENV": '"production"' },
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

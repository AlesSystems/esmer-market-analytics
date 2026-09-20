import { build } from "esbuild";
import { writeFile } from "node:fs/promises";

if (process.argv.length !== 3) {
  throw new Error("Usage: node scripts/create-sales-fixture.mjs <new-output.json>");
}
const compiled = await build({
  entryPoints: ["tests/helpers/sales-fixtures.ts"],
  bundle: true,
  platform: "node",
  format: "esm",
  write: false,
});
const fixture = await import(`data:text/javascript;base64,${Buffer.from(compiled.outputFiles[0].text).toString("base64")}`);
await writeFile(process.argv[2], fixture.salesPackage(fixture.journeyRecords()), { flag: "wx" });
console.log("SYNTHETIC_ONLY sales fixture created. Expected net sales 365, sale count 3, basket 133.33.");

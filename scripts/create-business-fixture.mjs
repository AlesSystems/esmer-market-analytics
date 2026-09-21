import { build } from "esbuild";
import { writeFile } from "node:fs/promises";

if (process.argv.length !== 3) {
  throw new Error("Usage: node scripts/create-business-fixture.mjs <new-output.json>");
}
const compiled = await build({
  stdin: { contents: 'export { businessPackage } from "./tests/helpers/business-fixtures"; export { purchasingJourney } from "./tests/helpers/purchasing-journey";', resolveDir: process.cwd(), loader: "ts" },
  bundle: true,
  platform: "node",
  format: "esm",
  write: false,
});
const fixture = await import(`data:text/javascript;base64,${Buffer.from(compiled.outputFiles[0].text).toString("base64")}`);
await writeFile(process.argv[2], fixture.businessPackage(fixture.purchasingJourney()), { flag: "wx" });
console.log("SYNTHETIC_ONLY business fixture created. Covered sales 100, cost 60, gross estimate 40, coverage 50%. Includes purchasing, linked supplier return, and negative stock.");

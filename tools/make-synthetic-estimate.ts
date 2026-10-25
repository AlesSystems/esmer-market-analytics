import { build } from "esbuild";
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

// node tools/make-synthetic-estimate.ts <output.json>
// Writes the rich SYNTHETIC estimate package used by the tests. The fixture is TypeScript with extensionless imports, so it is bundled first.
export async function makeSyntheticEstimate(output: string): Promise<void> {
  const entry = fileURLToPath(new URL("../tests/helpers/rich-estimate-fixture.ts", import.meta.url));
  const built = await build({ entryPoints: [entry], bundle: true, platform: "node", format: "esm", write: false, logLevel: "silent" });
  const module = await import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString("base64")}`);
  await writeFile(output, module.richEstimatePackage(), { flag: "wx" });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const output = process.argv[2];
  if (!output || process.argv.length > 3) { console.error("usage: node tools/make-synthetic-estimate.ts <output.json>"); process.exit(2); }
  await makeSyntheticEstimate(output);
  console.log("SYNTHETIC_ONLY estimate package written");
}

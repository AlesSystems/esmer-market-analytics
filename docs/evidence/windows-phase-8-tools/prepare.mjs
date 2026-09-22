import { build } from 'esbuild';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { createHash } from 'node:crypto';

const root = resolve('work/windows-phase-8');
await mkdir(root, { recursive: true });
await build({ stdin: { contents: "export { openStore } from './src/store/store'; export { Expenses } from './src/expenses/import'; export { SalesReports } from './src/reports/query'; export { ReportVersions } from './src/reports/versions'; export { excelReport } from './src/reports/export'; export { businessRecords, businessPackage } from './tests/helpers/business-fixtures'; export { workbook, row } from './tests/helpers/expense-fixtures';", resolveDir: process.cwd() }, bundle: true, platform: 'node', format: 'esm', packages: 'external', outfile: join(root, 'api.mjs') });
const { businessRecords, businessPackage, workbook, row } = await import('./api.mjs');
const folder = join(root, 'sentetik-İşçilik');
await mkdir(folder, { recursive: true });
const records = businessRecords();
records.lines[0].sales.productName = 'Işık İçme suyu şğüöç';
records.lines[1].sales.productId = 'formula-text';
records.lines[1].sales.productName = '=HYPERLINK("İstanbul")';
const corrected = structuredClone(records);
corrected.documents = [corrected.documents[0]];
corrected.lines = [corrected.lines[0]];
const fixtures = {
  'sentetik-satış.json': businessPackage(records),
  'sentetik-düzeltme.json': businessPackage(corrected, { extractionId: 'business-2', extractedAt: '2025-10-02T00:00:00.000Z' }),
  'sentetik-gider.xlsx': await workbook([[row[0], '15.09.2025', '01.10.2025', ...row.slice(3)]]),
};
const evidence = [];
for (const [name, bytes] of Object.entries(fixtures)) {
  const path = join(folder, name);
  await writeFile(path, bytes, { flag: 'wx' });
  evidence.push({ name, bytes: bytes.length, sha256: createHash('sha256').update(await readFile(path)).digest('hex') });
}
await writeFile(join(root, 'fixtures.json'), JSON.stringify(evidence, null, 2));
console.log(JSON.stringify(evidence));

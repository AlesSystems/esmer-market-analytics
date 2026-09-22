import { readFile, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import readSheets from 'read-excel-file/node';

const root = resolve('work/windows-phase-8');
const stage = process.argv[2];
assert.ok(['create', 'verify'].includes(stage));
const originalPath = join(root, 'sentetik-İşçilik/Hassasiyet-Çığ.xlsx');
const savedPath = join(root, 'sentetik-İşçilik/Excel-hassasiyet-Çığ.xlsx');
const quantities = ['0.125000000000000001', '12345678901234567890.123456789'];
if (stage === 'create') {
  const { excelReport } = await import(pathToFileURL(join(root, 'api.mjs')).href);
  const report = JSON.parse(await readFile(join(root, 'native-selected.json'), 'utf8'));
  report.id = 'synthetic-native-excel-precision';
  report.sales.metrics.quantities.kg = quantities[0];
  report.sales.products[0].quantities.kg = quantities[1];
  await writeFile(originalPath, await excelReport(report), { flag: 'wx' });
  console.log('Created synthetic compatibility probe; quantities intentionally substituted.');
} else {
  const original = await readFile(originalPath), saved = await readFile(savedPath);
  const originalSheets = await readSheets(original), savedSheets = await readSheets(saved);
  assert.deepEqual(savedSheets, originalSheets);
  for (const quantity of quantities) assert.ok(savedSheets.some(sheet => sheet.data.flat().includes(quantity)));
  const digest = bytes => createHash('sha256').update(bytes).digest('hex');
  const proof = { status: 'passed', syntheticQuantitySubstitution: true, quantities, originalSha256: digest(original), excelSavedSha256: digest(saved), allSheetValuesAndTypesEqual: true };
  await writeFile(join(root, 'native-precision-proof.json'), JSON.stringify(proof, null, 2));
  console.log(JSON.stringify(proof));
}

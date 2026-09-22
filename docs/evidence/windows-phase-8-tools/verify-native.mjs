import { readFile, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import readSheets from 'read-excel-file/node';
import { unzipSync, strFromU8 } from 'fflate';

const root = resolve('work/windows-phase-8');
const selected = JSON.parse(await readFile(join(root, 'native-selected.json'), 'utf8'));
const originalPath = join(root, 'sentetik-İşçilik/Seçili-İşçilik-Çığ.xlsx');
const savedPath = join(root, 'sentetik-İşçilik/Excel-kaydedildi-Çığ.xlsx');
const original = await readFile(originalPath), saved = await readFile(savedPath);
const originalSheets = await readSheets(original), savedSheets = await readSheets(saved);
assert.deepEqual(savedSheets, originalSheets);
assert.equal(savedSheets.length, 17);
for (const sheet of savedSheets) {
  assert.deepEqual(sheet.data[0].slice(0, 2), ['Rapor sürümü', selected.id]);
  assert.deepEqual(sheet.data[1].slice(0, 2), ['Dönem', '2025-09']);
  assert.deepEqual(sheet.data[2].slice(0, 2), ['Veri kesimi', '2025-09-30']);
  assert.deepEqual(sheet.data[3].slice(0, 2), ['Kaynak veri kümesi', selected.context.datasetId]);
}
for (const [title, value] of [['Net satış', 200], ['Tahmini maliyet', 60], ['Kapsanan tahmini brüt kâr', 40]]) {
  assert.equal(savedSheets[0].data.find(row => row[0] === title)[1], value);
}
assert.ok(savedSheets.some(sheet => sheet.data.flat().includes('=HYPERLINK("İstanbul")')));
assert.ok(savedSheets.some(sheet => sheet.data.flat().includes('Işık İçme suyu şğüöç')));
for (const [name, xml] of Object.entries(unzipSync(saved))) {
  if (/^xl\/worksheets\/sheet\d+\.xml$/.test(name)) assert.doesNotMatch(strFromU8(xml), /<f[ >]/);
}
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const proof = { selectedReportId: selected.id, originalSha256: digest(original), excelSavedSha256: digest(saved), sheets: 17, allValuesAndTypesEqual: true, literalTotals: { net: 200, cost: 60, coveredGross: 40 }, turkishAndFormulaLikeTextPreserved: true, formulas: 0 };
await writeFile(join(root, 'native-workbook-verification.json'), JSON.stringify(proof, null, 2));
console.log(JSON.stringify(proof));

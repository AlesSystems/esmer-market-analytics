import { build } from 'esbuild';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { createHash } from 'node:crypto';
import writeXlsxFile from 'write-excel-file/node';
await build({ stdin: { contents: "export { expenseTemplate, expenseColumns } from './src/expenses/template'; export { Expenses } from './src/expenses/import'; export { openStore } from './src/store/store'; export { businessRecords, businessPackage } from './tests/helpers/business-fixtures'; export { SalesReports } from './src/reports/query';", resolveDir: process.cwd() }, bundle: true, platform: 'node', format: 'esm', packages: 'external', outfile: 'work/windows-phase-7/api.mjs' });
const { expenseTemplate, expenseColumns, businessRecords, businessPackage } = await import('./api.mjs');
const root = resolve('work/windows-phase-7/sentetik-İşçilik');
await mkdir(root, { recursive: true });
const rows = [
 ['sentetik-kira', '15.01.2026', '01.02.2026', 'Sentetik kira', 'Faaliyet gideri', '50', '0', '50', 'İndirilemez', 'sentetik-vergi', 'sentetik-belge', '', '', ''],
 ['sentetik-katki', '15.01.2026', '', 'Sentetik katkı', 'İşletme sahibinin katkısı', '500', '0', '500', 'İndirilemez', 'sentetik-vergi', '', '', '', ''],
 ['sentetik-kesir', '15.03.2026', '', 'Sentetik İşçilik Çığ Şü Ö', 'Faaliyet gideri', '1.234,5678', '0', '1.234,5678', 'İndirilemez', 'sentetik-vergi', '', '', '', ''],
 ['sentetik-native', new Date('2026-03-16T00:00:00Z'), '', 'Sentetik sayısal', 'Faaliyet gideri', 12.3456, 0, 12.3456, 'İndirilemez', 'sentetik-vergi', '', '', '', '']
];
const cells = [expenseColumns, ...rows].map(row => row.map(value => value instanceof Date ? { type: Date, value, format: 'dd.mm.yyyy' } : { type: typeof value === 'number' ? Number : String, value }));
await writeFile(join(root, 'excel-girdi.xlsx'), await writeXlsxFile(cells, { sheet: 'Giderler' }).toBuffer(), { flag: 'wx' });
await writeFile(join(root, 'bos-sablon.xlsx'), await expenseTemplate(), { flag: 'wx' });
const records = businessRecords(); records.documents = [records.documents[0]]; records.lines = [records.lines[0]];
Object.assign(records.documents[0], { date: '2026-01-15', sales: { ...records.documents[0].sales, net: '300', tax: '15', gross: '315' } });
Object.assign(records.lines[0], { net: '300', sales: { ...records.lines[0].sales, unitNet: '300', tax: '15', gross: '315' }, business: { ...records.lines[0].business, historicalCost: { ...records.lines[0].business.historicalCost, unitCost: '100' } } });
const source = businessPackage(records, { lineage: 'sentetik-windows-phase-7', extractionId: 'sentetik-phase-7-1', extractedAt: '2026-02-01T00:00:00.000Z', cutoff: '2026-01-31', coverage: { from: '2026-01-01', to: '2026-01-31', complete: true } });
await writeFile(join(root, 'sentetik-satis.json'), source, { flag: 'wx' });
const fixtures = [];
for (const name of ['excel-girdi.xlsx', 'bos-sablon.xlsx', 'sentetik-satis.json']) { const bytes = await readFile(join(root, name)); fixtures.push({ name, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') }); }
await writeFile('work/windows-phase-7/fixtures.json', JSON.stringify({ root, fixtures }, null, 2));
console.log(JSON.stringify({ root, fixtures }));

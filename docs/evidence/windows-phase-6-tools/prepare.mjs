import { build } from 'esbuild';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import assert from 'node:assert/strict';
const { root } = JSON.parse(await readFile(new URL('./paths.json', import.meta.url), 'utf8'));
await build({ stdin: { contents: "export { openStore } from './src/store/store'; export { salesPackage, journeyRecords } from './tests/helpers/sales-fixtures';", resolveDir: process.cwd() }, bundle: true, platform: 'node', format: 'esm', outfile: 'work/windows-phase-6/fixture-api.mjs' });
const { openStore, salesPackage, journeyRecords } = await import('./fixture-api.mjs');
const bytes = salesPackage(journeyRecords());
await writeFile(join(root, 'sales.json'), bytes, { flag: 'wx' });
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
for (const name of ['installed-profile', 'portable-profile']) {
  const profile = join(root, name); await mkdir(profile);
  const databasePath = join(profile, 'analytics.sqlite');
  const store = openStore(databasePath, { schemaVersion: 3 });
  assert.equal(store.importPackage(bytes).status, 'active');
  store.appendRevision({ kind: 'setting', entityId: 'currency', value: { currency: 'TRY', reason: 'Synthetic lifecycle initial setting', evidence: 'fixture:setting-1' } });
  store.appendRevision({ kind: 'adjustment', entityId: 'adjustment', value: { net: '0.125000000000000001', target: { datasetId: store.readSnapshot().pin.datasetId, kind: 'line', sourceId: 'L001' }, reversed: false, reason: 'Synthetic lifecycle adjustment', evidence: 'fixture:adjustment' } });
  const accepted = store.readSnapshot();
  const report = { id: 'accepted', pin: accepted.pin, calculationVersion: 'synthetic-preservation-v1', evidence: ['fixture:synthetic-report'], output: { label: 'Synthetic migration sentinel only; not owner acceptance', net: '0.125000000000000001' } };
  store.acceptReport(report);
  store.appendRevision({ kind: 'setting', entityId: 'currency', value: { currency: 'TRY', reason: 'Synthetic lifecycle later setting', evidence: 'fixture:setting-2' } });
  const current = store.readSnapshot();
  const availability = store.availability();
  store.close();
  const db = new DatabaseSync(databasePath, { readOnly: true });
  const tables = {};
  for (const { name: table } of db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all()) {
    const columns = db.prepare(`PRAGMA table_info("${table}")`).all().map(row => row.name);
    const rows = db.prepare(`SELECT ${columns.map(column => `"${column}"`).join(',')} FROM "${table}" ORDER BY rowid`).all();
    tables[table] = { columns, rows, sha256: hash(rows) };
  }
  db.close();
  await writeFile(join(root, `${name}-expected.json`), JSON.stringify({ current, accepted, report, availability, tables, hashes: { current: hash(current), accepted: hash(accepted), report: hash(report) } }, null, 2), { flag: 'wx' });
}
console.log(JSON.stringify({ root, fixtureBytes: bytes.length, fixtureSha256: createHash('sha256').update(bytes).digest('hex'), schemaVersion: 3, ownerConfirmation: false }));

import { expect, test } from "vitest";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import readAll from "read-excel-file/node";
import { Recovery } from "../../src/recovery/backup";
import { generateRecoveryKey, encodeRecoveryKey, decodeRecoveryKey } from "../../src/recovery/keys";
import { ReportVersions } from "../../src/reports/versions";
import { SalesReports } from "../../src/reports/query";
import { excelReport } from "../../src/reports/export";
import { populateRecoveryStore } from "../helpers/recovery-fixtures";

function financialRecords(path: string) {
  const db = new DatabaseSync(path, { readOnly: true });
  try {
    const names = ["datasets", "source_documents", "source_lines", "source_suppliers", "active_dataset", "rollback_dataset", "package_history", "app_revisions", "adjustment_targets", "expense_batches", "expense_commands", "report_versions", "evidence_references", "import_batches"];
    return Object.fromEntries(names.map(name => [name, db.prepare(`SELECT * FROM ${name} ORDER BY rowid`).all()]));
  } finally { db.close(); }
}

test("independent artifact and exported key recover financial history and every Excel sheet after original installation loss", async () => {
  const root = await mkdtemp(join(tmpdir(), "esmer-independent-recovery-"));
  const original = join(root, "original"), fresh = join(root, "fresh"), destination = join(root, "retained-backups");
  await Promise.all([mkdir(original), mkdir(fresh), mkdir(destination)]);
  const originalPath = join(original, "analytics.sqlite"), restoredPath = join(fresh, "analytics.sqlite");
  const key = generateRecoveryKey(), keyPath = join(root, "retained-key.esmerkey");
  await writeFile(keyPath, encodeRecoveryKey(key), { mode: 0o600 });
  let recovery: Recovery | undefined;
  try {
    recovery = await Recovery.open(originalPath, { destination, key });
    const accepted = await populateRecoveryStore(recovery.store!);
    const before = financialRecords(originalPath);
    const workbookBefore = await readAll(await excelReport(accepted));
    const status = await recovery.backupNow();
    expect(status.state).toBe("ready");
    expect(status.backups.length).toBeGreaterThan(0);
    const latest = [...status.backups].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
    const artifact = join(destination, `${latest.id}.esmerbackup`);
    expect((await readFile(artifact)).includes(Buffer.from("Sentetik kira düzeltmesi"))).toBe(false);
    await recovery.close(); recovery = undefined;
    await rm(original, { recursive: true });
    key.fill(0);

    recovery = await Recovery.open(restoredPath);
    const preview = await recovery.prepareRestore(artifact, decodeRecoveryKey(await readFile(keyPath)));
    expect(preview.reports).toBe(1);
    expect(preview.revisions).toBe(6);
    expect(recovery.store!.availability()).toMatchObject({ store: "empty" });
    await recovery.confirmRestore(preview.token);
    expect(financialRecords(restoredPath)).toEqual(before);
    const versions = new ReportVersions(recovery.store!, new SalesReports(recovery.store!));
    const restored = versions.selected(accepted.id);
    expect(restored).toEqual(accepted);
    expect(restored.sales.metrics.netSales).toBe("100");
    expect(restored.purchasing.gross.coveredGrossProfit).toBe("40");
    expect(restored.operating.result.expenses).toBe("60");
    expect(await readAll(await excelReport(restored))).toEqual(workbookBefore);
    await recovery.close(); recovery = undefined;
    recovery = await Recovery.open(restoredPath);
    expect(financialRecords(restoredPath)).toEqual(before);
  } finally {
    await recovery?.close();
    await rm(root, { recursive: true, force: true });
  }
});

test("encrypted recovery preserves accepted cross-month product proof and every product Excel sheet after source replacement and profile loss", async () => {
  const { businessPackage, productProfitRecords } = await import("../helpers/business-fixtures");
  const { excelProductReport } = await import("../../src/reports/export");
  const root = await mkdtemp(join(tmpdir(), "esmer-product-proof-recovery-"));
  const original = join(root, "original"), fresh = join(root, "fresh"), destination = join(root, "retained-backups");
  await Promise.all([mkdir(original), mkdir(fresh), mkdir(destination)]);
  const originalPath = join(original, "analytics.sqlite"), restoredPath = join(fresh, "analytics.sqlite");
  const key = generateRecoveryKey(), keyPath = join(root, "retained-key.esmerkey");
  await writeFile(keyPath, encodeRecoveryKey(key), { mode: 0o600 });
  let recovery: Recovery | undefined;
  try {
    recovery = await Recovery.open(originalPath, { destination, key });
    const store = recovery.store!;
    await populateRecoveryStore(store);
    const records = productProfitRecords(false);
    records.documents.find(row => row.id === "A1")!.date = "2025-08-31";
    const coverage = { from: "2025-08-31", to: "2025-09-30", complete: true };
    expect(store.importPackage(businessPackage(records, { extractionId: "product-original", coverage })).status).toBe("active");
    const versions = new ReportVersions(store, new SalesReports(store));
    const opened = versions.open({ period: "2025-09" });
    if (opened.status !== "monthly") throw new Error("Expected product monthly report");
    const previousAcceptedId = versions.list({ period: "2025-09" }).reports[0].id;
    const accepted = versions.accept({ candidateId: opened.report.id, previousAcceptedId, reason: "Sentetik aylar arası iade kanıtı" });
    if (accepted.status !== "monthly") throw new Error("Expected accepted report");
    const productRequest = { reportId: accepted.report.id, productId: "A" };
    const dependencyRequest = { ...productRequest, returnLineId: "A2", offset: 0 };
    const detailBefore = versions.product(productRequest), dependencyBefore = versions.productDependency(dependencyRequest);
    expect(detailBefore).toMatchObject({ status: "product", summary: { netSales: "-100", coveredCost: "-60", coveredGrossProfit: "-40", coveredMarginPercent: null, quantities: [{ unit: "piece", sold: "0", returned: "1", net: "-1" }] } });
    if (detailBefore.status !== "product") throw new Error("Expected product detail");
    expect(detailBefore.daily.find(day => day.date === "2025-09-02")).toMatchObject({ netSales: "-100", coveredCost: "-60", coveredGrossProfit: "-40", trend: "-40" });
    expect(dependencyBefore).toMatchObject({ status: "product-dependency", originalLineId: "A1", document: { id: "A1", date: "2025-08-31" }, original: { id: "A1", business: { historicalCost: { unitCost: "60" } } }, returnOutcome: { lineId: "A2", cost: "-60" } });
    const workbookBefore = await readAll(await excelProductReport(accepted.report, "A"));
    expect(workbookBefore.length).toBeGreaterThan(1);
    expect(workbookBefore.flatMap(sheet => sheet.data.flat())).toContain("A1");

    const replacement = structuredClone(records);
    for (const line of replacement.lines.filter(row => row.sales?.productId === "A")) line.business!.historicalCost!.unitCost = "99";
    expect(store.importPackage(businessPackage(replacement, { extractionId: "product-corrected", coverage })).status).toBe("active");
    const newer = versions.open({ period: "2025-09" });
    if (newer.status !== "monthly") throw new Error("Expected corrected candidate");
    expect(versions.product({ reportId: newer.report.id, productId: "A" })).toMatchObject({ status: "product", summary: { coveredCost: "-99", coveredGrossProfit: "-1" } });
    expect(versions.product(productRequest)).toEqual(detailBefore);
    expect(versions.productDependency(dependencyRequest)).toEqual(dependencyBefore);
    expect(await readAll(await excelProductReport(versions.selected(accepted.report.id), "A"))).toEqual(workbookBefore);
    const before = financialRecords(originalPath);
    const status = await recovery.backupNow();
    expect(status.state).toBe("ready");
    const latest = [...status.backups].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
    const artifact = join(destination, `${latest.id}.esmerbackup`);
    await recovery.close(); recovery = undefined;
    await rm(original, { recursive: true });
    key.fill(0);

    recovery = await Recovery.open(restoredPath);
    const preview = await recovery.prepareRestore(artifact, decodeRecoveryKey(await readFile(keyPath)));
    expect(preview.reports).toBe(2);
    expect(recovery.store!.availability()).toMatchObject({ store: "empty" });
    await recovery.confirmRestore(preview.token);
    expect(financialRecords(restoredPath)).toEqual(before);
    const restoredVersions = new ReportVersions(recovery.store!, new SalesReports(recovery.store!));
    expect(restoredVersions.selected(accepted.report.id)).toEqual(accepted.report);
    expect(restoredVersions.product(productRequest)).toEqual(detailBefore);
    expect(restoredVersions.productDependency(dependencyRequest)).toEqual(dependencyBefore);
    expect(await readAll(await excelProductReport(restoredVersions.selected(accepted.report.id), "A"))).toEqual(workbookBefore);
  } finally {
    await recovery?.close();
    await rm(root, { recursive: true, force: true });
  }
});

test("deep validation rejects a v2 accepted report whose pinned unit cost is altered", async () => {
  const { businessPackage } = await import("../helpers/business-fixtures");
  const { openStore } = await import("../../src/store/store");
  const { validateSnapshot } = await import("../../src/recovery/validate");
  const root = await mkdtemp(join(tmpdir(), "esmer-v2-tamper-")), path = join(root, "analytics.sqlite");
  try {
    const store = openStore(path);
    store.importPackage(businessPackage());
    const versions = new ReportVersions(store,new SalesReports(store));
    const opened = versions.open({period:"2025-09"});
    if (opened.status !== "monthly" || opened.report.format !== "monthly-report-v2") throw new Error("Expected v2");
    versions.accept({candidateId:opened.report.id,previousAcceptedId:null,reason:"Sentetik kontrol"});
    store.close();
    expect(validateSnapshot(path).reports).toBe(1);
    const bytes = await readFile(path), target = Buffer.from('"historicalUnitCost":"60"'), replacement = Buffer.from('"historicalUnitCost":"99"');
    const index = bytes.indexOf(target);
    expect(index).toBeGreaterThan(-1);
    replacement.copy(bytes,index);
    await writeFile(path,bytes);
    expect(() => validateSnapshot(path)).toThrow();
  } finally { await rm(root,{recursive:true,force:true}); }
});

test("accepted v1 and v2 artifacts remain independently readable and exportable", async () => {
  const { businessPackage } = await import("../helpers/business-fixtures");
  const { openStore } = await import("../../src/store/store");
  const { validateSnapshot } = await import("../../src/recovery/validate");
  const root = await mkdtemp(join(tmpdir(), "esmer-versioned-reports-")), path = join(root, "analytics.sqlite");
  let store = openStore(path);
  try {
    store.importPackage(businessPackage());
    let versions = new ReportVersions(store,new SalesReports(store));
    const opened = versions.open({period:"2025-09"});
    if (opened.status !== "monthly" || opened.report.format !== "monthly-report-v2") throw new Error("Expected v2");
    const base = {...structuredClone(opened.report)};
    Reflect.deleteProperty(base,"productProfit");
    const legacy: import("../../src/reports/contracts").MonthlyReportV1 = {...base,id:"legacy-v1-fixture",format:"monthly-report-v1",calculations:{...base.calculations,report:"monthly-calc-v1"},rules:{...base.rules,artifact:"esmer-market:monthly-v1"},review:{acceptedAt:"2025-10-01T00:00:00.000Z",reason:"Sentetik eski sürüm",previousAcceptedId:null}};
    store.acceptReport({id:legacy.id,pin:{datasetId:legacy.context.datasetId,appRevision:legacy.context.appRevision},calculationVersion:legacy.calculations.report,evidence:[`package:${legacy.context.datasetId}`,legacy.rules.artifact],output:{report:legacy}});
    versions.accept({candidateId:opened.report.id,previousAcceptedId:legacy.id,reason:"Yeni sentetik sürüm"});
    expect(versions.compare({candidateId:opened.report.id,acceptedId:legacy.id}).changes).toEqual(expect.arrayContaining([expect.objectContaining({path:"format",before:"monthly-report-v1",after:"monthly-report-v2"})]));
    store.close(); store = openStore(path); versions = new ReportVersions(store,new SalesReports(store));
    expect(validateSnapshot(path).reports).toBe(2);
    expect(versions.list({period:"2025-09"}).reports).toHaveLength(2);
    expect(versions.selected(legacy.id)).toEqual(legacy);
    expect(versions.display({reportId:legacy.id}).report).not.toHaveProperty("productProfit");
    expect(() => versions.products({reportId:legacy.id,search:"",sort:"profit",direction:"desc",offset:0})).toThrow("PRODUCT_PROFIT_UNAVAILABLE");
    expect(await readAll(await excelReport(legacy))).not.toEqual(await readAll(await excelReport(versions.selected(opened.report.id))));
  } finally { store.close(); await rm(root,{recursive:true,force:true}); }
});

test("deep validation rejects coherent v2 aggregate changes that leave pinned lines unchanged", async () => {
  const { businessPackage } = await import("../helpers/business-fixtures");
  const { openStore } = await import("../../src/store/store");
  const { validateSnapshot } = await import("../../src/recovery/validate");
  const root = await mkdtemp(join(tmpdir(), "esmer-v2-aggregate-tamper-")), path = join(root, "analytics.sqlite");
  try {
    const store = openStore(path);
    store.importPackage(businessPackage());
    const versions = new ReportVersions(store,new SalesReports(store)), opened = versions.open({period:"2025-09"});
    if (opened.status !== "monthly" || opened.report.format !== "monthly-report-v2") throw new Error("Expected v2");
    versions.accept({candidateId:opened.report.id,previousAcceptedId:null,reason:"Sentetik kontrol"});
    store.close();
    expect(validateSnapshot(path).reports).toBe(1);
    const bytes = await readFile(path), start = bytes.indexOf(Buffer.from('"productProfit":')), end = bytes.indexOf(Buffer.from('"purchasing":'),start);
    expect(start).toBeGreaterThan(-1); expect(end).toBeGreaterThan(start);
    const target = Buffer.from('"coveredGrossProfit":"40"'), replacement = Buffer.from('"coveredGrossProfit":"90"');
    let count = 0, cursor = start;
    while ((cursor = bytes.indexOf(target,cursor)) >= 0 && cursor < end) { replacement.copy(bytes,cursor); count++; cursor += target.length; }
    expect(count).toBeGreaterThanOrEqual(3);
    await writeFile(path,bytes);
    expect(() => validateSnapshot(path)).toThrow();
  } finally { await rm(root,{recursive:true,force:true}); }
});

test("deep validation rejects a missing zero-value product identity", async () => {
  const { businessPackage, businessRecords, historicalCost } = await import("../helpers/business-fixtures");
  const { openStore } = await import("../../src/store/store");
  const { validateSnapshot } = await import("../../src/recovery/validate");
  const root = await mkdtemp(join(tmpdir(), "esmer-v2-zero-product-")), path = join(root, "analytics.sqlite");
  try {
    const records = businessRecords(), line = records.lines[1];
    line.sales = {...line.sales!,productId:"B",productName:"B",unitNet:"0",tax:"0",gross:"0"};
    line.net = "0"; line.business!.historicalCost = {...historicalCost("0"),documentedZero:true};
    records.documents[1].sales = {...records.documents[1].sales!,net:"0",tax:"0",gross:"0"};
    const store = openStore(path); store.importPackage(businessPackage(records));
    const versions = new ReportVersions(store,new SalesReports(store)), opened = versions.open({period:"2025-09"});
    if (opened.status !== "monthly" || opened.report.format !== "monthly-report-v2") throw new Error("Expected v2");
    expect(opened.report.productProfit.products.find(row=>row.productId==="B")).toMatchObject({netSales:"0",coveredCost:"0",coveredGrossProfit:"0"});
    versions.accept({candidateId:opened.report.id,previousAcceptedId:null,reason:"Sentetik kontrol"}); store.close();
    expect(validateSnapshot(path).reports).toBe(1);
    const bytes = await readFile(path), start = bytes.indexOf(Buffer.from('"productProfit":')), products = bytes.indexOf(Buffer.from('"products":['),start), end = bytes.indexOf(Buffer.from('"sourceExclusions":'),products);
    expect(products).toBeGreaterThan(start); expect(end).toBeGreaterThan(products);
    const { canonical } = await import("../../src/source/package");
    const target = Buffer.from(canonical(opened.report.productProfit.products.find(row=>row.productId==="B"))), index = bytes.indexOf(target,products);
    expect(index).toBeGreaterThan(products); expect(index).toBeLessThan(end); expect(bytes[index+target.length]).toBe(44);
    bytes.fill(32,index,index+target.length+1); await writeFile(path,bytes);
    expect(() => validateSnapshot(path)).toThrow();
  } finally { await rm(root,{recursive:true,force:true}); }
});

test("deep validation rejects altered v2 coverage, state and daily trend", async () => {
  const { businessPackage } = await import("../helpers/business-fixtures");
  const { openStore } = await import("../../src/store/store");
  const { validateSnapshot } = await import("../../src/recovery/validate");
  const root = await mkdtemp(join(tmpdir(), "esmer-v2-state-tamper-")), path = join(root, "analytics.sqlite");
  try {
    const store = openStore(path);
    store.importPackage(businessPackage());
    const versions = new ReportVersions(store, new SalesReports(store)), opened = versions.open({ period: "2025-09" });
    if (opened.status !== "monthly" || opened.report.format !== "monthly-report-v2") throw new Error("Expected v2");
    versions.accept({ candidateId: opened.report.id, previousAcceptedId: null, reason: "Sentetik kontrol" });
    store.close();
    expect(validateSnapshot(path).reports).toBe(1);
    const original = await readFile(path);
    for (const [target, replacement] of [
      ['"trend":"40"', '"trend":"99"'],
      ['"scope":"covered"', '"scope":"market" '],
      ['"status":"ready","trend":"40"', '"status":"empty","trend":"40"'],
      ['"sourceCoverage":"complete"', '"sourceCoverage":"partial" '],
      ['"salesCoverage":{"complete":true,"exposure":"0","unresolvedCount":0}', '"salesCoverage":{"complete":true,"exposure":"0","unresolvedCount":1}'],
      ['"periodCoverage":{"complete":true,"from":"2025-09-01","to":"2025-09-30"}', '"periodCoverage":{"complete":true,"from":"2025-09-02","to":"2025-09-30"}'],
    ]) {
      const bytes = Buffer.from(original), index = bytes.indexOf(Buffer.from(target));
      expect(index, target).toBeGreaterThan(-1);
      expect(Buffer.byteLength(replacement)).toBe(Buffer.byteLength(target));
      Buffer.from(replacement).copy(bytes, index);
      await writeFile(path, bytes);
      expect(() => validateSnapshot(path), target).toThrow();
    }
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("v2 recovery retains valid empty, partial and unresolved report states", async () => {
  const { businessPackage, businessRecords } = await import("../helpers/business-fixtures");
  const { openStore } = await import("../../src/store/store");
  const { validateSnapshot } = await import("../../src/recovery/validate");
  const root = await mkdtemp(join(tmpdir(), "esmer-v2-coverage-recovery-"));
  const empty = businessRecords(); empty.documents = []; empty.lines = [];
  const unresolved = businessRecords(); unresolved.lines[0].sales!.unit = "unknown";
  try {
    for (const [name, records, coverage] of [
      ["empty", empty, { from: "2025-09-01", to: "2025-09-30", complete: true }],
      ["partial", businessRecords(), { from: "2025-09-01", to: "2025-09-02", complete: false }],
      ["unresolved", unresolved, { from: "2025-09-01", to: "2025-09-30", complete: true }],
    ] as const) {
      const path = join(root, `${name}.sqlite`), store = openStore(path);
      try {
        expect(store.importPackage(businessPackage(records, { coverage })).status).toBe("active");
        const versions = new ReportVersions(store, new SalesReports(store)), opened = versions.open({ period: "2025-09" });
        if (opened.status !== "monthly" || opened.report.format !== "monthly-report-v2") throw new Error("Expected v2");
        if (name === "empty") expect(opened.report.productProfit.summary.status).toBe("empty");
        if (name === "partial") expect(opened.report.productProfit.daily[2]).toMatchObject({ sourceCoverage: "unavailable", status: "unavailable", trend: null });
        if (name === "unresolved") expect(opened.report.productProfit.summary.salesCoverage).toMatchObject({ complete: false, unresolvedCount: 1, exposure: null });
        versions.accept({ candidateId: opened.report.id, previousAcceptedId: null, reason: "Sentetik kapsam kontrolü" });
      } finally { store.close(); }
      expect(validateSnapshot(path).reports).toBe(1);
    }
  } finally { await rm(root, { recursive: true, force: true }); }
});

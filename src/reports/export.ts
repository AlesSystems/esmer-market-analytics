import writeXlsxFile, { type Row, type Cell } from "write-excel-file/node";
import { Exact } from "../domain/money";
import { classificationLabels, type Classification } from "../expenses/contracts";
import { canonical } from "../source/package";
import { reportProduct, productDependencySelector } from "./product-detail";
import type { MonthlyReport } from "./contracts";

const text = (value: unknown): Cell => value === null || value === undefined ? null : { type: String, value: String(value) };
const heading = (value: string): Cell => ({ type: String, value, fontWeight: "bold" });
const labels: Record<string, string> = {
  VOID: "İptal edilmiş belge", CONVERTED: "Dönüştürülmüş belge; iki kez sayılmaz", UNKNOWN_MEANING: "Satır anlamı veya birimi bilinmiyor", NO_LINES: "Belge satırları eksik", NOT_SALES: "Satış işlemi değil",
  complete: "Tam", partial: "Kısmi", unavailable: "Kullanılamıyor", estimated: "Tahmini", ready: "Hazır",
  sale: "Satış", "customer-return": "Müşteri iadesi", purchase: "Alış", "supplier-return": "Tedarikçi iadesi",
  piece: "Adet", kg: "Kilogram", invoice: "Fatura", dispatch: "İrsaliye", unknown: "Bilinmiyor", confirmed: "Kanıtla doğrulanmış",
  SYNTHETIC_ONLY: "Sentetik gösterim verisi — gerçek market verisi değildir", PARTIAL_COVERAGE: "Veri kapsamı eksik",
  MISSING_COST: "Maliyet kanıtı eksik; sıfır kabul edilmez", UNVALIDATED_COST: "Maliyet kanıtı doğrulanmamış", UNKNOWN_UNIT: "Birim bilinmiyor", UNKNOWN_TAX: "KDV işlemi veya kanıtı eksik", NEGATIVE_COST: "Negatif maliyet", UNDOCUMENTED_ZERO: "Sıfır maliyet belgelenmemiş", RETURN_ATTRIBUTION: "Müşteri iadesinin özgün maliyeti doğrulanamadı",
  INCOMPLETE_SALES: "Satış uzlaşması eksik", EXPENSES_INCOMPLETE: "Gider eksiksizliği onaylanmadı veya kayıtlar değişti", GROSS_INCOMPLETE: "Satış, maliyet veya dönem kanıtları eksik", LEGACY_EXPENSE: "Eski gider kaydının kanıtları eksik", UNCLASSIFIED: "Sınıflandırılmamış gider var", LOSS_REVIEW: "Stok kaybı kanıtı incelenmeli",
  NEGATIVE_STOCK: "Negatif stok kaydı", SPARSE_WASTE_RECORDING: "Fire kayıtları eksik; kayıt olmaması kayıp olmadığı anlamına gelmez", INVENTORY_UNAVAILABLE: "Desteklenen stok gözlemi yok", CONVERSION_CONFLICT: "İrsaliye / fatura bağlantısı çelişkili", AMBIGUOUS_REPLACEMENT_PRICE: "Aynı tarihte çelişen alış fiyatları", PURCHASE_RECONCILIATION: "Alış belgesi ve satırları uzlaşmıyor", UNSUPPORTED_PURCHASING_STATE: "Alış belgesi durumu desteklenmiyor", UNSUPPORTED_COST_MAPPING: "Maliyet eşlemesi desteklenmiyor", UNSUPPORTED_PURCHASING_MAPPING: "Alış eşlemesi desteklenmiyor", UNSUPPORTED_PURCHASE_BASIS: "Alış birimi veya tutarı doğrulanamadı", UNSUPPORTED_PURCHASING_EVIDENCE: "Alış veya tedarikçi kanıtı eksik",
};
const label = (value: string) => labels[value] ?? value;
function numeric(value: string | number | null): Cell[] {
  if (value === null) return [null, null, text("Kullanılamıyor / uygulanamaz")];
  const exact = String(value), number = Number(value);
  return Number.isFinite(number) && new Exact(exact).sd() <= 15 && new Exact(String(number)).eq(exact)
    ? [{ type: Number, value: number }, text(exact), null]
    : [text(exact), text(exact), text("Excel duyarlılığı aşılıyor; kesin değer metin olarak korundu")];
}
type Column<T> = { title: string; value: (row: T) => unknown; numeric?: boolean };
function table<T>(records: T[], columns: Column<T>[]): Row[] {
  return [columns.flatMap(column => column.numeric ? [heading(column.title), heading(`${column.title} — kesin değer`), heading("Duyarlılık açıklaması")] : [heading(column.title)]), ...records.map(record => columns.flatMap(column => {
    const value = column.value(record);
    return column.numeric ? numeric(value as string | number | null) : [text(typeof value === "boolean" ? value ? "Evet" : "Hayır" : value)];
  }))];
}
function technical(value: unknown, prefix = ""): Row[] {
  if (Array.isArray(value)) {
    const flatten = (item: unknown, path = "", target: Record<string, unknown> = {}): Record<string, unknown> => {
      if (item !== null && typeof item === "object" && !Array.isArray(item)) for (const [key, v] of Object.entries(item).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)) flatten(v, path ? `${path}.${key}` : key, target);
      else target[path] = Array.isArray(item) ? canonical(item) : item;
      return target;
    };
    const records = value.map(item => flatten(item)), keys = [...new Set(records.flatMap(row => Object.keys(row)))].sort();
    return [[text(prefix)], ...table(records, keys.map(key => ({ title: key, value: row => row[key] })))];
  }
  if (value !== null && typeof value === "object") return Object.entries(value).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).flatMap(([key, v]) => technical(v, prefix ? `${prefix}.${key}` : key));
  return [[text(prefix), text(value)]];
}
export async function excelReport(input: MonthlyReport): Promise<Buffer> {
  const r = structuredClone(input), s = r.sales, g = r.purchasing.gross, p = r.purchasing.purchasing, o = r.operating.result;
  const metadata: Row[] = [
    [text("Rapor sürümü"), text(r.id)], [text("Dönem"), text(r.context.period)], [text("Veri kesimi"), text(s.cutoff)],
    [text("Kaynak veri kümesi"), text(r.context.datasetId)], [text("Hesaplama sürümleri"), text(canonical(r.calculations))],
    [text("Rapor durumu"), text(r.review ? "İncelenmiş kayıt; tahminler güvenilir kâr değildir" : "Aday")],
    [text("Dönem kapsamı"), text(label(s.coverage))], [text("Para birimi"), text("TRY")],
    [text("Maliyet yöntemi"), text("Tarihsel son alış maliyeti tahmini; yalnız kapsanan satışlar")],
    [text("Satış kanıtı"), text(s.complete ? "Kaynakla uzlaşmış; gerçek dünyada eksiksizlik garantisi değildir" : "Eksik / uzlaşmamış")],
    [text("Kâr kanıtı"), text(o.status === "estimated" ? "Tahmini; doğrulanmış net kâr değildir" : o.headline)],
    ...[...new Set([...s.warnings, ...g.warnings, ...p.warnings, ...o.reasons])].map(warning => [text("Uyarı"), text(label(warning)), text(warning)]),
  ];
  const summary: Row[] = [[text("Gösterge"), text("Değer"), text("Kesin ondalık değer"), text("Duyarlılık açıklaması"), text("Kanıt / kapsam")]];
  const metric = (name: string, value: string | number | null, confidence: string) => summary.push([text(name), ...numeric(value), text(confidence)]);
  const sourceMetric = (name: string, value: string | number | null, confidence: string) => metric(name, s.coverage === "unavailable" ? null : value, confidence);
  const salesConfidence = s.complete ? "Kaynakla uzlaşmış" : "Eksik / uzlaşmamış";
  sourceMetric("Net satış", s.metrics.netSales, salesConfidence); sourceMetric("KDV", s.metrics.tax, salesConfidence); sourceMetric("Brüt satış tutarı", s.metrics.gross, salesConfidence);
  sourceMetric("Tamamlanan satış işlemi", s.metrics.saleDocumentCount, salesConfidence); sourceMetric("Sepet satış toplamı", s.metrics.basketNumerator, salesConfidence); sourceMetric("Ortalama sepet", s.metrics.averageBasket, salesConfidence);
  sourceMetric("Satılan miktar — adet", s.metrics.quantities.piece, salesConfidence); sourceMetric("Satılan miktar — kilogram", s.metrics.quantities.kg, salesConfidence);
  sourceMetric("Maliyet kapsamındaki satış", g.coveredSales, "Tahmini maliyeti desteklenen aynı satış nüfusu"); sourceMetric("Tahmini maliyet", g.covered.length ? g.coveredCost : null, "Tarihsel son alış maliyeti tahmini"); sourceMetric("Kapsanan tahmini brüt kâr", g.covered.length ? g.coveredGrossProfit : null, "Yalnız kapsanan satışlar"); sourceMetric("Kapsanan tahmini brüt marj (%)", g.coveredMarginPercent, "Pozitif kapsanan satış paydası"); sourceMetric("Maliyet kapsamı (%)", g.costCoveragePercent, "Mutlak satış ve iade tutarı üzerinden");
  for (const [key, title] of [["coveredSales", "Kapsanan satış tutarı"], ["coveredReturns", "Kapsanan müşteri iadeleri"], ["excludedSales", "Maliyeti dışlanan satış tutarı"], ["excludedReturns", "Maliyeti dışlanan müşteri iadeleri"]] as const) sourceMetric(title, g.exposures[key], "Maliyet kapsamı");
  metric("Faaliyet gideri", o.breakdownCoverage.operatingExpense === "available" ? o.breakdown.operatingExpense : null, "Uygun sınıflandırma ve KDV kanıtı"); metric("İşçilik", o.breakdownCoverage.labour === "available" ? o.breakdown.labour : null, "Toplu işçilik; kişi bilgisi yok"); metric("Ayrı stok kaybı", o.breakdownCoverage.separateLoss === "available" ? o.breakdown.separateLoss : null, "Maliyette sayılmamış kanıtlı kayıp"); metric("Hesaba alınan giderler", Object.values(o.breakdownCoverage).some(value => value === "available") ? o.expenses : null, "Eksiksizlik ayrıca incelenir"); metric("Ödemeler", o.payments, "Ödeme tarihli brüt hareket; faaliyet gideri değildir"); metric(o.headline, o.value, label(o.status));
  const breakdown = (records: typeof s.products) => table(records, [{ title: "Kimlik", value: row => row.id }, { title: "Ad", value: row => row.name }, { title: "Net satış", value: row => row.netSales, numeric: true }, { title: "Satış payı (%)", value: row => row.share, numeric: true }, { title: "Önceki aya göre değişim (%)", value: row => row.previousMonthChange, numeric: true }, { title: "Adet", value: row => row.quantities.piece, numeric: true }, { title: "Kilogram", value: row => row.quantities.kg, numeric: true }]);
  const sections: [string, Row[]][] = [
    ["Özet", summary],
    ["Karşılaştırmalar", table(Object.entries(s.comparisons).map(([kind, value]) => ({kind, ...value})), [{ title: "Karşılaştırma", value: row => row.kind === "month" ? "Önceki ay" : "Önceki yıl" }, { title: "Uygun kapsam", value: row => row.available }, { title: "Bu dönem başlangıç", value: row => row.currentFrom }, { title: "Bu dönem bitiş", value: row => row.currentTo }, { title: "Önceki başlangıç", value: row => row.from }, { title: "Önceki bitiş", value: row => row.to }, ...(["netSales", "netChange", "transactionChange", "basketChange"] as const).map((key, i) => ({ title: ["Önceki net satış", "Nominal satış değişimi (%)", "İşlem değişimi (%)", "Sepet değişimi (%)"][i], value: (row: typeof s.comparisons.month) => row[key], numeric: true })), { title: "Adet değişimi (%)", value: row => row.quantityChange.piece, numeric: true }, { title: "Kilogram değişimi (%)", value: row => row.quantityChange.kg, numeric: true }])],
    ["Kategoriler", breakdown(s.categories)], ["Ürünler", breakdown(s.products)],
    ["Günlük", table(s.daily, [{title: "Tarih", value: row => row.date}, {title: "Net satış", value: row => row.netSales, numeric: true}])],
    ["Satış işlemleri", table(s.transactions, [{ title: "Belge kimliği", value: row => row.documentId }, {title: "Tarih", value: row => row.date}, {title: "Tür", value: row => label(row.kind)}, {title: "Net satış", value: row => row.net, numeric: true}, {title: "KDV", value: row => row.tax, numeric: true}, {title: "Brüt tutar", value: row => row.gross, numeric: true}, {title: "Kaynakla uzlaşmış", value: row => row.reconciled}])],
    ["Satış satırları", table(r.salesEvidence.components, [{title: "Belge kimliği", value: row => row.documentId}, {title: "Satır kimliği", value: row => row.lineId}, {title: "Tarih", value: row => row.date}, {title: "Tür", value: row => label(row.kind)}, {title: "Ürün", value: row => row.productName}, {title: "Kategori", value: row => row.categoryName}, {title: "Birim", value: row => label(row.unit)}, {title: "Miktar", value: row => row.quantity, numeric: true}, {title: "Net satış", value: row => row.net, numeric: true}, {title: "KDV", value: row => row.tax, numeric: true}, {title: "Brüt tutar", value: row => row.gross, numeric: true}])],
    ["Maliyet", table([...g.covered, ...g.excluded], [{title: "Belge kimliği", value: row => row.documentId}, {title: "Satır kimliği", value: row => row.lineId}, {title: "Ürün", value: row => row.productName}, {title: "Birim", value: row => label(row.unit)}, {title: "Miktar", value: row => row.quantity, numeric: true}, {title: "Net satış", value: row => row.net, numeric: true}, {title: "Tahmini maliyet", value: row => row.cost, numeric: true}, {title: "Kapsam", value: row => row.reason ? label(row.reason) : "Kapsanan tahmin"}, {title: "Kanıt", value: row => row.evidence}])],
    ["Alışlar", table(p.history, [{title: "Belge kimliği", value: row => row.documentId}, {title: "Satır kimliği", value: row => row.lineId}, {title: "Tarih", value: row => row.date}, {title: "Ürün", value: row => row.productName}, {title: "Tedarikçi", value: row => row.supplierName}, {title: "Birim", value: row => label(row.unit)}, {title: "Miktar", value: row => row.quantity, numeric: true}, {title: "Net tutar", value: row => row.net, numeric: true}, {title: "Birim maliyet", value: row => row.unitCost, numeric: true}, {title: "Belge türü", value: row => label(row.representation)}, {title: "Kaynak belgeler", value: row => row.sourceDocumentIds.join(", ")}, {title: "Kanıt", value: row => row.evidence}])],
    ["Tedarikçi iadeleri", table(p.supplierReturns, [{title: "Belge kimliği", value: row => row.documentId}, {title: "Satır kimliği", value: row => row.lineId}, {title: "Tedarikçi", value: row => row.supplierName}, {title: "Ürün", value: row => row.productName}, {title: "Tarih", value: row => row.date}, {title: "Birim", value: row => label(row.unit)}, {title: "Miktar", value: row => row.quantity, numeric: true}, {title: "Net tutar", value: row => row.net, numeric: true}, {title: "Fiziksel iade", value: row => row.physicalReturn}, {title: "Talep edilen geri kazanım", value: row => row.requestedRecovery, numeric: true}, {title: "Tanınan tedarikçi alacağı", value: row => row.recognizedCredit, numeric: true}, {title: "Değişim durumu", value: row => label(row.replacementSettlement)}, {title: "Mutabakat kanıtları", value: row => row.settlementEvidenceReferences.join(", ")}, {title: "Kaynak belgeler", value: row => row.sourceDocumentIds.join(", ")}])],
    ["Yenileme maliyeti", table(p.replacements, [{title: "Ürün", value: row => row.productName}, {title: "Birim", value: row => label(row.unit)}, {title: "Tarih", value: row => row.date}, {title: "Miktar", value: row => row.quantity, numeric: true}, {title: "Tarihsel birim maliyet", value: row => row.historicalUnitCost, numeric: true}, {title: "Son alış birim maliyeti", value: row => row.latestUnitCost, numeric: true}, {title: "Nominal birim değişimi (%)", value: row => row.nominalChangePercent, numeric: true}, {title: "Tarihsel maliyet", value: row => row.historicalCost, numeric: true}, {title: "Yenileme maliyeti", value: row => row.replacementCost, numeric: true}, {title: "Kaynak belgeler", value: row => row.sourceDocumentIds.join(", ")}])],
    ["Stok", table(p.inventory, [{title: "Satır kimliği", value: row => row.lineId}, {title: "Ürün", value: row => row.productName}, {title: "Tarih", value: row => row.date}, {title: "Birim", value: row => label(row.unit)}, {title: "Stok", value: row => row.stock, numeric: true}, {title: "Kaydedilmiş fire", value: row => row.recordedWaste, numeric: true}, {title: "Eksiksiz kanıt", value: row => row.complete}, {title: "Kanıt", value: row => row.evidence}])],
    ["Giderler", table(r.operating.expenseRecords, [{title: "Kayıt kimliği", value: row => row.entityId}, {title: "Revizyon", value: row => row.revision}, {title: "Gider tarihi", value: row => row.value.date}, {title: "Ödeme tarihi", value: row => "paymentDate" in row.value ? row.value.paymentDate : null}, {title: "Kategori", value: row => "category" in row.value ? row.value.category : null}, {title: "Sınıf", value: row => "classification" in row.value ? classificationLabels[row.value.classification as Classification] : "Eski kayıt"}, {title: "Net tutar", value: row => row.value.net, numeric: true}, {title: "KDV", value: row => "tax" in row.value ? row.value.tax : null, numeric: true}, {title: "Brüt tutar", value: row => "gross" in row.value ? row.value.gross : null, numeric: true}, {title: "İptal", value: row => "voided" in row.value ? row.value.voided : false}, {title: "Açıklama", value: row => row.value.reason}, {title: "Kanıt", value: row => row.value.evidence}])],
    ["Dışlananlar", [...table(s.exclusions, [{title: "Belge kimliği", value: row => row.documentId}, {title: "Neden", value: row => label(row.reason)}]), ...table(p.exclusions, [{title: "Belge kimliği", value: row => row.documentId}, {title: "Neden", value: row => label(row.reason)}]), ...table(o.excluded, [{title: "Gider kimliği", value: row => row.entityId}, {title: "Sınıf", value: row => classificationLabels[row.classification as Classification] ?? row.classification}, {title: "Ayrı tutar", value: row => row.amount, numeric: true}])]],
    ["Kaynak kanıtları", technical({documents: r.salesEvidence.documents, lines: r.salesEvidence.lines})],
    ["Gider kanıtları", technical(r.appEvidence)],
    ["Kanıt ve sürüm", technical({context: r.context, rules: r.rules, calculations: r.calculations, review: r.review, filters: s.filters, importedAt: s.importedAt, extractedAt: s.extractedAt, from: s.from, to: s.to, mappingVersion: s.mappingVersion, lineage: r.purchasing.lineage, extractionId: r.purchasing.extractionId})],
  ];
  if (r.format === "monthly-report-v2") {
    const profit = r.productProfit;
    sections.push(
      ["Ürün kârlılığı özeti", technical(profit.summary)],
      ["Ürün kârlılığı", table(profit.products, [{title:"Ürün kimliği",value:row=>row.productId},{title:"Ürün",value:row=>row.displayName},{title:"Ad durumu",value:row=>row.displayStatus},{title:"Net satış",value:row=>row.netSales,numeric:true},{title:"Kapsanan satış",value:row=>row.coveredSales,numeric:true},{title:"Kapsanan maliyet",value:row=>row.coveredCost,numeric:true},{title:"Kapsanan tahmini kâr",value:row=>row.coveredGrossProfit,numeric:true},{title:"Marj (%)",value:row=>row.coveredMarginPercent,numeric:true},{title:"Maliyet kapsamı (%)",value:row=>row.costCoveragePercent,numeric:true},{title:"Kapsanan satır",value:row=>row.coveredCount},{title:"Dışlanan satır",value:row=>row.excludedCount},{title:"Miktarlar",value:row=>canonical(row.quantities)},{title:"Dışlama nedenleri",value:row=>row.exclusionReasons.join(", ")}])],
      ["Günlük ürün kârlılığı", table(profit.daily, [{title:"Tarih",value:row=>row.date},{title:"Durum",value:row=>row.status},{title:"Kaynak kapsamı",value:row=>row.sourceCoverage},{title:"Net satış",value:row=>row.netSales,numeric:true},{title:"Kapsanan satış",value:row=>row.coveredSales,numeric:true},{title:"Kapsanan maliyet",value:row=>row.coveredCost,numeric:true},{title:"Kapsanan tahmini kâr",value:row=>row.coveredGrossProfit,numeric:true},{title:"Trend",value:row=>row.trend,numeric:true},{title:"Miktarlar",value:row=>canonical(row.quantities)}])],
      ["Ürün kâr kanıtları", table(profit.lines, [{title:"Belge kimliği",value:row=>row.documentId},{title:"Satır kimliği",value:row=>row.lineId},{title:"Ürün kimliği",value:row=>row.productId},{title:"Tarih",value:row=>row.date},{title:"Tür",value:row=>label(row.kind)},{title:"Birim",value:row=>label(row.unit)},{title:"Miktar",value:row=>row.quantity,numeric:true},{title:"Kaydedilen miktar",value:row=>row.recorded.quantity,numeric:true},{title:"Net satış",value:row=>row.net,numeric:true},{title:"Kaydedilen net",value:row=>row.recorded.net,numeric:true},{title:"Tarihsel birim maliyet",value:row=>row.historicalUnitCost,numeric:true},{title:"Kapsanan maliyet",value:row=>row.cost,numeric:true},{title:"Özgün satış satırı",value:row=>row.originalSaleLineId},{title:"Maliyet nedeni",value:row=>row.costReason ? label(row.costReason) : null},{title:"Kanıt",value:row=>row.costEvidence}])],
      ["Ürün kaynak dışlamaları", table(profit.sourceExclusions, [{title:"Belge kimliği",value:row=>row.documentId},{title:"Tarih",value:row=>row.date},{title:"Neden",value:row=>label(row.reason)},{title:"Maruz kalma",value:row=>row.exposure,numeric:true}])],
    );
  }
  const sheets = sections.map(([sheet, data]) => ({ sheet, data: [...metadata, ...data], columns: Array.from({ length: data.reduce((maximum, row) => Math.max(maximum, row.length), 5) }, (_, index) => ({ width: index === 0 ? 42 : index % 3 === 0 ? 36 : 24 })) }));
  return writeWorkbook(sheets);
}

async function writeWorkbook(sheets: { sheet: string; data: Row[]; columns?: { width: number }[] }[]): Promise<Buffer> {
  for (const sheet of sheets) {
    if (sheet.data.length > 1_048_576) throw new Error("EXCEL_ROW_LIMIT");
    for (const row of sheet.data) {
      if (row.length > 16_384) throw new Error("EXCEL_COLUMN_LIMIT");
      for (const cell of row) if (cell && typeof cell === "object" && "value" in cell && typeof cell.value === "string" && cell.value.length > 32_767) throw new Error("EXCEL_CELL_LIMIT");
    }
  }
  return writeXlsxFile(sheets).toBuffer();
}

export async function excelProductReport(report: MonthlyReport, productId: string): Promise<Buffer> {
  const detail = reportProduct(report, productId);
  if (detail.status === "unavailable") throw new Error(detail.code);
  if (report.format !== "monthly-report-v2") throw new Error("PRODUCT_PROFIT_UNAVAILABLE");
  const lines = report.productProfit.lines.filter(row => row.productId === productId);
  const documentIds = new Set(lines.map(row => row.documentId)), permittedDocuments = new Set<string>();
  const selectDependency = productDependencySelector(report, productId);
  const dependencies = lines.filter(row => row.kind === "customer-return").map(row => {
    const result = selectDependency(row.lineId, 0);
    if (result.status === "product-dependency") {
      permittedDocuments.add(result.document.id);
      return { returnLineId: row.lineId, originalLineId: result.originalLineId, documentId: result.document.id, status: "available", reason: null };
    }
    return { returnLineId: row.lineId, originalLineId: row.originalSaleLineId, documentId: null, status: "unavailable", reason: result.message };
  });
  const metadata: Row[] = [
    [text("Kapsam"), text("Seçili ürün; özgün belgeler yalnız kanıttır, dönem toplamına eklenmez")],
    [text("Rapor sürümü"), text(detail.reportId)], [text("Ürün kimliği"), text(productId)], [text("Ürün"), text(detail.summary.displayName)],
    [text("Kaynak kökeni"), text(detail.lineage)], [text("Dönem"), text(detail.period)], [text("Veri kesimi"), text(detail.cutoff)],
    [text("Kaynak veri kümesi"), text(report.context.datasetId)], [text("Uygulama revizyonu"), text(report.context.appRevision)],
    [text("Hesaplama sürümleri"), text(canonical(detail.calculations))], [text("Yöntem kuralları"), text(canonical(detail.rules))], [text("Para birimi"), text("TRY")],
    [text("Maliyet yöntemi"), text("Tarihsel son alış maliyeti tahmini; yalnız kapsanan satışlar; giderlerden önce")],
    [text("Kaynak kapsamı"), text(detail.sourceCoverage.complete ? "Tam" : "Kısmi; ürüne atanmamış tutar bilinmiyor")],
    [text("Çözümlenmemiş kaynak sayısı"), text(detail.sourceCoverage.unresolvedCount)], [text("Bilinmeyen kaynak tutarı"), text(detail.sourceCoverage.exposure)],
    ...[...new Set(detail.warnings)].map(warning => [text("Uyarı"), text(label(warning)), text(warning)]),
  ];
  const metrics = [
    ["Net satış", "netSales"], ["Maliyet kapsamındaki satış", "coveredSales"], ["Kapsanan maliyet", "coveredCost"],
    ["Kapsanan tahmini brüt kâr", "coveredGrossProfit"], ["Kapsanan tahmini brüt marj (%)", "coveredMarginPercent"], ["Maliyet kapsamı (%)", "costCoveragePercent"],
  ] as const;
  const summary: Row[] = [[heading("Gösterge"), heading("Değer"), heading("Kesin ondalık değer"), heading("Duyarlılık açıklaması")],
    ...metrics.map(([title, key]) => [text(title), ...numeric(detail.summary[key])]),
    [text("Kapsanan satır sayısı"), text(detail.summary.coveredCount)], [text("Maliyeti dışlanan satır sayısı"), text(detail.summary.excludedCount)],
    ...(["coveredSales", "coveredReturns", "excludedSales", "excludedReturns"] as const).map(key => [text(({ coveredSales: "Kapsanan satış tutarı", coveredReturns: "Kapsanan iade tutarı", excludedSales: "Dışlanan satış tutarı", excludedReturns: "Dışlanan iade tutarı" } as Record<string, string>)[key]), ...numeric(detail.summary.exposures[key])]),
    ...detail.summary.quantities.flatMap(row => [[text(`Satılan miktar (${label(row.unit)})`), ...numeric(row.sold)], [text(`İade miktarı (${label(row.unit)})`), ...numeric(row.returned)], [text(`Net miktar (${label(row.unit)})`), ...numeric(row.net)]]),
    ...detail.summary.exclusionReasons.map(reason => [text("Maliyet dışlama nedeni"), text(label(reason)), text(reason)]),
  ];
  const daily = table(detail.daily, [{ title: "Tarih", value: row => row.date }, { title: "Durum", value: row => label(row.status) }, { title: "Kaynak kapsamı", value: row => label(row.sourceCoverage) },
    ...metrics.map(([title, key]) => ({ title, value: (row: typeof detail.daily[number]) => row[key], numeric: true })),
    { title: "Kapsanan satır", value: row => row.coveredCount }, { title: "Dışlanan satır", value: row => row.excludedCount },
    { title: "Miktarlar (ayrı birimler)", value: row => canonical(row.quantities) }, { title: "Satış ve iade kapsamı", value: row => canonical(row.exposures) }, { title: "Nedenler", value: row => row.exclusionReasons.map(label).join("; ") }]);
  const sections: [string, Row[]][] = [
    ["Ürün özeti", summary], ["Ürün günlük", daily], ["Ürün satırları", technical(lines)],
    ["Ürün belgeleri", technical(report.salesEvidence.documents.filter(row => documentIds.has(row.id)))],
    ["Özgün bağlantılar", table(dependencies, [{ title: "İade satırı", value: row => row.returnLineId }, { title: "Özgün satış satırı", value: row => row.originalLineId }, { title: "Özgün belge", value: row => row.documentId }, { title: "Durum", value: row => row.status === "available" ? "Kayıtlı kanıt" : "Kullanılamıyor" }, { title: "Neden", value: row => row.reason }])],
    ["Özgün belgeler", technical(report.purchasing.evidence.documents.filter(row => permittedDocuments.has(row.id)))],
    ["Özgün satırlar", technical(report.purchasing.evidence.lines.filter(row => permittedDocuments.has(row.documentId)))],
    ["Kaynak belirsizliği", technical({ attribution: "Ürüne atanmamış kaynak dışlamaları; tutar bilinmiyor", sourceCoverage: detail.sourceCoverage, exclusions: report.productProfit.sourceExclusions })],
  ];
  return writeWorkbook(sections.map(([sheet, data]) => ({ sheet, data: [...metadata, ...data] })));
}

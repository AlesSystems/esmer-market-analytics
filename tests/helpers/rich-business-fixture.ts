import { BUSINESS_MAPPING_VERSION, writePackage, type DocumentRecord, type LineRecord, type Metadata, type Records, type HistoricalCost } from "../../src/source/package";
import { Exact, rounded, sum } from "../../src/domain/money";
import { Expenses } from "../../src/expenses/import";
import type { ExpenseFields } from "../../src/expenses/contracts";
import type { openStore } from "../../src/store/store";

// Deterministic, purely synthetic grocery month for judging the redesigned financial charts.
// September 2025 is the reviewed month; August 2025 (lighter volume) only feeds previous-month comparisons.
type Unit = "piece" | "kg";
type Product = { id: string; name: string; category: string; unit: Unit; price: number; margin: number; weight: number };
const categories: Record<string, string> = { staples: "Temel Gıda", dairy: "Süt ve Kahvaltılık", bakery: "Fırın", drinks: "İçecekler", produce: "Meyve ve Sebze", cleaning: "Temizlik", snacks: "Atıştırmalık" };
const catalog: Omit<Product, "id">[] = [
  { name: "Çay 500 g", category: "staples", unit: "piece", price: 145, margin: 0.18, weight: 6 }, { name: "Makarna 500 g", category: "staples", unit: "piece", price: 28, margin: 0.2, weight: 7 },
  { name: "Pirinç 1 kg", category: "staples", unit: "piece", price: 62, margin: 0.17, weight: 5 }, { name: "Un 2 kg", category: "staples", unit: "piece", price: 58, margin: 0.15, weight: 4 },
  { name: "Şeker 1 kg", category: "staples", unit: "piece", price: 48, margin: 0.14, weight: 5 }, { name: "Ayçiçek yağı 1 L", category: "staples", unit: "piece", price: 105, margin: 0.12, weight: 5 },
  { name: "Tuz 750 g", category: "staples", unit: "piece", price: 12, margin: 0.28, weight: 3 }, { name: "Mercimek 1 kg", category: "staples", unit: "piece", price: 54, margin: 0.18, weight: 3 },
  { name: "Süt 1 L", category: "dairy", unit: "piece", price: 45, margin: 0.13, weight: 12 }, { name: "Yoğurt 1 kg", category: "dairy", unit: "piece", price: 68, margin: 0.17, weight: 6 },
  { name: "Beyaz peynir 500 g", category: "dairy", unit: "piece", price: 160, margin: 0.2, weight: 5 }, { name: "Yumurta 10'lu", category: "dairy", unit: "piece", price: 72, margin: 0.14, weight: 8 },
  { name: "Tereyağı 250 g", category: "dairy", unit: "piece", price: 135, margin: 0.16, weight: 3 }, { name: "Zeytin 400 g", category: "dairy", unit: "piece", price: 88, margin: 0.24, weight: 3 },
  { name: "Ekmek", category: "bakery", unit: "piece", price: 15, margin: 0.3, weight: 20 }, { name: "Simit", category: "bakery", unit: "piece", price: 12, margin: 0.38, weight: 7 }, { name: "Poğaça", category: "bakery", unit: "piece", price: 20, margin: 0.4, weight: 4 },
  { name: "İçme suyu 1,5 L", category: "drinks", unit: "piece", price: 14, margin: 0.25, weight: 11 }, { name: "Gazoz 1 L", category: "drinks", unit: "piece", price: 32, margin: 0.22, weight: 6 },
  { name: "Meyve suyu 1 L", category: "drinks", unit: "piece", price: 52, margin: 0.2, weight: 4 }, { name: "Soda 200 ml", category: "drinks", unit: "piece", price: 10, margin: 0.3, weight: 5 },
  { name: "Domates", category: "produce", unit: "kg", price: 38, margin: 0.28, weight: 9 }, { name: "Salatalık", category: "produce", unit: "kg", price: 34, margin: 0.28, weight: 6 },
  { name: "Elma", category: "produce", unit: "kg", price: 46, margin: 0.26, weight: 6 }, { name: "Muz", category: "produce", unit: "kg", price: 78, margin: 0.2, weight: 5 },
  { name: "Patates", category: "produce", unit: "kg", price: 30, margin: 0.25, weight: 7 }, { name: "Soğan", category: "produce", unit: "kg", price: 26, margin: 0.25, weight: 6 },
  { name: "Çamaşır deterjanı 3 kg", category: "cleaning", unit: "piece", price: 245, margin: 0.17, weight: 2 }, { name: "Bulaşık deterjanı 750 ml", category: "cleaning", unit: "piece", price: 82, margin: 0.2, weight: 3 },
  { name: "Tuvalet kâğıdı 12'li", category: "cleaning", unit: "piece", price: 138, margin: 0.18, weight: 3 },
  { name: "Bisküvi 200 g", category: "snacks", unit: "piece", price: 26, margin: 0.28, weight: 5 }, { name: "Çikolata 80 g", category: "snacks", unit: "piece", price: 34, margin: 0.3, weight: 4 }, { name: "Cips 150 g", category: "snacks", unit: "piece", price: 48, margin: 0.27, weight: 4 },
];
const products: Product[] = catalog.map((row, index) => ({ ...row, id: `urun-${String(index + 1).padStart(3, "0")}` }));
const suppliers = [{ id: "toptanci-a", name: "Toptancı A" }, { id: "toptanci-b", name: "Toptancı B" }, { id: "toptanci-c", name: "Toptancı C" }];
const money = (value: number) => value.toFixed(2);
const days = (from: string, to: string) => { const out: string[] = []; for (const day = new Date(`${from}T00:00:00Z`); day.toISOString().slice(0, 10) <= to; day.setUTCDate(day.getUTCDate() + 1)) out.push(day.toISOString().slice(0, 10)); return out; };

type Returnable = { line: LineRecord; date: string; unitNet: string; discount: string; unit: Unit; unitCost: string; remaining: number };
type Priced = { unitNet: string; unitCost: string };

function lineValues(quantity: string, unitNet: string, discount: string, sign: 1 | -1) {
  const net = new Exact(quantity).times(unitNet).times(new Exact(100).minus(discount)).div(100).times(sign).toFixed();
  const tax = rounded(new Exact(net).times(5).div(100).toFixed());
  return { net, tax, gross: new Exact(net).plus(tax).toFixed() };
}
function cost(unitCost: string | null, unit: Unit, evidence: string, originalSaleLineId: string | null, bare = false): HistoricalCost | null {
  if (unitCost === null) return bare ? null : { unitCost: null, unit, taxBasis: "net", evidence: null, documentedZero: false, originalSaleLineId };
  return { unitCost, unit, taxBasis: "net", evidence, documentedZero: false, originalSaleLineId };
}

export function richBusinessRecords(): Records {
  let seed = 20250901;
  const next = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  const documents: DocumentRecord[] = [], lines: LineRecord[] = [];
  const total = products.reduce((value, product) => value + product.weight, 0);
  const pick = () => { let target = next() * total; for (const product of products) { target -= product.weight; if (target <= 0) return product; } return products[0]; };
  const pricing = new Map<string, Priced>();
  const priced = (product: Product, date: string): Priced => {
    const index = products.indexOf(product), period = date.slice(0, 7), stepped = date.slice(8) > "15" && index % 3 === 0, key = `${product.id}:${period}:${stepped}`;
    if (!pricing.has(key)) {
      const unitNet = money(product.price * (period === "2025-09" ? 1 + (index % 4) * 0.012 : 1));
      pricing.set(key, { unitNet, unitCost: money(Number(unitNet) * (1 - product.margin) * (stepped ? 1.03 : 1)) });
    }
    return pricing.get(key)!;
  };
  const pool: Returnable[] = [];
  const sale = (id: string, date: string, product: Product, quantity: number, discount: string, voided: boolean) => {
    const { unitNet, unitCost } = priced(product, date), qty = String(quantity), value = lineValues(qty, unitNet, discount, 1), missing = next() < 0.06, bare = next() < 0.5;
    const line: LineRecord = { id, documentId: "", quantity: qty, net: value.net, cost: null, sales: { productId: product.id, productName: product.name, categoryId: product.category, categoryName: categories[product.category], unit: product.unit, unitNet, discountRate: discount, taxRate: "5", tax: value.tax, gross: value.gross, meaning: "known" }, business: { historicalCost: cost(missing ? null : unitCost, product.unit, `hist-${id}`, null, bare), inventory: null } };
    if (!missing && !voided) pool.push({ line, date, unitNet, discount, unit: product.unit, unitCost, remaining: quantity });
    return line;
  };
  const document = (id: string, kind: DocumentRecord["kind"], date: string, state: "completed" | "void", own: LineRecord[]) => {
    own.forEach(line => { line.documentId = id; });
    documents.push({ id, kind, date, supplierId: null, sales: { state, convertedTo: null, net: sum(own.map(line => line.net)), tax: sum(own.map(line => line.sales!.tax)), gross: sum(own.map(line => line.sales!.gross)) }, purchasing: null });
    lines.push(...own);
  };
  for (const [from, to, volume] of [["2025-08-01", "2025-08-31", 0.88], ["2025-09-01", "2025-09-30", 1]] as const) for (const date of days(from, to)) {
    const weekday = new Date(`${date}T00:00:00Z`).getUTCDay(), weekend = weekday === 0 || weekday === 6;
    const count = Math.round((weekend ? 42 + next() * 18 : 22 + next() * 18) * volume), compact = date.replaceAll("-", "");
    const earliest = new Date(`${date}T00:00:00Z`); earliest.setUTCDate(earliest.getUTCDate() - 7);
    const floor = earliest.toISOString().slice(0, 10);
    for (let n = 1; n <= count; n++) {
      const number = String(n).padStart(3, "0"), eligible = pool.filter(row => row.date >= floor && row.remaining > 0);
      if (next() < 0.03 && eligible.length) {
        const original = eligible[Math.floor(next() * eligible.length)], quantity = original.unit === "kg" ? 0.5 : Math.min(original.remaining, 1 + Math.floor(next() * 2));
        original.remaining -= quantity;
        const id = `R-${compact}-${number}`, qty = String(quantity), value = lineValues(qty, original.unitNet, original.discount, -1);
        document(id, "customer-return", date, "completed", [{ id: `${id}-1`, documentId: "", quantity: qty, net: value.net, cost: null, sales: { ...original.line.sales!, tax: value.tax, gross: value.gross }, business: { historicalCost: cost(original.unitCost, original.unit, `hist-${id}-1`, original.line.id), inventory: null } }]);
        continue;
      }
      const id = `S-${compact}-${number}`, voided = next() < 0.01, own: LineRecord[] = [], used = new Set<string>(), lineCount = 1 + Math.floor(next() ** 1.4 * 7);
      for (let item = 1; item <= lineCount; item++) {
        let product = pick(); for (let retry = 0; used.has(product.id) && retry < 6; retry++) product = pick();
        if (used.has(product.id)) continue;
        used.add(product.id);
        const quantity = product.unit === "kg" ? 0.5 * (1 + Math.floor(next() * 5)) : 1 + Math.floor(next() ** 2 * (product.weight > 8 ? 5 : 3));
        own.push(sale(`L-${compact}-${number}-${item}`, date, product, quantity, next() < 0.08 ? "10" : "0", voided));
      }
      document(id, "sale", date, voided ? "void" : "completed", own);
    }
  }
  // Purchase invoices from generic wholesalers; one dispatch converted to its invoice.
  const purchaseDates = [["2025-08-05", 0], ["2025-08-12", 1], ["2025-08-19", 2], ["2025-08-26", 0], ["2025-09-02", 1], ["2025-09-05", 0], ["2025-09-09", 2], ["2025-09-12", 1], ["2025-09-16", 0], ["2025-09-19", 2], ["2025-09-23", 1], ["2025-09-26", 0], ["2025-09-29", 2]] as const;
  purchaseDates.forEach(([date, supplier], index) => {
    const id = `P-${date.replaceAll("-", "")}`, count = 6 + Math.floor(next() * 5), chosen = new Set<Product>();
    while (chosen.size < count) chosen.add(pick());
    const own = [...chosen].map((product, item): LineRecord => {
      const unitNet = money(Number(priced(product, date).unitCost) * (1 + 0.02 + (index % 3) * 0.015)), quantity = String(product.unit === "kg" ? 20 + Math.floor(next() * 9) * 10 : 12 * (1 + Math.floor(next() * 8))), value = lineValues(quantity, unitNet, "0", 1);
      return { id: `${id}-${item + 1}`, documentId: id, quantity, net: value.net, cost: null, sales: { productId: product.id, productName: product.name, categoryId: product.category, categoryName: categories[product.category], unit: product.unit, unitNet, discountRate: "0", taxRate: "5", tax: value.tax, gross: value.gross, meaning: "known" }, business: { historicalCost: null, inventory: null } };
    });
    const evidence = (key: string) => ({ representation: "invoice" as const, convertedTo: null, invoiced: false, evidence: key, physicalReturn: false, requestedRecovery: null, recognizedCredit: null, replacementSettlement: "unknown" as const, settlementEvidence: null });
    const totals = { state: "completed" as const, convertedTo: null, net: sum(own.map(line => line.net)), tax: sum(own.map(line => line.sales!.tax)), gross: sum(own.map(line => line.sales!.gross)) };
    documents.push({ id, kind: "purchase", date, supplierId: suppliers[supplier].id, sales: totals, purchasing: evidence(`evidence-${id}`) });
    lines.push(...own);
    if (date === "2025-09-12") {
      const dispatch = `D-${date.replaceAll("-", "")}`;
      documents.push({ id: dispatch, kind: "purchase", date, supplierId: suppliers[supplier].id, sales: { ...totals }, purchasing: { ...evidence(`evidence-${dispatch}`), representation: "dispatch", convertedTo: id, invoiced: true } });
      lines.push(...own.map(line => ({ ...structuredClone(line), id: line.id.replace("P-", "D-"), documentId: dispatch })));
    }
  });
  return { documents, lines, suppliers: suppliers.map(row => ({ ...row })) };
}

export function richBusinessPackage(records: Records = richBusinessRecords(), metadata: Partial<Metadata> = {}) {
  return writePackage([{ stream: "documents", records: records.documents }, { stream: "lines", records: records.lines }, { stream: "suppliers", records: records.suppliers }], { lineage: "rich-business-fixture", extractionId: "rich-business-1", extractedAt: "2025-10-01T00:00:00.000Z", cutoff: "2025-09-30", coverage: { from: "2025-08-01", to: "2025-09-30", complete: true }, ...metadata }, BUSINESS_MAPPING_VERSION);
}

// App-recorded September 2025 expenses. Completeness is intentionally never confirmed, so operating profit stays unavailable.
const turkish = (value: string) => { const [whole, cents] = value.split("."); return `${whole.replace(/\B(?=(\d{3})+$)/g, ".")},${cents}`; };
const expense = (date: string, category: string, net: string, tax = "0.00", extra: Partial<ExpenseFields> = {}): ExpenseFields => ({ date, paymentDate: date, category, classification: "operating-expense", net: turkish(net), tax: turkish(tax), gross: turkish(new Exact(net).plus(tax).toFixed(2)), taxTreatment: "unknown", taxEvidence: null, supportingReference: null, sourceReference: null, labourPeriod: null, loss: null, ...extra });
export function seedRichExpenses(store: ReturnType<typeof openStore>) {
  const service = new Expenses(store);
  const rows = [
    expense("2025-09-01", "Kira", "28000.00"), expense("2025-09-10", "Elektrik", "6420.50"), expense("2025-09-12", "Su", "640.00"),
    expense("2025-09-08", "Nakliye", "3150.00", "157.50", { taxTreatment: "recoverable", taxEvidence: "rich-tax-evidence-1" }),
    expense("2025-09-17", "Bakım ve onarım", "2200.00", "110.00", { taxTreatment: "non-recoverable", taxEvidence: "rich-tax-evidence-2" }),
    expense("2025-09-22", "Reklam ve tanıtım", "1500.00"), expense("2025-09-25", "Belediye harcı", "1200.00", "0.00", { classification: "taxes" }),
    expense("2025-09-30", "İşçilik (aylık toplam)", "41500.00", "0.00", { classification: "labour", labourPeriod: "2025-09" }),
  ];
  rows.forEach((fields, index) => { const result = service.create({ action: "save", requestId: `rich-expense-${index + 1}`, fields, duplicateReview: null }); if (result.status !== "saved") throw new Error(`RICH_EXPENSE_NOT_SAVED:${index + 1}:${result.status}`); });
}

import { createHash, randomUUID } from "node:crypto";
import type { openStore } from "../store/store";
import { canonical } from "../source/package";
import { calculateEstimateExpenseComponents } from "../analytics/operating";
import { Exact, sum } from "../domain/money";
import { requireValid } from "../store/revisions";
import { classificationLabels, classifications, type CreateExpenseRequest, type CreateExpenseResult, type ExpenseFields, type ManualCandidate, type ExpensePreview, type ExpensePreviewRow, type ExpenseValue, type ConfirmExpensesRequest, type ExpensePeriod, type QueryExpensesRequest } from "./contracts";
import { readExpenseWorkbook, decimalCell, dateCell, type Cell } from "./workbook";
import { isExpense, isManualBill, expensePeriod, validExpense, fieldKeys, validFields, validDate, validCreateExpenseRequest, validPeriod } from "./validation";
import { manualBillNumbers, relevantExpenseRevision } from "./adjustments";
import { groupExpenses } from "./groups";
const hash = (s: string | Uint8Array) => createHash("sha256").update(s).digest("hex");
const nullable = (cells: Cell[], index: number) => cells[index]?.value || null;
function value(c: Cell[], batchId: string, row: number): ExpenseValue {
  const read = <T>(label: string, work: () => T): T => { try { return work(); } catch { throw new Error(`${label}: biçim veya değer geçersiz.`); } };
  const date = read("Gider tarihi", () => dateCell(c[1]));
  const paymentDate = nullable(c, 2) ? read("Ödeme tarihi", () => dateCell(c[2])) : null;
  const net = read("Net tutar", () => decimalCell(c[5])), tax = read("KDV tutarı", () => decimalCell(c[6])), gross = read("Brüt tutar", () => decimalCell(c[7]));
  if (!new Exact(net).plus(tax).eq(gross)) throw new Error("Brüt tutar: net tutar ile KDV toplamına eşit olmalı.");
  if (!c[3]?.value) throw new Error("Kategori: zorunlu alan boş.");
  const classificationText = c[4]?.value;
  const classification = Object.entries(classificationLabels).find(([, label]) => label === classificationText)?.[0] ?? classificationText;
  if (!classifications.includes(classification as never)) throw new Error("Sınıflandırma: şablondaki sınıflardan birini seçin.");
  const taxText = c[8]?.value, taxTreatment = ({ "İndirilebilir": "recoverable", "İndirilemez": "non-recoverable", "Bilinmiyor": "unknown" } as Record<string, string>)[taxText] ?? taxText;
  if (!["recoverable", "non-recoverable", "unknown"].includes(taxTreatment)) throw new Error("KDV işlemi: İndirilebilir, İndirilemez veya Bilinmiyor kullanın.");
  if (taxTreatment !== "unknown" && !nullable(c, 9)) throw new Error("KDV kanıtı: bilinen işlem için kanıt referansı zorunlu.");
  if (classification === "labour" && nullable(c, 11) !== date.slice(0, 7)) throw new Error("İşçilik dönemi: gider ayıyla aynı YYYY-AA dönemi zorunlu.");
  if (classification !== "labour" && nullable(c, 11)) throw new Error("İşçilik dönemi: yalnızca aylık toplam işçilik satırında kullanılabilir.");
  if (classification === "inventory-loss" && (!nullable(c, 12) || !nullable(c, 13))) throw new Error("Kayıp kanıtı ve kayıp işlemi: stok kaybında zorunlu.");
  const lossText = nullable(c, 13), recognition = lossText === "Ayrı gider" ? "separate" : lossText === "Maliyete dahil" ? "already-in-cost" : lossText;
  const v = { format: "expense-v1", date, paymentDate, category: c[3]?.value, classification, net, tax, gross, taxTreatment, taxEvidence: nullable(c, 9), supportingReference: nullable(c, 10), sourceReference: nullable(c, 0), labourPeriod: nullable(c, 11), loss: nullable(c, 12) || recognition ? { evidence: nullable(c, 12), recognition } : null, origin: { batchId, row }, reason: "Excel içe aktarımı", evidence: batchId, replacesRevision: null, voided: false };
  if (!validExpense(v)) throw new Error("Kanıt / referans alanları: kısa, kişisel veri içermeyen kimlik kullanın; kategori en çok 80 karakter olmalı ve kayıp işlemi sınıfla eşleşmeli."); return v;
}
const amountKeys = ["net", "tax", "gross"] as const;
const detailKeys = fieldKeys.filter(key => !amountKeys.some(amount => key === amount));
const comparableDetails = (value: ExpenseValue) => canonical(Object.fromEntries(detailKeys.map(key => [key, value[key as keyof ExpenseValue]])));
const same = (a: ExpenseValue, b: ExpenseValue) =>
  amountKeys.every(key => new Exact(a[key]).eq(b[key])) && comparableDetails(a) === comparableDetails(b);

export class Expenses {
  private pending: ExpensePreview | null = null;
  constructor(private readonly store: ReturnType<typeof openStore>) {}
  create(request: CreateExpenseRequest): CreateExpenseResult {
    requireValid(validCreateExpenseRequest(request));
    if (request.action === "resolve") return this.store.resolveExpenseCommand(request.requestId);
    if (request.action === "save-bill" || request.action === "correct-bill") {
      const fields = { ...request.fields, category: request.fields.category.trim() };
      const fieldErrors: Partial<Record<keyof typeof fields, string>> = {};
      try { fields.amount = decimalCell({ value: fields.amount, numeric: false }); }
      catch { fieldErrors.amount = "Geçerli bir TRY tutarı girin (ör. 1.250,50)."; }
      if (!fields.category) fieldErrors.category = "Kategori zorunlu.";
      if (Object.keys(fieldErrors).length) return { status: "invalid", fieldErrors };
      return this.store.saveManualBill({ ...request, fields });
    }
    const fields = { ...request.fields }, fieldErrors: Partial<Record<keyof ExpenseFields, string>> = {};
    for (const key of ["net", "tax", "gross"] as const) {
      try { fields[key] = decimalCell({ value: fields[key], numeric: false }); }
      catch { fieldErrors[key] = "Geçerli bir TRY tutarı girin (ör. 1.250,50)."; }
    }
    if (!validDate(fields.date)) fieldErrors.date = "Geçerli bir gider tarihi girin.";
    if (fields.paymentDate !== null && !validDate(fields.paymentDate)) fieldErrors.paymentDate = "Geçerli bir ödeme tarihi girin.";
    if (!fields.category.trim()) fieldErrors.category = "Kategori zorunlu.";
    if (!fieldErrors.net && !fieldErrors.tax && !fieldErrors.gross && !new Exact(fields.net).plus(fields.tax).eq(fields.gross)) fieldErrors.gross = "Brüt tutar, net tutar ile KDV toplamına eşit olmalı.";
    if (fields.taxTreatment !== "unknown" && !fields.taxEvidence) fieldErrors.taxEvidence = "Bilinen KDV işlemi için kanıt kodu zorunlu.";
    if (!Object.keys(fieldErrors).length && !validFields(fields)) fieldErrors.classification = "Sınıflandırma ve kanıt alanlarını inceleyin.";
    if (Object.keys(fieldErrors).length) return { status: "invalid", fieldErrors };
    return this.store.createExpenseCommand(request.requestId, fields, request.duplicateReview);
  }
  preview(bytes: Uint8Array): ExpensePreview {
    this.pending = null;
    const snapshot = this.store.readSnapshot(), batchId = hash(bytes);
    const preview: ExpensePreview = { status: "preview", previewId: randomUUID(), batchId, baseRevision: snapshot.pin.appRevision, rows: [], manualCandidates: {}, errors: [], alreadyImported: this.store.expenseBatches().some(b => b.batchId === batchId) };
    if (preview.alreadyImported) {
      this.pending = preview;
      return structuredClone(preview);
    }
    try {
      const cells = readExpenseWorkbook(bytes), known = new Map(snapshot.app.filter(row => row.kind === "expense").map(row => [row.entityId, row]));
      const aliases = new Map<string, string>(), billsByAmount = new Map<string, ManualCandidate[]>(), billNumbers = manualBillNumbers(snapshot.expenseHistory);
      for (const record of snapshot.expenseHistory) if (record.kind === "expense") {
        if (isExpense(record.value) && record.value.attachment && record.value.sourceReference) aliases.set(record.value.sourceReference, record.entityId);
      }
      for (const record of known.values()) if (record.kind === "expense" && isManualBill(record.value) && !record.value.voided) {
        const { period, category, amount } = record.value;
        const key = `${period}:${new Exact(amount).toFixed()}`;
        const bills = billsByAmount.get(key) ?? [];
        if (!bills.length) billsByAmount.set(key, bills);
        bills.push({ entityId: record.entityId, revision: record.revision, period, category, amount, billNumber: billNumbers.get(record.entityId)! });
      }
      for (const bills of billsByAmount.values()) bills.sort((a, b) => a.billNumber - b.billNumber);
      const seen = new Set<string>(), candidates = new Map<string, string>(), losses = new Set<string>();
      const duplicateKey = (v: ExpenseValue) => `${v.date}:${new Exact(v.gross).toFixed()}`;
      for (const record of known.values()) if (isExpense(record.value) && !record.value.voided) {
        const key = duplicateKey(record.value);
        if (!candidates.has(key)) candidates.set(key, record.entityId);
        if (record.value.loss) losses.add(record.value.loss.evidence);
      }
      for (const [index, c] of cells.entries()) {
        if (!c.some(cell => cell?.value)) continue;
        const row: ExpensePreviewRow = { row: index + 2, entityId: "", value: null, errors: [], duplicates: [], alreadyPresent: false };
        try {
          row.value = value(c, batchId, row.row);
          row.entityId = row.value.sourceReference ? `expense-ref:${hash(row.value.sourceReference)}` : `expense:${batchId}:${row.row}`;
          const alias = row.value.sourceReference ? aliases.get(row.value.sourceReference) : undefined;
          const existing = known.get(alias ?? row.entityId);
          if (seen.has(row.entityId)) row.errors.push("Kayıt referansı çalışma kitabında tekrar ediyor.");
          seen.add(row.entityId);
          if (existing) {
            if (isExpense(existing.value) && !existing.value.voided && same(row.value, existing.value)) row.alreadyPresent = true;
            else row.errors.push("Kayıt referansı mevcut kayıttan farklı. Gerekçeli düzeltme kullanın.");
          }
          if (!row.alreadyPresent) {
            const matchKey = `${row.value.date.slice(0, 7)}:${new Exact(row.value.gross).toFixed()}`;
            const bills = billsByAmount.get(matchKey);
            if (bills?.length) {
              row.matchKey = matchKey;
              preview.manualCandidates[matchKey] = bills;
            }
            const candidate = candidates.get(duplicateKey(row.value));
            if (candidate && candidate !== row.entityId) row.duplicates.push(candidate);
            if (row.value.loss && losses.has(row.value.loss.evidence)) row.errors.push("Kayıp kanıtı başka bir kayıtta kullanılmış.");
          }
        } catch (error) { row.errors.push(error instanceof Error ? error.message : "Satır doğrulanamadı."); row.value = null; }
        if (row.errors.length) { row.value = null; delete row.matchKey; }
        if (row.value) {
          const key = duplicateKey(row.value);
          if (!candidates.has(key)) candidates.set(key, row.entityId);
          if (row.value.loss) losses.add(row.value.loss.evidence);
        }
        preview.rows.push(row);
      }
      if (!preview.rows.length) preview.errors.push("Çalışma kitabında gider satırı yok.");
    } catch { preview.errors.push("Çalışma kitabı geçersiz. Yalnızca kanonik şablon, tek sayfa ve sabit değerler kabul edilir; formül, ek sütun kullanmayın."); }
    this.pending = preview;
    return structuredClone(preview);
  }
  cancelPreview({ previewId }: { previewId: string }) {
    if (this.pending?.previewId === previewId) this.pending = null;
    return { status: "cancelled" as const };
  }
  confirm(request: ConfirmExpensesRequest) {
    const p = this.pending;
    requireValid(p && p.previewId === request.previewId);
    if (p.alreadyImported) { this.pending = null; return { status: "already-imported" as const, count: 0 }; }
    requireValid(!p.errors.length && p.rows.length && p.rows.every(row => row.value && !row.errors.length));
    const candidates = new Set(p.rows.filter(row => !row.alreadyPresent && (row.matchKey || row.duplicates.length)).map(row => row.row));
    const keep = new Set(request.keepCandidateRows), matches = new Map((request.matches ?? []).map(match => [match.row, match.entityId]));
    requireValid(keep.size === request.keepCandidateRows.length && matches.size === (request.matches?.length ?? 0) &&
      new Set(matches.values()).size === matches.size && keep.size + matches.size === candidates.size &&
      [...keep].every(row => candidates.has(row) && !matches.has(row)) && [...matches.keys()].every(row => candidates.has(row)));
    const acknowledgements = new Set(request.acknowledgedDetailedRows);
    requireValid(acknowledgements.size === (request.acknowledgedDetailedRows?.length ?? 0));
    const billsById = new Map(Object.entries(p.manualCandidates).flatMap(([key, bills]) =>
      bills.map(bill => [bill.entityId, { key, bill }] as const)));
    const changes = p.rows.filter(row => !row.alreadyPresent).map(row => {
      const entityId = matches.get(row.row);
      const candidate = entityId ? billsById.get(entityId) : undefined;
      requireValid(!entityId || candidate && candidate.key === row.matchKey);
      const needsAcknowledgement = !!candidate && row.duplicates.length > 0;
      requireValid(acknowledgements.delete(row.row) === needsAcknowledgement);
      return { entityId: row.entityId, value: row.value!, match: candidate?.bill };
    });
    requireValid(!acknowledgements.size);
    const imported = this.store.importExpenses(p.batchId, p.baseRevision, changes);
    this.pending = null;
    return { status: imported ? "imported" as const : "already-imported" as const, count: imported ? changes.length : 0 };
  }
  query({ period }: QueryExpensesRequest): ExpensePeriod {
    requireValid(validPeriod(period));
    const snapshot = this.store.readSnapshot(), history = snapshot.expenseHistory.filter(row => row.kind === "expense"), expenseRevision = relevantExpenseRevision(history, period);
    const rows = snapshot.app.filter(row => row.kind === "expense").filter(row => (expensePeriod(row.value) === period || isExpense(row.value) && row.value.paymentDate?.startsWith(period)));
    const confirmation = snapshot.app.find(row => row.kind === "confirmation" && row.entityId === `expense-complete:${period}`);
    const current = rows.filter(row => (isExpense(row.value) || isManualBill(row.value)) && !row.value.voided);
    const complete = confirmation?.kind === "confirmation" && confirmation.value.complete && confirmation.value.reviewedRevision === expenseRevision;
    const components = calculateEstimateExpenseComponents({ period, expenses: snapshot.app });
    const coverage = components.reasons.length ? "incomplete" : complete || Object.values(components.breakdownCoverage).includes("available") ? "available" : "missing";
    const summary: ExpensePeriod["summary"] = { expenses: coverage === "available" ? components.expenses : null, coverage, labour: components.breakdownCoverage.labour === "available" ? components.breakdown.labour : null, labourCoverage: components.breakdownCoverage.labour, reasons: components.reasons, excluded: components.excluded };
    return { status: "expenses", period, appRevision: snapshot.pin.appRevision, expenseRevision, rows, history, batches: this.store.expenseBatches(), summary, complete, confirmation: confirmation?.kind === "confirmation" && confirmation.value.complete && confirmation.value.period === period ? complete ? "current" : "stale" : "none", ...groupExpenses(period, snapshot.app), incurred: sum(current.filter(row => expensePeriod(row.value) === period).map(row => isManualBill(row.value) ? row.value.amount : isExpense(row.value) ? row.value.gross : "0")), payments: sum(current.filter(row => isExpense(row.value) && row.value.paymentDate?.startsWith(period)).map(row => isExpense(row.value) ? row.value.gross : "0")) };
  }
}

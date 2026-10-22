import type { ExpenseGroupKey } from "../../expenses/groups";
import type { NetProfitReason } from "../../source/month-profit";
import type { ExpensePeriod } from "../../expenses/contracts";
import { date } from "../format";

export const groupLabels: Record<ExpenseGroupKey, string> = { staff: "Personel toplamı", rent: "Kira", utilities: "Elektrik/su", other: "Diğer" };

/** One short sentence per reason, in the order the service checks them. */
export function netReasonText(reason: NetProfitReason, dataUntil: string): string {
  switch (reason) {
    case "costUnknown": return "Bazı ürünlerin maliyeti bilinmediği için brüt kâr hesaplanamadı.";
    case "monthPartial": return `Ay henüz bitmedi; veri ${date(dataUntil)} tarihine kadar.`;
    case "expensesMissing": return "Bu ayın giderleri henüz girilmedi.";
    case "expensesIncomplete": return "Giderler girildi ama “Bu ayın giderleri tamam” onayı verilmedi.";
    case "unknownTax": return "Bir giderin KDV durumu bilinmiyor; aşağıdaki satırı düzeltin.";
    case "confirmationStale": return "Onaydan sonra giderler değişti; yeniden onaylayın.";
  }
}

export function confirmationState(state: ExpensePeriod["confirmation"]): string {
  return state === "current" ? "Onaylandı" : state === "stale" ? "Onay eskidi" : "Onay bekliyor";
}

export const attentionText: Record<ExpensePeriod["attention"][number]["reason"], string> = {
  unknownTax: "KDV durumu bilinmiyor",
  unclassified: "Gider türü seçilmemiş",
  lossReview: "Stok kaybı kanıtı eksik",
};

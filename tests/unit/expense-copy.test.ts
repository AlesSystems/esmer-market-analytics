import { expect, test } from "vitest";
import { confirmationState, groupLabels, netReasonText } from "../../src/ui/expenses/copy";
import type { NetProfitReason } from "../../src/source/month-profit";

test("the four display groups read in plain Turkish", () => {
  expect([groupLabels.staff, groupLabels.rent, groupLabels.utilities, groupLabels.other]).toEqual(["Personel toplamı", "Kira", "Elektrik/su", "Diğer"]);
});

test("every net-profit reason has a short plain sentence", () => {
  const all: NetProfitReason[] = ["costUnknown", "monthPartial", "expensesMissing", "expensesIncomplete", "expensesBlocked", "unknownTax", "confirmationStale"];
  const texts = all.map(reason => netReasonText(reason, "2025-10-20"));
  expect(texts).toEqual([
    "Bazı ürünlerin maliyeti bilinmediği için brüt kâr hesaplanamadı.",
    "Ay henüz bitmedi; veri 20.10.2025 tarihine kadar.",
    "Bu ayın giderleri henüz girilmedi.",
    "Giderler girildi ama “Bu ayın giderleri tamam” onayı verilmedi.",
    "Onaylandı ama bazı gider satırları net kârı engelliyor; işaretli satırları düzeltin.",
    "Bir giderin KDV durumu bilinmiyor; aşağıdaki satırı düzeltin.",
    "Onaydan sonra giderler değişti; yeniden onaylayın.",
  ]);
  for (const text of texts) expect(text.length).toBeLessThan(90);
});

test("confirmation state names stale plainly", () => {
  expect(confirmationState("none")).toBe("Onay bekliyor");
  expect(confirmationState("current")).toBe("Onaylandı");
  expect(confirmationState("stale")).toBe("Onay eskidi");
});

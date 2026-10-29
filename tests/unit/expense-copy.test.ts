import { expect, test } from "vitest";
import { attentionText, blankSentence, confirmPlan, confirmReason, groupLabels, statusText } from "../../src/ui/expenses/copy";
import type { ExpenseGroup } from "../../src/expenses/groups";
import type { ExpensePeriod } from "../../src/expenses/contracts";

const groups = (counts: [number, number, number, number], amounts: (string | null)[] = ["0", "0", "0", "0"]): ExpenseGroup[] =>
  (["staff", "rent", "utilities", "other"] as const).map((key, index) => ({ key, count: counts[index], amount: amounts[index] }));
const view = (overrides: Partial<Pick<ExpensePeriod, "groups" | "attention" | "confirmation" | "rows">> = {}) =>
  ({ groups: groups([0, 0, 0, 0]), attention: [], confirmation: "none", rows: [], ...overrides }) as Pick<ExpensePeriod, "groups" | "attention" | "confirmation" | "rows">;

test("the four display groups read in plain Turkish", () => {
  expect([groupLabels.staff, groupLabels.rent, groupLabels.utilities, groupLabels.other]).toEqual(["Personel toplamı", "Kira", "Elektrik/su", "Diğer"]);
});

test("a month with no counted line offers only the explicit 'gider yok' and never asks about blank groups", () => {
  const plan = confirmPlan(view());
  expect(plan).toMatchObject({ lines: false, blocked: false, state: "none" });
  expect(confirmReason(plan, false)).toBe("Bu ay gider yok");
});

test("lines in some groups name exactly the empty groups, in display order", () => {
  const plan = confirmPlan(view({ groups: groups([0, 2, 0, 1], [null, "100", "0", "5"]) }));
  expect(plan).toMatchObject({ lines: true, blocked: false, empty: ["staff", "utilities"] });
  expect(blankSentence(plan.empty)).toBe("Personel toplamı ve Elektrik/su için kayıt yok.");
  expect(blankSentence(["rent"])).toBe("Kira için kayıt yok.");
  expect(blankSentence(["staff", "rent", "other"])).toBe("Personel toplamı, Kira ve Diğer için kayıt yok.");
  expect(confirmReason(plan, false)).toBe("Bu ayın giderleri tamam");
  expect(confirmReason(plan, true)).toBe("Bu kalemlerde gider yok: Personel toplamı, Elektrik/su");
});

test("a line that blocks the total, or an attention row alone, blocks the confirmation", () => {
  const attention = [{ entityId: "e1", category: "Kira", date: "2025-10-05", reason: "unknownTax" as const }];
  expect(confirmPlan(view({ groups: groups([0, 1, 0, 0], [null, null, null, null]), attention }))).toMatchObject({ lines: true, blocked: true });
  expect(confirmPlan(view({ attention: [{ ...attention[0], reason: "unclassified" }] }))).toMatchObject({ lines: true, blocked: true });
});

test("every state has one short status sentence", () => {
  const filled = groups([1, 1, 1, 1], ["1", "1", "1", "1"]);
  expect(statusText(view())).toBe("Bu ay için gider girilmedi.");
  expect(statusText(view({ rows: [{}] as ExpensePeriod["rows"] }))).toBe("Bu ay giderine sayılan kayıt yok.");
  expect(statusText(view({ groups: groups([0, 1, 0, 0], [null, "10", null, null]) }))).toBe("1 / 4 grupta kayıt var. Boş kalan grupları onaydan önce kontrol edin.");
  expect(statusText(view({ groups: filled }))).toBe("Kayıtlardan hesaplanan toplamlar hazır. Onaylayınca net kâr Bu ay sayfasında görünür.");
  expect(statusText(view({ groups: filled, attention: [{ entityId: "e1", category: "K", date: "2025-10-05", reason: "unknownTax" }] }))).toBe("Bazı satırlar düzeltilmeden onaylanamaz; net kâr hesaplanamaz.");
  expect(statusText(view({ groups: filled, confirmation: "current", attention: [{ entityId: "e1", category: "K", date: "2025-10-05", reason: "unknownTax" }] }))).toBe("Onaylandı ama işaretli satırlar net kârı engelliyor; düzeltin.");
  expect(statusText(view({ groups: filled, confirmation: "current" }))).toBe("Bu ayın giderlerini onayladınız. Bir gider değişirse onay yeniden istenir.");
  expect(statusText(view({ confirmation: "current" }))).toBe("Bu ay için “gider yok” dediniz. Bir gider eklenirse onay yeniden istenir.");
  expect(statusText(view({ groups: filled, confirmation: "stale" }))).toBe("Onaydan sonra giderler değişti. Kontrol edip yeniden onaylayın.");
  for (const text of [statusText(view()), statusText(view({ groups: filled }))]) expect(text.length).toBeLessThan(100);
});

test("every attention reason has a plain sentence", () => {
  expect(Object.values(attentionText)).toEqual(["KDV durumu bilinmiyor", "Gider türü seçilmemiş", "Stok kaybı kanıtı eksik", "Eski biçimli kayıt; yeniden girilmeli"]);
});

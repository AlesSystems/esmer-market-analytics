import type { ExpenseGroupKey } from "../../expenses/groups";
import type { ExpensePeriod } from "../../expenses/contracts";

export const groupLabels: Record<ExpenseGroupKey, string> = { staff: "Personel toplamı", rent: "Kira", utilities: "Elektrik/su", other: "Diğer" };

export const attentionText: Record<ExpensePeriod["attention"][number]["reason"], string> = {
  unknownTax: "KDV durumu bilinmiyor",
  unclassified: "Gider türü seçilmemiş",
  lossReview: "Stok kaybı kanıtı eksik",
  legacy: "Eski biçimli kayıt; yeniden girilmeli",
};

/** The same reasons as a short chip beside the line. */
export const attentionChip: Record<ExpensePeriod["attention"][number]["reason"], string> = {
  unknownTax: "KDV bilinmiyor",
  unclassified: "Tür seçilmemiş",
  lossReview: "Kanıt eksik",
  legacy: "Eski biçim",
};

type Month = Pick<ExpensePeriod, "groups" | "attention" | "confirmation">;
/** What confirming this month means. Reads only the counts the service returned. */
export type ConfirmPlan = {
  /** Some line counts toward the month (or blocks it). False: the month has no relevant line at all. */
  lines: boolean;
  /** A line needs the owner's correction before the month can be confirmed. */
  blocked: boolean;
  /** Groups with no line, in display order. With lines present these are the blanks the owner must answer for. */
  empty: ExpenseGroupKey[];
  state: ExpensePeriod["confirmation"];
};

export function confirmPlan(view: Month): ConfirmPlan {
  return {
    lines: view.groups.some(group => group.count > 0) || view.attention.length > 0,
    blocked: view.attention.length > 0,
    empty: view.groups.filter(group => group.count === 0).map(group => group.key),
    state: view.confirmation,
  };
}

/** "Kira ve Elektrik/su için kayıt yok." */
export function blankSentence(empty: ExpenseGroupKey[]): string {
  const names = empty.map(key => groupLabels[key]);
  const list = names.length < 2 ? names.join("") : `${names.slice(0, -1).join(", ")} ve ${names[names.length - 1]}`;
  return `${list} için kayıt yok.`;
}

/** The reason stored with the confirmation. `explicit` is the owner's "no expense in these groups". */
export function confirmReason(plan: ConfirmPlan, explicit: boolean): string {
  if (!plan.lines) return "Bu ay gider yok";
  return explicit ? `Bu kalemlerde gider yok: ${plan.empty.map(key => groupLabels[key]).join(", ")}` : "Bu ayın giderleri tamam";
}

/** The one sentence under the page title. */
export function statusText(view: Month & Pick<ExpensePeriod, "rows">): string {
  const plan = confirmPlan(view);
  if (plan.state === "stale") return "Onaydan sonra giderler değişti. Kontrol edip yeniden onaylayın.";
  if (plan.state === "current") {
    if (plan.blocked) return "Onaylandı ama işaretli satırlar net kârı engelliyor; düzeltin.";
    return plan.lines ? "Bu ayın giderlerini onayladınız. Bir gider değişirse onay yeniden istenir." : "Bu ay için “gider yok” dediniz. Bir gider eklenirse onay yeniden istenir.";
  }
  if (plan.blocked) return "Bazı satırlar düzeltilmeden onaylanamaz; net kâr hesaplanamaz.";
  if (!plan.lines) return view.rows.length === 0 ? "Bu ay için gider girilmedi." : "Bu ay giderine sayılan kayıt yok.";
  const filled = view.groups.length - plan.empty.length;
  if (plan.empty.length) return `${filled} / ${view.groups.length} grupta kayıt var. Boş kalan grupları onaydan önce kontrol edin.`;
  return "Kayıtlardan hesaplanan toplamlar hazır. Onaylayınca net kâr Bu ay sayfasında görünür.";
}

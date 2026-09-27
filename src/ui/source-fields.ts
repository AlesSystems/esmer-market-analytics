import { date, decimal } from "./format";

const typeLabels: Record<string, string> = {"1": "Alış faturası", "2": "Satış faturası", "3": "Alıştan iade faturası", "4": "Satıştan iade faturası", "5": "Alış irsaliyesi", "7": "Alıştan iade irsaliyesi", "8": "Satıştan iade irsaliyesi", "11": "Perakende satış fişi", "12": "Perakende satış iade fişi", "15": "Stok tüketimi", "16": "Stok firesi", "17": "Stok sayımı", "35": "Perakende satış faturası"};
export const typeLabel = (code: string | null) => `${code ?? "—"} · ${code && typeLabels[code] || "Tür anlamı doğrulanmadı"}`;
const headerLabels: Record<string, string> = {
  ID: "Belge kayıt ID'si", FIS_TURU: "Belge türü", DOVIZ_AD: "Kaynak döviz kimliği", DURUM: "Durum kodu", AKTIF: "Aktif kodu",
  SATIR_TOPLAM: "Satır toplamı · doğrulanmadı", SATIR_ISKONTO_TOPLAM: "Satır iskonto toplamı · doğrulanmadı", FIS_ISKONTO_TOPLAM: "Belge iskonto toplamı · doğrulanmadı",
  KDV_TOPLAM: "KDV toplamı · doğrulanmadı", OTV_TOPLAM: "ÖTV toplamı · doğrulanmadı", TEFKIFAT_TOPLAM: "Tevkifat toplamı · doğrulanmadı",
  GENELTOPLAM: "Kaynak belge tutarı · doğrulanmadı", FIS_TARIHI: "Kaynak tarihi", CURRENCY: "Para birimi",
};
const lineLabels: Record<string, string> = {
  ID: "Satır kayıt ID'si", STOK: "Ürün kayıt ID'si", FIS_TURU: "Belge türü", CARPAN: "Çarpan", MIKTAR_FIS: "Kaynak miktar",
  TOPLAM_KDV_MATRAHI: "KDV matrahı · doğrulanmadı", TOPLAM_KDV: "KDV · doğrulanmadı", TOPLAM_OTV: "ÖTV · doğrulanmadı", TOPLAM_TEVKIF: "Tevkifat · doğrulanmadı",
};
const amounts = new Set(["SATIR_TOPLAM", "SATIR_ISKONTO_TOPLAM", "FIS_ISKONTO_TOPLAM", "KDV_TOPLAM", "OTV_TOPLAM", "TEFKIFAT_TOPLAM", "GENELTOPLAM", "CARPAN", "MIKTAR_FIS", "TOPLAM_KDV_MATRAHI", "TOPLAM_KDV", "TOPLAM_OTV", "TOPLAM_TEVKIF"]);
export const sourceLineColumns = ["ID", "STOK", "FIS_TURU", "CARPAN", "MIKTAR_FIS", "TOPLAM_KDV_MATRAHI", "TOPLAM_KDV", "TOPLAM_OTV", "TOPLAM_TEVKIF"] as const;

export function sourceFieldLabel(kind: "header" | "line", name: string) {
  return (kind === "header" ? headerLabels : lineLabels)[name] ?? name;
}
export function sourceFieldValue(name: string, value: string | null) {
  if (value === null) return "—";
  if (name === "FIS_TARIHI") return `${date(value.slice(0, 10))} · ${value}`;
  if (name === "FIS_TURU") return typeLabel(value);
  if (amounts.has(name)) return `${decimal(value)} · ${value}`;
  return value;
}

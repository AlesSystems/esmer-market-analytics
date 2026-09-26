import { expect, test } from "vitest";
import { sourceFieldLabel, sourceFieldValue, sourceLineColumns } from "../../src/ui/source-fields";

test("source detail labels projected fields and keeps the exact source string", () => {
  expect(sourceFieldLabel("header", "KDV_TOPLAM")).toBe("KDV toplamı · doğrulanmadı");
  expect(sourceFieldLabel("header", "OTV_TOPLAM")).toBe("ÖTV toplamı · doğrulanmadı");
  expect(sourceFieldLabel("header", "TEFKIFAT_TOPLAM")).toBe("Tevkifat toplamı · doğrulanmadı");
  expect(sourceFieldValue("KDV_TOPLAM", "3.4567890123456789")).toBe("3,4567890123456789 · 3.4567890123456789");
  expect(sourceFieldValue("OTV_TOPLAM", null)).toBe("—");
  expect(sourceFieldValue("FIS_TARIHI", "2025-10-01T12:00:00.000")).toBe("01.10.2025 · 2025-10-01T12:00:00.000");
  expect(sourceFieldValue("FIS_TURU", "11")).toBe("11 · Perakende satış fişi");
  expect(sourceFieldLabel("line", "STOK")).toBe("Ürün kayıt ID'si");
  expect(sourceFieldLabel("line", "MIKTAR_FIS")).toBe("Kaynak miktar");
  expect(sourceFieldValue("MIKTAR_FIS", "2.000")).toBe("2,000 · 2.000");
  expect(sourceLineColumns).not.toContain("FIS");
  expect(sourceLineColumns).toEqual(["ID", "STOK", "FIS_TURU", "CARPAN", "MIKTAR_FIS", "TOPLAM_KDV_MATRAHI", "TOPLAM_KDV", "TOPLAM_OTV", "TOPLAM_TEVKIF"]);
});

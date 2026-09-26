import type { SqlSnapshot } from "../../src/source/sql-server";
export function rawSnapshot(): SqlSnapshot {
  return {databaseId: "00000000-0000-4000-8000-000000000001", engineVersion: "15.0.1", capturedAt: "2026-09-26T00:00:00.000Z", from: "2025-10-01", to: "2025-10-12", headers: [{ID: "1", FIS_TURU: "11", DOVIZ_AD: "1", DURUM: "1", AKTIF: "1", SATIR_TOPLAM: "120", SATIR_ISKONTO_TOPLAM: "0", FIS_ISKONTO_TOPLAM: "0", KDV_TOPLAM: "3.4567890123456789", OTV_TOPLAM: null, TEFKIFAT_TOPLAM: null, GENELTOPLAM: "123.4567890123456789", FIS_TARIHI: "2025-10-01T12:00:00.000", CURRENCY: "TRY"}], lines: [{ID: "2", FIS: "1", STOK: "3", FIS_TURU: "11", CARPAN: "1", MIKTAR_FIS: "2.000", TOPLAM_KDV_MATRAHI: "120", TOPLAM_KDV: "3.4567890123456789", TOPLAM_OTV: null, TOPLAM_TEVKIF: null}]};
}

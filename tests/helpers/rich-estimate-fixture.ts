import type {SqlRow, SqlSnapshot} from "../../src/source/sql-server";
import {writeRawEstimatePackage} from "../../src/source/raw-package";

export function richEstimateSnapshot(): SqlSnapshot {
  let seed = 20251031;
  const next = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  const headers: SqlRow[] = [], lines: SqlRow[] = [];
  const products = Array.from({length: 48}, (_, index) => ({id: String(1000 + index), price: 8 + Math.round(next() * 220), margin: 0.12 + next() * 0.3, weight: 0.2 + next() ** 2 * 3}));
  let headerId = 1, lineId = 100000;
  for (let day = new Date(Date.UTC(2025, 7, 1)); day <= new Date(Date.UTC(2025, 9, 31)); day.setUTCDate(day.getUTCDate() + 1)) {
    const date = day.toISOString().slice(0, 10), weekend = day.getUTCDay() === 0 || day.getUTCDay() === 6;
    const receipts = Math.round((weekend ? 34 : 22) + next() * 14);
    for (let receipt = 0; receipt < receipts; receipt++) {
      const type = next() < 0.04 ? "12" : next() < 0.03 ? "35" : "11", id = String(headerId++);
      let total = 0;
      const count = 1 + Math.floor(next() * 4);
      for (let item = 0; item < count; item++) {
        const product = products[Math.floor(next() ** 1.6 * products.length)], quantity = 1 + Math.floor(next() * 3 * product.weight);
        const amount = (product.price * quantity).toFixed(2), cost = next() < 0.07 ? null : (product.price * (1 - product.margin)).toFixed(2);
        total += Number(amount);
        lines.push({ID: String(lineId++), FIS: id, STOK: product.id, FIS_TURU: type, CARPAN: "1", MIKTAR_FIS: `${quantity}.000`, TOPLAM_KDV_MATRAHI: amount, TOPLAM_KDV: (Number(amount) * 0.05).toFixed(2), TOPLAM_OTV: null, TOPLAM_TEVKIF: null, BELGE_TARIHINDEKI_SON_ALIS_FIYATI: cost});
      }
      headers.push({ID: id, FIS_TURU: type, DOVIZ_AD: "1", DURUM: "1", AKTIF: "1", SATIR_TOPLAM: total.toFixed(2), SATIR_ISKONTO_TOPLAM: "0", FIS_ISKONTO_TOPLAM: "0", KDV_TOPLAM: (total * 0.05).toFixed(2), OTV_TOPLAM: null, TEFKIFAT_TOPLAM: null, GENELTOPLAM: (total * 1.05).toFixed(2), FIS_TARIHI: `${date}T${String(9 + Math.floor(next() * 12)).padStart(2, "0")}:00:00.000`, CURRENCY: "TRY"});
    }
  }
  return {databaseId: "00000000-0000-4000-8000-0000000000aa", engineVersion: "15.0.1", capturedAt: "2025-11-01T00:00:00.000Z", from: "2025-08-01", to: "2025-10-31", headers, lines};
}

export const richEstimatePackage = () => writeRawEstimatePackage(richEstimateSnapshot(), "fixture:rich-estimate", "rich-estimate-1");

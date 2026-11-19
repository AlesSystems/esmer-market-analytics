import { writeRawEstimatePackage } from "../../src/source/raw-package";
import { namedSnapshot, rawSnapshot } from "./raw-fixture";

export const november = "2026-11";

export function novemberProfitSnapshot() {
  const base = rawSnapshot();
  // One unit sold for 15,000 TRY with a historical cost of 5,000 TRY.
  return namedSnapshot({
    ...base,
    from: "2026-11-01",
    to: "2026-11-30",
    capturedAt: "2026-12-01T00:00:00.000Z",
    headers: [{
      ...base.headers[0], FIS_TARIHI: "2026-11-15T12:00:00.000",
      SATIR_TOPLAM: "15000", KDV_TOPLAM: "0", GENELTOPLAM: "15000",
    }],
    lines: [{
      ...base.lines[0], MIKTAR_FIS: "1", TOPLAM_KDV_MATRAHI: "15000",
      TOPLAM_KDV: "0", BELGE_TARIHINDEKI_SON_ALIS_FIYATI: "5000",
    }],
  });
}

export const novemberProfitPackage = (snapshot = novemberProfitSnapshot()) =>
  writeRawEstimatePackage(snapshot, "fixture:november-bill", "november-bill-1");

export const novemberElectricityExcelRow = [
  "november-electricity-1", "15.11.2026", null, "Elektrik", "operating-expense",
  "1000", "250", "1250", "recoverable", "tax-1", "bill-1", null, null, null,
];

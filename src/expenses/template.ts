import writeXlsxFile from "write-excel-file/node";
export const expenseColumns = ["Kayıt referansı", "Gider tarihi", "Ödeme tarihi", "Kategori", "Sınıflandırma", "Net tutar", "KDV tutarı", "Brüt tutar", "KDV işlemi", "KDV kanıtı", "Destek referansı", "İşçilik dönemi", "Kayıp kanıtı", "Kayıp işlemi"];
export async function expenseTemplate(): Promise<Buffer> {
  return writeXlsxFile([expenseColumns.map(value => ({ type: String, value, fontWeight: "bold" as const }))], { sheet: "Giderler", columns: expenseColumns.map(() => ({ width: 24 })) }).toBuffer();
}

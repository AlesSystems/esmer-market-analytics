import writeXlsxFile,{type Row,type Cell} from "write-excel-file/node";
import type {MonthProfitView,NetProfitReason} from "./month-profit";

// Amounts and percentages are written as exact decimal text, like the source-estimate export.
// A null is an empty cell with a note in the last column, never 0.
const text=(value:unknown):Cell=>value===null||value===undefined?null:{type:String,value:String(value)};
const reasons:Record<NetProfitReason,string>={
 costUnknown:"Maliyetler bilinmediği için hesaplanamadı",monthPartial:"Ay henüz tamamlanmadı",expensesMissing:"Bu ayın giderleri girilmedi",
 expensesIncomplete:"Bu ayın giderleri tamamlanmadı",unknownTax:"Bazı giderlerin KDV durumu bilinmiyor",confirmationStale:"Giderler onaydan sonra değişti; yeniden onaylayın",
};
const UNKNOWN="Bilinmiyor";
const SUBTOTAL="bilinen alt toplam";
const isZero=(value:string|null)=>value!==null&&/^-?0+(\.0+)?$/.test(value);
const line=(label:string,value:string|number|null,note:string|null=null,subtotal=false):Row=>[text(label),text(value),text(value===null?note??UNKNOWN:subtotal?SUBTOTAL:note)];

/** Same wording as the product card on Ürünler. */
function productNote(p:MonthProfitView["products"][number]):string|null{
 const notes:string[]=[];
 if(p.cost===null)notes.push("Maliyet bilinmiyor");
 else if(p.flags.missingCost)notes.push("Bazı satışlarının maliyeti bilinmiyor; kâr yalnız maliyeti bilinen satışlardan hesaplandı");
 if(p.marginPct===null&&p.cost!==null)notes.push("Marj hesaplanamadı");
 if(p.unitPrice===null||p.unitCost===null)notes.push("Birim değerleri bilinmiyor");
 return notes.length?notes.join("; "):null;
}

export async function excelMonthProfit(view:MonthProfitView):Promise<Buffer> {
 const t=view.totals;
 const head:Row[]=[[text("Doğrulanmamış tahmin — kesin kâr değildir")],[text("Dönem"),text(view.month)],[text("Veri aralığı"),text(`${view.dataFrom} / ${view.dataUntil}`)],[text("Kaynak sürümü"),text(view.source.hash)],[text("Hesaplama sürümü"),text(view.version)],
  [text("Son alış fiyatıyla yapılmış tahmindir; iadeler kâra dahil değildir. Tutarlar kesin ondalık metindir; boş hücre bilinmeyendir, sıfır değildir.")],[]];
 const netNote=t.netProfitReason===null?null:reasons[t.netProfitReason];
 const sections:[string,Row[]][]=[
  ["Özet",[[text("Gösterge"),text("Değer"),text("Not")],
   line("Satış",t.sales,null,t.unknownSaleAmounts>0),line("Maliyeti bilinen satış",t.knownCostSales),line("Tahmini maliyet",t.cost),line("Tahmini brüt kâr",t.grossProfit),line("Marj (%)",t.marginPct),line("Maliyeti bilinen satış (%)",t.costKnownPct),
   line("Maliyeti bilinmeyen satış",t.unknownSaleAmounts>0&&isZero(t.unknownCostSales)?null:t.unknownCostSales,null,t.unknownSaleAmounts>0),line("Maliyeti bilinmeyen ürün",t.unknownCostProducts),line("İadeler",t.returns,null,t.unknownReturnAmounts>0),line("Tutarı bilinmeyen satış satırı",String(t.unknownSaleAmounts)),line("Tutarı bilinmeyen iade satırı",String(t.unknownReturnAmounts)),line("Fiş sayısı",t.receipts),line("Ortalama sepet",t.averageBasket),
   line("Giderler",t.expenses),line("Tahmini net kâr",t.netProfit,netNote)]],
  ["Ürünler",[[text("Ürün"),text("Kategori"),text("Satış"),text("Maliyet"),text("Brüt kâr"),text("Marj (%)"),text("Miktar"),text("Birim"),text("Birim satış fiyatı"),text("Birim maliyet"),text("Not")],
   ...view.products.map((p):Row=>[text(p.name??`Ürün #${p.id}`),text(p.category),text(p.sales),text(p.cost),text(p.grossProfit),text(p.marginPct),text(p.quantity),text(p.unit),text(p.unitPrice),text(p.unitCost),text(productNote(p))])]],
  ["Giderler",[[text("Gösterge"),text("Değer"),text("Not")],
   line("Giderler toplamı",t.expenses),
   line("Gider onayı",t.expensesComplete?"Onaylı":"Onaylanmadı"),
   line("Tahmini brüt kâr",t.grossProfit),
   line("Tahmini net kâr",t.netProfit,netNote)]],
 ];
 const sheets=sections.map(([sheet,rows])=>({sheet,data:[...head,...rows]}));
 for(const sheet of sheets){if(sheet.data.length>1_048_576)throw Error("EXCEL_ROW_LIMIT");for(const row of sheet.data)for(const cell of row)if(cell&&typeof cell==="object"&&"value"in cell&&typeof cell.value==="string"&&cell.value.length>32767)throw Error("EXCEL_CELL_LIMIT");}
 return writeXlsxFile(sheets).toBuffer();
}

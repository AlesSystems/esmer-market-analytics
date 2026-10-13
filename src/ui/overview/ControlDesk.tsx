import { useEffect, useState } from "react";
import type { MonthlyDisplay } from "../../reports/display";
import { date, money, percent } from "../format";
import { bridgeSteps, CoverageBridge, DailyNetSales, ProductRanking } from "./financial-charts";

type Props = { report: MonthlyDisplay; refresh: () => void; onSales?: (categoryId?: string) => void; onExpenses?: () => void; onPurchasing?: () => void; onReport?: () => void; onProduct?: (id: string) => void };
const amount = (value: string | null) => value === null ? "Hesaplanamıyor" : money(value);

export function ControlDesk({ report, refresh, onSales, onExpenses, onReport, onProduct }: Props) {
  const [data, setData] = useState<{id:string;expenses:string|null;products:import("../../reports/display").ReportProductsPage["rows"];expenseCoverage:import("../../expenses/contracts").ExpenseSummary["coverage"]|null;expenseComplete:boolean;productsFailed:boolean;error:string}>();
  useEffect(() => { let current = true;
    const products = report.format === "monthly-report-v2" ? window.esmer.readReportProducts({reportId:report.id,search:"",sort:"netSales",direction:"desc",offset:0}) : Promise.resolve(null);
    Promise.all([window.esmer.queryExpenses({period:report.context.period}),products]).then(([expenses,rows])=>{if(current)setData({id:report.id,expenses:expenses.status==="expenses"&&expenses.expenseRevision===report.operating.expenseRevision?expenses.summary.expenses:null,products:rows?.status==="products"?rows.rows.slice(0,5):[],productsFailed:rows!==null&&rows.status!=="products",expenseCoverage:expenses.status==="expenses"?expenses.summary.coverage:null,expenseComplete:expenses.status==="expenses"&&expenses.complete,error:expenses.status==="expenses"&&expenses.expenseRevision!==report.operating.expenseRevision?"Gider kayıtları bu rapordan sonra değişti; raporu yenileyin.":expenses.status!=="expenses"?"Giderler okunamadı; Giderler sayfasından yeniden deneyin.":""});}).catch(()=>{if(current)setData({id:report.id,expenses:null,products:[],productsFailed:true,expenseCoverage:null,expenseComplete:false,error:"Özet kayıtları okunamadı; ilgili sayfadan yeniden deneyin."});});
    return()=>{current=false;}; },[report.id,report.context.period]);
  const expenses=data?.id===report.id?data.expenses:null,products=data?.id===report.id?data.products:[];
  const s = report.sales, g = report.purchasing.gross;
  const profit = report.format === "monthly-report-v2" ? report.productProfit.summary : null;
  const gross = profit ? profit.coveredGrossProfit : g.status !== "unavailable" && g.coveredCount > 0 ? g.coveredGrossProfit : null;
  const coverage = profit ? profit.costCoveragePercent : g.status !== "unavailable" ? g.costCoveragePercent : null;
  const margin = profit ? profit.coveredMarginPercent : g.status !== "unavailable" ? g.coveredMarginPercent : null;
  const coveredSales = profit ? profit.coveredSales : g.status !== "unavailable" ? g.coveredSales : null;
  const exposures = profit?.exposures ?? g.exposures;
  const salesAvailable = s.coverage !== "unavailable";
  const salesAmount = salesAvailable ? amount(s.metrics.netSales) : "Hesaplanamıyor";
  const comparison = s.comparisons.month;
  const comparisonText = comparison.available && comparison.netChange !== null ? `${comparison.netChange.startsWith("-") || comparison.netChange === "0" ? "" : "+"}${percent(comparison.netChange)}` : "Karşılaştırılamıyor";
  const salesStatus = !salesAvailable ? "Dönem verisi yok" : !s.complete ? "Kanıt eksik" : s.coverage === "partial" ? "Kısmi dönem" : "Kaynakla uzlaşıyor";
  function openDetails() { onReport?.(); }
  const steps = bridgeSteps(report);
  const expenseState = data?.id===report.id ? data.expenseCoverage !== "available" ? "Gider kanıtı eksik; bilinmeyen sıfır değildir." : data.expenseComplete ? "Giderlerin eksiksizliği onaylandı." : "Giderlerin eksiksizliği onaylanmadı." : "";
  return <main className="control-desk">
    <header className="c-heading"><div><h1>Ay bir bakışta</h1><p>{report.context.period} · {report.review ? "İncelenmiş sürüm" : "Aday rapor"} · {report.state === "open" ? "Açık" : "Geçici"}</p></div><button className="c-text-action" onClick={openDetails}>Ayın raporunu aç →</button></header>
    {data?.id===report.id&&data.error&&<p role="alert">{data.error}</p>}
    <section className="c-matrix" aria-label="Aylık performans">
      <button onClick={() => onSales ? onSales() : openDetails()}><span>Net satış</span><strong>{salesAmount}</strong><em>{comparisonText} <span>önceki aya göre</span></em><small>Satış kapsamı: {salesStatus}</small></button>
      <button onClick={openDetails}><span>Kapsanan tahmini brüt {gross?.startsWith("-") ? "zarar" : "kâr"}</span><strong>{amount(gross)}</strong><em className="c-muted">Kapsanan satışta marj {margin === null ? "hesaplanamıyor" : percent(margin)}</em><small>Giderler düşülmemiştir · maliyet kapsamı {coverage === null ? "bilinmiyor" : percent(coverage)}</small></button>
      <button onClick={() => onExpenses ? onExpenses() : openDetails()}><span>Kayıtlı giderler</span><strong>{data?.id===report.id?amount(expenses):"Yükleniyor…"}</strong><em className="c-muted">Sınıflandırılmış dönem giderleri</em><small>{expenseState}</small></button>
    </section>
    {(s.stale || report.operating.stale) && <div className="c-notice"><strong>{report.operating.stale ? "Gider kayıtları değişti" : "Daha yeni veri var"}</strong><p>Bu rapor önceki sürümü gösteriyor.</p><button className="c-text-action" onClick={refresh}>Aylık raporu yenile →</button></div>}
    <div className="c-body"><div className="c-main">
      <section className="c-chart">
        {salesAvailable && s.daily.length > 0 ? <DailyNetSales report={report} /> : <><div className="c-section-heading"><div><h2>Ay içindeki satışlar</h2></div></div><p>{salesAvailable ? "Bu dönemde kapsanan satış katkısı yok." : "Günlük satış için dönem verisi yok."}</p></>}
        <div className="c-chart-foot"><span><strong>{salesAvailable ? s.metrics.saleDocumentCount.toLocaleString("tr-TR") : "Veri yok"}</strong> satış belgesi</span><span><strong>{salesAvailable ? amount(s.metrics.averageBasket) : "Hesaplanamıyor"}</strong> ortalama sepet</span><span>{date(s.from)} – {date(s.to)} · veri sonu {date(s.cutoff)}</span><button className="c-text-action" onClick={() => onSales ? onSales() : openDetails()}>Satış ayrıntılarını aç →</button></div>
      </section>
      <div className={steps ? "c-duo" : "c-duo c-solo"}>
        <section className="c-ranking">
          {products.length ? <ProductRanking rows={products} metric="netSales" title="Öne çıkan ürünler" summary="Net satışa göre ilk beş · tüm ürünler kapsamı" ariaLabel="Net satışa göre ilk beş ürün" empty="Bu dönemde kapsanan ürün katkısı yok." onSelect={row => onProduct ? onProduct(row.productId) : onSales?.()} /> : <><div className="c-section-heading"><div><h2>Öne çıkan ürünler</h2><p>Net satışa göre ilk beş · tüm ürünler kapsamı</p></div></div>{data?.id===report.id&&data.productsFailed?<><p role="alert">Ürün öne çıkanları okunamadı.</p>{onSales&&<button className="c-text-action" onClick={()=>onSales()}>Satışlar listesine git</button>}</>:<p>{data?.id===report.id?"Bu dönemde kapsanan ürün katkısı yok.":"Ürün öne çıkanları yükleniyor…"}</p>}</>}
          {onSales && products.length > 0 && <button className="c-text-action" onClick={() => onSales()}>Tüm ürünler →</button>}
        </section>
        {steps && <section className="c-bridge"><CoverageBridge steps={steps} /></section>}
      </div>
    </div><details className="c-evidence"><summary>Veri ve hesaplama ayrıntıları</summary><div className="c-proof-list"><div><span>Satış kaynağı</span><strong>{s.warnings.includes("SYNTHETIC_ONLY") ? "Sentetik örnek" : `Satış: ${salesStatus}`}</strong><p>Kayıtlı KDV hariç; müşteri iadeleri düşülmüş. {date(s.from)} – {date(s.to)}.</p></div><div><span>Maliyet kapsamı</span><strong>{coverage === null ? "Hesaplanamıyor" : percent(coverage)} <small>mutlak net tutar kapsamı</small></strong><p>Dışlanan satış: {money(exposures.excludedSales)} · dışlanan müşteri iadesi: {money(exposures.excludedReturns)}. Eksik maliyet sıfır kabul edilmez.</p></div><div><span>Brüt kârın yöntemi</span><strong>Tarihsel tahmin</strong><p>{coveredSales === null ? "Kapsanan satış tutarı hesaplanamıyor" : `${money(coveredSales)} kapsanan satış üzerinden hesaplanır`}; giderler düşülmemiştir. Doğrulanmış net kâr değildir.</p></div></div><details className="c-method"><summary>Kaynak ve yöntem</summary><p>Rapor: {report.id}</p><p>Veri sonu: {date(s.cutoff)} · İçe aktarım: {s.importedAt ? date(s.importedAt) : "Kayıt yok"}</p><p>Paket: {report.purchasing.extractionId}</p><p>{Object.values(report.calculations).join(" · ")}</p><button className="c-text-action" onClick={openDetails}>Ayrıntılı rapora git →</button></details></details></div>
  </main>;
}

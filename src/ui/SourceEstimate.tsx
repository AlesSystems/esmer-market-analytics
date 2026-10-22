import {useContext,useEffect,useRef,useState,type ReactNode} from "react";
import type {EstimateTotals} from "../source/estimate";
import {AppFrame} from "./frame";
import {reasonLabels} from "../source/estimate";
import {Input} from "./components/ui/input";
import {Button} from "./components/ui/button";
import {Bridge,ChartFrame,DailyBars,EstimateBadge,RankBars,type ChartTable,type RankRow} from "./charts";
import {dailyDay,dailySeries,sourceBridgeSteps} from "./source-estimate-days";
import {count,date,money,percent} from "./format";
const amount=(value:string|null)=>value===null?"Bilinmiyor":money(value);
const coverage=(value:string|null)=>value===null?"Hesaplanamıyor":percent(value);
const returnLabel="İade tutarı adayı (katkıya dahil değil)";
export function SourceEstimate({hash,period,onProduct,active=true,presentation,heading,actions,onLoaded}:{onLoaded?:()=>void;presentation:"summary"|"products"|"report";active?:boolean;hash:string;period:string;heading:ReactNode;actions?:ReactNode;onProduct:(id:string,button?:HTMLButtonElement)=>void}) {
 const frame=useContext(AppFrame);
 const [loaded,setLoaded]=useState<{key:string;value:Awaited<ReturnType<typeof window.esmer.querySourceEstimate>>}>(),[offset,setOffset]=useState(0),[productId,setProductId]=useState<string|null>(null),[search,setSearch]=useState(""),[message,setMessage]=useState(""),[loading,setLoading]=useState(true),[exporting,setExporting]=useState(false);
 const [readFailed,setReadFailed]=useState(false),[retry,setRetry]=useState(0);
 const sequence=useRef(0);
 const key=JSON.stringify([hash,period,offset,productId]),queryResult=loaded?.key===key?loaded.value:null;
 useEffect(()=>{setOffset(0);setProductId(null);setSearch("");setLoaded(undefined);setMessage("");},[hash,period]);
 useEffect(()=>{if(!active||loaded?.key===key)return;const id=++sequence.current;setLoading(true);setReadFailed(false);setLoaded(undefined);setMessage("");window.esmer.querySourceEstimate({hash,period,view:"products",offset,productId}).then(value=>{if(id!==sequence.current)return;setLoaded({key,value});}).catch(()=>{if(id===sequence.current){setReadFailed(true);setMessage("Tahmin okunamadı.");}}).finally(()=>{if(id===sequence.current)setLoading(false);});return()=>{++sequence.current;};},[hash,period,offset,productId,active,key,retry]);
 async function exportReport(){const id=sequence.current;setExporting(true);setMessage("");try{const value=await window.esmer.exportSourceEstimate({hash,period});if(id!==sequence.current)return;if(value.status==="saved")setMessage("Doğrulanmamış tahmin kaydedildi.");else if(value.status!=="cancelled")setMessage(value.message);}catch{if(id===sequence.current)setMessage("Tahmin dosyası kaydedilemedi.");}finally{setExporting(false);}}
 const result=queryResult?.status==="source-estimate"?queryResult:null;
 const recovery=queryResult?.status==="source-unavailable"&&queryResult.code==="ESTIMATE_UNAVAILABLE";
 const ctx=`${hash}|${period}`,kept=useRef<{ctx:string;value:NonNullable<typeof result>}|null>(null);
 if(result)kept.current={ctx,value:result};
 const base=result??(kept.current?.ctx===ctx?kept.current.value:null);
 useEffect(()=>{if(result)onLoaded?.();},[result]);
 const totals=(t:EstimateTotals)=><><td className="number">{amount(t.candidateSaleAmount)}</td><td className="number">{amount(t.candidateReturnAmount)}</td><td className="number">{amount(t.coveredSaleAmount)}</td><td className="number">{amount(t.candidateCost)}</td><td className="number">{amount(t.contribution)}</td><td>{t.coveredLines} / {t.totalLines}</td></>;
 const headings=<><th>Satış tutarı adayı</th><th>İade tutarı adayı</th><th>Kapsanan satış adayı</th><th>Maliyet adayı</th><th>Kapsanan katkı</th><th>Kapsanan / tüm satırlar</th></>;

 const unknown=base?(()=>{const t=base.report.summary,parts=[];if(t.unknownSaleAmounts+t.unknownReturnAmounts>0)parts.push(`${count(t.unknownSaleAmounts)} satış ve ${count(t.unknownReturnAmounts)} iade adayının tutarı bilinmiyor; gösterilen tutarlar bilinen alt toplamdır.`);if(base.report.emptyDocuments>0)parts.push(`${count(base.report.emptyDocuments)} satırsız belgenin tutar etkisi bilinmiyor.`);return parts.join(" ");})():"";
 const rankRows:RankRow[]=base?base.ranking.map(row=>({id:row.productId,label:row.productName??`Ürün #${row.productId}`,value:row.contribution,detail:`Maliyet kapsamı ${coverage(row.costCoveragePercent)}`,focusKey:`estimate-rank-${hash}-${period}-${row.productId}`,onSelect:button=>onProduct(row.productId,button)})):[];
 const dailyTable:ChartTable|undefined=base?{caption:"Günlük tahminler",columns:[{label:"Tarih"},{label:"Satış tutarı adayı",numeric:true},{label:"Kapsanan satış adayı",numeric:true},{label:"Maliyet adayı",numeric:true},{label:"Kapsanan katkı",numeric:true},{label:"Maliyeti bilinmeyen satış",numeric:true},{label:"İade tutarı adayı",numeric:true},{label:"Kapsanan / tüm satırlar"},{label:"Tutarı bilinmeyen satır",numeric:true}],rows:base.report.days.map(d=>{const t=d.totals;return t?[date(d.date),amount(t.candidateSaleAmount),amount(t.coveredSaleAmount),amount(t.candidateCost),amount(t.contribution),amount(t.uncoveredSaleAmount),amount(t.candidateReturnAmount),`${t.coveredLines} / ${t.totalLines}`,count(t.unknownSaleAmounts+t.unknownReturnAmounts)]:[date(d.date),...Array.from({length:8},()=>"Kapsam dışı")];})}:undefined;
 const summary=base?.report.summary;
 const kpis=summary&&<div className="est-kpis">
  <article className="metric est-hero"><h3>Tahmini satış katkısı (kapsanan satırlar)</h3><strong>{amount(summary.contribution)}</strong><p>yalnız maliyeti bilinen satırlar · giderler dahil değil</p></article>
  <article className="metric"><h3>Kapsanan satış adayı</h3><strong>{amount(summary.coveredSaleAmount)}</strong><p>tüm satış adayı {amount(summary.candidateSaleAmount)}</p></article>
  <article className="metric"><h3>Maliyet kapsamı</h3><strong>{coverage(summary.costCoveragePercent)}</strong><p>{count(summary.coveredLines)} / {count(summary.totalLines)} satır</p></article>
  <article className="metric"><h3>İade tutarı adayı</h3><strong>{amount(summary.candidateReturnAmount)}</strong><p>katkıya dahil değil — sonucu yüksek gösterebilir</p></article>
 </div>;
 const dailyChart=base&&dailyTable&&<ChartFrame className="est-chart" headingLevel="h2" title={presentation==="report"?"Günlük tahminler":"Günlük tahmini katkı"} summary="Kapsam dışı günler boşluktur; boş günler satış yapılmadığını göstermez." legend={[...dailySeries.filter(item=>item.key!=="unknownAmount").map(item=>({key:item.key,label:item.label,color:item.color})),{key:"return",label:returnLabel,color:"var(--viz-negative)"},{key:"unknown",label:"Tutarı bilinmeyen satır (taralı)",color:"unknown"}]} table={dailyTable}>
  <DailyBars period={period} days={base.report.days.map(dailyDay)} series={dailySeries} formatValue={money} negativeLabel={returnLabel} plotHeight={200}/>
 </ChartFrame>;
 const rankChart=base&&<ChartFrame className="est-chart" headingLevel="h2" title={presentation==="products"?"Ürünlere göre tahmini satış katkısı":"En yüksek katkılı ürünler"} summary={presentation==="products"?"İlk 10 ürün · yalnız kapsanan satırlar. Katkı iadeleri içermez, sonucu yüksek gösterebilir. Ürün seçimi kaynak belgelerini açar.":"İlk 10 ürün · yalnız kapsanan satırlar. Ürün seçimi kaynak belgelerini açar."}>
  <RankBars rows={rankRows} color="var(--viz-contribution)" formatValue={money} ariaLabel="Ürünlere göre tahmini satış katkısı sıralaması" empty="Katkısı hesaplanabilen ürün yok."/>
 </ChartFrame>;
 const bridge=summary&&<ChartFrame className="est-chart" headingLevel="h2" title="Satıştan katkıya" summary="Maliyeti bilinmeyen satış katkıya girmez.">
  <Bridge steps={sourceBridgeSteps(summary)} formatValue={money}/>
 </ChartFrame>;
 return <section className="source-est" aria-label="Kaynak tahmini" aria-busy={loading}>
 <header className="est-head">{heading}<EstimateBadge label="Doğrulanmamış tahmin — net kâr değildir.">Birim, vergi, tamamlanma ve tarihsel maliyet anlamları doğrulanmadı. Giderler dahil değildir.</EstimateBadge><div className="est-actions">{presentation==="report"&&result&&<Button variant="outline" disabled={exporting} onClick={()=>void exportReport()}>{exporting?"Tahmin kaydediliyor…":"Tahmini Excel olarak kaydet"}</Button>}{actions}</div></header>
 {loading&&<p role="status">Tahmin yükleniyor…</p>}{queryResult&&queryResult.status!=="source-estimate"&&<p role="status">{queryResult.message}</p>}{recovery&&<><p>Tahmin için maliyet adayı içeren veri paketi seçin.</p>{frame&&<Button variant="outline" onClick={()=>frame.show("settings")}>Veri paketi içe aktarmaya git</Button>}</>}{message&&<p role="status">{message}</p>}{readFailed&&!loading&&<Button variant="outline" onClick={()=>setRetry(value=>value+1)}>Tahmini yeniden yükle</Button>}
 {base&&<>
 {presentation!=="products"&&kpis}
 {unknown&&<p className="est-unknown">{unknown}</p>}
 {presentation==="summary"&&<>{bridge}{dailyChart}{rankChart}</>}
 {presentation==="report"&&dailyChart}
 {presentation==="products"&&rankChart}
 {presentation!=="summary"&&result&&<div className="est-products"><h2>Ürünlere göre tahmin</h2><div className="report-actions"><label>Ürün kayıt ID’siyle ara<Input value={search} onChange={event=>setSearch(event.target.value)}/></label><Button variant="outline" disabled={search!==""&&!/^-?(?:0|[1-9][0-9]{0,18})$/.test(search)} onClick={()=>{setOffset(0);setProductId(search||null);}}>Tahmini ürünü ara</Button><Button variant="outline" onClick={()=>{setSearch("");setProductId(null);setOffset(0);}}>Tüm tahmini ürünler</Button></div><div className="table-scroll est-table"><table aria-label="Ürün tahminleri"><thead><tr><th>Ürün</th>{headings}</tr></thead><tbody>{result.products.map(p=><tr key={p.productId}><td><Button variant="link" data-focus-key={`estimate-product-${hash}-${period}-${p.productId}`} onClick={event=>onProduct(p.productId,event.currentTarget)}>Ürün #{p.productId}</Button></td>{totals(p.totals)}</tr>)}</tbody></table></div><nav aria-label="Tahmini ürün sayfaları" className="report-actions"><Button variant="outline" disabled={loading||result.offset===0} onClick={()=>setOffset(Math.max(0,result.offset-50))}>Önceki tahmini ürünler</Button><span>{result.total?`${result.offset+1}–${Math.min(result.offset+50,result.total)} / ${result.total}`:"Ürün yok"}</span><Button variant="outline" disabled={loading||result.offset+50>=result.total} onClick={()=>setOffset(result.offset+50)}>Sonraki tahmini ürünler</Button></nav></div>}
 <div className="est-details">
 <details><summary>Maliyet kapsamı ve dışlanan satırlar</summary><ul>{Object.entries(base.report.summary.exclusions).map(([reason,n])=><li key={reason}>{reasonLabels[reason as keyof typeof reasonLabels]}: {n}</li>)}</ul></details>
 <details><summary>Tahmin yöntemi ve kaynak sürümü</summary><p className="report-id">Sürüm: {base.report.calculationVersion}<br/>Kaynak: {base.report.sourceHash}<br/>Kapsam: {base.report.from}–{base.report.to}<br/>Hazırlanma: {base.report.extractedAt}</p><ul>{base.report.assumptions.map(([id,label])=><li key={id}>{label}</li>)}</ul><p>Tahminler geçicidir; mali rapor olarak onaylanmaz. Yeni paket bu görünümü değiştirir. Excel tüm ürün ve günleri içerir.</p></details>
 </div>
 </>}</section>;
}

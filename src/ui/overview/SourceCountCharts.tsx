import {ChartFrame,DailyBars,RankBars,type DailyDay} from "../charts";
import {monthDates} from "../charts/geometry";
import type {SourceView} from "../SourceWorkspace";
import {typeLabel} from "../source-fields";

export const count=(value:number)=>value.toLocaleString("tr-TR");
const countText=(value:string)=>count(Number(value));
const countTick=(value:number)=>count(Math.round(value));
const documents={key:"documents",label:"Belge kaydı",color:"var(--viz-sales)"};

/** Day columns for a recorded-document count chart. A day without records inside the backup window is unknown (sparse data), outside the window it is out of range; neither is zero. */
export function dailyCountDays(view:Pick<SourceView,"days"|"from"|"to">,period:string):DailyDay[] {
 const first=view.from.slice(0,10),last=view.to.slice(0,10),recorded=new Map(view.days.map(row=>[row.date,row.documents]));
 return monthDates(period).flatMap((date):DailyDay[]=>{
  if(date<first||date>last)return [];
  const documentsOnDay=recorded.get(date);
  return [documentsOnDay===undefined?{date,segments:[],state:"unknown"}:{date,segments:[{key:"documents",value:String(documentsOnDay)}],state:"value"}];
 });
}

export function SourceDailyCounts({view,period,outside,title="Günlük belge kayıtları",ariaLabel="Günlük kaynak belge kayıtları",note="Kayıt sayısıdır; tutar veya tamamlanmış işlem değildir. Kayıt görünmeyen günler sıfır kabul edilmez.",emptyText}:{view:SourceView;period:string;outside:boolean;title?:string;ariaLabel?:string;note?:string;emptyText?:string}) {
 const empty=view.days.length===0;
 return <ChartFrame className="source-count-chart" title={title} summary={empty?undefined:note} headingLevel="h2">
  {empty?<p className="viz-empty">{outside?"Günlük kayıtlar bu dönem için gösterilemiyor; dönem yedek kapsamında değil.":emptyText??"Bu dönem için günlük belge kaydı yok."}</p>:<DailyBars period={period} days={dailyCountDays(view,period)} series={[documents]} formatValue={countText} formatTick={countTick} integerTicks ariaLabel={ariaLabel} plotHeight={160}/>}
 </ChartFrame>;
}

export function SourceTypeCounts({view,outside}:{view:SourceView;outside:boolean}) {
 const empty=view.types.length===0;
 return <ChartFrame className="source-count-chart" title="Kaynak belge türleri" summary={empty?undefined:`${view.types.length} / ${view.typeTotal} tür kodu gösteriliyor; ${view.typeTotal>view.types.length?"diğer türler grafikte ve tabloda yok. ":""}Tarihsel tür adları mali sınıflandırma değildir.`} headingLevel="h2">
  {empty?<p className="viz-empty">{outside?"Belge türleri bu dönem için gösterilemiyor; dönem yedek kapsamında değil.":"Bu dönem için belge türü kaydı yok."}</p>:<RankBars rows={view.types.map(row=>({id:row.code,label:typeLabel(row.code),value:String(row.documents)}))} color="var(--viz-sales)" formatValue={countText} ariaLabel="Kaynak belge türlerine göre kayıt sayıları"/>}
 </ChartFrame>;
}

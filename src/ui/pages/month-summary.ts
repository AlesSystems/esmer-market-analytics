/** Display text only. Number() is used for rounding and scaling the words; no amount feeds another amount. */
const names=["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];
const locative=["Ocak'ta","Şubat'ta","Mart'ta","Nisan'da","Mayıs'ta","Haziran'da","Temmuz'da","Ağustos'ta","Eylül'de","Ekim'de","Kasım'da","Aralık'ta"];
const index=(month:string)=>Number(month.slice(5,7))-1;
export const monthName=(month:string)=>`${names[index(month)]} ${month.slice(0,4)}`;
export const monthShort=(month:string)=>names[index(month)].slice(0,3);
const format=(value:number,digits:number)=>new Intl.NumberFormat("tr-TR",{maximumFractionDigits:digits}).format(value);

/** "1,97 milyon ₺", "296 bin ₺", "57,5 ₺". */
export function wordMoney(value:string):string {
 const number=Number(value),abs=Math.abs(number),sign=number<0?"-":"";
 if(abs>=1e6)return `${sign}${format(abs/1e6,2)} milyon ₺`;
 if(abs>=1e3)return `${sign}${format(abs/1e3,1)} bin ₺`;
 return `${sign}${format(abs,2)} ₺`;
}
const positive=(value:string)=>value.replace(/^-/,"");
const whole=(value:string)=>format(Math.round(Number(positive(value))),0);

export function monthSummary(month:string,t:{sales:string|null;grossProfit:string|null;marginPct:string|null;unknownCostSales?:string}):string {
 if(t.sales===null)return `${names[index(month)]} ayının satış tutarı bilinmiyor.`;
 const opening=`${locative[index(month)]} ${wordMoney(t.sales)} satış yaptınız`;
 if(t.grossProfit===null)return `${opening}; maliyetler bilinmediği için brüt kâr hesaplanamadı.`;
 const loss=t.grossProfit.startsWith("-");
 const gross=`${opening}; tahmini brüt ${loss?"zarar":"kâr"} ${wordMoney(positive(t.grossProfit))}`;
 if(t.marginPct===null)return `${gross}.`;
 // The margin is over known-cost sales; say so whenever some sales have no cost.
 const base=t.unknownCostSales!==undefined&&!/^-?0+(\.0+)?$/.test(t.unknownCostSales)?"maliyeti bilinen her":"her";
 return loss||t.marginPct.startsWith("-")?`${gross} — ${base} 100 ₺'lik satışta ${whole(t.marginPct)} ₺ zarar.`:`${gross} — ${base} 100 ₺'lik satıştan ${whole(t.marginPct)} ₺.`;
}

type BridgeTotals={sales:string|null;knownCostSales:string;cost:string|null;grossProfit:string|null;unknownCostSales:string;unknownSaleAmounts:number;expenses:string|null;netProfit:string|null};
type Step={label:string;value:string|null;kind:"total"|"minus"|"result"|"unknown";detail?:string};
const zero=(value:string)=>/^-?0+(\.0+)?$/.test(value);
/** Satış → (maliyeti bilinmeyen satış kenara) → mal maliyeti → brüt kâr → giderler → net kâr. Service strings pass through untouched. */
export function monthBridgeSteps(t:BridgeTotals):Step[] {
 const aside=!zero(t.unknownCostSales)||t.unknownSaleAmounts>0;
 return [
  {label:"Satış",value:aside?t.sales:t.knownCostSales,kind:"total"},
  ...(aside?[{label:"Maliyeti bilinmeyen satış",value:t.unknownCostSales,kind:"unknown" as const,detail:`kenara ayrıldı · kâra dahil değil${t.unknownSaleAmounts>0?" · bilinen alt toplam":""}`},{label:"Maliyeti bilinen satış",value:t.knownCostSales,kind:"total" as const}]:[]),
  {label:"Mal maliyeti",value:t.cost,kind:"minus"},
  {label:"Brüt kâr",value:t.grossProfit,kind:"total"},
  t.expenses===null?{label:"Giderler",value:null,kind:"minus",detail:"eksik"}:{label:"Giderler",value:t.expenses,kind:"minus"},
  t.netProfit===null?{label:"Net kâr",value:null,kind:"result",detail:"hesaplanamadı"}:{label:"Net kâr",value:t.netProfit,kind:"result"},
 ];
}

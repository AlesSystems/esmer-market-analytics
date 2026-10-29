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
 // Pick the unit after rounding: 999.960 is "1 milyon", not "1.000 bin".
 if(abs>=1e6||Math.round(abs/100)/10>=1000)return `${sign}${format(abs/1e6,2)} milyon ₺`;
 if(abs>=1e3)return `${sign}${format(abs/1e3,1)} bin ₺`;
 return `${sign}${format(abs,2)} ₺`;
}
/** "%13,37"; a negative value reads "-%10,00" (the sign goes before the percent mark). */
export function percentText(value:string):string {
 const abs=value.replace(/^-/,""),[integer,fraction=""]=abs.split(".");
 return `${value.startsWith("-")?"-":""}%${integer.replace(/\B(?=(\d{3})+(?!\d))/g,".")}${fraction?`,${fraction}`:""}`;
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

const dative=["Ocak'a","Şubat'a","Mart'a","Nisan'a","Mayıs'a","Haziran'a","Temmuz'a","Ağustos'a","Eylül'e","Ekim'e","Kasım'a","Aralık'a"];
export const monthLocative=(month:string)=>locative[index(month)];
export const monthDative=(month:string)=>dative[index(month)];
const previousOf=(month:string)=>{const d=new Date(`${month}-01T00:00:00Z`);d.setUTCMonth(d.getUTCMonth()-1);return d.toISOString().slice(0,7);};

/** "Ekim'de 1,97 milyon ₺ satış yaptınız. Tahmini brüt kâr": the sentence the hero amount completes. */
export function monthLead(month:string,sales:string|null):string {
 return sales===null?`${names[index(month)]} ayının satış tutarı bilinmiyor. Tahmini brüt kâr`:`${locative[index(month)]} ${wordMoney(sales)} satış yaptınız. Tahmini brüt kâr`;
}

/** "Her 100 ₺'lik satıştan 15 ₺ kâr kaldı."; the margin is over known-cost sales, and the line says so whenever some sales have no cost. Null when the margin is unknown. */
export function marginLine(t:{marginPct:string|null;unknownCostSales:string}):string|null {
 if(t.marginPct===null)return null;
 const base=!/^-?0+(\.0+)?$/.test(t.unknownCostSales)?"Maliyeti bilinen her":"Her";
 return t.marginPct.startsWith("-")?`${base} 100 ₺'lik satışta ${whole(t.marginPct)} ₺ zarar.`:`${base} 100 ₺'lik satıştan ${whole(t.marginPct)} ₺ kâr kaldı.`;
}

/** "Eylül'e göre %10,60 fazla"; the percentage is the service's, only its sign is read. Null without a comparison. */
export function monthChange(month:string,pct:string|null):string|null {
 if(pct===null)return null;
 const against=`${dative[index(previousOf(month))]} göre`;
 if(/^-?0+(\.0+)?$/.test(pct))return `${against} değişmedi`;
 return `${against} ${percentText(positive(pct))} ${pct.startsWith("-")?"az":"fazla"}`;
}

const zero=(value:string)=>/^-?0+(\.0+)?$/.test(value);
/** Which way the month-on-month arrow points. A zero change or no comparison has no arrow. The percentage is the service's, only its sign is read. */
export function changeArrow(pct:string|null):"up"|"down"|null {
 if(pct===null||zero(pct))return null;
 return pct.startsWith("-")?"down":"up";
}

type BridgeTotals={sales:string|null;knownCostSales:string;cost:string|null;grossProfit:string|null;unknownCostSales:string;unknownSaleAmounts:number;expenses:string|null;netProfit:string|null};
type Step={label:string;value:string|null;kind:"total"|"minus"|"result"|"unknown";detail?:string};
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

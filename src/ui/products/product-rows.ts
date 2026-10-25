import type {MonthProfitProduct} from "../../source/month-profit";

/** Table order, filtering and search for Ürünler. Membership comes from service flags; values are only compared, never combined. */
export type SortKey="name"|"sales"|"cost"|"grossProfit"|"marginPct"|"marginChangePoints";
export type Sort={key:SortKey;direction:"ascending"|"descending"};
export type QuickFilter="all"|"loss"|"lowMargin10"|"marginDrop"|"missingCost";
export const defaultSort:Sort={key:"grossProfit",direction:"descending"};
export const quickFilters:[QuickFilter,string][]=[["all","Tümü"],["loss","Zarar edenler"],["lowMargin10","Marjı %10 altı"],["marginDrop","Marjı düşenler"],["missingCost","Maliyeti eksik"]];

export const productName=(p:Pick<MonthProfitProduct,"id"|"name">)=>p.name??`Ürün #${p.id}`;
const byId=(a:string,b:string)=>a.length-b.length||(a<b?-1:a>b?1:0);
const collator=new Intl.Collator("tr",{sensitivity:"base"});

/** Text columns sort A→Z first; number columns highest first. A repeated click reverses. */
export function nextSort(current:Sort,key:SortKey):Sort {
 if(current.key===key)return {key,direction:current.direction==="ascending"?"descending":"ascending"};
 return {key,direction:key==="name"?"ascending":"descending"};
}

/** Unknown values stay last in both directions; ties fall back to the product ID. */
export function sortProducts(rows:MonthProfitProduct[],sort:Sort):MonthProfitProduct[] {
 const sign=sort.direction==="ascending"?1:-1;
 return [...rows].sort((a,b)=>{
  if(sort.key==="name")return sign*collator.compare(productName(a),productName(b))||byId(a.id,b.id);
  const x=a[sort.key],y=b[sort.key];
  if(x===null||y===null)return x===y?byId(a.id,b.id):x===null?1:-1;
  return sign*(Number(x)-Number(y))||byId(a.id,b.id);
 });
}

/** Search matches the product name (Turkish case rules) or its exact ID, with or without "#". */
export function matchesSearch(p:MonthProfitProduct,query:string):boolean {
 const q=query.trim().toLocaleLowerCase("tr");
 if(!q)return true;
 return q.replace(/^#/,"")===p.id||(p.name??"").toLocaleLowerCase("tr").includes(q);
}

export function visibleProducts(rows:MonthProfitProduct[],{query,filter,sort}:{query:string;filter:QuickFilter;sort:Sort}):MonthProfitProduct[] {
 return sortProducts(rows.filter(p=>(filter==="all"||p.flags[filter])&&matchesSearch(p,query)),sort);
}

import type {MonthProfitProduct} from "../../source/month-profit";

/** Table order, filtering and search for Ürünler. Membership comes from service flags; values are only compared, never combined. */
export type SortKey="name"|"sales"|"grossProfit"|"marginPct";
export type Sort={key:SortKey;direction:"ascending"|"descending"};
export type QuickFilter="all"|"attention"|"missingCost";
export const defaultSort:Sort={key:"grossProfit",direction:"descending"};
export const quickFilters:[QuickFilter,string][]=[["all","Tümü"],["attention","Zarar · marj düştü"],["missingCost","Alış fiyatı yok"]];
const inFilter=(p:MonthProfitProduct,filter:QuickFilter)=>filter==="all"||(filter==="attention"?p.flags.loss||p.flags.marginDrop:p.flags.missingCost);
/** How many products each filter holds, ignoring the search. */
export const filterCounts=(rows:MonthProfitProduct[]):Record<QuickFilter,number>=>({all:rows.length,attention:rows.filter(p=>inFilter(p,"attention")).length,missingCost:rows.filter(p=>inFilter(p,"missingCost")).length});

export const productName=(p:Pick<MonthProfitProduct,"id"|"name">)=>p.name??`Ürün #${p.id}`;
const byId=(a:string,b:string)=>a.length-b.length||(a<b?-1:a>b?1:0);
const collator=new Intl.Collator("tr",{sensitivity:"base"});

/** Text columns sort A→Z first; number columns highest first. A repeated click reverses. */
export function nextSort(current:Sort,key:SortKey):Sort {
 if(current.key===key)return {key,direction:current.direction==="ascending"?"descending":"ascending"};
 return {key,direction:key==="name"?"ascending":"descending"};
}

/** Unknown values stay last in both directions; ties fall back to the product ID. Numbers are parsed once per sort. */
export function sortProducts(rows:MonthProfitProduct[],sort:Sort):MonthProfitProduct[] {
 const sign=sort.direction==="ascending"?1:-1;
 const keyed=rows.map(p=>({p,name:sort.key==="name"?productName(p):"",n:sort.key==="name"||p[sort.key]===null?null:Number(p[sort.key])}));
 return keyed.sort((a,b)=>{
  if(sort.key==="name")return sign*collator.compare(a.name,b.name)||byId(a.p.id,b.p.id);
  if(a.n===null||b.n===null)return a.n===b.n?byId(a.p.id,b.p.id):a.n===null?1:-1;
  return sign*(a.n-b.n)||byId(a.p.id,b.p.id);
 }).map(r=>r.p);
}

/** Lowercased text each product is searched by, built once per view: the displayed name (including the "Ürün #12" fallback). */
export const searchIndex=(rows:MonthProfitProduct[]):Map<string,string>=>new Map(rows.map(p=>[p.id,productName(p).toLocaleLowerCase("tr")]));

/** Search matches the displayed product name (Turkish case rules) or its exact ID, with or without "#". */
export function matchesSearch(p:MonthProfitProduct,query:string,index?:Map<string,string>):boolean {
 const q=query.trim().toLocaleLowerCase("tr");
 if(!q)return true;
 return q.replace(/^#/,"")===p.id||(index?.get(p.id)??productName(p).toLocaleLowerCase("tr")).includes(q);
}

export function visibleProducts(rows:MonthProfitProduct[],{query,filter,sort}:{query:string;filter:QuickFilter;sort:Sort},index?:Map<string,string>):MonthProfitProduct[] {
 return sortProducts(rows.filter(p=>inFilter(p,filter)&&matchesSearch(p,query,index)),sort);
}

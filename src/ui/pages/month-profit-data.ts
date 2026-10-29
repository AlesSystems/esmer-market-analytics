import {createContext,createElement,useContext,useEffect,useState,type ReactNode} from "react";
import type {MonthProfitResult} from "../../source/month-profit";

export type MonthProfitRead=({month:string;result:MonthProfitResult}|{month:string;failed:string})&{revision?:unknown};

/** Reads the month profit view. `read` is the answer for the month asked for; while another month loads it is undefined, so a month change never shows the previous month's figures under the new label. */
export function useMonthProfit(month:string|null,active:boolean,revision:unknown){
 const [read,setRead]=useState<MonthProfitRead>();
 const [loading,setLoading]=useState(false);
 const [attempt,setAttempt]=useState(0);
 useEffect(()=>{
  if(!active||!month)return;
  let live=true;setLoading(true);
  window.esmer.readMonthProfit({month}).then(result=>{if(!live)return;setRead(result.status==="month-profit"||result.status==="source-unavailable"?{month,result,revision}:{month,failed:result.message,revision});})
   .catch(()=>{if(live)setRead({month,failed:"Yerel hizmete ulaşılamadı.",revision});})
   .finally(()=>{if(live)setLoading(false);});
  return()=>{live=false;};
 },[month,active,attempt,revision]);
 /** An answer read under an older expense revision, or for another month, is dropped: a stale net profit never sits next to the new state, and last month's figures never sit under this month's label. */
 return {read:read&&read.revision===revision&&read.month===month?read:undefined,loading,retry:()=>setAttempt(value=>value+1)};
}

export type MonthProfitState=ReturnType<typeof useMonthProfit>;
const Context=createContext<MonthProfitState|null>(null);
/** One read of the selected month for Bu ay, Ürünler and the Excel button, instead of one per page. */
export function MonthProfitProvider({month,active,revision,children}:{month:string|null;active:boolean;revision:unknown;children:ReactNode}){
 const state=useMonthProfit(month,active,revision);
 return createElement(Context.Provider,{value:state},children);
}
export function useMonthProfitContext():MonthProfitState{
 const state=useContext(Context);
 if(!state)throw new Error("MonthProfitProvider missing");
 return state;
}

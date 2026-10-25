import {useEffect,useState} from "react";
import type {MonthProfitResult} from "../../source/month-profit";

export type MonthProfitRead=({month:string;result:MonthProfitResult}|{month:string;failed:string})&{revision?:unknown};

/** Reads the month profit view. Keeps the last answer while the next month loads, so a month change never flashes empty. */
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
 /** An answer read under an older expense revision is dropped, so a stale net profit never sits next to the new state. */
 return {read:read&&read.revision===revision?read:undefined,loading,retry:()=>setAttempt(value=>value+1)};
}

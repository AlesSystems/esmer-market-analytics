import type { ReportContext } from "../reports/contracts";
export function createMonthlyRead<T>(read: (context: ReportContext) => Promise<T>) {
  const pending=new Map<string,Promise<T>>();
  return (context: ReportContext): Promise<T> => {
    const key=JSON.stringify([context.sessionId,context.datasetId,context.appRevision,context.calculationVersion,context.period]);
    const existing=pending.get(key);
    if(existing)return existing;
    const result=read(context).finally(()=>pending.delete(key));
    pending.set(key,result);
    return result;
  };
}

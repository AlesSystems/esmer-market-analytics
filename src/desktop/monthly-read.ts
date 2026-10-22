import type { ReportContext } from "../reports/contracts";
export function createMonthlyRead<T>(read: (context: ReportContext) => Promise<T>) {
  return (context: ReportContext): Promise<T> => read(context);
}

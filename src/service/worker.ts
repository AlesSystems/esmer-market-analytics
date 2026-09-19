import { parentPort, workerData } from "node:worker_threads";
import type { ServiceRequest, ServiceResponse } from "../domain/contracts";
import { importErrorCode, openStore } from "../store/store";
import { importOutcome } from "./operations";
import { SalesReports } from "../reports/query";
let reports: SalesReports | undefined;
let store: ReturnType<typeof openStore> | undefined;
try {
  if (!workerData || typeof workerData.databasePath !== "string") throw new Error("INVALID_SERVICE_CONFIG");
  store = openStore(workerData.databasePath);
  reports = new SalesReports(store);
} catch { store?.close(); store = undefined; }
parentPort?.on("message", (request: ServiceRequest) => {
  let result: ServiceResponse["result"];
  try {
    if (!store) throw new Error("SERVICE_UNAVAILABLE");
    if (request.operation === "getAvailability") result = store.availability();
    else if (request.operation === "openSales") result = reports!.open(request.payload);
    else if (request.operation === "querySales") result = reports!.query(request.payload);
    else if (request.operation === "inspectSales") result = reports!.inspect(request.payload);
    else {
      store.prune();
      result = importOutcome(store.importPackage(request.bytes));
    }
  } catch (error) {
    result = request.operation !== "importPackage"
      ? { status: "unavailable", code: "SERVICE_UNAVAILABLE", message: "Yerel hizmet başlatılamadı. Uygulamayı yeniden açın." }
      : store ? importOutcome({ status: "failed", code: importErrorCode(error) }) : { status: "failed", code: "SERVICE_UNAVAILABLE", message: "Yerel hizmete ulaşılamadı. Uygulamayı yeniden açın." };
  }
  parentPort?.postMessage({ id: request.id, result } satisfies ServiceResponse);
});
parentPort?.on("close", () => store?.close());

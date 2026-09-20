import { expect, test } from "vitest";
import { openStore } from "../../src/store/store";
import { SalesReports } from "../../src/reports/query";
import { salesPackage } from "../helpers/sales-fixtures";

test("purchasing shares the sales snapshot and rejects stale contexts without inventing legacy cost", () => {
  const store = openStore(":memory:");
  try {
    store.importPackage(salesPackage());
    const reports = new SalesReports(store), opened = reports.open({ period: null });
    if (opened.status !== "report") throw new Error("Expected sales report");
    const result = reports.purchasing({ context: opened.view.context });
    expect(result.status).toBe("purchasing");
    if (result.status !== "purchasing") throw new Error("Expected purchasing view");
    expect(result.view.gross.status).toBe("unavailable");
    expect(result.view.purchasing.status).toBe("unavailable");
    expect(reports.purchasing({ context: { ...opened.view.context, sessionId: "forged" } })).toMatchObject({ status: "unavailable", code: "STALE_CONTEXT" });
    reports.open({ period: "2025-08" });
    expect(reports.purchasing({ context: opened.view.context })).toMatchObject({ status: "unavailable", code: "STALE_CONTEXT" });
  } finally { store.close(); }
});

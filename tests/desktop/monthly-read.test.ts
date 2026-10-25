import { test, expect, _electron as electron } from "@playwright/test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { openStore } from "../../src/store/store";
import { savePreferences } from "../../src/desktop/preferences";
import { richBusinessPackage, seedRichExpenses } from "../helpers/rich-business-fixture";
import { executablePath } from "../helpers/desktop-executable";
import { openReportView, openWorkspace } from "../helpers/desktop-navigation";

test("identical monthly preload reads and Bu ay to sales navigation complete without busy",async()=>{
 const userData=await mkdtemp(join(tmpdir(),"esmer-monthly-read-")),store=openStore(join(userData,"analytics.sqlite"));
 try {store.importPackage(richBusinessPackage());seedRichExpenses(store);}finally{store.close();}
 await savePreferences(userData,{selectedMonth:"2025-09",textSize:"normal"});
 const app=await electron.launch({executablePath,args:[`--user-data-dir=${userData}`]});
 try {
  const page=await app.firstWindow();
  await openWorkspace(page);
  await expect(page.getByLabel("Dönem",{exact:true}).filter({visible:true})).toHaveValue("2025-09");
  await expect(page.locator('[aria-busy="true"]:visible')).toHaveCount(0);
  const results=await page.evaluate(async()=>{
   const opened=await window.esmer.openSales({period:"2025-09"});
   if(opened.status!=="report")throw Error("Synthetic sales context unavailable");
   return Promise.all([window.esmer.queryMonthly({context:opened.view.context}),window.esmer.queryMonthly({context:{...opened.view.context}})]);
  });
  expect(results).toMatchObject([{status:"monthly"},{status:"monthly"}]);
  expect(results[0]).toEqual(results[1]);
  await page.reload();
  await openWorkspace(page);
  await expect(page.getByLabel("Dönem",{exact:true}).filter({visible:true})).toHaveValue("2025-09");
  await openReportView(page,"Veri ve kaynak");
  await expect(page.getByRole("heading",{name:"Satışlar",exact:true})).toBeVisible();
  await expect(page.getByText("Başka bir işlem sürüyor. Tamamlandığında yeniden deneyin.",{exact:true})).toHaveCount(0);
  const chart=page.locator(".c-viz-profit:visible");
  await expect(chart.locator(".viz-tick")).toContainText(["0 ₺","2 B ₺","4 B ₺"]);
  const firstDay=chart.locator('[data-date="2025-09-01"] [data-key="profit"]');
  await expect.poll(()=>firstDay.evaluate(node=>(node as SVGGraphicsElement).getBBox().height)).toBeGreaterThan(90);
 }finally{await app.close();await rm(userData,{recursive:true,force:true});}
});

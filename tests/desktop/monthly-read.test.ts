import { test, expect, _electron as electron } from "@playwright/test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { openStore } from "../../src/store/store";
import { savePreferences } from "../../src/desktop/preferences";
import { richBusinessPackage, seedRichExpenses } from "../helpers/rich-business-fixture";
import { executablePath } from "../helpers/desktop-executable";

test("identical monthly preload reads and summary to sales navigation complete without busy",async()=>{
 const userData=await mkdtemp(join(tmpdir(),"esmer-monthly-read-")),store=openStore(join(userData,"analytics.sqlite"));
 try {store.importPackage(richBusinessPackage());seedRichExpenses(store);}finally{store.close();}
 await savePreferences(userData,{selectedMonth:"2025-09",textSize:"normal"});
 const app=await electron.launch({executablePath,args:[`--user-data-dir=${userData}`]});
 try {
  const page=await app.firstWindow();
  await expect(page.getByRole("heading",{name:"Marketinize bir bütün olarak bakın."})).toBeVisible();
  const results=await page.evaluate(async()=>{
   const opened=await window.esmer.openSales({period:"2025-09"});
   if(opened.status!=="report")throw Error("Synthetic sales context unavailable");
   return Promise.all([window.esmer.queryMonthly({context:opened.view.context}),window.esmer.queryMonthly({context:{...opened.view.context}})]);
  });
  expect(results.map(result=>result.status)).toEqual(["monthly","monthly"]);
  expect(results[0]).toEqual(results[1]);
  await page.reload();
  await page.getByRole("button",{name:"Özeti aç",exact:true}).click();
  await expect(page.getByRole("heading",{name:"Ay bir bakışta",exact:true})).toBeVisible();
  await page.getByRole("navigation",{name:"Ana gezinme"}).getByRole("button",{name:"Satışlar",exact:true}).click();
  await expect(page.getByRole("heading",{name:"Satışlar",exact:true})).toBeVisible();
  await expect(page.getByText("Başka bir işlem sürüyor. Tamamlandığında yeniden deneyin.",{exact:true})).toHaveCount(0);
 }finally{await app.close();await rm(userData,{recursive:true,force:true});}
});

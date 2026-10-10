import { openWorkspace } from "../helpers/desktop-navigation";
import { test, expect, _electron as electron } from "@playwright/test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { openStore } from "../../src/store/store";
import { businessPackage, businessRecords, addPurchase } from "../helpers/business-fixtures";
import { executablePath } from "../helpers/desktop-executable";
test("complete invoice list preserves empty documents and returns to page and keyboard row", async () => {
 const userData=await mkdtemp(join(tmpdir(),"esmer-invoices-")),records=businessRecords();addPurchase(records,"P1");
 const template=records.documents.find(row=>row.id==="P1")!;
 for(let index=0;index<55;index++)records.documents.push({...structuredClone(template),id:`EMPTY-${String(index).padStart(3,"0")}`,supplierId:null});
 const store=openStore(join(userData,"analytics.sqlite"));try{store.importPackage(businessPackage(records));}finally{store.close();}
 const app=await electron.launch({executablePath,args:[`--user-data-dir=${userData}`]});
 try {
  const page=await app.firstWindow();await openWorkspace(page);await page.getByRole("navigation",{name:"Ana gezinme"}).getByRole("button",{name:"Alışlar ve maliyet",exact:true}).click();
  await expect(page.getByRole("heading",{name:"Faturalar",exact:true})).toBeVisible();
  await expect(page.getByRole("heading",{name:"Son alışlar",exact:true})).toBeVisible();
  await page.getByRole("button",{name:"Sonraki 50 kayıt",exact:true}).click();
  const row=page.getByRole("button",{name:"Belgeyi aç EMPTY-050",exact:true});await expect(row).toBeVisible();await page.setViewportSize({width:560,height:720});
  const table=page.getByRole("region",{name:"Fatura kayıtları tablosu",exact:true});
  await table.evaluate(element=>{element.style.maxHeight="90px";element.querySelector("table")!.style.minWidth="1000px";element.scrollLeft=120;element.scrollTop=20;});
  const scroll=await table.evaluate(element=>({x:element.scrollLeft,y:element.scrollTop}));
  expect(scroll.x).toBeGreaterThan(0);expect(scroll.y).toBeGreaterThan(0);
  await row.evaluate(element=>element.focus({preventScroll:true}));await page.keyboard.press("Enter");
  await expect(page.getByRole("region",{name:"Fatura ayrıntıları",exact:true})).toContainText("Fatura numarası mevcut değil");
  await expect(page.getByRole("region",{name:"Fatura ayrıntıları",exact:true})).toContainText("Tedarikçi bilgisi mevcut değil");
  await expect(page.getByRole("region",{name:"Fatura ayrıntıları",exact:true})).toContainText("saklanan satırı yok");
  await page.getByRole("navigation",{name:"Ana gezinme"}).getByRole("button",{name:"Alışlar ve maliyet",exact:true}).click();
  await expect(row).toBeFocused();expect(await table.evaluate(element=>({x:element.scrollLeft,y:element.scrollTop}))).toEqual(scroll);await expect(page.getByText("51–56 / 56",{exact:true})).toBeVisible();
  await page.getByRole("navigation",{name:"Ana gezinme"}).getByRole("button",{name:"Satışlar",exact:true}).click();
  await page.getByRole("navigation",{name:"Ana gezinme"}).getByRole("button",{name:"Alışlar ve maliyet",exact:true}).click();
  await expect(page.getByText("51–56 / 56",{exact:true})).toBeVisible();
 } finally {await app.close();await rm(userData,{recursive:true,force:true});}
});

test("hidden purchasing detail never handles another page Escape key", async () => {
 const userData=await mkdtemp(join(tmpdir(),"esmer-hidden-purchase-")),records=businessRecords();addPurchase(records,"P1");
 const store=openStore(join(userData,"analytics.sqlite"));try{store.importPackage(businessPackage(records));}finally{store.close();}
 const app=await electron.launch({executablePath,args:[`--user-data-dir=${userData}`]});
 try {
  const page=await app.firstWindow();await openWorkspace(page);await page.getByRole("navigation",{name:"Ana gezinme"}).getByRole("button",{name:"Alışlar ve maliyet",exact:true}).click();
  await page.getByRole("button",{name:"P1",exact:true}).click();await expect(page.getByRole("heading",{name:"Maliyet ve alış kaynak detayı",exact:true})).toBeVisible();
  await page.getByRole("navigation",{name:"Ana gezinme"}).getByRole("button",{name:"Giderler",exact:true}).click();
  const button=page.getByRole("button",{name:"Gider ekle",exact:true});await button.focus();const scroll=await page.evaluate(()=>({x:scrollX,y:scrollY}));await page.keyboard.press("Escape");await expect(button).toBeFocused();expect(await page.evaluate(()=>({x:scrollX,y:scrollY}))).toEqual(scroll);
  await page.getByRole("navigation",{name:"Ana gezinme"}).getByRole("button",{name:"Alışlar ve maliyet",exact:true}).click();await expect(page.getByRole("heading",{name:"Maliyet ve alış kaynak detayı",exact:true})).toBeVisible();
  await page.getByRole("button",{name:"Ayarlar",exact:true}).click();await expect(page.getByRole("heading",{name:"Ayarlar",exact:true})).toBeVisible();await page.keyboard.press("Escape");
  await page.getByRole("navigation",{name:"Ana gezinme"}).getByRole("button",{name:"Alışlar ve maliyet",exact:true}).click();await expect(page.getByRole("heading",{name:"Maliyet ve alış kaynak detayı",exact:true})).toBeVisible();
 } finally {await app.close();await rm(userData,{recursive:true,force:true});}
});

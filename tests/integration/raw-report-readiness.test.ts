import {expect, test} from "vitest";
import {openStore} from "../../src/store/store";
import {writeRawPackage} from "../../src/source/raw-package";
import {SalesReports} from "../../src/reports/query";
import {ReportVersions} from "../../src/reports/versions";
import {rawSnapshot} from "../helpers/raw-fixture";

test("raw backup records explain why financial reports cannot open",()=>{
 const store=openStore(":memory:");
 try{
  const sales=new SalesReports(store),versions=new ReportVersions(store,sales);
  expect(sales.open({period:"2025-10"})).toMatchObject({status:"unavailable",code:"EMPTY_STORE",message:"Henüz veri içe aktarılmadı."});
  store.importSourcePreview(writeRawPackage(rawSnapshot(),"fixture:raw-readiness","batch-1"));
  const expected={status:"unavailable",code:"UNSUPPORTED_MAPPING",message:"Yedek kayıtları yüklendi; mali rapor için doğrulanmış satış verisi henüz hazır değil."};
  expect(sales.open({period:"2025-10"})).toEqual(expected);
  expect(versions.open({period:"2025-10"})).toEqual(expected);
 }finally{store.close();}
});

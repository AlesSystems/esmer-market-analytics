import {writeRawEstimatePackage} from "../../src/source/raw-package";
import type {SqlSnapshot} from "../../src/source/sql-server";
import {rawSnapshot} from "./raw-fixture";
// Hand-built three-month synthetic package. Expected values below are computed by hand, not by the code under test.
export function monthProfitSnapshot():SqlSnapshot{
 const base=rawSnapshot(),h=base.headers[0],l=base.lines[0];
 const headers:SqlSnapshot["headers"]=[],lines:SqlSnapshot["lines"]=[];
 const doc=(id:string,type:string,date:string)=>headers.push({...h,ID:id,FIS_TURU:type,FIS_TARIHI:`${date}T12:00:00.000`});
 const line=(id:string,docId:string,type:string,product:string,qty:string,amount:string,cost:string|null)=>lines.push({...l,ID:id,FIS:docId,STOK:product,FIS_TURU:type,MIKTAR_FIS:qty,TOPLAM_KDV_MATRAHI:amount,BELGE_TARIHINDEKI_SON_ALIS_FIYATI:cost});
 doc("301","11","2025-08-15");line("3011","301","11","1","10","100","8");
 doc("201","11","2025-09-10");line("2011","201","11","1","10","200","13.7");line("2012","201","11","4","1","250","234");line("2013","201","11","5","2","20","6");line("2014","201","11","6","1","10","5");
 doc("202","11","2025-09-11");line("2021","202","11","2","1","30","20");
 doc("101","11","2025-10-03");line("1011","101","11","1","10","100","7");line("1012","101","11","2","2","50",null);
 doc("102","11","2025-10-05");line("1021","102","11","3","4","40","11");line("1022","102","11","1","5","50","7");
 doc("103","11","2025-10-07");line("1031","103","11","4","1","200","190");line("1032","103","11","5","3","30","8");line("1033","103","11","7","1","10","9.5");
 doc("104","12","2025-10-08");line("1041","104","12","1","1","15","7");
 doc("105","35","2025-10-09");line("1051","105","35","6","1","999","5");
 const products=[["1","Süt","Süt ürünleri","adet"],["2","Peynir","Süt ürünleri","kg"],["3","Ekmek","Fırın","adet"],["4","Çay",null,"adet"],["5","Şeker","Kuru gıda","adet"],["6","Yağ","Kuru gıda","adet"],["7","Tuz","Kuru gıda","adet"]].map(([ID,NAME,CATEGORY,UNIT])=>({ID,NAME,CATEGORY,UNIT}));
 return {...base,from:"2025-08-01",to:"2025-10-20",headers,lines,products} as SqlSnapshot;
}
export const monthProfitPackage=(s=monthProfitSnapshot())=>writeRawEstimatePackage(s,"fixture:month-profit","month-profit-1");

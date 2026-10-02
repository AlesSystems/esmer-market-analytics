import {expect,test} from "vitest";
import {writeRawEstimatePackage,readRawPackage,writeRawPackage} from "../../src/source/raw-package";
import {calculateSourceEstimate} from "../../src/source/estimate";
import {rawSnapshot} from "../helpers/raw-fixture";
test("explicit estimate package retains exact covered sales and excludes unattributed return costs",()=>{
 const s=rawSnapshot();s.lines[0].BELGE_TARIHINDEKI_SON_ALIS_FIYATI="70";
 const pkg=readRawPackage(writeRawEstimatePackage(s,"fixture:estimate","batch-1"))!;
 const r=calculateSourceEstimate(pkg,"2025-10","a".repeat(64));
 expect(r.summary).toMatchObject({candidateSaleAmount:"120",coveredSaleAmount:"120",candidateCost:"140",contribution:"-20",coveredLines:1,totalLines:1});
 expect(()=>writeRawPackage(s,"fixture:estimate","batch-1")).toThrow();
});

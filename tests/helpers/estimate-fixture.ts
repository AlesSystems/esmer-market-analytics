import {rawSnapshot} from "./raw-fixture";
import {writeRawEstimatePackage,readRawPackage} from "../../src/source/raw-package";
export function estimateSnapshot(){const s=rawSnapshot();s.lines[0].BELGE_TARIHINDEKI_SON_ALIS_FIYATI="70";return s;}
export function estimatePackage(s=estimateSnapshot(),id="estimate-1"){return writeRawEstimatePackage(s,"fixture:estimate",id);}
export function estimateParsed(s=estimateSnapshot()){return readRawPackage(estimatePackage(s))!;}

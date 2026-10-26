import {validSelectedMonth} from "../domain/month";
import type {RawPackage} from "./raw-package";
import type {SqlRow} from "./sql-server";
export type SourceQuery = {hash:string|null;period:string|null;view:"overview"|"documents"|"products"|"detail";scope:"all"|"sales"|"purchasing";documentType:string|null;productId:string|null;documentId:string|null;offset:number};
export type SourceWorkspaceResult = {status:"source-empty"}|{status:"source-unavailable";code:"SOURCE_CHANGED"|"NOT_FOUND";message:string}|{
 status:"source-workspace";sourceFormat:RawPackage["schemaVersion"];hash:string;period:string;from:string;to:string;lastDocumentDate:string|null;extractedAt:string;lineage:string;extractionId:string;databaseId:string;
 counts:{documents:number;lines:number;products:number;emptyDocuments:number};typeTotal:number;types:{code:string;documents:number}[];days:{date:string;documents:number}[];
 documents:SqlRow[];products:{id:string;documents:number;lines:number}[];lines:SqlRow[];document:SqlRow|null;total:number;offset:number;
};
const id=(v:unknown)=>typeof v==="string" && /^-?(?:0|[1-9][0-9]{0,18})$/.test(v);
export function validSourceQuery(value:unknown):value is SourceQuery {
 if(!value||typeof value!=="object"||Array.isArray(value))return false;
 const v=value as Record<string,unknown>;
 return Object.keys(v).sort().join() === "documentId,documentType,hash,offset,period,productId,scope,view" &&
 (v.hash===null||typeof v.hash==="string"&&/^[a-f0-9]{64}$/.test(v.hash)) &&
 (v.period===null||validSelectedMonth(v.period)) &&
 typeof v.view==="string" && ["overview","documents","products","detail"].includes(v.view) && typeof v.scope==="string" && ["all","sales","purchasing"].includes(v.scope) &&
 (v.documentType===null||id(v.documentType)) && (v.productId===null||id(v.productId)) &&
 (v.view==="detail" ? id(v.documentId) : v.documentId===null) &&
 (v.view==="overview"||v.hash!==null&&v.period!==null) && Number.isSafeInteger(v.offset)&&Number(v.offset)>=0&&Number(v.offset)<=100000;
}
// These dictionary code groups organize source inspection; they do not establish economic events or financial inclusion.
const scopes={all:null,sales:new Set(["2","4","8","11","12","35"]),purchasing:new Set(["1","3","5","7"])};
export function querySource(pkg:RawPackage,hash:string,request:SourceQuery):SourceWorkspaceResult {
 if(!validSourceQuery(request))throw Error("INVALID_PAYLOAD");
 if(request.hash!==null&&request.hash!==hash)return {status:"source-unavailable",code:"SOURCE_CHANGED",message:"Kaynak sürümü değişti. Yeni sürümü açın."};
 const snapshot=pkg.snapshot,latest=snapshot.headers.reduce((value,row)=>row.FIS_TARIHI!>value?row.FIS_TARIHI!:value,"");
 const period=request.period??(latest||snapshot.to).slice(0,7);
 const products=request.productId===null?null:new Set(snapshot.lines.filter(row=>row.STOK===request.productId).map(row=>row.FIS));
 const headers=snapshot.headers.filter(row=>row.FIS_TARIHI!.startsWith(period)&&(!scopes[request.scope]||scopes[request.scope]!.has(row.FIS_TURU!))&&(request.documentType===null||row.FIS_TURU===request.documentType)&&(!products||products.has(row.ID)));
 const headerIds=new Set(headers.map(row=>row.ID));
 const lines=snapshot.lines.filter(row=>headerIds.has(row.FIS)&&(request.productId===null||row.STOK===request.productId));
 const lineHeaders=new Set(lines.map(row=>row.FIS));
 const productGroups=new Map<string,{id:string;documents:Set<string>;lines:number}>();
 for(const line of lines){const group=productGroups.get(line.STOK!)??{id:line.STOK!,documents:new Set<string>(),lines:0};group.documents.add(line.FIS!);group.lines++;productGroups.set(group.id,group);}
 const types=new Map<string,number>(),days=new Map<string,number>();
 for(const row of headers){types.set(row.FIS_TURU!,(types.get(row.FIS_TURU!)??0)+1);const date=row.FIS_TARIHI!.slice(0,10);days.set(date,(days.get(date)??0)+1);}
 const numeric=(a:string,b:string)=>BigInt(a)<BigInt(b)?-1:BigInt(a)>BigInt(b)?1:0;
 const document=request.view==="detail"?headers.find(row=>row.ID===request.documentId)??null:null;
 if(request.view==="detail"&&!document)return {status:"source-unavailable",code:"NOT_FOUND",message:"Belge seçili kaynak kapsamında bulunamadı."};
 const detailLines=request.view==="detail"?snapshot.lines.filter(row=>row.FIS===request.documentId):[];
 const total=request.view==="products"?productGroups.size:request.view==="detail"?detailLines.length:headers.length;
 const offset=total===0?0:Math.min(request.offset,Math.floor((total-1)/50)*50);
 return {status:"source-workspace",sourceFormat:pkg.schemaVersion,hash,period,from:snapshot.from,to:snapshot.to,lastDocumentDate:latest?latest.slice(0,10):null,extractedAt:snapshot.capturedAt,lineage:pkg.lineage,extractionId:pkg.extractionId,databaseId:snapshot.databaseId,
 counts:{documents:headers.length,lines:lines.length,products:productGroups.size,emptyDocuments:headers.filter(row=>!lineHeaders.has(row.ID)).length},
 typeTotal:types.size,types:[...types].sort(([a],[b])=>numeric(a,b)).slice(0,50).map(([code,documents])=>({code,documents})),days:[...days].sort(([a],[b])=>a.localeCompare(b)).map(([date,documents])=>({date,documents})),
 documents:request.view==="documents"?headers.sort((a,b)=>b.FIS_TARIHI!.localeCompare(a.FIS_TARIHI!)||numeric(a.ID!,b.ID!)).slice(offset,offset+50):[],
 products:request.view==="products"?[...productGroups.values()].sort((a,b)=>numeric(a.id,b.id)).slice(offset,offset+50).map(row=>({id:row.id,documents:row.documents.size,lines:row.lines})):[],
 lines:request.view==="detail"?detailLines.sort((a,b)=>numeric(a.ID!,b.ID!)).slice(offset,offset+50):[],document,total,offset};
}

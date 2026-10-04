import {useState} from "react";
import type {SqlRow} from "../source/sql-server";
import {date,decimal} from "./format";
import {sourceFieldLabel,sourceLineColumns,typeLabel} from "./source-fields";
const groups=[
 {title:"Belge kimliği ve tarihi",keys:["ID","FIS_TARIHI","FIS_TURU"]},
 {title:"Para birimi ve durum",keys:["CURRENCY","DOVIZ_AD","DURUM","AKTIF"]},
 {title:"Kaydedilmiş tutarlar",keys:["GENELTOPLAM","SATIR_TOPLAM","SATIR_ISKONTO_TOPLAM","FIS_ISKONTO_TOPLAM","KDV_TOPLAM","OTV_TOPLAM","TEFKIFAT_TOPLAM"]},
];
const numericFields=new Set(["BELGE_TARIHINDEKI_SON_ALIS_FIYATI","SATIR_TOPLAM","SATIR_ISKONTO_TOPLAM","FIS_ISKONTO_TOPLAM","KDV_TOPLAM","OTV_TOPLAM","TEFKIFAT_TOPLAM","GENELTOPLAM","CARPAN","MIKTAR_FIS","TOPLAM_KDV_MATRAHI","TOPLAM_KDV","TOPLAM_OTV","TOPLAM_TEVKIF"]);
const numeric=(name:string)=>numericFields.has(name);
function readable(name:string,value:string|null){
 if(value===null)return "—";
 if(name==="FIS_TARIHI")return date(value.slice(0,10));
 if(name==="FIS_TURU")return typeLabel(value);
 if(numeric(name))return decimal(value.replace(/(\.\d*?)0+$/,"$1").replace(/\.$/,""));
 return value;
}
export function SourceDocumentDetail({document,lines}:{document:SqlRow|null;lines:SqlRow[]}){
 const [raw,setRaw]=useState(false);
 const columns=lines.some(row=>Object.hasOwn(row,"BELGE_TARIHINDEKI_SON_ALIS_FIYATI"))?[...sourceLineColumns,"BELGE_TARIHINDEKI_SON_ALIS_FIYATI"]:sourceLineColumns;
 const known=new Set(groups.flatMap(group=>group.keys));
 const extra=Object.keys(document??{}).filter(key=>!known.has(key));
 function value(name:string,source:string|null){return <><span>{readable(name,source)}</span>{raw&&source!==null&&<small className="source-document-raw">{source}</small>}</>;}
 return <section className="source-document-detail" aria-label="Kaynak belge ayrıntıları">
  <h2>Kaynak belge {document?.ID}</h2>
  <p className="source-document-note">Tutarlar kaynak para birimindedir ve doğrulanmadı. Boş değer “—”; sıfır sayılmaz. Ürün filtresi belge seçimine uygulanır; bu belgenin tüm satırları sayfalanır.</p>
  <label className="source-document-toggle"><input type="checkbox" checked={raw} onChange={event=>setRaw(event.target.checked)}/> Tam kaynak değerlerini göster</label>
  <div className="source-document-summary">{[...groups,...(extra.length?[{title:"Diğer kaynak alanları",keys:extra}]:[])].map(group=><section key={group.title}><h3>{group.title}</h3><dl>{group.keys.filter(key=>Object.hasOwn(document??{},key)).map(name=><div key={name}><dt>{sourceFieldLabel("header",name)}</dt><dd className={numeric(name)?"source-document-number":undefined}>{value(name,document?.[name]??null)}</dd></div>)}</dl></section>)}</div>
  <h2>Belge satırları</h2>
  <div className="source-document-scroll" role="region" tabIndex={0} aria-label="Belge satırları yatay kaydırma"><table><caption>Kaydedilmiş belge satırları</caption><thead><tr>{columns.map(name=><th scope="col" className={numeric(name)?"source-document-number":undefined} key={name}>{sourceFieldLabel("line",name)}</th>)}</tr></thead><tbody>{lines.map(row=><tr key={row.ID}>{columns.map(name=><td key={name} className={numeric(name)?"source-document-number":undefined}>{value(name,row[name]??null)}</td>)}</tr>)}</tbody></table></div>
 </section>;
}

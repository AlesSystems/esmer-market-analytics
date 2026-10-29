import type {MonthProfitUnavailable} from "../../source/month-profit";
import type {PageProps} from "../sections";
import {Button} from "../components/ui/button";
import {InfoIcon} from "../icons";
import {Popover} from "../shell/Popover";
import {date,percent} from "../format";
import {monthName} from "./month-summary";

/** The one trust chip on a month-profit page. Same words on Bu ay and Ürünler. */
export function TrustChip({costKnownPct}:{costKnownPct:string|null}) {
 return <Popover buttonClass="chip" dialogLabel="Tahmini hakkında" panelClass="pop-trust" label={<><InfoIcon/>Tahmini</>}>
  <p>Son alış fiyatıyla tahmin; doğrulanmış kâr değildir. İadeler kâra dahil değil, alış fiyatı olmayan ürünlerin satışı kâra katılmaz.{costKnownPct!==null&&` Maliyeti bilinen satış ${percent(costKnownPct)}.`}</p>
 </Popover>;
}

/** ESTIMATE_UNAVAILABLE and MONTH_NOT_COVERED, worded and handled alike on Bu ay and Ürünler. `purpose` completes "…içe aktarınca bu sayfa …". */
export function MonthUnavailable({result,month,purpose,coverage,onMonth,importPackage}:{result:MonthProfitUnavailable;month:string;purpose:string}&Pick<PageProps,"coverage"|"onMonth"|"importPackage">) {
 if(result.code==="ESTIMATE_UNAVAILABLE")return <div className="state"><h2>Kâr tahmini için veri paketi gerekiyor</h2><p>Maliyet bilgisi içeren bir veri paketi içe aktarınca bu sayfa {purpose}.</p><div className="state-actions"><Button onClick={importPackage}>Veri paketi içe aktar</Button></div></div>;
 return <div className="state"><h2>{monthName(month)} için veri yok</h2><p>{coverage?`Veri paketi ${date(coverage.from)} – ${date(coverage.to)} arasını kapsıyor. Bu aralıktan bir ay seçin.`:"Bu ay veri paketinin dışında. Üstteki ay okuyla başka bir ay seçin."}</p>{coverage&&<div className="state-actions"><Button variant="secondary" onClick={()=>onMonth(coverage.to.slice(0,7))}>Son aya git ({monthName(coverage.to.slice(0,7))})</Button></div>}</div>;
}

import type {MonthProfitUnavailable} from "../../source/month-profit";
import type {PageProps} from "../sections";
import {Button} from "../components/ui/button";
import {EstimateBadge} from "../charts";
import {date} from "../format";
import {monthName} from "./month-summary";

/** The one trust chip on a month-profit page. Same words as Bu ay. */
export function TrustChip({navigate}:Pick<PageProps,"navigate">) {
 return <EstimateBadge label="Tahmini"><p>Son alış fiyatıyla tahmin · iadeler kâra dahil değil.</p><Button variant="link" className="month-link" onClick={()=>navigate("reports",{reportView:"report"})}>Ayrıntılar Rapor ve Excel’de</Button></EstimateBadge>;
}

/** ESTIMATE_UNAVAILABLE and MONTH_NOT_COVERED, worded and handled as on Bu ay. `purpose` completes "…içe aktarınca bu sayfa …". */
export function MonthUnavailable({result,month,purpose,coverage,availability,onMonth,navigate,openSettings}:{result:MonthProfitUnavailable;month:string;purpose:string}&Pick<PageProps,"coverage"|"availability"|"onMonth"|"navigate"|"openSettings">) {
 if(result.code==="ESTIMATE_UNAVAILABLE")return <div className="month-state"><h2>Kâr tahmini için veri paketi gerekiyor</h2><p>Maliyet bilgisi içeren bir veri paketi içe aktarınca bu sayfa {purpose}.</p><div className="month-state-actions"><Button onClick={openSettings}>Veri paketi içe aktar</Button>{availability?.status==="ready"&&availability.store==="loaded"&&<Button variant="outline" onClick={()=>navigate("reports")}>Aylık raporlara git</Button>}</div></div>;
 return <div className="month-state"><h2>{monthName(month)} için veri yok</h2><p>{coverage?`Veri paketi ${date(coverage.from)} – ${date(coverage.to)} arasını kapsıyor. Bu aralıktan bir ay seçin.`:"Bu ay veri paketinin dışında. Kenar çubuğundaki Dönem alanından başka bir ay seçin."}</p>{coverage&&<div className="month-state-actions"><Button variant="outline" onClick={()=>onMonth(coverage.to.slice(0,7))}>Son aya git ({monthName(coverage.to.slice(0,7))})</Button></div>}</div>;
}

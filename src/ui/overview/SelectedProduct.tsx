import { useEffect, useRef, useState } from "react";
import type { DesktopApi } from "../../domain/contracts";
import { Button } from "../components/ui/button";
import { PageControls, PAGE_SIZE } from "../PageControls";
import { date, decimal, money, percent } from "../format";
import { purchasingWarningLabels } from "../purchasing/PurchasingWorkspace";

type Detail = Extract<Awaited<ReturnType<DesktopApi["readReportProduct"]>>, { status: "product" }>;
type Dependency = Extract<Awaited<ReturnType<DesktopApi["readReportProductDependency"]>>, { status: "product-dependency" }>;
const amount = (value: string | null) => value === null ? "Hesaplanamıyor" : money(value);
const ratio = (value: string | null) => value === null ? "Hesaplanamıyor" : percent(value);
const unit = (value: "piece" | "kg" | "unknown" | undefined) => value === "piece" ? "adet" : value === "kg" ? "kg" : "birim bilinmiyor";

export function SelectedProduct({ reportId, productId, active=true }: {active?:boolean; reportId: string; productId: string }) {
  const [detail, setDetail] = useState<Detail>(), [error, setError] = useState(""), [attempt, setAttempt] = useState(0);
  const [exporting, setExporting] = useState(false), [exportMessage, setExportMessage] = useState("");
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    if(!active)return;
    let current = true;
    setDetail(undefined); setError("");
    window.esmer.readReportProduct({ reportId, productId }).then(result => {
      if (!current) return;
      if (result.status === "product" && result.reportId === reportId && result.productId === productId) setDetail(result);
      else setError("message" in result ? result.message : "Seçili ürün özeti yüklenemedi.");
    }).catch(() => { if (current) setError("Seçili ürün özeti yüklenemedi."); });
    return () => { current = false; };
  }, [reportId, productId, attempt,active]);
  async function exportProduct() {
    setExporting(true); setExportMessage("");
    try {
      const result = await window.esmer.exportReportProduct({ reportId, productId });
      if (mounted.current) setExportMessage(result.status === "saved" ? "Seçili ürün dosyası kaydedildi." : result.status === "cancelled" ? "Dışa aktarma iptal edildi." : "message" in result ? result.message : "Ürün dosyası kaydedilemedi.");
    } catch { if (mounted.current) setExportMessage("Ürün dosyası kaydedilemedi. Yeniden deneyin."); }
    finally { if (mounted.current) setExporting(false); }
  }
  const selected = detail?.summary;
  return <section aria-label="Seçili ürün özeti">
    {error ? <div role="alert" className="notice warning">{error}<Button variant="outline" onClick={() => setAttempt(value => value + 1)}>Ürün özetini yeniden yükle</Button></div> : !detail || !selected ? <p role="status">Seçili ürün özeti yükleniyor…</p> : <>
      <h3>{selected.coveredGrossProfit?.startsWith("-") ? "Kapsanan tahmini brüt zarar" : "Kapsanan tahmini brüt kâr"}</h3>
      <strong className="text-3xl font-semibold">{amount(selected.coveredGrossProfit)}</strong>
      <p>{detail.period} · Ürün #{productId} · Veri sonu: {date(detail.cutoff)}</p>
      <dl className="financial-ledger">
        <div><dt>Net satış (KDV hariç)</dt><dd>{amount(selected.netSales)}</dd></div>
        <div><dt>Maliyeti kapsanan net satış</dt><dd>{amount(selected.coveredSales)}</dd></div>
        <div><dt>Tarihsel tahmini maliyet (kapsanan)</dt><dd>{amount(selected.coveredCost)}</dd></div>
        <div><dt>Kapsanan tahmini brüt kâr marjı</dt><dd>{ratio(selected.coveredMarginPercent)}</dd></div>
        <div><dt>Maliyet kapsamı (mutlak net tutar)</dt><dd>{ratio(selected.costCoveragePercent)}</dd></div>
      </dl>
      {selected.quantities.map(quantity => <p key={quantity.unit}>Satış / iade / net miktar: {decimal(quantity.sold)} / {decimal(quantity.returned)} / {decimal(quantity.net)} {quantity.unit === "piece" ? "adet" : "kg"}</p>)}
      <p>{selected.coveredCount} kapsanan / {selected.excludedCount} dışlanan satır. Dışlanan satış: {money(selected.exposures.excludedSales)} · Dışlanan müşteri iadesi: {money(selected.exposures.excludedReturns)}</p>
      {selected.excludedCount > 0 && <p className="notice warning">Kapsam eksik. Eksik maliyet sıfır değildir. Dışlanan iadeler tahmini sonucu yüksek gösterebilir.</p>}
      {!detail.sourceCoverage.complete && <p className="notice warning">Kaynak kapsamı eksik. {detail.sourceCoverage.unresolvedCount} çözümlenmemiş kayıt ürüne güvenilir biçimde atanamıyor; etkisi bilinmiyor.</p>}
      {detail.daily.some(day => day.sourceCoverage !== "complete") && <p className="notice warning">Dönem veya kaynak kapsamı eksik. Gözlenmeyen günler sıfır sayılmaz.</p>}
      {selected.exclusionReasons.length > 0 && <ul>{selected.exclusionReasons.map(code => <li key={code}>{purchasingWarningLabels[code] ?? "Maliyet veya iade atfı kanıtı doğrulanmadı"}</li>)}</ul>}
      <p>Tarihsel son alış maliyeti tahmini. İşletme giderleri dahil değil; doğrulanmış net kâr değildir.</p>
      <details><summary>Seçili ürünün günlük tutarları</summary><div className="table-scroll" tabIndex={0}><table aria-label="Seçili ürünün günlük tutarları"><thead><tr><th>Gün</th><th className="number">Net satış</th><th className="number">Kapsanan maliyet</th><th className="number">Kapsanan kâr</th><th className="number">Marj</th><th>Kapsam</th></tr></thead><tbody>{detail.daily.map(day => <tr key={day.date}><td>{date(day.date)}</td><td className="number">{amount(day.netSales)}</td><td className="number">{amount(day.coveredCost)}</td><td className="number">{amount(day.trend)}</td><td className="number">{ratio(day.coveredMarginPercent)}</td><td>{day.status === "empty" ? "İşlemsiz gün" : day.status === "unavailable" ? "Hesaplanamıyor" : day.excludedCount || day.sourceCoverage !== "complete" ? "Kapsam eksik" : "Kapsanan katkı"}</td></tr>)}</tbody></table></div></details>
      <div className="report-actions"><Button variant="outline" disabled={exporting} onClick={() => void exportProduct()}>{exporting ? "Ürün dosyası hazırlanıyor…" : "Seçili ürünü Excel'e aktar"}</Button><span role="status">{exportMessage}</span></div>
      <p>Ürün dosyası tüm günleri ve kanıt satırlarını içerir. Arama ve sayfa seçimi dosyanın kapsamını değiştirmez. Aylık rapor dışa aktarımı tüm ürünleri korur.</p>
      <details><summary>Seçili ürünün kaynak ve yöntemi</summary><p>Rapor: {reportId} · Kaynak: {detail.lineage} · {Object.values(detail.calculations).join(" · ")}</p></details>
    </>}
  </section>;
}

export function ProductDependency({ reportId, productId, returnLineId, onClose, active=true }: {active?:boolean; reportId: string; productId: string; returnLineId: string; onClose: () => void }) {
  const [offset, setOffset] = useState(0), [attempt, setAttempt] = useState(0);
  const [page, setPage] = useState<Dependency>(), [error, setError] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if(!active)return;
    let current = true; setPage(undefined); setError("");
    window.esmer.readReportProductDependency({ reportId, productId, returnLineId, offset }).then(result => {
      if (!current) return;
      if (result.status === "product-dependency" && result.reportId === reportId && result.productId === productId && result.returnLineId === returnLineId && result.offset === offset) setPage(result);
      else setError("message" in result ? result.message : "Asıl satış kanıtı bu raporda mevcut değil.");
    }).catch(() => { if (current) setError("Asıl satış kanıtı yüklenemedi."); });
    return () => { current = false; };
  }, [reportId, productId, returnLineId, offset, attempt,active]);
  useEffect(() => { if (active && (page || error) && heading.current?.getClientRects().length) heading.current.focus(); }, [page, error,active]);
  const originalCost = page?.original.business?.historicalCost;
  return <section className="block" aria-label="Asıl satış kanıtı"><h3 ref={heading} tabIndex={-1}>Asıl satış kanıtı</h3><Button variant="outline" onClick={onClose}>İadeye dön</Button>
    <p>Seçili ayın toplamına eklenmez. Bu kayıtlar raporun saklanan kanıtıdır; yeniden hesaplanmış satış sonucu değildir.</p>
    {error ? <div role="alert" className="notice warning">{error}<Button variant="outline" onClick={() => setAttempt(value => value + 1)}>Asıl satış kanıtını yeniden yükle</Button></div> : !page ? <p role="status">Asıl satış kanıtı yükleniyor…</p> : <>
      <p>Asıl belge: {page.document.id} · {date(page.document.date)} · Asıl satır: {page.original.id}</p>
      <p>Kaydedilen asıl miktar: {decimal(page.original.quantity)} {unit(page.original.sales?.unit)} · Kaydedilen net tutar: {money(page.original.net)} · Kaydedilen tarihsel birim maliyet: {amount(originalCost?.unitCost ?? null)} / {unit(originalCost?.unit)} · {originalCost?.taxBasis === "net" ? "KDV hariç" : "KDV temeli bilinmiyor"}</p>
      <p>Maliyet kanıtı: {page.original.business?.historicalCost?.evidence ?? "Mevcut değil"} · Bu kaydın varlığı tek başına iade maliyetini doğrulamaz.</p>
      <p>Tüm belge satırları. Diğer ürünler seçili ürün katkısına dahil değildir.</p>
      {page.rows.map(line => <article className="receipt-line" key={line.id}><h4>{line.sales?.productName || `Ürün #${line.sales?.productId ?? "Bilinmiyor"}`}</h4><p>{line.id === page.original.id ? "Asıl satışla eşleşiyor" : "Belgenin diğer satırı"} · {line.sales?.productId === productId ? "Seçili ürünle eşleşiyor" : "Seçili ürün kapsamı dışında"} · Kaydedilen miktar: {decimal(line.quantity)} {unit(line.sales?.unit)} · net: {money(line.net)}</p></article>)}
      <PageControls page={offset / PAGE_SIZE} total={page.total} label="Asıl belge satırları" itemLabel="satır" onPage={value => setOffset(value * PAGE_SIZE)} />
    </>}
  </section>;
}

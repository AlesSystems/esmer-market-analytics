import { useEffect, useState } from "react";
import type { MonthlyDisplay, ReportEvidencePage, ReportEvidenceRequest } from "../../reports/display";
import type { PurchasingView } from "../../reports/contracts";
import { salesReasonLabels } from "../report-labels";
import { date, decimal, money, percent } from "../format";
import { PAGE_SIZE, PageControls } from "../PageControls";
import { PurchasingWorkspace } from "../purchasing/PurchasingWorkspace";

type Section = ReportEvidenceRequest["section"];
type Page<K extends Section> = Extract<ReportEvidencePage, { section: K }>;

function useEvidence<K extends Section>(reportId: string, section: K, offset: number, search = "", range: ReportEvidenceRequest["range"] = "current", documentId: string | null = null) {
  const [loaded, setLoaded] = useState<{ key: string; page: Page<K> }>(), [error, setError] = useState(""), [attempt, setAttempt] = useState(0);
  const key = JSON.stringify([reportId, section, offset, search, range, documentId, attempt]);
  useEffect(() => {
    let current = true;
    setLoaded(undefined); setError("");
    if (section === "lines" && documentId === null) return;
    window.esmer.readReportEvidence({ reportId, section, offset, search, range, documentId }).then(result => {
      if (!current) return;
      if (result.status === "evidence" && result.section === section && result.reportId === reportId && result.offset === offset) setLoaded({ key, page: result as Page<K> });
      else setError("Rapor kanıtı yüklenemedi.");
    }).catch(() => { if (current) setError("Rapor kanıtı yüklenemedi."); });
    return () => { current = false; };
  }, [reportId, section, offset, search, range, documentId, attempt, key]);
  return { page: loaded?.key === key ? loaded.page : undefined, error, retry: () => setAttempt(value => value + 1) };
}

const Pager = ({ offset, total, setOffset, label }: { offset: number; total: number; setOffset: (value: number) => void; label: string }) => <PageControls page={Math.floor(offset / PAGE_SIZE)} total={total} onPage={page => setOffset(page * PAGE_SIZE)} label={label} itemLabel={label} />;

export function ReportEvidence({ report }: { report: MonthlyDisplay }) {
  const [search, setSearch] = useState(""), [offset, setOffset] = useState(0), [excludedOffset, setExcludedOffset] = useState(0), [purchasingOpen, setPurchasingOpen] = useState(false);
  const [purchasing, setPurchasing] = useState<PurchasingView>(), [purchasingError, setPurchasingError] = useState(""), [purchasingAttempt, setPurchasingAttempt] = useState(0);
  const components = useEvidence(report.id, "components", offset, search);
  const exclusions = useEvidence(report.id, "exclusions", excludedOffset);
  useEffect(() => {
    if (!purchasingOpen) return;
    let current = true; setPurchasing(undefined); setPurchasingError("");
    window.esmer.readReportPurchasing({ reportId: report.id }).then(result => { if (!current) return; if (result.status === "purchasing") setPurchasing(result.view); else setPurchasingError(result.message); }).catch(() => { if (current) setPurchasingError("Maliyet ve alış raporu yüklenemedi. Yeniden deneyin."); });
    return () => { current = false; };
  }, [report.id, purchasingOpen, purchasingAttempt]);
  return <div className="saved-evidence"><h3>Sabit satış bileşenleri</h3><label>Kanıtlarda ürün ara<input type="search" maxLength={160} value={search} onChange={event => { setSearch(event.target.value); setOffset(0); }} /></label><p>Ürün adına göre Türkçe sıralama. Arama yalnızca kanıt listesini daraltır; rapor toplamlarını değiştirmez.</p>
    {components.error ? <div className="notice warning" role="alert"><span>{components.error}</span><button onClick={components.retry}>Yeniden dene</button></div> : !components.page ? <p role="status">Rapor kanıtı yükleniyor…</p> : <>{components.page.rows.map(row => <details key={row.lineId}><summary>{row.productName} · {row.documentId} / {row.lineId} · {money(row.net)}</summary><dl className="evidence"><dt>İşlem</dt><dd>{row.kind === "customer-return" ? "Müşteri iadesi" : "Satış"} · {date(row.date)}</dd><dt>Miktar / birim</dt><dd>{decimal(row.quantity)} {row.unit === "kg" ? "kg" : "adet"}</dd><dt>Net / KDV / brüt</dt><dd>{money(row.net)} / {money(row.tax)} / {money(row.gross)}</dd><dt>Kaydedilen net / KDV / brüt</dt><dd>{money(row.recorded.net)} / {money(row.recorded.tax)} / {money(row.recorded.gross)}</dd><dt>Birim net / indirim / KDV oranı</dt><dd>{money(row.input.unitNet)} / {percent(row.input.discountRate)} / {percent(row.input.taxRate)}</dd><dt>Uzlaşma</dt><dd>{row.reconciled ? "Sentetik kaynak satırıyla uzlaşıyor" : "Fark var"}</dd></dl></details>)}<Pager offset={offset} total={components.page.total} setOffset={setOffset} label="satır" />{!components.page.total && <p>Eşleşen kapsanan satır yok.</p>}</>}
    {report.sales.exclusionCount > 0 && <><h3>Hesaplama dışında kalan kayıtlar</h3><p>Her sayfada en fazla 100 dışlama açıklaması gösterilir. Kaynak kayıtları aşağıdaki belge aramasından incelenebilir.</p>{exclusions.error ? <div className="notice warning" role="alert"><span>{exclusions.error}</span><button onClick={exclusions.retry}>Yeniden dene</button></div> : !exclusions.page ? <p role="status">Dışlama kanıtları yükleniyor…</p> : <>{exclusions.page.rows.map((row, i) => <p key={`${row.documentId}:${i}`}>{row.documentId} · {salesReasonLabels[row.reason] ?? "Kaynak anlamı desteklenmiyor"} · katkı bilinmiyor; sıfır sayılmaz.</p>)}<Pager offset={excludedOffset} total={exclusions.page.total} setOffset={setExcludedOffset} label="dışlama" /></>}</>}
    <SavedSourceRecords report={report} />
    <details onToggle={event => setPurchasingOpen(event.currentTarget.open)}><summary>Sabit maliyet ve alış kanıtları</summary>{purchasingOpen && (purchasingError ? <div className="notice warning" role="alert"><span>{purchasingError}</span><button onClick={() => setPurchasingAttempt(value => value + 1)}>Yeniden dene</button></div> : purchasing ? <PurchasingWorkspace context={report.context} saved={purchasing} /> : <p role="status">Maliyet ve alış raporu yükleniyor…</p>)}</details>
  </div>;
}

function SavedSourceRecords({ report }: { report: MonthlyDisplay }) {
  const [range, setRange] = useState<ReportEvidenceRequest["range"]>("current"), [search, setSearch] = useState(""), [offset, setOffset] = useState(0), [documentId, setDocumentId] = useState(""), [lineOffset, setLineOffset] = useState(0);
  const documents = useEvidence(report.id, "documents", offset, search, range);
  const lines = useEvidence(report.id, "lines", lineOffset, "", range, documentId || null);
  const selected = documents.page?.rows.find(row => row.id === documentId);
  const interval = range === "current" ? report.sales : report.sales.comparisons[range];
  const kind = (value: string) => ({ sale: "Satış", "customer-return": "Müşteri iadesi", purchase: "Alış", "supplier-return": "Tedarikçi iadesi" })[value] ?? "Türü bilinmiyor";
  return <details><summary>Kaydedilmiş kaynak belgeleri ve karşılaştırma kanıtları</summary><p>Hesaplama dışında kalan belgeler dahil, bu rapor sürümünde saklanan kaynak kayıtları. Belge tutarı tek başına satışa dahil edildiği anlamına gelmez.</p><label>Kanıt dönemi<select value={range} onChange={event => { setRange(event.target.value as typeof range); setDocumentId(""); setOffset(0); }}><option value="current">Rapor dönemi</option><option value="month">Önceki ay karşılaştırması</option><option value="year">Önceki yıl karşılaştırması</option></select></label><p>{date(interval.from)} – {date(interval.to)} · Kaynak: {report.purchasing.lineage} · Paket: {report.purchasing.extractionId}</p><label>Kaynak belge kimliği ara<input maxLength={160} value={search} onChange={event => { setSearch(event.target.value); setDocumentId(""); setOffset(0); }} /></label>
    {documents.error ? <div className="notice warning" role="alert"><span>{documents.error}</span><button onClick={documents.retry}>Yeniden dene</button></div> : !documents.page ? <p role="status">Kaynak belgeleri yükleniyor…</p> : <><label>Kaynak belgesi<select value={documentId} onChange={event => { setDocumentId(event.target.value); setLineOffset(0); }}><option value="">Belge seçin</option>{documents.page.rows.map(row => <option key={row.id} value={row.id}>{row.id} · {date(row.date)} · {kind(row.kind)}</option>)}</select></label><Pager offset={offset} total={documents.page.total} setOffset={value => { setOffset(value); setDocumentId(""); }} label="belge" />{!documents.page.total && <p>Bu karşılaştırma aralığında kaydedilmiş kaynak belgesi yok.</p>}</>}
    {selected && <article className="receipt-line"><h4>{selected.id} · {kind(selected.kind)}</h4><p>{selected.sales ? `Kaydedilen belge neti ${money(selected.sales.net)} · KDV ${money(selected.sales.tax)} · brüt ${money(selected.sales.gross)}` : "Belge tutar kanıtı yok."}</p>{lines.error ? <div className="notice warning" role="alert"><span>{lines.error}</span><button onClick={lines.retry}>Yeniden dene</button></div> : !lines.page ? <p role="status">Kaynak satırları yükleniyor…</p> : <>{lines.page.rows.map(row => <div key={row.id}><h4>{row.sales?.productName ?? "Ürün anlamı bilinmiyor"} · {row.id}</h4><p>Kaydedilen miktar: {decimal(row.quantity)} · Net: {money(row.net)}</p>{row.sales && <p>Birim: {row.sales.unit === "piece" ? "adet" : row.sales.unit === "kg" ? "kg" : "Bilinmiyor"} · Birim net: {money(row.sales.unitNet)} · İndirim: {percent(row.sales.discountRate)} · KDV: {money(row.sales.tax)} · Brüt: {money(row.sales.gross)}</p>}</div>)}<Pager offset={lineOffset} total={lines.page.total} setOffset={setLineOffset} label="kaynak satırı" /></>}</article>}
  </details>;
}

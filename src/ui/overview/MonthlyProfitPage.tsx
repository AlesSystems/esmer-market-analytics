import { useEffect, useRef, useState } from "react";
import type { MonthlyDisplay, ReportProductsPage, ReportProductsRequest, ReportEvidencePage } from "../../reports/display";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { PAGE_SIZE, PageControls } from "../PageControls";
import { date, decimal, money, percent } from "../format";
import { OperatingSummary } from "../OperatingSummary";
import { purchasingWarningLabels } from "../purchasing/PurchasingWorkspace";
import { SelectedProduct, ProductDependency } from "./SelectedProduct";
import { ReportEvidence } from "./ReportEvidence";

type V2 = Extract<MonthlyDisplay, { format: "monthly-report-v2" }>;
type Product = ReportProductsPage["rows"][number];
type ProductEvidence = Extract<ReportEvidencePage, { section: "product-profit" }>;
type DocumentPage = Extract<ReportEvidencePage, { section: "documents" }>;
type LinePage = Extract<ReportEvidencePage, { section: "lines" }>;
type Props = { report: V2; embedded?: boolean; refresh: () => void; onSales?: (categoryId?: string) => void; onExpenses?: () => void; onPurchasing?: () => void };
const amount = (value: string | null) => value === null ? "Hesaplanamıyor" : money(value);
const ratio = (value: string | null) => value === null ? "Hesaplanamıyor" : percent(value);
const reason = (code: string) => purchasingWarningLabels[code] ?? ({ RETURN_ATTRIBUTION: "İadenin asıl satış maliyeti doğrulanmadı", UNSUPPORTED_COST_MAPPING: "Maliyet anlamı doğrulanmadı" } as Record<string, string>)[code] ?? "Maliyet kanıtı eksik veya desteklenmiyor";

export function MonthlyProfitPage({ report, embedded = false, refresh, onSales, onExpenses, onPurchasing }: Props) {
  const [query, setQuery] = useState<Omit<ReportProductsRequest, "reportId">>({ search: "", sort: "profit", direction: "desc", offset: 0 });
  const [products, setProducts] = useState<{ key: string; page: ReportProductsPage }>(), [productError, setProductError] = useState(""), [attempt, setAttempt] = useState(0);
  const [selected, setSelected] = useState<Product | null>(null), [evidenceOffset, setEvidenceOffset] = useState(0), [evidence, setEvidence] = useState<{ key: string; page: ProductEvidence }>(), [evidenceError, setEvidenceError] = useState(""), [evidenceAttempt, setEvidenceAttempt] = useState(0);
  const [returnLineId, setReturnLineId] = useState<string | null>(null);
  const dependencyOpener = useRef<HTMLButtonElement | null>(null);
  const [documentId, setDocumentId] = useState<string | null>(null), [proof, setProof] = useState(false);
  const tableHeading = useRef<HTMLHeadingElement>(null), detailHeading = useRef<HTMLHeadingElement>(null), opener = useRef<HTMLButtonElement | null>(null), focusPending = useRef(false), tableScroll = useRef(0), documentOpener = useRef<HTMLButtonElement | null>(null);
  const productKey = JSON.stringify([report.id, query, attempt]), evidenceKey = JSON.stringify([report.id, selected?.productId, evidenceOffset, evidenceAttempt]);
  const productPage = products?.key === productKey ? products.page : undefined, evidencePage = evidence?.key === evidenceKey ? evidence.page : undefined;
  useEffect(() => {
    let current = true; setProducts(undefined); setProductError("");
    window.esmer.readReportProducts({ reportId: report.id, ...query }).then(result => {
      if (!current) return;
      if (result.status === "products" && result.reportId === report.id && result.offset === query.offset) setProducts({ key: productKey, page: result });
      else setProductError("Ürün listesi yüklenemedi. Yeniden deneyin.");
    }).catch(() => { if (current) setProductError("Ürün listesi yüklenemedi. Yeniden deneyin."); });
    return () => { current = false; };
  }, [report.id, query, attempt, productKey]);
  useEffect(() => {
    let current = true; setEvidence(undefined); setEvidenceError("");
    if (!selected) return;
    window.esmer.readReportEvidence({ reportId: report.id, section: "product-profit", productId: selected.productId, offset: evidenceOffset, search: "", range: "current", documentId: null }).then(result => {
      if (!current) return;
      if (result.status === "evidence" && result.section === "product-profit" && result.reportId === report.id && result.productId === selected.productId && result.offset === evidenceOffset) setEvidence({ key: evidenceKey, page: result });
      else setEvidenceError("Ürün kanıtı yüklenemedi. Yeniden deneyin.");
    }).catch(() => { if (current) setEvidenceError("Ürün kanıtı yüklenemedi. Yeniden deneyin."); });
    return () => { current = false; };
  }, [report.id, selected, evidenceOffset, evidenceAttempt, evidenceKey]);
  useEffect(() => { if (evidencePage && focusPending.current) { detailHeading.current?.focus(); focusPending.current = false; } }, [evidencePage]);
  const summary = report.productProfit.summary, partial = summary.scope === "covered", loss = summary.coveredGrossProfit?.startsWith("-");
  const headline = `${partial ? "Kapsanan " : ""}tahmini brüt ${loss ? "zarar" : "kâr"}`;
  const term = query.search.trim().toLocaleLowerCase("tr-TR");
  const hiddenBySearch = selected && term && !selected.displayName.toLocaleLowerCase("tr-TR").includes(term) && !selected.productId.toLocaleLowerCase("tr-TR").includes(term);
  const offPage = selected && productPage && !productPage.rows.some(row => row.productId === selected.productId);
  const Container = embedded ? "section" : "main";
  const Heading = embedded ? "h2" : "h1";
  function select(product: Product, button: HTMLButtonElement) { opener.current = button; tableScroll.current = window.scrollY; if (selected?.productId === product.productId) { detailHeading.current?.focus(); return; } focusPending.current = true; setSelected(product); setEvidenceOffset(0); setDocumentId(null); setReturnLineId(null); }
  function returnToTable() {
    if (opener.current?.isConnected) { window.scrollTo(0, tableScroll.current); opener.current.focus({ preventScroll: true }); }
    else tableHeading.current?.focus();
  }
  return <Container className="monthly-overview monthly-profit-page">
    <div className="page-heading"><div><Heading>Aylık Ürün Kârlılığı</Heading><Badge variant="warning">{report.state === "open" ? "Açık" : "Geçici"}</Badge></div><Badge variant="outline">{report.review ? "İncelenmiş sürüm" : "Aday rapor"}</Badge></div>
    <p>Seçili ay · tüm ürünler · {report.context.period} · Veri sonu: {date(report.sales.cutoff)}</p>
    <p>Geçmiş kaynak verisi · Kapsanan dönem: {date(summary.periodCoverage.from)} – {date(summary.periodCoverage.to)}</p>
    {report.sales.warnings.includes("SYNTHETIC_ONLY") && <p>Sentetik gösterim verisi; gerçek market verisi değildir.</p>}
    {report.sales.stale && <div className="notice"><strong>Daha yeni veri var · bu rapor önceki sürümü gösteriyor</strong><Button variant="outline" onClick={refresh}>Aylık raporu yenile</Button></div>}
    {report.operating.stale && <div className="notice"><strong>Gider kayıtları değişti</strong><span>Bu rapor önceki gider sürümünde sabit tutuluyor.</span><Button variant="outline" onClick={refresh}>Aylık raporu yeni giderlerle aç</Button></div>}
    <section className="block" aria-label="Aylık göstergeler">
      <h2>{headline.charAt(0).toLocaleUpperCase("tr-TR") + headline.slice(1)}</h2>
      <strong className="monthly-amount">{summary.status === "empty" ? "Bu ay satış veya iade yok" : amount(summary.coveredGrossProfit)}</strong>
      {report.sales.coverage === "unavailable" && <p className="notice warning">Dönem verisi yok</p>}
      {summary.status === "unavailable" && <p className="notice warning">{report.sales.coverage === "unavailable" || !summary.salesCoverage.complete ? "Kâr hesaplanamıyor · kaynak anlamı doğrulanmadı" : "Kâr hesaplanamıyor · maliyet kanıtı yok"}</p>}
      {partial && <div className="notice warning"><strong>Kapsam eksik</strong><span>Tüm market kârı belirlenemiyor. Eksik maliyet sıfır kabul edilmez.</span></div>}
      <dl className="financial-ledger"><div><dt>Net satış (KDV hariç)</dt><dd>{amount(summary.netSales)}</dd></div><div><dt>Maliyeti kapsanan net satış</dt><dd>{amount(summary.coveredSales)}</dd></div><div><dt>Tarihsel tahmini maliyet (kapsanan)</dt><dd>{amount(summary.coveredCost)}</dd></div><div><dt>Maliyet kapsamı (mutlak net tutar)</dt><dd>{ratio(summary.costCoveragePercent)}</dd></div><div><dt>Kapsanan tahmini brüt kâr marjı</dt><dd>{ratio(summary.coveredMarginPercent)}</dd></div></dl>
      <p>{summary.coveredCount} kapsanan / {summary.excludedCount} dışlanan satır. Dışlanan satış: {money(summary.exposures.excludedSales)} · Dışlanan müşteri iadesi: {money(summary.exposures.excludedReturns)}</p>
      {!summary.salesCoverage.complete && <p className="notice warning">Kaynak kanıtı eksik · {summary.salesCoverage.unresolvedCount} çözümlenmemiş kayıt · katkı {summary.salesCoverage.exposure === null ? "bilinmiyor; sıfır sayılmaz" : money(summary.salesCoverage.exposure)}</p>}
      {(report.sales.coverage === "partial" || !summary.periodCoverage.complete) && <p className="notice warning"><strong>Kısmi dönem</strong> · dönem kapsamı eksik.</p>}
      {summary.exclusionReasons.length > 0 && <ul>{summary.exclusionReasons.map(code => <li key={code}>{reason(code)}</li>)}</ul>}
      <p>İşletme giderleri bu brüt tahmine dahil değil. Tarihsel son alış maliyeti tahmini; doğrulanmış net kâr değildir.</p>
      <details className="monthly-operating"><summary>Giderler ve faaliyet sonucu</summary><p>İşçilik: {report.operating.result.breakdownCoverage.labour === "missing" ? "Henüz sağlanmadı" : report.operating.result.breakdownCoverage.labour === "incomplete" ? "Kanıt eksik" : money(report.operating.result.breakdown.labour)}</p><OperatingSummary context={report.context} revision={0} refresh={refresh} saved={report.operating} /></details>
      <div className="report-actions">{onExpenses && <Button variant="outline" onClick={onExpenses}>Giderleri incele</Button>}{onPurchasing && <Button variant="outline" onClick={onPurchasing}>Maliyetleri incele</Button>}{onSales && <Button variant="outline" onClick={() => onSales()}>Satışları incele</Button>}</div>
    </section>
    <section className="block monthly-trend"><div className="section-heading"><h2>Günlük tahmini brüt kâr</h2><span>TRY · {partial ? "Kapsanan sonuç" : "Tahmini sonuç"} · tüm ürünler</span></div>
      <div className="chart" role="img" aria-label="Günlük tahmini brüt kâr grafiği">{report.productProfit.daily.map(day => <div className="bar-column" key={day.date}><svg viewBox="0 0 40 110" preserveAspectRatio="none" aria-hidden="true"><line x1="0" x2="40" y1="55" y2="55" stroke="currentColor" strokeWidth="0.5" />{day.height !== null && <rect x="8" y={day.negative ? 55 : 55 - Number(day.height) * 0.5} width="24" height={Number(day.height) * 0.5} className={day.negative ? "negative-bar" : "positive-bar"} />}{day.zero && <circle cx="20" cy="55" r="2" fill="currentColor" className="zero-marker" />}</svg><small>{day.date.slice(8)}</small><span className="sr-only">{date(day.date)}: {amount(day.trend)}</span></div>)}</div>
      <p>Çizginin altı tahmini zarar. Kapsanmayan veya maliyeti bilinmeyen günler boşluktur; sıfır değildir.</p>
      <details><summary>Günlük tutarlar</summary><div className="table-scroll" tabIndex={0}><table><thead><tr><th>Gün</th><th className="number">Tahmini katkı</th><th>Kapsam</th></tr></thead><tbody>{report.productProfit.daily.map(day => <tr key={day.date}><td>{date(day.date)}</td><td className="number">{amount(day.trend)}</td><td>{day.status === "empty" ? "İşlemsiz gün" : day.trend === null ? "Hesaplanamıyor" : day.sourceCoverage === "complete" && day.excludedCount === 0 ? "Kapsanan katkı" : "Kapsam eksik"}</td></tr>)}</tbody></table></div></details>
    </section>
    <section className="block" aria-label="Ürün katkıları"><h2 ref={tableHeading} tabIndex={-1}>Ürün katkıları</h2>
      <div className="report-actions"><label>Ürün ara<Input type="search" maxLength={160} value={query.search} onChange={event => setQuery({ ...query, search: event.target.value, offset: 0 })} /></label><label>Sıralama<select value={query.sort} onChange={event => setQuery({ ...query, sort: event.target.value as ReportProductsRequest["sort"], offset: 0 })}><option value="profit">Kapsanan kâr</option><option value="name">Ürün adı</option><option value="netSales">Net satış</option><option value="coverage">Maliyet kapsamı</option></select></label><label>Sıralama yönü<select value={query.direction} onChange={event => setQuery({ ...query, direction: event.target.value as ReportProductsRequest["direction"], offset: 0 })}><option value="desc">Azalan</option><option value="asc">Artan</option></select></label></div>
      <p>Arama ve sıralama yalnızca ürün listesini değiştirir. Aylık sonuç, grafik ve rapor kapsamı tüm ürünlerdir.</p>
      {productError ? <div role="alert" className="notice warning">{productError}<Button variant="outline" onClick={() => setAttempt(value => value + 1)}>Ürün listesini yeniden yükle</Button></div> : !productPage ? <p role="status">Ürün listesi yükleniyor…</p> : <><div className="table-scroll" tabIndex={0}><table><thead><tr><th>Ürün</th><th>Satış / iade / net</th><th className="number">Net satış</th><th className="number">Kapsanan maliyet</th><th className="number">Kapsanan kâr</th><th className="number">Maliyet kapsamı</th></tr></thead><tbody>{productPage.rows.map(row => <tr key={row.productId} className={row.productId === selected?.productId ? "selected" : ""}><td><Button variant="link" onClick={event => select(row, event.currentTarget)} aria-pressed={row.productId === selected?.productId}>{row.displayName}</Button>{row.displayStatus === "fallback" && <small>Ürün adı mevcut değil</small>}</td><td>{row.quantities.map(q => <div key={q.unit}>{decimal(q.sold)} / {decimal(q.returned)} / {decimal(q.net)} {q.unit === "piece" ? "adet" : "kg"}</div>)}</td><td className="number">{amount(row.netSales)}</td><td className="number">{amount(row.coveredCost)}</td><td className="number">{amount(row.coveredGrossProfit)}{row.excludedCount > 0 && <small>Kapsam eksik</small>}</td><td className="number">{ratio(row.costCoveragePercent)}</td></tr>)}</tbody></table></div><PageControls page={query.offset / PAGE_SIZE} total={productPage.total} label="Ürünler" itemLabel="ürün" onPage={page => setQuery({ ...query, offset: page * PAGE_SIZE })} />{!productPage.total && <p>Eşleşen ürün yok. Aramayı temizleyin; rapor kapsamı değişmez.</p>}</>}
    </section>
    {selected && <section className="block" aria-label="Seçili ürün kanıtı"><h2 ref={detailHeading} tabIndex={-1}>Seçili ürün · {selected.displayName}</h2>{hiddenBySearch ? <p>Seçili ürün arama sonuçlarında yok</p> : offPage ? <p>Seçili ürün bu sayfada değil</p> : null}<Button variant="outline" onClick={returnToTable}>Ürün listesine dön</Button><p>Seçili ürünün kapsanan kârı: {amount(selected.coveredGrossProfit)} · {selected.coveredCount} kapsanan / {selected.excludedCount} dışlanan satır.</p>
      <SelectedProduct key={`${report.id}:${selected.productId}`} reportId={report.id} productId={selected.productId} />
      {evidenceError ? <div role="alert" className="notice warning">{evidenceError}<Button variant="outline" onClick={() => setEvidenceAttempt(value => value + 1)}>Ürün kanıtını yeniden yükle</Button></div> : !evidencePage ? <p role="status">Ürün kanıtı yükleniyor…</p> : <>{evidencePage.rows.map(line => <article className="receipt-line" key={line.lineId}><h3>{line.kind === "customer-return" ? "Müşteri iadesi" : "Satış"} · {date(line.date)}</h3><p>{decimal(line.quantity)} {line.unit === "piece" ? "adet" : "kg"} · Net satış: {money(line.net)} · Tarihsel birim maliyeti: {amount(line.historicalUnitCost)} · Kapsanan maliyet: {amount(line.cost)}</p>{line.costReason && <p className="notice warning">{reason(line.costReason)}. Eksik maliyet sıfır değildir.</p>}{line.originalSaleLineId && <Button variant="outline" onClick={event => { dependencyOpener.current = event.currentTarget; setReturnLineId(line.lineId); setDocumentId(null); }}>Asıl satışı aç · {line.originalSaleLineId}</Button>}<details><summary>Kaynak ve yöntem</summary><p>Belge / satır: {line.documentId} / {line.lineId} · Ürün: {line.productId}</p><p>Maliyet kanıtı: {line.costEvidence ?? "Mevcut değil"} · Kayıtlı net / KDV / brüt: {money(line.recorded.net)} / {money(line.recorded.tax)} / {money(line.recorded.gross)}</p><p>Birim net / indirim: {money(line.input.unitNet)} / {percent(line.input.discountRate)}</p></details><Button variant="outline" onClick={event => { documentOpener.current = event.currentTarget; setDocumentId(line.documentId); setReturnLineId(null); }}>Belgeyi aç · {line.documentId}</Button></article>)}<PageControls page={evidenceOffset / PAGE_SIZE} total={evidencePage.total} label="Ürün kanıtı" itemLabel="satır" onPage={page => setEvidenceOffset(page * PAGE_SIZE)} /></>}
      {returnLineId && <ProductDependency key={`${report.id}:${selected.productId}:${returnLineId}`} reportId={report.id} productId={selected.productId} returnLineId={returnLineId} onClose={() => { setReturnLineId(null); (dependencyOpener.current?.isConnected ? dependencyOpener.current : detailHeading.current)?.focus(); }} />}
      {documentId && <PinnedDocument key={`${report.id}:${selected.productId}:${documentId}`} reportId={report.id} productId={selected.productId} documentId={documentId} onClose={() => { setDocumentId(null); (documentOpener.current?.isConnected ? documentOpener.current : detailHeading.current)?.focus(); }} />}
    </section>}
    <details className="block report-proof"><summary>Rapor kanıtı</summary><p>{report.review ? "İncelenmiş sürüm kaydedildi." : "Aday rapor henüz kaydedilmedi."} Kaydetmek tahmini maliyeti güvenilir kâra dönüştürmez.</p><details><summary>Kaynak ve yöntem</summary><p>Rapor: {report.id} · Kaynak / paket: {report.purchasing.lineage} / {report.purchasing.extractionId} · {Object.values(report.calculations).join(" · ")}</p></details><Button variant="outline" onClick={() => setProof(value => !value)} aria-expanded={proof}>Sabit rapor kanıtlarını {proof ? "gizle" : "göster"}</Button>{proof && <ReportEvidence report={report} />}</details>
  </Container>;
}

function PinnedDocument({ reportId, productId, documentId, onClose }: { reportId: string; productId: string; documentId: string; onClose: () => void }) {
  const [offset, setOffset] = useState(0), [attempt, setAttempt] = useState(0);
  const [loaded, setLoaded] = useState<{ key: string; documents: DocumentPage; lines: LinePage }>(), [error, setError] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  const key = JSON.stringify([reportId, productId, documentId, offset, attempt]);
  const page = loaded?.key === key ? loaded : undefined;
  useEffect(() => {
    let current = true; setLoaded(undefined); setError("");
    const base = { reportId, search: "", range: "current" as const, documentId: null };
    Promise.all([window.esmer.readReportEvidence({ ...base, section: "documents", documentId, offset: 0 }), window.esmer.readReportEvidence({ ...base, section: "lines", documentId, offset })]).then(([documents, lines]) => {
      if (!current) return;
      if (documents.status === "evidence" && documents.section === "documents" && documents.reportId === reportId && documents.offset === 0 && lines.status === "evidence" && lines.section === "lines" && lines.reportId === reportId && lines.offset === offset) setLoaded({ key, documents, lines });
      else setError("Belge kanıtı yüklenemedi. Yeniden deneyin.");
    }).catch(() => { if (current) setError("Belge kanıtı yüklenemedi. Yeniden deneyin."); });
    return () => { current = false; };
  }, [reportId, productId, documentId, offset, attempt, key]);
  useEffect(() => { if (page) heading.current?.focus(); }, [page]);
  const header = page?.documents.rows.find(row => row.id === documentId);
  return <section className="block" aria-label="Sabit belge kanıtı"><h3 ref={heading} tabIndex={-1}>Belge kanıtı · {documentId}</h3><Button variant="outline" onClick={onClose}>Ürüne dön</Button><p>Tüm belge satırları. Diğer ürünler seçili ürün katkısına dahil değildir. Belge toplamı, seçili ürünün kapsanan tutarından ayrıdır.</p>{error ? <div role="alert">{error}<Button onClick={() => setAttempt(value => value + 1)}>Belge kanıtını yeniden yükle</Button></div> : !page ? <p role="status">Belge kanıtı yükleniyor…</p> : <>{header?.sales ? <p>Kaydedilen tam belge neti: {money(header.sales.net)} · KDV: {money(header.sales.tax)} · brüt: {money(header.sales.gross)}</p> : <p>Bu sayfada tam belge başlığı yok; belge toplamı hesaplanmadı.</p>}{page.lines.rows.map(line => <article className="receipt-line" key={line.id}><h4>{line.sales?.productName ?? "Ürün anlamı bilinmiyor"}</h4><p>{line.sales?.productId === productId ? "Seçili ürünle eşleşiyor" : "Seçili ürün kapsamı dışında"} · Kaydedilen miktar: {decimal(line.quantity)} · net: {money(line.net)}</p><details><summary>Kaynak satırı</summary><p>{line.documentId} / {line.id} · ürün: {line.sales?.productId ?? "Bilinmiyor"}</p></details></article>)}<PageControls page={offset / PAGE_SIZE} total={page.lines.total} label="Belge satırları" itemLabel="satır" onPage={value => setOffset(value * PAGE_SIZE)} /></>}</section>;
}

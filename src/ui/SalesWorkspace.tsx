import { SalesReceiptScene, type SalesReceiptSelection } from "./scenes/SalesReceiptScene";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { useEffect, useRef, useState } from "react";
import { emptySalesFilters, type Breakdown, type SalesDetail, type SalesFilters, type SalesView } from "../reports/contracts";

import { decimal, money, date, quantity, percent } from "./format";
import { ExpensesWorkspace } from "./ExpensesWorkspace";
import { MonthlyWorkspace } from "./overview/MonthlyWorkspace";
import { AppShell, type Destination } from "./AppShell";
import { PurchasingWorkspace } from "./purchasing/PurchasingWorkspace";
import { salesReasonLabels } from "./report-labels";
import { PageControls, pageRows } from "./PageControls";
const kind = (value: string) => ({ sale: "Satış", "customer-return": "Müşteri iadesi", purchase: "Alış", "supplier-return": "Tedarikçi iadesi" })[value] ?? "Türü bilinmiyor";

export function SalesWorkspace({ view, setView, stale }: { view: SalesView; setView: (view: SalesView) => void; stale: boolean }) {
  const [receiptSelection, setReceiptSelection] = useState<SalesReceiptSelection>("documents");
  const evidenceSummary = useRef<HTMLElement>(null);
  useEffect(() => { setReceiptSelection(view.filters.kind === "customer-return" ? "returns" : "documents"); }, [view.filters.kind]);
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [screen, setScreen] = useState<"monthly" | "versions" | "overview" | "products" | "transactions" | "purchasing" | "expenses">("monthly");
  const [expenseRevision, setExpenseRevision] = useState(0);
  const [comparisonWindow, setComparisonWindow] = useState<"month" | "year">("month");
  const [search, setSearch] = useState(view.filters.search);
  const [detail, setDetail] = useState<SalesDetail>();
  const [lineId, setLineId] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [categoryPage, setCategoryPage] = useState(0);
  const [productPage, setProductPage] = useState(0);
  const [transactionPage, setTransactionPage] = useState(0);
  const [exclusionPage, setExclusionPage] = useState(0);
  const request = useRef(0);
  const opening = useRef(false);
  const retry = useRef<() => void>(() => undefined);
  const panelTitle = useRef<HTMLHeadingElement>(null);
  const opener = useRef<HTMLButtonElement | null>(null);
  const line = detail?.lines.find(item => item.lineId === lineId);
  const excludedLine = detail?.excludedLines.find(item => item.lineId === lineId);
  const sourceOpen = !!(line || excludedLine);
  function resetPages() { setCategoryPage(0); setProductPage(0); setTransactionPage(0); setExclusionPage(0); }
  const scope = view.products.find(item => item.id === view.filters.productId)?.name ?? view.categories.find(item => item.id === view.filters.categoryId)?.name ?? view.filters.productId ?? view.filters.categoryId ?? "Tüm ürünler";
  function closePanel() { setDetail(undefined); setLineId(undefined); opener.current?.focus(); }
  useEffect(() => { if (detail) panelTitle.current?.focus(); }, [detail, lineId]);
  useEffect(() => {
    if (!detail) return;
    function escape(event: KeyboardEvent) { if (event.key === "Escape") { setDetail(undefined); setLineId(undefined); opener.current?.focus(); } }
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, [detail]);
  async function query(filters: SalesFilters, next = screen) {
    if (opening.current) return;
    retry.current = () => { void query(filters, next); };
    const id = ++request.current; setBusy(true); setError(""); setDetail(undefined); setLineId(undefined);
    try {
      const result = await window.esmer.querySales({ context: view.context, filters });
      if (id !== request.current) return;
      if (result.status === "report") { setView(result.view); setScreen(next); resetPages(); }
      else { setError(result.message); if (result.status === "unavailable" && result.code === "STALE_CONTEXT") retry.current = () => { void open(view.context.period); }; }
    } catch { if (id === request.current) setError("Satış raporu yüklenemedi. Yeniden deneyin."); }
    finally { if (id === request.current) setBusy(false); }
  }
  async function open(period: string) {
    if (opening.current) return;
    opening.current = true;
    retry.current = () => { void open(period); };
    const id = ++request.current; setBusy(true); setError("");
    try {
      const result = await window.esmer.openSales({ period });
      if (id !== request.current) return;
      if (result.status === "report") { setView(result.view); setScreen(screen === "products" || screen === "transactions" ? "overview" : screen); setSearch(""); setDetail(undefined); setLineId(undefined); resetPages(); }
      else { setError(result.message); if (result.status === "unavailable" && result.code === "STALE_CONTEXT") retry.current = () => { void open(view.context.period); }; }
    } catch { if (id === request.current) setError("Satış raporu yüklenemedi. Yeniden deneyin."); }
    finally { opening.current = false; if (id === request.current) setBusy(false); }
  }
  async function inspect(documentId: string, button: HTMLButtonElement) {
    if (opening.current) return;
    retry.current = () => { void inspect(documentId, button); };
    opener.current = button; const id = ++request.current; setBusy(true); setError("");
    try {
      const result = await window.esmer.inspectSales({ context: view.context, filters: view.filters, documentId });
      if (id !== request.current) return;
      if (result.status === "detail") { setDetail(result.detail); setLineId(undefined); }
      else { setError(result.message); if (result.status === "unavailable" && result.code === "STALE_CONTEXT") retry.current = () => { void open(view.context.period); }; }
    } catch { if (id === request.current) setError("İşlem detayı yüklenemedi. İşlemi yeniden seçin."); }
    finally { if (id === request.current) setBusy(false); }
  }
  function reset() { if (opening.current) return; setSearch(""); void query(emptySalesFilters, "overview"); }
  function breakdown(rows: Breakdown[], products: boolean) {
    const page = products ? productPage : categoryPage;
    return <><div className="table-scroll" tabIndex={0}><table><thead><tr><th>{products ? "Ürün" : "Kategori"}</th>{products && <th>Miktar</th>}<th className="number">Net satış</th><th className="number">{products ? "Önceki aya göre" : "Pay / önceki ay"}</th></tr></thead><tbody>{pageRows(rows, page).map(row => <tr key={row.id}><td><Button variant="link" className="row-link" onClick={() => void query({ ...view.filters, categoryId: products ? view.filters.categoryId : row.id, productId: products ? row.id : null }, products ? "transactions" : "products")}>{row.name}</Button></td>{products && <td>{quantity(row.quantities)}</td>}<td className="number">{money(row.netSales)}</td><td className="number">{!products && <>{percent(row.share)}<br /></>}{percent(row.previousMonthChange)}</td></tr>)}</tbody></table></div><PageControls page={page} total={rows.length} label={products ? "Ürünler" : "Kategoriler"} onPage={products ? setProductPage : setCategoryPage} /></>;
  }
  const comparisons = (field: "netChange" | "transactionChange" | "basketChange") => <div className="comparisons">{([comparisonWindow]).map(key => <span key={key}>{key === "month" ? "Önceki ay" : "Önceki yıl"}<b className={view.comparisons[key][field] === null ? "" : view.comparisons[key][field]?.startsWith("-") ? "negative" : "positive"}>{view.comparisons[key][field] && !view.comparisons[key][field]?.startsWith("-") && view.comparisons[key][field] !== "0" ? "+" : ""}{percent(view.comparisons[key][field])}</b></span>)}</div>;
  const chartBaseline = view.daily.some(day => day.negative) ? 55 : 100;
  const chartScale = chartBaseline === 55 ? 0.5 : 1;
  const destination: Destination = screen === "products" || screen === "transactions" ? "overview" : screen;
  function navigate(next: Destination) {
    if (opening.current) return;
    ++request.current; setBusy(false); setError(""); setDetail(undefined); setLineId(undefined);
    if (next === "overview") reset(); else setScreen(next);
  }
  return <AppShell destination={destination} navigate={navigate} controls={<>
    <label className="period-label">Dönem <Input type="month" lang="tr" disabled={opening.current} value={view.context.period} onChange={event => { if (event.target.value) void open(event.target.value); }} /></label>
    <details className="data-status"><summary>Veri: <strong>{date(view.cutoff)}</strong></summary><div className="data-popover"><dl className="evidence"><dt>Paket hazırlanma</dt><dd>{date(view.extractedAt)}</dd><dt>İçe aktarım</dt><dd>{view.importedAt ? date(view.importedAt) : "Kayıt yok"}</dd><dt>Veri sürümü</dt><dd>{view.context.datasetId}</dd><dt>Hesaplama sürümü</dt><dd>{view.context.calculationVersion}</dd></dl><p>Raporlar yerel veri sürümünden okunur.</p></div></details>
    {view.warnings.includes("SYNTHETIC_ONLY") && <span className="synthetic-label" title="Gerçek market verisi değildir.">Sentetik veri</span>}
  </>}>
      {(stale || view.stale) && <div className="notice"><strong>Yeni veri sürümü hazır</strong><span>Bu rapor ve kaynak detayları açık sürümde sabit tutuluyor.</span><Button variant="outline" onClick={() => void open(view.context.period)}>Raporu yenile</Button></div>}
      {error && <div className="notice warning" role="alert"><span>{error}</span><Button variant="outline" onClick={() => retry.current()}>Yeniden dene</Button></div>}
      {busy && <p role="status">Rapor yükleniyor…</p>}
      {(screen === "monthly" || screen === "versions") ? <MonthlyWorkspace onExpenses={() => navigate("expenses")} onPurchasing={() => navigate("purchasing")} key={`${view.context.sessionId}:${screen}`} context={view.context} versions={screen === "versions"} revision={expenseRevision} refresh={() => void open(view.context.period)} onSales={(categoryId?: string) => { void query({ ...emptySalesFilters, categoryId: categoryId ?? null }, categoryId ? "products" : "overview"); }} /> : screen === "expenses" ? <ExpensesWorkspace key={view.context.period} period={view.context.period} onChange={() => setExpenseRevision(value => value + 1)} /> : screen === "purchasing" ? <PurchasingWorkspace key={view.context.sessionId} context={view.context} /> : <div className={`work-grid sales-control-desk${detail ? " has-detail" : ""}`}><main aria-busy={busy}>
        <div className="page-heading"><div><h1>{screen === "overview" ? "Satış Özeti" : screen === "products" ? "Kategori / Ürün Detayı" : "İşlemler"}</h1><p>{scope}</p></div><label className="search-label">Ürün ara<Input type="search" disabled={opening.current} value={search} placeholder="Ürün adı" onChange={event => { setSearch(event.target.value); void query({ ...emptySalesFilters, search: event.target.value }, event.target.value ? "products" : "overview"); }} /></label></div>
        {(!view.complete || view.coverage !== "complete") && <div className="notice warning"><strong>{view.coverage === "unavailable" ? "Dönem verisi yok" : view.coverage === "partial" ? "Kısmi dönem" : "Kanıt eksik"}</strong><span>{date(view.from)} – {date(view.to)}. Çözümlenmemiş katkılar sıfır kabul edilmez.</span></div>}
        {screen !== "overview" && <nav className="subview-nav" aria-label="Satış ayrıntıları"><Button variant="outline" onClick={reset}>Satış özetine dön</Button><Button variant="outline" onClick={() => void query({ ...view.filters, productId: null }, "products")}>Kategori / Ürün Detayı</Button><span>{scope}</span></nav>}
        <details className="metric-evidence" open={evidenceOpen} onToggle={event => setEvidenceOpen(event.currentTarget.open)}><summary ref={evidenceSummary}>{view.coverage === "unavailable" ? "Hesaplanamıyor" : !view.complete ? "Kanıt eksik" : view.coverage === "partial" ? "Kısmi dönem" : "Kaynakla uzlaşıyor"} · Bu sayı nasıl oluştu?</summary>
          <p>Satış yöntemi: indirim sonrası, kayıtlı KDV hariç, müşteri iadeleri düşülmüş. {quantity(view.metrics.quantities)}. {view.context.calculationVersion}</p>
          <p>Sentetik gösterim verisi; gerçek market verisi değildir.</p>
          {view.warnings.length > 0 && <ul className="warnings">{view.warnings.map(warning => <li key={warning}>{warning === "SYNTHETIC_ONLY" ? "Sentetik gösterim verisi" : warning === "PARTIAL_COVERAGE" ? "Veri kapsamı eksik" : warning === "MISSING_COST" ? "Eksik maliyet sıfır kabul edilmez" : "Veri kalitesi uyarısı: " + warning}</li>)}</ul>}
          <div className="comparison-boundaries">{(["month", "year"] as const).map(key => <p key={key}>{key === "month" ? "Önceki ay" : "Önceki yıl"}: bu dönem {date(view.comparisons[key].currentFrom)} – {date(view.comparisons[key].currentTo)} / karşılaştırma {date(view.comparisons[key].from)} – {date(view.comparisons[key].to)} · {view.comparisons[key].available ? "Karşılaştırma kapsamı mevcut" : "Eksik / karşılaştırılamıyor"}</p>)}</div>
        </details>
        {screen === "overview" && <>
          <div className="metrics"><article className="metric"><h2>Kapsanan net satış</h2><strong>{view.coverage === "unavailable" ? "Veri yok" : money(view.metrics.netSales)}</strong>{comparisons("netChange")}<p>KDV hariç · müşteri iadeleri düşülmüş</p><small>{view.coverage === "unavailable" ? "Miktar verisi yok" : quantity(view.metrics.quantities)}</small></article><article className="metric"><h2>Satış belgesi</h2><strong>{view.coverage === "unavailable" ? "Veri yok" : view.metrics.saleDocumentCount.toLocaleString("tr-TR")}</strong>{comparisons("transactionChange")}<p>Tamamlanmış satış belgeleri</p><small>Müşteri iadeleri sayıya dahil değildir.</small></article><article className="metric"><h2>Ortalama sepet</h2><strong>{view.coverage === "unavailable" ? "Veri yok" : view.metrics.averageBasket === null ? "Hesaplanamıyor" : money(view.metrics.averageBasket)}</strong>{comparisons("basketChange")}<p>Satış neti / satış belgesi</p><small>İade tutarı ve iade belgeleri dahil değildir.</small></article></div>
        </>}
        <div className="sales-desk-body"><div className="sales-ledger">
        {screen === "overview" ? <>
          <div className="overview-grid"><section className="block"><div className="section-heading"><h2>Günlük net satış</h2><label>Karşılaştırma<select value={comparisonWindow} onChange={event => setComparisonWindow(event.target.value as "month" | "year")}><option value="month">Önceki ay</option><option value="year">Önceki yıl</option></select></label></div><div className="chart" role="img" aria-label="Günlük net satış grafiği">{view.daily.map(day => <div className="bar-column" key={day.date}><svg viewBox="0 0 40 110" preserveAspectRatio="none" aria-hidden="true"><line x1="0" x2="40" y1={chartBaseline} y2={chartBaseline} stroke="currentColor" strokeWidth="0.5" /><rect x="8" y={day.negative ? chartBaseline : chartBaseline - Number(day.height) * chartScale} width="24" height={Number(day.height) * chartScale} className={day.negative ? "negative-bar" : "positive-bar"} /></svg><small>{day.date.slice(8)}</small><span className="sr-only">{date(day.date)}: {money(day.netSales)}</span></div>)}</div><p className="caption">Çizginin altındaki sütunlar negatif net satıştır. Tüm günlerin tutarları aşağıdadır.</p><details><summary>Günlük tutarlar</summary><ul>{view.daily.map(day => <li key={day.date}>{date(day.date)}: {money(day.netSales)}</li>)}</ul></details><p className="caption">İadeler dahil net satış. Negatif günler eksi işaretiyle günlük tutarlarda gösterilir.</p></section><section className="block category-block"><div className="section-heading"><h2>Kategori dağılımı</h2><Button variant="outline" onClick={() => void query(emptySalesFilters, "products")}>Tüm ürünler</Button></div>{breakdown(view.categories, false)}</section></div><Button variant="outline" className="all-transactions" onClick={() => void query(view.filters, "transactions")}>Tüm işlemleri göster</Button>
        </> : screen === "products" ? <section className="block">{view.products.length ? breakdown(view.products, true) : <div className="empty-state"><h2>Eşleşen ürün yok</h2><p>Başka bir ürün adı deneyin veya aramayı temizleyin. Bu seçim kaynak kapsamını değiştirmez.</p><Button variant="outline" onClick={reset}>Aramayı temizle</Button></div>}</section> : <section className="block"><div className="section-heading"><div><h2>İşlem listesi</h2><p>Tutarlar yalnızca seçili kapsamın katkısını gösterir.</p></div><label>İşlem türü<select value={view.filters.kind} onChange={event => void query({ ...view.filters, kind: event.target.value as SalesFilters["kind"] })}><option value="all">Tümü</option><option value="sale">Satışlar</option><option value="customer-return">Müşteri iadeleri</option></select></label></div><div className="table-scroll" tabIndex={0}><table><thead><tr><th>Tarih / belge</th><th>Tür</th><th className="number">Seçili kapsamın net satışı</th><th>Durum</th></tr></thead><tbody>{pageRows(view.transactions, transactionPage).map(transaction => <tr key={transaction.documentId} className={transaction.kind === "customer-return" ? "return-row" : ""}><td><Button variant="link" className="row-link" onClick={event => void inspect(transaction.documentId, event.currentTarget)}>{transaction.documentId}</Button><small>{date(transaction.date)}</small></td><td>{kind(transaction.kind)}</td><td className="number">{money(transaction.scopeNet)}</td><td>{transaction.reconciled ? "Sentetik kayıtlarla uzlaşıyor" : "Eksik · belge/satır farkı"}</td></tr>)}</tbody></table></div><PageControls page={transactionPage} total={view.transactions.length} label="İşlemler" onPage={setTransactionPage} />{!view.transactions.length && <p className="empty-state">Bu filtreye uyan işlem yok. Kaynak kapsamı yukarıda gösterilir.</p>}</section>}
        {view.exclusions.length > 0 && <section className="block exclusions"><h2>Hesaplama dışındaki belgeler ({view.exclusions.length})</h2><p>Bu belgelerin katkıları toplama dahil değildir.</p><ul>{pageRows(view.exclusions, exclusionPage).map(item => <li key={item.documentId}><Button variant="link" className="row-link" onClick={event => void inspect(item.documentId, event.currentTarget)}>{item.documentId}</Button> · {salesReasonLabels[item.reason] ?? item.reason}</li>)}</ul><PageControls page={exclusionPage} total={view.exclusions.length} label="Hesaplama dışındaki belgeler" onPage={setExclusionPage} /></section>}
      </div>
      {!detail && <aside className="sales-evidence-rail" aria-label="Satış kapsamı ve kanıt"><h2>Kayıttan kanıta</h2><p>Seçili dönem {view.context.period}. Belgeyi ve hesaplama kapsamını inceleyin.</p><SalesReceiptScene selection={receiptSelection} disabled={busy} onDocuments={() => { setReceiptSelection("documents"); void query({ ...view.filters, kind: "sale" }, "transactions"); }} onReturns={() => { setReceiptSelection("returns"); void query({ ...view.filters, kind: "customer-return" }, "transactions"); }} onEvidence={() => { setReceiptSelection("evidence"); setEvidenceOpen(true); requestAnimationFrame(() => { evidenceSummary.current?.focus(); evidenceSummary.current?.scrollIntoView({ block: "nearest" }); }); }} /><dl><dt>Veri sonu</dt><dd>{date(view.cutoff)}</dd><dt>Dönem kapsamı</dt><dd>{view.coverage === "complete" ? "Tam dönem" : view.coverage === "partial" ? "Kısmi dönem" : "Veri yok"}</dd><dt>Satış eşleme yöntemi</dt><dd>{view.mappingVersion}</dd></dl><p>Net satış, kâr değildir. Eksik maliyet ve giderler sıfır sayılmaz.</p><details><summary>Teknik kaynak kimliği</summary><p>{view.context.datasetId}<br />{view.mappingVersion}<br />{view.context.calculationVersion}</p></details></aside>}
      {detail && <aside className="detail-panel" aria-label={sourceOpen ? "Kaynak detayı" : "İşlem detayı"}><div className="panel-controls">{sourceOpen && <Button variant="outline" onClick={() => setLineId(undefined)}>İşleme dön</Button>}<Button variant="outline" className="close-panel" onClick={closePanel}>Kapat</Button></div><h2 ref={panelTitle} tabIndex={-1}>{sourceOpen ? "Kaynak Detayı" : "İşlem Detayı"}</h2><p className="panel-subtitle">{detail.documentId} · {date(detail.date)} · {kind(detail.kind)}</p>
        {(!detail.reconciled || detail.exclusion) && <div className="notice warning"><strong>Uzlaşma eksik</strong><span>{detail.exclusion ? salesReasonLabels[detail.exclusion] ?? detail.exclusion : "Belge veya satır tutarları arasında fark var. Tutar doğrulanmış sayılmaz."}</span></div>}
        {excludedLine ? <>
          <h3>{excludedLine.productName}</h3>
          <p className="explanation">Hesaplanmadı; bu satır net satış katkısı olarak kullanılmadı.</p>
          <p className="notice warning">{salesReasonLabels[excludedLine.reason] ?? excludedLine.reason}. Kaydedilen değerler kaynak kanıtıdır; bilinmeyen katkı sıfır kabul edilmez.</p>
          <details><summary>Kaynak ve yöntem</summary>
          <dl className="evidence">
            <dt>Belge / satır</dt><dd>{detail.documentId} / {excludedLine.lineId}</dd>
            <dt>Kaynak kimliği</dt><dd>{detail.lineage}</dd>
            <dt>Aktarım paketi</dt><dd>{detail.extractionId}</dd>
            <dt>Bu veri sürümünün içe aktarımı</dt><dd>{detail.importedAt ? date(detail.importedAt) : "Kayıt yok"}</dd>
            <dt>Veri sonu</dt><dd>{date(detail.cutoff)}</dd>
            <dt>Veri sürümü</dt><dd>{detail.context.datasetId}</dd>
            <dt>Hesaplama yöntemi</dt><dd>Belge hesaplama dışında tutuldu. Bu satır için net katkı, beklenen KDV veya brüt tutar hesaplanmadı.</dd>
            <dt>Yöntem sürümü</dt><dd>{detail.context.calculationVersion}</dd>
            <dt>Eşleme sürümü</dt><dd>{detail.mappingVersion}</dd>
            <dt>Uygulama revizyonu</dt><dd>{detail.context.appRevision}</dd>
            <dt>Kaydedilen miktar / birim</dt><dd>{decimal(excludedLine.quantity)} / {excludedLine.input?.unit === "piece" ? "adet" : excludedLine.input?.unit === "kg" ? "kg" : "Bilinmiyor"}</dd>
            <dt>Kaydedilen net / KDV / brüt</dt><dd>{money(excludedLine.net)} / {excludedLine.input ? money(excludedLine.input.tax) : "Bilinmiyor"} / {excludedLine.input ? money(excludedLine.input.gross) : "Bilinmiyor"}</dd>
            {excludedLine.input && <><dt>Ürün / kategori kimliği</dt><dd>{excludedLine.input.productId} / {excludedLine.input.categoryId}</dd><dt>Kaydedilen satır anlamı</dt><dd>{excludedLine.input.meaning === "known" ? "Bilinen" : "Bilinmiyor"}</dd><dt>Kaydedilen birim net / indirim / KDV oranı</dt><dd>{money(excludedLine.input.unitNet)} / {percent(excludedLine.input.discountRate)} / {percent(excludedLine.input.taxRate)}</dd></>}
          </dl></details>
        </> : line ? <><h3>{line.productName}</h3><p className="explanation">Bu {kind(line.kind).toLocaleLowerCase("tr-TR")} satırının net katkısı <strong>{money(line.net)}</strong>. Kaydedilen {money(line.tax)} KDV net satışa dahil değildir.</p>{!line.matchesScope && <p className="notice">Bu satır açık belgeye aittir; seçili kapsama dahil değildir.</p>}<p className="notice">{line.reconciled && detail.reconciled ? "Sentetik kaynak kaydıyla uzlaşıyor. Gerçek market kayıtlarının eksiksiz olduğunu kanıtlamaz." : "Eksik · satır veya belge farkı çözülmedi."}</p><details><summary>Kaynak ve yöntem</summary><dl className="evidence"><dt>Belge / satır</dt><dd>{detail.documentId} / {line.lineId}</dd><dt>Kaynak kimliği</dt><dd>{detail.lineage}</dd><dt>Aktarım paketi</dt><dd>{detail.extractionId}</dd><dt>Bu veri sürümünün içe aktarımı</dt><dd>{detail.importedAt ? date(detail.importedAt) : "Kayıt yok"}</dd><dt>Veri sonu</dt><dd>{date(detail.cutoff)}</dd><dt>Veri sürümü</dt><dd>{detail.context.datasetId}</dd><dt>Hesaplama yöntemi</dt><dd>Miktar × birim net × (1 − indirim oranı); iade eksi işaretli. Kaydedilen KDV ayrıca gösterilir.</dd><dt>Yöntem sürümü</dt><dd>{detail.context.calculationVersion}</dd></dl></details><details><summary>Teknik ayrıntılar</summary><dl className="evidence"><dt>Eşleme sürümü</dt><dd>{detail.mappingVersion}</dd><dt>Uygulama revizyonu</dt><dd>{detail.context.appRevision}</dd><dt>Kaydedilen miktar / birim</dt><dd>{decimal(line.recorded.quantity)} / {line.unit === "kg" ? "kg" : "adet"}</dd><dt>Ürün / kategori kimliği</dt><dd>{line.productId} / {line.categoryId}</dd><dt>Kaydedilen net / KDV / brüt</dt><dd>{money(line.recorded.net)} / {money(line.recorded.tax)} / {money(line.recorded.gross)}</dd><dt>Beklenen KDV</dt><dd>{money(line.expectedTax)}</dd><dt>Birim net / indirim / KDV oranı</dt><dd>{money(line.input.unitNet)} / {percent(line.input.discountRate)} / {percent(line.input.taxRate)}</dd><dt>Kapsam</dt><dd>{view.context.period} · {scope}</dd></dl></details></> : <><dl className="document-totals"><div><dt>Belge net toplamı</dt><dd>{detail.exclusion ? "Hesaplama dışında" : money(detail.totals.net)}</dd></div><div><dt>Kaydedilen KDV</dt><dd>{detail.recorded ? money(detail.recorded.tax) : "Bilinmiyor"}</dd></div><div><dt>Hesaplanan brüt toplam</dt><dd>{detail.exclusion ? "Hesaplama dışında" : money(detail.totals.gross)}</dd></div></dl><p className="selected-total">Seçili kapsam: <strong>{detail.exclusion ? "Hesaplama dışında" : money(detail.scopeNet)}</strong><br /><span>{scope} · tüm belge toplamından ayrıdır.</span></p>{!detail.reconciled && detail.recorded && <p className="notice warning">Kaydedilen başlık neti: {money(detail.recorded.net)} · hesaplanan satır neti: {detail.exclusion ? "Bilinmiyor" : money(detail.totals.net)} · kaydedilen brüt: {money(detail.recorded.gross)}</p>}<h3>Belge satırları</h3>{detail.lines.map(item => <article className={`receipt-line ${item.matchesScope ? "matched" : ""}`} key={item.lineId}><div className="line-heading"><h4>{item.productName}</h4><strong>{money(item.net)}</strong></div><p>{decimal(item.quantity)} {item.unit === "kg" ? "kg" : "adet"} · İndirim: {percent(item.input.discountRate)}</p><p>KDV: {money(item.tax)} · Brüt: {money(item.gross)}</p><small>{item.matchesScope ? "Seçili kapsamla eşleşiyor" : "Seçili kapsam dışında"}{!item.reconciled && " · Satır farkı var"}</small><Button variant="outline" className="source-link" onClick={() => setLineId(item.lineId)}>Kaynak detayını göster</Button></article>)}{detail.excludedLines.map(item => <article className="receipt-line" key={item.lineId}><h4>{item.productName}</h4><p>{item.lineId} · {salesReasonLabels[item.reason] ?? item.reason}</p><p>Kaydedilen net: {money(item.net)}. Net satış katkısı bilinmiyor; sıfır sayılmaz.</p><Button variant="outline" className="source-link" onClick={() => setLineId(item.lineId)}>Kaynak detayını göster</Button></article>)}<p className="caption">Tüm belge satırları gösterilir. Kaynak kimliği: {detail.documentId} · Paket: {detail.extractionId}</p></>}
      </aside>}
      </div></main></div>}<footer><span>Esmer Market · Çevrimdışı analiz</span><span>Tutarlar Türk lirası (TRY)</span></footer>
  </AppShell>;
}

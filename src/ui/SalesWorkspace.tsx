import { useEffect, useRef, useState, type ReactNode } from "react";
import { emptySalesFilters, type Breakdown, type SalesDetail, type SalesFilters, type SalesView } from "../reports/contracts";

import { decimal, money, date, quantity, percent } from "./format";
import { ExpensesWorkspace } from "./ExpensesWorkspace";
import { MonthlyWorkspace } from "./overview/MonthlyWorkspace";
import { OperatingSummary } from "./OperatingSummary";
import { PurchasingWorkspace } from "./purchasing/PurchasingWorkspace";
import { salesReasonLabels } from "./report-labels";
const kind = (value: string) => ({ sale: "Satış", "customer-return": "Müşteri iadesi", purchase: "Alış", "supplier-return": "Tedarikçi iadesi" })[value] ?? "Türü bilinmiyor";

export function SalesWorkspace({ view, setView, importing, importPackage, stale, messages }: { view: SalesView; setView: (view: SalesView) => void; importing: boolean; importPackage: () => Promise<void>; stale: boolean; messages: ReactNode }) {
  const [screen, setScreen] = useState<"monthly" | "versions" | "overview" | "products" | "transactions" | "purchasing" | "expenses">("monthly");
  const [expenseRevision, setExpenseRevision] = useState(0);
  const [search, setSearch] = useState(view.filters.search);
  const [detail, setDetail] = useState<SalesDetail>();
  const [lineId, setLineId] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const request = useRef(0);
  const opening = useRef(false);
  const retry = useRef<() => void>(() => undefined);
  const panelTitle = useRef<HTMLHeadingElement>(null);
  const opener = useRef<HTMLButtonElement | null>(null);
  const line = detail?.lines.find(item => item.lineId === lineId);
  const excludedLine = detail?.excludedLines.find(item => item.lineId === lineId);
  const sourceOpen = !!(line || excludedLine);
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
      if (result.status === "report") { setView(result.view); setScreen(next); }
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
      if (result.status === "report") { setView(result.view); setScreen(screen === "monthly" || screen === "versions" ? "monthly" : "overview"); setSearch(""); setDetail(undefined); setLineId(undefined); }
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
    return <div className="table-scroll"><table><thead><tr><th>{products ? "Ürün" : "Kategori"}</th>{products && <th>Miktar</th>}<th className="number">Net satış</th><th className="number">{products ? "Önceki aya göre" : "Pay / önceki ay"}</th></tr></thead><tbody>{rows.map(row => <tr key={row.id}><td><button className="row-link" onClick={() => void query({ ...view.filters, categoryId: products ? view.filters.categoryId : row.id, productId: products ? row.id : null }, products ? "transactions" : "products")}>{row.name}</button></td>{products && <td>{quantity(row.quantities)}</td>}<td className="number">{money(row.netSales)}</td><td className="number">{!products && <>{percent(row.share)}<br /></>}{percent(row.previousMonthChange)}</td></tr>)}</tbody></table></div>;
  }
  const comparisons = (field: "netChange" | "transactionChange" | "basketChange") => <div className="comparisons">{(["month", "year"] as const).map(key => <span key={key}>{key === "month" ? "Önceki ay" : "Önceki yıl"}<b className={view.comparisons[key][field] === null ? "" : view.comparisons[key][field]?.startsWith("-") ? "negative" : "positive"}>{percent(view.comparisons[key][field])}</b></span>)}</div>;
  return <div className="sales-app">
    <header className="app-header"><button className="brand" onClick={reset}>ESMER <span>MARKET</span></button><span>Yerel analiz</span><span className="offline">● Canlı bağlantı kapalı</span><button disabled={importing} onClick={() => void importPackage()}>{importing ? "Veriler içe aktarılıyor…" : "Veri paketi içe aktar"}</button></header>
    <div className="workspace">
      <div className="workspace-header"><nav aria-label="Analiz gezinmesi"><button onClick={() => { ++request.current; setBusy(false); setDetail(undefined); setScreen("monthly"); }}>Aylık Market Özeti</button><button onClick={reset}>Satış Özeti</button><button disabled={opening.current} onClick={() => { ++request.current; setBusy(false); setDetail(undefined); setScreen("purchasing"); }}>Maliyet ve Alışlar</button><button onClick={() => { ++request.current; setBusy(false); setDetail(undefined); setScreen("expenses"); }}>Giderler</button><button onClick={() => { ++request.current; setBusy(false); setDetail(undefined); setScreen("versions"); }}>Rapor sürümleri</button>{screen !== "overview" && screen !== "purchasing" && screen !== "expenses" && screen !== "monthly" && screen !== "versions" && <><span>/</span><button onClick={() => void query({ ...view.filters, productId: null }, "products")}>Kategori / Ürün Detayı</button></>}{screen === "transactions" && <span>/ İşlemler</span>}</nav><label className="period-label">Dönem <input type="month" lang="tr" disabled={opening.current} value={view.context.period} onChange={event => { if (event.target.value) void open(event.target.value); }} /></label></div>
      <div className="data-strip"><span>Veri sonu: <strong>{date(view.cutoff)}</strong></span><span>Paket hazırlanma: {date(view.extractedAt)}</span><span>Bu veri sürümünün içe aktarımı: {view.importedAt ? date(view.importedAt) : "Kayıt yok"}</span><span>Rapor aralığı: {date(view.from)} – {date(view.to)}</span><span>Kapsam: {screen === "purchasing" ? "Maliyet: tüm ürünler" : scope}</span></div>
      <div className="import-messages">{messages}</div>
      {(stale || view.stale) && <div className="notice"><strong>Yeni veri sürümü hazır</strong><span>Bu rapor ve kaynak detayları açık sürümde sabit tutuluyor.</span><button onClick={() => void open(view.context.period)}>Raporu yenile</button></div>}
      {error && <div className="notice warning" role="alert"><span>{error}</span><button onClick={() => retry.current()}>Yeniden dene</button></div>}
      {busy && <p role="status">Rapor yükleniyor…</p>}
      {(screen === "monthly" || screen === "versions") ? <MonthlyWorkspace context={view.context} versions={screen === "versions"} revision={expenseRevision} refresh={() => void open(view.context.period)} /> : screen === "expenses" ? <ExpensesWorkspace key={view.context.period} period={view.context.period} onChange={() => setExpenseRevision(value => value + 1)} /> : screen === "purchasing" ? <PurchasingWorkspace key={view.context.sessionId} context={view.context} /> : <div className="work-grid"><main aria-busy={busy}>
        <div className="page-heading"><div><h1>{screen === "overview" ? "Satış Özeti" : screen === "products" ? "Kategori / Ürün Detayı" : "İşlemler"}</h1><p>{scope} · {view.context.period} · TRY</p></div><label className="search-label">Ürün ara<input type="search" disabled={opening.current} value={search} placeholder="Ürün adı" onChange={event => { setSearch(event.target.value); void query({ ...emptySalesFilters, search: event.target.value }, event.target.value ? "products" : "overview"); }} /></label></div>
        <div className={`notice ${!view.complete ? "warning" : ""}`}><strong>{view.coverage === "unavailable" ? "Dönem verisi yok" : view.coverage === "partial" ? "Kısmi dönem" : "Dönem kapsamı tam"}{!view.complete ? " · Uzlaşma eksik" : ""}</strong><span>{view.coverage === "unavailable" ? "Kaynak kapsamı dışında kalan dönem sıfır faaliyet anlamına gelmez." : `Gösterilen değerler ${date(view.from)} – ${date(view.to)} aralığındaki kapsanan katkılardır.`} Sentetik gösterim verisi; gerçek market verisi değildir.</span></div>
        {!view.complete && view.coverage !== "unavailable" && <p className="caption">Çözümlenmemiş kayıtlar ve belge/satır farkları nedeniyle bu değerler doğrulanmış toplam değildir. Bilinmeyen katkılar sıfır kabul edilmez.</p>}
        {view.warnings.length > 0 && <ul className="warnings">{view.warnings.map(warning => <li key={warning}>{warning === "SYNTHETIC_ONLY" ? "Sentetik gösterim verisi" : warning === "PARTIAL_COVERAGE" ? "Veri kapsamı eksik" : warning === "MISSING_COST" ? "Eksik maliyet sıfır kabul edilmez" : "Veri kalitesi uyarısı: " + warning}</li>)}</ul>}
        {screen !== "transactions" && <div className="comparison-boundaries">{(["month", "year"] as const).map(key => <p key={key}>{key === "month" ? "Önceki ay" : "Önceki yıl"}: bu dönem {date(view.comparisons[key].currentFrom)} – {date(view.comparisons[key].currentTo)} / karşılaştırma {date(view.comparisons[key].from)} – {date(view.comparisons[key].to)} · {view.comparisons[key].available ? "Karşılaştırma kapsamı mevcut" : "Eksik / karşılaştırılamıyor"}</p>)}</div>}
        {screen === "overview" ? <>
          <OperatingSummary context={view.context} revision={expenseRevision} refresh={() => void open(view.context.period)} />
          <div className="metrics"><article className="metric"><h2>Kapsanan net satış</h2><strong>{view.coverage === "unavailable" ? "Veri yok" : money(view.metrics.netSales)}</strong>{comparisons("netChange")}<p>KDV hariç · müşteri iadeleri düşülmüş</p><small>{view.coverage === "unavailable" ? "Miktar verisi yok" : quantity(view.metrics.quantities)}</small></article><article className="metric"><h2>Satış belgesi</h2><strong>{view.coverage === "unavailable" ? "Veri yok" : view.metrics.saleDocumentCount.toLocaleString("tr-TR")}</strong>{comparisons("transactionChange")}<p>Tamamlanmış satış belgeleri</p><small>Müşteri iadeleri sayıya dahil değildir.</small></article><article className="metric"><h2>Ortalama sepet</h2><strong>{view.coverage === "unavailable" ? "Veri yok" : view.metrics.averageBasket === null ? "Hesaplanamıyor" : money(view.metrics.averageBasket)}</strong>{comparisons("basketChange")}<p>Satış neti / satış belgesi</p><small>İade tutarı ve iade belgeleri dahil değildir.</small></article></div>
          <div className="overview-grid"><section className="block"><div className="section-heading"><h2>Günlük net satış</h2><span>TRY · kapsanan katkılar</span></div><div className="chart" role="img" aria-label="Günlük net satış grafiği">{view.daily.map(day => <div className="bar-column" key={day.date}><svg viewBox="0 0 40 110" preserveAspectRatio="none" aria-hidden="true"><rect x="8" y="0" width="24" height={day.height} className={day.negative ? "negative-bar" : "positive-bar"} transform="translate(0 100) scale(1 -1)" /></svg><small>{day.date.slice(8)}</small><span className="sr-only">{date(day.date)}: {money(day.netSales)}</span></div>)}</div><details><summary>Günlük tutarlar</summary><ul>{view.daily.map(day => <li key={day.date}>{date(day.date)}: {money(day.netSales)}</li>)}</ul></details><p className="caption">İadeler dahil net satış. Negatif günler eksi işaretiyle günlük tutarlarda gösterilir.</p></section><section className="block category-block"><div className="section-heading"><h2>Kategori dağılımı</h2><button onClick={() => void query(emptySalesFilters, "products")}>Tüm ürünler</button></div>{breakdown(view.categories, false)}</section></div><button className="all-transactions" onClick={() => void query(view.filters, "transactions")}>Tüm işlemleri göster</button>
        </> : screen === "products" ? <section className="block">{view.products.length ? breakdown(view.products, true) : <div className="empty-state"><h2>Eşleşen ürün yok</h2><p>Başka bir ürün adı deneyin veya aramayı temizleyin. Bu seçim kaynak kapsamını değiştirmez.</p><button onClick={reset}>Aramayı temizle</button></div>}</section> : <section className="block"><div className="section-heading"><div><h2>İşlem listesi</h2><p>Tutarlar yalnızca seçili kapsamın katkısını gösterir.</p></div><label>İşlem türü<select value={view.filters.kind} onChange={event => void query({ ...view.filters, kind: event.target.value as SalesFilters["kind"] })}><option value="all">Tümü</option><option value="sale">Satışlar</option><option value="customer-return">Müşteri iadeleri</option></select></label></div><div className="table-scroll"><table><thead><tr><th>Tarih / belge</th><th>Tür</th><th className="number">Seçili kapsamın net satışı</th><th>Durum</th></tr></thead><tbody>{view.transactions.map(transaction => <tr key={transaction.documentId} className={transaction.kind === "customer-return" ? "return-row" : ""}><td><button className="row-link" onClick={event => void inspect(transaction.documentId, event.currentTarget)}>{transaction.documentId}</button><small>{date(transaction.date)}</small></td><td>{kind(transaction.kind)}</td><td className="number">{money(transaction.scopeNet)}</td><td>{transaction.reconciled ? "Sentetik kayıtlarla uzlaşıyor" : "Eksik · belge/satır farkı"}</td></tr>)}</tbody></table></div>{!view.transactions.length && <p className="empty-state">Bu filtreye uyan işlem yok. Kaynak kapsamı yukarıda gösterilir.</p>}</section>}
        {view.exclusions.length > 0 && <section className="block exclusions"><h2>Hesaplama dışındaki belgeler ({view.exclusions.length})</h2><p>Bu belgelerin katkıları toplama dahil değildir.</p><ul>{view.exclusions.map(item => <li key={item.documentId}><button className="row-link" onClick={event => void inspect(item.documentId, event.currentTarget)}>{item.documentId}</button> · {salesReasonLabels[item.reason] ?? item.reason}</li>)}</ul></section>}
      </main>
      {detail && <aside className="detail-panel" aria-label={sourceOpen ? "Kaynak detayı" : "İşlem detayı"}><div className="panel-controls">{sourceOpen && <button onClick={() => setLineId(undefined)}>İşleme dön</button>}<button className="close-panel" onClick={closePanel}>Kapat</button></div><h2 ref={panelTitle} tabIndex={-1}>{sourceOpen ? "Kaynak Detayı" : "İşlem Detayı"}</h2><p className="panel-subtitle">{detail.documentId} · {date(detail.date)} · {kind(detail.kind)}</p>
        {(!detail.reconciled || detail.exclusion) && <div className="notice warning"><strong>Uzlaşma eksik</strong><span>{detail.exclusion ? salesReasonLabels[detail.exclusion] ?? detail.exclusion : "Belge veya satır tutarları arasında fark var. Tutar doğrulanmış sayılmaz."}</span></div>}
        {excludedLine ? <>
          <h3>{excludedLine.productName}</h3>
          <p className="explanation">Hesaplanmadı; bu satır net satış katkısı olarak kullanılmadı.</p>
          <p className="notice warning">{salesReasonLabels[excludedLine.reason] ?? excludedLine.reason}. Kaydedilen değerler kaynak kanıtıdır; bilinmeyen katkı sıfır kabul edilmez.</p>
          <h3>Kaynak ve yöntem</h3>
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
          </dl>
        </> : line ? <><h3>{line.productName}</h3><p className="explanation">Bu {kind(line.kind).toLocaleLowerCase("tr-TR")} satırının net katkısı <strong>{money(line.net)}</strong>. Kaydedilen {money(line.tax)} KDV net satışa dahil değildir.</p>{!line.matchesScope && <p className="notice">Bu satır açık belgeye aittir; seçili kapsama dahil değildir.</p>}<p className="notice">{line.reconciled && detail.reconciled ? "Sentetik kaynak kaydıyla uzlaşıyor. Gerçek market kayıtlarının eksiksiz olduğunu kanıtlamaz." : "Eksik · satır veya belge farkı çözülmedi."}</p><h3>Kaynak ve yöntem</h3><dl className="evidence"><dt>Belge / satır</dt><dd>{detail.documentId} / {line.lineId}</dd><dt>Kaynak kimliği</dt><dd>{detail.lineage}</dd><dt>Aktarım paketi</dt><dd>{detail.extractionId}</dd><dt>Bu veri sürümünün içe aktarımı</dt><dd>{detail.importedAt ? date(detail.importedAt) : "Kayıt yok"}</dd><dt>Veri sonu</dt><dd>{date(detail.cutoff)}</dd><dt>Veri sürümü</dt><dd>{detail.context.datasetId}</dd><dt>Hesaplama yöntemi</dt><dd>Miktar × birim net × (1 − indirim oranı); iade eksi işaretli. Kaydedilen KDV ayrıca gösterilir.</dd><dt>Yöntem sürümü</dt><dd>{detail.context.calculationVersion}</dd></dl><details><summary>Teknik ayrıntılar</summary><dl className="evidence"><dt>Eşleme sürümü</dt><dd>{detail.mappingVersion}</dd><dt>Uygulama revizyonu</dt><dd>{detail.context.appRevision}</dd><dt>Kaydedilen miktar / birim</dt><dd>{decimal(line.recorded.quantity)} / {line.unit === "kg" ? "kg" : "adet"}</dd><dt>Ürün / kategori kimliği</dt><dd>{line.productId} / {line.categoryId}</dd><dt>Kaydedilen net / KDV / brüt</dt><dd>{money(line.recorded.net)} / {money(line.recorded.tax)} / {money(line.recorded.gross)}</dd><dt>Beklenen KDV</dt><dd>{money(line.expectedTax)}</dd><dt>Birim net / indirim / KDV oranı</dt><dd>{money(line.input.unitNet)} / {percent(line.input.discountRate)} / {percent(line.input.taxRate)}</dd><dt>Kapsam</dt><dd>{view.context.period} · {scope}</dd></dl></details></> : <><dl className="document-totals"><div><dt>Belge net toplamı</dt><dd>{detail.exclusion ? "Hesaplama dışında" : money(detail.totals.net)}</dd></div><div><dt>Kaydedilen KDV</dt><dd>{detail.recorded ? money(detail.recorded.tax) : "Bilinmiyor"}</dd></div><div><dt>Hesaplanan brüt toplam</dt><dd>{detail.exclusion ? "Hesaplama dışında" : money(detail.totals.gross)}</dd></div></dl><p className="selected-total">Seçili kapsam: <strong>{detail.exclusion ? "Hesaplama dışında" : money(detail.scopeNet)}</strong><br /><span>{scope} · tüm belge toplamından ayrıdır.</span></p>{!detail.reconciled && detail.recorded && <p className="notice warning">Kaydedilen başlık neti: {money(detail.recorded.net)} · hesaplanan satır neti: {detail.exclusion ? "Bilinmiyor" : money(detail.totals.net)} · kaydedilen brüt: {money(detail.recorded.gross)}</p>}<h3>Belge satırları</h3>{detail.lines.map(item => <article className={`receipt-line ${item.matchesScope ? "matched" : ""}`} key={item.lineId}><div className="line-heading"><h4>{item.productName}</h4><strong>{money(item.net)}</strong></div><p>{decimal(item.quantity)} {item.unit === "kg" ? "kg" : "adet"} · İndirim: {percent(item.input.discountRate)}</p><p>KDV: {money(item.tax)} · Brüt: {money(item.gross)}</p><small>{item.matchesScope ? "Seçili kapsamla eşleşiyor" : "Seçili kapsam dışında"}{!item.reconciled && " · Satır farkı var"}</small><button className="source-link" onClick={() => setLineId(item.lineId)}>Kaynak detayını göster</button></article>)}{detail.excludedLines.map(item => <article className="receipt-line" key={item.lineId}><h4>{item.productName}</h4><p>{item.lineId} · {salesReasonLabels[item.reason] ?? item.reason}</p><p>Kaydedilen net: {money(item.net)}. Net satış katkısı bilinmiyor; sıfır sayılmaz.</p><button className="source-link" onClick={() => setLineId(item.lineId)}>Kaynak detayını göster</button></article>)}<p className="caption">Tüm belge satırları gösterilir. Kaynak kimliği: {detail.documentId} · Paket: {detail.extractionId}</p></>}
      </aside>}
      </div>}<footer><span>Esmer Market · Çevrimdışı analiz · {view.context.datasetId}</span><span>{view.context.calculationVersion}</span></footer>
    </div>
  </div>;
}

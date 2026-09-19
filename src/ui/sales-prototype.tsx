// THROWAWAY: three compositions of the approved sales journey, selected by ?variant=A|B|C.
// All report numbers below are precomputed synthetic fixtures, not financial calculation code.
import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';

type Variant = 'A' | 'B' | 'C';
type Line = { product: string; quantity: string; net: string; tax: string; gross: string; id: string };
const products = [
  { id: 'bread', name: 'Günlük ekmek', category: 'Fırın', net: '150,00', quantity: '5 adet', share: '%41,1', change: '+%7,1' },
  { id: 'water', name: 'İçme suyu · 1,5 L', category: 'İçecekler', net: '100,00', quantity: '5 adet', share: '%27,4', change: '+%25,0' },
  { id: 'apple', name: 'Elma', category: 'Manav', net: '80,00', quantity: '2 kg', share: '%21,9', change: '+%14,3' },
  { id: 'soda', name: 'Maden suyu · 200 ml', category: 'İçecekler', net: '35,00', quantity: '1 adet', share: '%9,6', change: '+%16,7' },
];
const categories = [
  { name: 'Fırın', net: '150,00', share: '%41,1', change: '+%7,1', width: 100 },
  { name: 'İçecekler', net: '135,00', share: '%37,0', change: '+%22,7', width: 90 },
  { name: 'Manav', net: '80,00', share: '%21,9', change: '+%14,3', width: 53 },
];
const documents = [
  { id: 'DEMO-S003', date: '03.09.2025', kind: 'sale', net: '200,00', tax: '10,00', gross: '210,00', lines: [
    { id: 'L005', product: 'bread', quantity: '4 adet', net: '120,00', tax: '6,00', gross: '126,00' },
    { id: 'L006', product: 'apple', quantity: '2 kg', net: '80,00', tax: '4,00', gross: '84,00' },
  ] },
  { id: 'DEMO-R001', date: '03.09.2025', kind: 'return', net: '−35,00', tax: '−1,75', gross: '−36,75', lines: [
    { id: 'L007', product: 'soda', quantity: '−1 adet', net: '−35,00', tax: '−1,75', gross: '−36,75' },
  ] },
  { id: 'DEMO-S002', date: '02.09.2025', kind: 'sale', net: '130,00', tax: '6,50', gross: '136,50', lines: [
    { id: 'L003', product: 'water', quantity: '3 adet', net: '60,00', tax: '3,00', gross: '63,00' },
    { id: 'L004', product: 'soda', quantity: '2 adet', net: '70,00', tax: '3,50', gross: '73,50' },
  ] },
  { id: 'DEMO-S001', date: '01.09.2025', kind: 'sale', net: '70,00', tax: '3,50', gross: '73,50', lines: [
    { id: 'L001', product: 'water', quantity: '2 adet', net: '40,00', tax: '2,00', gross: '42,00' },
    { id: 'L002', product: 'bread', quantity: '1 adet', net: '30,00', tax: '1,50', gross: '31,50' },
  ] },
];
const variantNames = { A: 'Dengeli özet', B: 'Yoğun tablo', C: 'Rehberli okuma' };
const getVariant = (): Variant => { const v = new URLSearchParams(location.search).get('variant'); return v === 'B' || v === 'C' ? v : 'A'; };
const productFor = (id: string) => products.find(p => p.id === id)!;
function Arrow({ back = false }: { back?: boolean }) { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d={back ? 'M19 12H5m6-6-6 6 6 6' : 'M5 12h14m-6-6 6 6-6 6'} /></svg>; }
function App() {
  const [variant, setVariant] = useState<Variant>(getVariant);
  const [view, setView] = useState<'overview' | 'products' | 'transactions'>('overview');
  const [category, setCategory] = useState('');
  const [product, setProduct] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [period, setPeriod] = useState('2025-09');
  const [scenario, setScenario] = useState('normal');
  const [docId, setDocId] = useState('');
  const [lineId, setLineId] = useState('');
  const panelTitle = useRef<HTMLHeadingElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const doc = documents.find(d => d.id === docId);
  const line = doc?.lines.find(l => l.id === lineId);
  const discrepant = scenario === 'discrepancy';
  const unavailable = scenario === 'empty' || period !== '2025-09';
  const cycle = (offset: number) => setVariant(v => (['A','B','C'] as Variant[])[(['A','B','C'].indexOf(v) + offset + 3) % 3]);
  useEffect(() => { const url = new URL(location.href); url.searchParams.set('variant', variant); history.replaceState(null, '', url); }, [variant]);
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (event.key === 'Escape' && docId) { if (lineId) setLineId(''); else closePanel(); }
      if (target.closest('input, textarea, select, [contenteditable="true"], [role="slider"], summary')) return;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); cycle(event.key === 'ArrowLeft' ? -1 : 1); }
    };
    window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key);
  }, [docId, lineId]);
  useEffect(() => { if (docId) panelTitle.current?.focus(); }, [docId, lineId]);
  function closePanel() { setDocId(''); setLineId(''); opener.current?.focus(); }
  function reset() { setView('overview'); setCategory(''); setProduct(''); setQuery(''); setFilter('all'); setDocId(''); setLineId(''); }
  function openCategory(name: string) { setCategory(name); setProduct(''); setQuery(''); setView('products'); setDocId(''); setLineId(''); }
  function openProduct(id: string) { setProduct(id); setCategory(productFor(id).category); setQuery(''); setFilter('all'); setView('transactions'); setDocId(''); setLineId(''); }
  function openDoc(id: string, element: HTMLElement) { opener.current = element; setDocId(id); setLineId(''); }
  function matches(l: Line) { return product ? l.product === product : category ? productFor(l.product).category === category : true; }
  function contribution(d: typeof documents[number]) {
    if (!product && !category) return d.net;
    const matching = d.lines.filter(matches);
    return matching.length === d.lines.length ? d.net : matching[0]?.net ?? '—';
  }
  const scope = product ? productFor(product).name : category;
  const visibleProducts = products.filter(p => query ? p.name.toLocaleLowerCase('tr').includes(query.toLocaleLowerCase('tr')) : !category || p.category === category);
  const visibleDocs = documents.filter(d => d.lines.some(matches) && (filter === 'all' || d.kind === filter));
  const title = query ? 'Ürün arama' : view === 'overview' ? 'Satış Özeti' : view === 'products' ? category || 'Ürünler' : product ? productFor(product).name : 'İşlemler';
  const reportStatus = discrepant ? 'Eksik · fark var' : 'Örnek kayıtlarla uzlaşıyor';

  const metrics = <section className="metrics" aria-label="Satış göstergeleri">
    {[
      ['Net satış', '365,00 ₺', '+%14,1', '+%21,7', 'KDV hariç · iadeler düşüldü'],
      ['Tamamlanan satış', '3 işlem', '%0,0', '+%50,0', '1 müşteri iadesi ayrıca gösterilir'],
      ['Ortalama sepet', '133,33 ₺', '+%11,1', '−%16,7', 'İade öncesi 400,00 ₺ / 3 satış'],
    ].map(([label, value, month, year, note]) => <div className="metric" key={label}><h2>{label}</h2><strong>{value}</strong><div className="comparisons"><span>Aya göre <b className={month.startsWith('−') ? 'negative' : month.startsWith('+') ? 'positive' : undefined}>{month}</b></span><span>Yıla göre <b className={year.startsWith('−') ? 'negative' : year.startsWith('+') ? 'positive' : undefined}>{year}</b></span></div><p>{note}</p><small>{reportStatus}</small></div>)}
  </section>;
  const trend = <section className="trend block" aria-label="Günlük net satış">
    <div className="section-heading"><h2>Günlük net satış</h2><span>01–03 Eylül · TRY</span></div>
    <div className="chart" role="img" aria-label="1 Eylül 70 lira, 2 Eylül 130 lira, 3 Eylül 165 lira net satış. Sentetik örnek.">
      {[['01 Eyl','70,00',42.424242],['02 Eyl','130,00',78.787879],['03 Eyl','165,00',100]].map(([day, value, height]) => <div className="bar-column" key={day}><div className="bar" style={{height: `${height}%`}}><span>{value} ₺</span></div><small>{day}</small></div>)}
    </div><p className="caption">3 Eylül: 200,00 ₺ satış − 35,00 ₺ müşteri iadesi.</p>
  </section>;
  const categoryTable = <section className="category-block block">
    <div className="section-heading"><div><h2>Kategoriler</h2><p>Bir kategori seçerek ürünlere ilerleyin.</p></div><span>Net satışa göre</span></div>
    <div className="table-scroll"><table><thead><tr><th>Kategori</th><th className="number">Net satış</th><th className="number">Pay</th><th className="number">Önceki ay</th></tr></thead><tbody>{categories.map(c => <tr key={c.name}><td><button className="row-link" onClick={() => openCategory(c.name)}>{c.name}<Arrow /></button><div className="share-track"><span style={{width: `${c.width}%`}} /></div></td><td className="number">{c.net} ₺</td><td className="number">{c.share}</td><td className="number">{c.change}</td></tr>)}</tbody></table></div>
    <p className="caption">Net miktar: 11 adet ve 2 kg. Farklı birimler toplanmaz.</p>
  </section>;
  const overview = variant === 'A' ? <div className="layout-a">{metrics}<div className="overview-grid">{trend}{categoryTable}</div></div> : variant === 'B' ? <div className="layout-b">{metrics}<div className="overview-grid">{categoryTable}{trend}</div></div> : <div className="layout-c"><div className="summary-rail"><h2>Ayın kısa özeti</h2>{metrics}</div><div className="reading-column">{trend}{categoryTable}</div></div>;

  return <div className={`prototype variant-${variant}`}>
    <div className="prototype-banner"><strong>Etkileşimli taslak</strong><span>Tüm rakamlar sentetik örnektir. Gerçek market verisi değildir.</span></div>
    <header className="app-header"><button className="brand" onClick={reset}>ESMER <span>MARKET</span></button><span>Satış analizi</span><span className="offline">Çevrimdışı örnek</span></header>
    <div className="workspace">
      <div className="workspace-header"><nav aria-label="Gezinti"><button onClick={reset}>Satış özeti</button>{category && <><span>/</span><button onClick={() => openCategory(category)}>{category}</button></>}{product && <><span>/</span><span>{productFor(product).name}</span></>}</nav><label className="period-label">Dönem <select aria-label="Dönem" value={period} onChange={e => { setPeriod(e.target.value); reset(); }}><option value="2025-09">Eylül 2025</option><option value="2025-08">Ağustos 2025 · veri yok</option></select></label></div>
      <div className="data-strip">{scenario === 'empty' ? <span>Henüz aktarım yok · Canlı bağlantı kapalı</span> : <><span>Veri sonu: <b>03.09.2025</b></span><span>Son aktarım: 04.09.2025</span><span>Rapor: DEMO-v1</span><span>Canlı bağlantı kapalı</span></>}</div>
      <div className="work-grid">
        <main>
          <div className="page-heading"><div><h1>{title}</h1><p>{view === 'transactions' ? 'Seçili ürünün satış ve müşteri iadesi kayıtları.' : 'Eylül ayını inceleyin; bir tutarın kaynağına kadar ilerleyin.'}</p></div><label className="search-label">Ürün ara<input type="search" placeholder="Ürün adı, ör. su" value={query} onChange={e => {setQuery(e.target.value); setDocId(''); setLineId('');}} /></label></div>
          {!unavailable && <div className="notice"><strong>Kısmi dönem · 01–03 Eylül</strong><span>Karşılaştırmalar: 01–03 Ağustos 2025 ve 01–03 Eylül 2024. Tutar değişimi, gerçek büyüme veya kâr değildir.</span></div>}
          {scenario === 'refresh' && <div className="notice"><strong>Yeni örnek veri sürümü hazır: DEMO-v2</strong><span>Bu inceleme DEMO-v1 üzerinde sabit tutuluyor. Gezinirken sayılar değişmez.</span></div>}
          {discrepant && <div className="notice warning" role="status"><strong>DEMO-S002 belgesinde 2,00 ₺ fark var.</strong><span>Satır toplamı 130,00 ₺, belge başlığı 132,00 ₺. Raporda satır tutarları gösteriliyor; uzlaşma eksik.</span><button onClick={e => openDoc('DEMO-S002', e.currentTarget)}>Farkı incele</button></div>}
          {unavailable ? <section className="empty-state"><h2>{scenario === 'empty' ? 'Henüz veri içe aktarılmadı' : 'Bu dönem için veri yok'}</h2><p>{scenario === 'empty' ? 'Hazırlanmış bir veri paketi içe aktarıldığında satışlar burada görünür.' : 'Ağustos ayına ait ayrıntılı kayıtlar bu örnekte bulunmuyor. Bu, satış olmadığı anlamına gelmez.'}</p><button onClick={() => {setPeriod('2025-09'); setScenario('normal');}}>Eylül örneğine dön</button></section> : scenario === 'loading' ? <section className="empty-state" aria-busy="true" aria-live="polite"><h2>Satış özeti hazırlanıyor…</h2><div className="skeleton" /><div className="skeleton short" /><button onClick={() => setScenario('normal')}>Yükleme örneğini tamamla</button></section> : scenario === 'failure' ? <section className="empty-state" role="alert"><h2>Rapor yüklenemedi</h2><p>Yerel hizmet yanıt vermedi. Son geçerli veri korunuyor.</p><button onClick={() => setScenario('normal')}>Yeniden dene</button></section> : <>
            {query || view === 'products' ? <section className="block"><div className="section-heading"><h2>{query ? `“${query}” için ürünler` : 'Ürünler'}</h2><span>{visibleProducts.length} ürün · net satışa göre</span></div>{visibleProducts.length ? <div className="table-scroll"><table><thead><tr><th>Ürün</th><th>Net miktar</th><th className="number">Net satış</th><th className="number">Önceki ay</th></tr></thead><tbody>{visibleProducts.map(p => <tr key={p.id}><td><button className="row-link" onClick={() => openProduct(p.id)}>{p.name}<Arrow /></button><small>{p.category}</small></td><td>{p.quantity}</td><td className="number">{p.net} ₺</td><td className="number">{p.change}</td></tr>)}</tbody></table></div> : <div className="empty-state"><h2>Eşleşen ürün yok</h2><p>Başka bir ürün adı deneyin veya aramayı temizleyin.</p><button onClick={() => setQuery('')}>Aramayı temizle</button></div>}<p className="caption">Bir ürünü seçerek tutarı oluşturan işlemleri görün.</p></section> : view === 'overview' ? overview : <section className="block"><div className="section-heading"><div><h2>İşlemler</h2><p>Tutarlar yalnızca {scope || 'seçili kapsam'} için geçerlidir.</p></div><label>İşlem türü <select value={filter} onChange={e => setFilter(e.target.value)}><option value="all">Tümü</option><option value="sale">Satışlar</option><option value="return">Müşteri iadeleri</option></select></label></div><div className="table-scroll"><table><thead><tr><th>Tarih / belge</th><th>Tür</th><th className="number">Seçili kapsamın net satışı</th><th>Durum</th></tr></thead><tbody>{visibleDocs.map(d => <tr key={d.id} className={d.kind === 'return' ? 'return-row' : undefined}><td><button className="row-link" onClick={e => openDoc(d.id, e.currentTarget)}>{d.id}<Arrow /></button><small>{d.date}</small></td><td>{d.kind === 'return' ? 'Müşteri iadesi' : 'Satış'}</td><td className="number">{contribution(d)} ₺</td><td>{discrepant && d.id === 'DEMO-S002' ? 'Fark var' : 'Örnekle uzlaşıyor'}</td></tr>)}</tbody></table></div>{!visibleDocs.length && <p className="empty-state">Bu filtreye uyan işlem yok. Diğer işlem türlerini görmek için Tümü seçin.</p>}<p className="caption">{visibleDocs.length} belge · Yeniden kullanılan fiş numarası yerine belge kimliği gösterilir.</p></section>}
          </>}
        </main>
        {doc && <aside className="detail-panel" aria-label={line ? 'Kaynak detayı' : 'İşlem detayı'}><div className="panel-controls">{line && <button onClick={() => setLineId('')}><Arrow back /> İşleme dön</button>}<button className="close-panel" onClick={closePanel}>Kapat</button></div><h2 ref={panelTitle} tabIndex={-1}>{line ? 'Kaynak Detayı' : 'İşlem Detayı'}</h2><p className="panel-subtitle">{doc.id} · {doc.date} · {doc.kind === 'return' ? 'Müşteri iadesi' : 'Satış'}</p>
          {line ? <><h3>{productFor(line.product).name}</h3><p className="explanation">Bu {doc.kind === 'return' ? 'iade' : 'satış'} satırı, seçili dönemin net satışına <strong>{line.net} ₺</strong> katkı yapar. Kaydedilen {line.tax} ₺ KDV net satışa dahil değildir.</p>{!matches(line) && <p className="notice">Bu satır açık belgeye aittir; seçili ürün/kategori kapsamına dahil değildir.</p>}<div className={`notice ${discrepant && doc.id === 'DEMO-S002' ? 'warning' : ''}`}><strong>{discrepant && doc.id === 'DEMO-S002' ? 'Eksik · belge ve satırlar arasında fark var' : 'Sentetik kaynak satırıyla uzlaşıyor'}</strong><span>{discrepant && doc.id === 'DEMO-S002' ? '2,00 ₺ belge farkı çözülmeden bu değer uzlaşmış sayılmaz.' : 'Satır örnek rapora dahil. Bu durum gerçek market kayıtlarının eksiksiz olduğunu kanıtlamaz.'}</span></div><h3>Kaynak ve yöntem</h3><dl className="evidence"><dt>Belge / satır</dt><dd>{doc.id} / {line.id}</dd><dt>Aktarım paketi</dt><dd>DEMO-BATCH-001</dd><dt>Veri sonu</dt><dd>03.09.2025</dd><dt>Veri / rapor sürümü</dt><dd>DEMO-DATA-1 / DEMO-v1</dd><dt>Yöntem / sürüm</dt><dd>Kaydedilen net satır tutarı / demo-sales-v1</dd><dt>Düzeltme</dt><dd>Yok (sentetik örnek)</dd></dl><details><summary>Teknik ayrıntılar</summary><dl className="evidence"><dt>Kaynak kimliği</dt><dd>SYNTHETIC-ONLY</dd><dt>Normalizasyon</dt><dd>demo-normalization-v1</dd><dt>Uygulama revizyonu</dt><dd>prototype-v1</dd><dt>Kapsam</dt><dd>01–03.09.2025 · {scope || 'tüm ürünler'}</dd></dl><p className="caption">Gerçek veri bağlantısı veya sorgu çalıştırılmaz.</p></details></> : <><dl className="document-totals"><div><dt>Belge net toplamı</dt><dd>{discrepant && doc.id === 'DEMO-S002' ? '132,00' : doc.net} ₺</dd></div><div><dt>Kaydedilen KDV</dt><dd>{doc.tax} ₺</dd></div><div><dt>Brüt toplam</dt><dd>{discrepant && doc.id === 'DEMO-S002' ? '138,50' : doc.gross} ₺</dd></div></dl>{(product || category) && <p className="selected-total">Seçili kapsam: <strong>{contribution(doc)} ₺</strong><br /><span>{scope} · tüm belge toplamından ayrıdır.</span></p>}{discrepant && doc.id === 'DEMO-S002' && <div className="notice warning"><strong>Uzlaşma eksik</strong><span>Satırlar: 130,00 ₺ · başlık: 132,00 ₺ · fark: 2,00 ₺.</span></div>}<h3>Belge satırları <span>({doc.lines.length})</span></h3>{doc.lines.map(l => <article className={`receipt-line ${matches(l) && (product || category) ? 'matched' : ''}`} key={l.id}><div className="line-heading"><h4>{productFor(l.product).name}</h4><strong>{l.net} ₺</strong></div><p>{l.quantity} · İndirim: 0,00 ₺</p><p>KDV: {l.tax} ₺ · Brüt: {l.gross} ₺</p>{matches(l) && (product || category) && <small>Seçili kapsamla eşleşiyor</small>}<button className="source-link" onClick={() => setLineId(l.id)}>Kaynak detayını göster<Arrow /></button></article>)}<p className="caption">Tüm belge satırları gösterilir. Tutarlar ve KDV yalnızca sentetik örnektir.</p></>}
        </aside>}
      </div>
      <footer>{scenario === 'empty' ? 'Aktarım paketi yok' : 'Sentetik paket · DEMO-BATCH-001'} <span>Yalnızca tasarım değerlendirmesi</span></footer>
    </div>
    {process.env.NODE_ENV !== 'production' && <div className="prototype-controls"><div className="variant-switcher"><button aria-label="Önceki taslak" onClick={() => cycle(-1)}><Arrow back /></button><strong>{variant} · {variantNames[variant]}</strong><button aria-label="Sonraki taslak" onClick={() => cycle(1)}><Arrow /></button></div><label>Örnek durum <select value={scenario} onChange={e => {setScenario(e.target.value); setDocId(''); setLineId('');}}><option value="normal">Kısmi dönem</option><option value="empty">İlk açılış</option><option value="loading">Yükleniyor</option><option value="failure">Hata</option><option value="discrepancy">Belge farkı</option><option value="refresh">Yeni veri sürümü</option></select></label><output>Görünüm: {lineId ? 'kaynak' : docId ? 'belge' : query ? 'arama' : view} · {period} · {scope || 'tümü'} · {filter} · DEMO-v1{docId ? ` · ${docId}` : ''}{lineId ? ` / ${lineId}` : ''}</output></div>}
  </div>;
}
createRoot(document.getElementById('root')!).render(<App />);

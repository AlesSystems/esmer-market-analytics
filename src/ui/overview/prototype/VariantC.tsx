import { fixture, type VariantProps } from "./model";
import { Arrow, Categories, Scene, StatusNote, Trend } from "./shared";
import "./variant-c.css";

export function VariantC({ selected, onSelect, onInspect }: VariantProps) {
  return <section className="variant-c">
    <header className="c-heading"><div><h1>Ay bir bakışta</h1><p>Satış, maliyet ve giderleri aynı çerçevede okuyun.</p></div><button className="c-text-action" onClick={() => onInspect("Ayın raporu")}>Ayın raporunu aç <Arrow /></button></header>
    <div className="c-matrix" aria-label="Aylık performans">
      <button onClick={() => { onSelect("sales"); onInspect("Net satış"); }}><span>Net satış</span><strong>{fixture.netSales}<small> ₺</small></strong><em>{fixture.comparison} <span>önceki aya göre</span></em></button>
      <button onClick={() => { onSelect("cost"); onInspect("Tarihsel tahmini maliyet"); }}><span>Tarihsel tahmini maliyet</span><strong>{fixture.cost}<small> ₺</small></strong><em className="c-muted">Satışların {fixture.coverage}’i kapsanıyor</em></button>
      <button onClick={() => onInspect("Tahmini brüt kâr")}><span>Tahmini brüt kâr</span><strong>{fixture.gross}<small> ₺</small></strong><em className="c-muted">Kapsanan satışta marj {fixture.margin}</em></button>
      <button className="c-unavailable" onClick={() => { onSelect("expenses"); onInspect("Faaliyet kârı"); }}><span>Faaliyet kârı</span><strong>Hesaplanamıyor</strong><em>Gider verileri eksik <Arrow /></em></button>
    </div>
    <div className="c-body">
      <div className="c-main">
        <section className="c-chart"><div className="c-section-heading"><div><h2>Ay içindeki satışlar</h2><p>Günlük net satış · ₺</p></div><button className="c-text-action" onClick={() => onInspect("Günlük satışlar")}>Günleri incele <Arrow /></button></div><Trend /><div className="c-chart-foot"><span><strong>{fixture.documents}</strong> satış belgesi</span><span><strong>{fixture.basket} ₺</strong> ortalama sepet</span><span>30 gün · {fixture.cutoff} itibarıyla</span></div></section>
        <section className="c-ranking"><div className="c-section-heading"><div><h2>Satışın dağılımı</h2><p>Kategori bazında net satış ve toplam içindeki payı</p></div><button className="c-text-action" onClick={() => onInspect("Kategori raporu")}>Tümünü aç <Arrow /></button></div><Categories onInspect={onInspect} /></section>
        <StatusNote onInspect={onInspect} />
      </div>
      <aside className="c-evidence" aria-label="Veri kapsamı ve yöntem"><h2>Sonucun dayanağı</h2><p className="c-evidence-intro">Rakamları okurken kapsamı da görün.</p><Scene selected={selected} onSelect={onSelect} tone="blue" /><div className="c-proof-list"><button onClick={() => onInspect("Satış kaynağı")}><span>Satış kaynağı</span><strong>Sentetik örnek</strong><p>Kayıtlı KDV hariç; müşteri iadeleri düşülmüş.</p><Arrow /></button><button onClick={() => onInspect("Maliyet kapsamı")}><span>Maliyet kapsamı</span><strong>{fixture.coverage} <small>satış kapsanıyor</small></strong><p>{fixture.excluded} ₺ satışta maliyet eksik. Eksik maliyet sıfır kabul edilmez.</p><Arrow /></button><button onClick={() => onInspect("Hesaplama yöntemi")}><span>Brüt kârın yöntemi</span><strong>Tarihsel tahmin</strong><p>{fixture.coveredSales} ₺ kapsanan satış üzerinden hesaplanır; giderler düşülmemiştir.</p><Arrow /></button></div><button className="c-method-button" onClick={() => onInspect("Veri ve yöntem")}>Veri ve yöntemi incele <Arrow /></button></aside>
    </div>
  </section>;
}

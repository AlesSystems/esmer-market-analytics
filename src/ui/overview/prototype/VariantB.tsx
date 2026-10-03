import { fixture, type VariantProps } from "./model";
import { Arrow, Categories, Scene, StatusNote, Trend } from "./shared";
import "./variant-b.css";

export function VariantB({ selected, onSelect, onInspect }: VariantProps) {
  return <main className="variant-b">
    <div className="b-opening">
      <div><h1>Ayın hesabı</h1><p>Eylül daha güçlü kapandı. Satış yükseldi; ayın tam sonucu için giderler bekleniyor.</p></div>
      <span className="b-date">{fixture.period}<br /><small>30 günlük hesap</small></span>
    </div>
    <section className="b-ledger" aria-label="Ayın finansal hesabı">
      <div className="b-ledger-reading">
        <button className="b-sale-row" onClick={() => onInspect("Net satış")}><span>Net satış<small>Kayıtlı KDV hariç, iadeler düşülmüş</small></span><strong>{fixture.netSales} <em>₺</em></strong><Arrow /></button>
        <div className="b-comparison"><span>Önceki aya göre <strong>{fixture.comparison}</strong></span><span>{fixture.documents} belge · Ortalama sepet {fixture.basket} ₺</span></div>
        <div className="b-equation">
          <button onClick={() => onInspect("Maliyet kapsamındaki satış")}><span>Maliyeti kapsanan satış</span><strong>{fixture.coveredSales} ₺</strong><Arrow /></button>
          <button onClick={() => onInspect("Tarihsel tahmini maliyet")}><span><i aria-hidden="true">−</i> Tarihsel tahmini maliyet</span><strong>{fixture.cost} ₺</strong><Arrow /></button>
          <button className="b-gross" onClick={() => onInspect("Tahmini brüt kâr")}><span>Tahmini brüt kâr<small>Maliyet kapsamındaki satış üzerinden</small></span><strong>{fixture.gross} <em>₺</em></strong><Arrow /></button>
        </div>
        <p className="b-coverage">Satışların <strong>{fixture.coverage}</strong>’inde maliyet var. <button onClick={() => onInspect("Eksik maliyet")}>{fixture.excluded} ₺ satış kapsam dışında <Arrow /></button></p>
      </div>
      <aside className="b-object"><Scene selected={selected} onSelect={onSelect} tone="burgundy" /><p>Hesabın bir bölümünü seçin,<br />dayandığı veriyi inceleyin.</p></aside>
    </section>
    <StatusNote onInspect={onInspect} />
    <section className="b-trend-section" aria-labelledby="b-trend-title">
      <div className="b-section-heading"><div><h2 id="b-trend-title">Ayın ritmi</h2><p>Günlük net satış · Eylül 2025</p></div><button onClick={() => onInspect("Günlük satış")}>Günleri incele <Arrow /></button></div>
      <Trend />
    </section>
    <section className="b-category-section" aria-labelledby="b-category-title">
      <div className="b-section-heading"><div><h2 id="b-category-title">Satış nereden geldi?</h2><p>Kategori bazında net satış ve toplam içindeki payı</p></div><span>Toplam {fixture.netSales} ₺</span></div>
      <Categories onInspect={onInspect} />
    </section>
    <footer className="b-closing"><span>Brüt kâr oranı <strong>{fixture.margin}</strong> · Maliyeti kapsanan satış üzerinden</span><button onClick={() => onInspect("Hesaplama kapsamı")}>Hesaplama kapsamı <Arrow /></button></footer>
  </main>;
}

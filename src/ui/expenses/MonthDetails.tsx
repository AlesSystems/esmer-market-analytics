import { classifications, classificationLabels, type ExpensePeriod } from "../../expenses/contracts";
import { date, money } from "../format";

/** Two collapsed notes at the foot of the page: how the month's totals are built (with the import history), and how to fill the Excel template. */
export function MonthDetails({ view }: { view: ExpensePeriod }) {
  return <div className="g-more">
    <details><summary>Hesap ayrıntıları ve içe aktarma geçmişi</summary>
      <p>Toplam, gider tarihine göre bu aya düşen giderlerdir. İndirilebilir KDV’li giderlerde net, diğerlerinde brüt tutar sayılır. Varlık alımı, vergi, kredi, işletme sahibinin katkı ve çekişleri ile transferler gider toplamına girmez.</p>
      {view.summary.excluded.length > 0 && <><h3>Gider toplamı dışında</h3><ul>{view.summary.excluded.map(item => <li key={item.entityId}>{item.classification === "already-in-cost" ? "Maliyette yer alan stok kaybı" : classificationLabels[item.classification as keyof typeof classificationLabels]} · {money(item.amount)}</li>)}</ul></>}
      <dl className="g-totals"><div><dt>Gider tarihine göre kayıtlı brüt</dt><dd>{money(view.incurred)}</dd></div><div><dt>Ödeme tarihine göre kayıtlı brüt</dt><dd>{money(view.payments)}</dd></div></dl>
      <h3>İçe aktarma geçmişi ({view.batches.length.toLocaleString("tr-TR")})</h3>
      {view.batches.length ? <ul>{view.batches.map(batch => <li key={batch.batchId}>{date(batch.createdAt)} · {batch.count} kayıt · sürümler {batch.firstRevision}–{batch.lastRevision}<small>{batch.batchId}</small></li>)}</ul> : <p>Henüz içe aktarma yok.</p>}
    </details>
    <details><summary>Excel şablonu nasıl doldurulur?</summary>
      <p>Tek sayfayı ve sütun başlıklarını koruyun. Formül veya ek sütun eklemeyin.</p>
      <dl className="g-evidence"><dt>Kategori</dt><dd>Kira için “Kira”, elektrik ve su için “Elektrik” veya “Su” yazın. Diğer giderler “Diğer” altında toplanır.</dd><dt>Sınıflandırma</dt><dd>{classifications.map(item => classificationLabels[item]).join("; ")}</dd><dt>Personel</dt><dd>“İşçilik” sınıfıyla yalnızca aylık toplamı girin; kişi veya bordro bilgisi eklemeyin. İşçilik dönemi gider ayıyla aynı olmalı (örnek: 2026-01).</dd><dt>KDV işlemi</dt><dd>İndirilebilir; İndirilemez; Bilinmiyor. İlk ikisinde KDV kanıtı zorunlu. “Bilinmiyor” net kârı durdurur.</dd><dt>Tarih ve tutar</dt><dd>Gider tarihi: 15.01.2026 veya 2026-01-15. Tutar: 1250,50. Net ile KDV toplamı brüte eşit olmalı.</dd><dt>Referanslar</dt><dd>Kişisel bilgi yerine kısa kod kullanın (harf, rakam, nokta, alt çizgi, iki nokta, kısa çizgi).</dd><dt>Stok kaybı</dt><dd>Kayıp kanıtı ve Kayıp işlemi (Ayrı gider veya Maliyete dahil) zorunlu.</dd></dl>
    </details>
  </div>;
}

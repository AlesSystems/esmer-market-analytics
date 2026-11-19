import type { RefObject } from "react";
import { classifications, classificationLabels, type ExpensePeriod } from "../../expenses/contracts";
import { date, money } from "../format";
import { DownloadIcon, UploadIcon } from "../icons";

export function ImportLanding({ view, title, busy, chooseWorkbook, saveTemplate }: {
  view: ExpensePeriod;
  title: RefObject<HTMLHeadingElement | null>;
  busy: boolean;
  chooseWorkbook: () => void;
  saveTemplate: () => void;
}) {
  return <section className="card g-task" aria-labelledby="expense-excel-title">
    <h2 id="expense-excel-title" ref={title} tabIndex={-1}>Excel’den gider içe aktar</h2>
    <div className="g-actions">
      <button type="button" className="btn btn-primary" disabled={busy} onClick={chooseWorkbook}><UploadIcon />Excel dosyası seç</button>
      <button type="button" className="btn btn-secondary" disabled={busy} onClick={saveTemplate}><DownloadIcon />Şablonu indir</button>
    </div>
    <section className="g-import-history" aria-labelledby="expense-batch-title">
      <h3 id="expense-batch-title">İçe aktarma geçmişi</h3>
      {view.batches.length ? <ul>{view.batches.map(batch => <li key={batch.batchId}>{date(batch.createdAt)} · {batch.count} kayıt · sürümler {batch.firstRevision}–{batch.lastRevision}<small>{batch.batchId}</small></li>)}</ul> : <p>Henüz içe aktarma yok.</p>}
    </section>
    <div className="g-more">
      <details><summary>Hesap ayrıntıları</summary>
        <p>Toplama bu aya ait giderler girer. Ayrıntılı kayıtlarda indirilebilir KDV varsa net, diğer durumlarda brüt tutar sayılır. Varlık alımı, vergi, kredi, işletme sahibinin katkı ve çekişleri ile transferler gider toplamına girmez.</p>
        {view.summary.excluded.length > 0 && <><h3>Gider toplamı dışında</h3><ul>{view.summary.excluded.map(item => <li key={item.entityId}>{item.classification === "already-in-cost" ? "Maliyette yer alan stok kaybı" : classificationLabels[item.classification as keyof typeof classificationLabels]} · {money(item.amount)}</li>)}</ul></>}
        <dl className="g-totals"><div><dt>Gider tarihine göre kayıtlı brüt</dt><dd>{money(view.incurred)}</dd></div><div><dt>Ödeme tarihine göre kayıtlı brüt</dt><dd>{money(view.payments)}</dd></div></dl>
      </details>
      <details><summary>Excel şablonu nasıl doldurulur?</summary>
        <p>Tek sayfayı ve sütun başlıklarını koruyun. Formül veya ek sütun eklemeyin.</p>
        <dl className="g-evidence"><dt>Kategori</dt><dd>Kira için “Kira”, elektrik ve su için “Elektrik” veya “Su” yazın. Diğer giderler “Diğer” altında toplanır.</dd><dt>Sınıflandırma</dt><dd>{classifications.map(item => classificationLabels[item]).join("; ")}</dd><dt>Personel</dt><dd>“İşçilik” sınıfıyla yalnızca aylık toplamı girin; kişi veya bordro bilgisi eklemeyin. İşçilik dönemi gider ayıyla aynı olmalı (örnek: 2026-01).</dd><dt>KDV işlemi</dt><dd>İndirilebilir; İndirilemez; Bilinmiyor. İlk ikisinde KDV kanıtı zorunlu. “Bilinmiyor” net kârı durdurur.</dd><dt>Tarih ve tutar</dt><dd>Gider tarihi: 15.01.2026 veya 2026-01-15. Tutar: 1250,50. Net ile KDV toplamı brüte eşit olmalı.</dd><dt>Referanslar</dt><dd>Kişisel bilgi yerine kısa kod kullanın (harf, rakam, nokta, alt çizgi, iki nokta, kısa çizgi).</dd><dt>Stok kaybı</dt><dd>Kayıp kanıtı ve Kayıp işlemi (Ayrı gider veya Maliyete dahil) zorunlu.</dd></dl>
      </details>
    </div>
  </section>;
}

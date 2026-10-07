import type {SourceView} from "../SourceWorkspace";
import {date} from "../format";
import {typeLabel} from "../source-fields";
import "./control-desk.css";
import "./source-control-desk.css";

const count = (value: number) => value.toLocaleString("tr-TR");
const sourceDate = (value: string) => date(value.slice(0, 10));

type Props = {
  view: SourceView;
  period: string;
  outside: boolean;
  onDocuments: () => void;
  onProducts: () => void;
  onDocumentType: (code: string) => void;
};

export function SourceControlDesk({view, period, outside, onDocuments, onProducts, onDocumentType}: Props) {
  const indicators = [
    {label: "Belge kaydı", value: view.counts.documents, detail: "Tüm durum ve türler", action: onDocuments},
    {label: "Satır kaydı", value: view.counts.lines, detail: "Kaynak belge satırları", action: onDocuments},
    {label: "Ürün kayıt ID’si", value: view.counts.products, detail: "Ayrı ürün kimlikleri", action: onProducts},
    {label: "Satırsız belge", value: view.counts.emptyDocuments, detail: "Satırı bulunmayan belgeler", action: onDocuments},
  ];
  const maxDay = Math.max(1, ...view.days.map(row => row.documents));
  const maxType = Math.max(1, ...view.types.map(row => row.documents));
  const [year, month] = period.split("-").map(Number);
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

  return <div className="control-desk source-control-desk">
    <header className="c-heading">
      <div><h1>Aylık Market Özeti</h1><p>Kaynak kayıtlarının özeti · {period}</p></div>
      <button className="c-text-action" onClick={onDocuments}>Tüm kaynak belgeleri <span aria-hidden="true">↗</span></button>
    </header>
    <section className="c-matrix" aria-label="Kaynak kayıt göstergeleri">
      {indicators.map(indicator => <button key={indicator.label} className={outside ? "c-unavailable" : undefined} onClick={indicator.action}>
        <span>{indicator.label}</span><strong>{outside ? "Kapsam dışında" : count(indicator.value)}</strong><small>{indicator.detail}</small><em>Kayıtları aç <span aria-hidden="true">↗</span></em>
      </button>)}
    </section>
    <div className="c-body">
      <div className="c-main">
        <section className="c-chart">
          <div className="c-section-heading"><div><h2>Günlük belge kayıtları</h2><p>Yalnızca yedekte görülen tarihler. Gösterilmeyen günler sıfır kabul edilmez.</p></div></div>
          {view.days.length === 0 ? <p>{outside ? "Günlük kayıtlar bu dönem için gösterilemiyor; dönem yedek kapsamında değil." : "Bu dönem için günlük belge kaydı yok."}</p> :
            <div className="c-daily-chart" role="img" aria-label="Günlük kaynak belge kayıtları" style={{gridTemplateColumns: `repeat(${daysInMonth}, minmax(0, 1fr))`}}>
              {view.days.map(row => <div key={row.date} style={{gridColumn: Number(row.date.slice(8, 10))}}><svg viewBox="0 0 40 110" preserveAspectRatio="none" aria-hidden="true"><rect x="8" y={100 - 90 * row.documents / maxDay} width="24" height={90 * row.documents / maxDay} fill="currentColor" /></svg><small aria-hidden="true">{row.date.slice(8, 10)}</small></div>)}
            </div>}
          <details className="source-count-details c-daily-values"><summary>Günlük tam sayıları göster</summary><div className="table-scroll"><table aria-label="Günlük kaynak belge kayıtları tablosu"><thead><tr><th>Kaynak tarihi</th><th>Belge kaydı</th></tr></thead><tbody>{view.days.map(row => <tr key={row.date}><td>{sourceDate(row.date)}</td><td className="number">{count(row.documents)}</td></tr>)}</tbody></table></div></details>
        </section>
        <section className="c-ranking">
          <div className="c-section-heading"><div><h2>Kaynak belge türleri</h2><p>{view.types.length} / {view.typeTotal} tür kodu gösteriliyor; {view.typeTotal > view.types.length ? "diğer türler grafikte ve tabloda yok. " : ""}Tarihsel tür adları mali sınıflandırma değildir.</p></div></div>
          {view.types.length === 0 ? <p>{outside ? "Belge türleri bu dönem için gösterilemiyor; dönem yedek kapsamında değil." : "Bu dönem için belge türü kaydı yok."}</p> :
            <div className="source-type-chart" role="img" aria-label="Kaynak belge türlerine göre kayıt sayıları">{view.types.map(row => <div className="source-type-bar" key={row.code}><span aria-hidden="true">{typeLabel(row.code)}</span><svg viewBox="0 0 100 12" preserveAspectRatio="none" aria-hidden="true"><rect x="0" y="1" width={100 * row.documents / maxType} height="10" fill="currentColor" /></svg><strong aria-hidden="true">{count(row.documents)}</strong></div>)}</div>}
          <details className="source-count-details"><summary>Belge türlerinin tam sayılarını göster</summary><div className="table-scroll"><table aria-label="Kaynak belge türleri tablosu"><thead><tr><th>Tür kodu / tarihsel açıklama</th><th>Belge kaydı</th></tr></thead><tbody>{view.types.map(row => <tr key={row.code}><td><button className="c-text-action source-type-action" onClick={() => onDocumentType(row.code)}>{typeLabel(row.code)}</button></td><td className="number">{count(row.documents)}</td></tr>)}</tbody></table></div></details>
        </section>
      </div>
      <aside className="c-evidence" aria-label="Kaynak kapsamı ve yöntem">
        <h2>Kaynak kapsamı ve yöntem</h2><p className="c-evidence-intro">Mali sonuçlar doğrulanmadı</p>
        <div className="c-proof-list">
          <div><span>Yedek kapsamı</span><strong>{sourceDate(view.from)}–{sourceDate(view.to)}</strong><p>Kayıt sayıları tüm durumları içerir.</p></div>
          <div><span>Kayıt anlamları</span><strong>Ham kaynak kayıtları</strong><p>Tür kodları tamamlanmış işlem veya tanınmış tutar anlamına gelmez.</p></div>
        </div>
        <details className="c-method"><summary>Veri ve hesaplama ayrıntıları</summary><p>{view.lineage}</p><p>Paket: {view.extractionId}</p><p>Veritabanı: {view.databaseId}<br/>Hazırlanma: {view.extractedAt}<br/>Sürüm: {view.hash}</p><p>Ürün adı, kategori ve tedarikçi bu örnekte yok. Tarihsel tür açıklamaları bu yedekte yeniden doğrulanmış mali anlam değildir. Maliyet adayı içeren paketler ayrı doğrulanmamış tahmin gösterir.</p></details>
      </aside>
    </div>
  </div>;
}

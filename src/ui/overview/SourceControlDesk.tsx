import type {SourceView} from "../SourceWorkspace";
import {date} from "../format";
import {typeLabel} from "../source-fields";
import "./control-desk.css";
import "./source-control-desk.css";
import {SourceDailyCounts,SourceTypeCounts,count} from "./SourceCountCharts";

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
    {label: "Satır kaydı", value: view.counts.lines, detail: null, action: onDocuments},
    {label: "Ürün kayıt ID’si", value: view.counts.products, detail: null, action: onProducts},
    {label: "Satırsız belge", value: view.counts.emptyDocuments, detail: null, action: onDocuments},
  ];

  return <div className="control-desk source-control-desk">
    <header className="c-heading">
      <div><h2>Kaydedilmiş kaynak kayıtları</h2><p>Kaynak kayıtlarının özeti · {period}</p></div>
      <button className="c-text-action" onClick={onDocuments}>Tüm kaynak belgeleri <span aria-hidden="true">↗</span></button>
    </header>
    <section className="c-matrix" aria-label="Kaynak kayıt göstergeleri">
      {indicators.map(indicator => <button key={indicator.label} className={outside ? "c-unavailable" : undefined} onClick={indicator.action}>
        <span>{indicator.label}</span><strong>{outside ? "Kapsam dışında" : count(indicator.value)}</strong>{indicator.detail && <small>{indicator.detail}</small>}<em><span aria-hidden="true">↗</span></em>
      </button>)}
    </section>
    <div className="c-body">
      <div className="c-main">
        <section className="c-chart">
          <SourceDailyCounts view={view} period={period} outside={outside}/>
          <details className="source-count-details c-daily-values"><summary>Günlük tam sayıları göster</summary><div className="table-scroll"><table aria-label="Günlük kaynak belge kayıtları tablosu"><thead><tr><th>Kaynak tarihi</th><th>Belge kaydı</th></tr></thead><tbody>{view.days.map(row => <tr key={row.date}><td>{sourceDate(row.date)}</td><td className="number">{count(row.documents)}</td></tr>)}</tbody></table></div></details>
        </section>
        <section className="c-ranking">
          <SourceTypeCounts view={view} outside={outside}/>
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

/* Disposable visual prototype. Financial figures below are independent literal
   presentation fixtures; this file deliberately contains no finance formulas. */
const months = {
  '2025-10': { name: 'Ekim 2025', period: '1–18 Ekim 2025', sales: '680.000,00 ₺', cost: '530.000,00 ₺', knownSales: '670.000,00 ₺', gross: '140.000,00 ₺', margin: '%20,90', coverage: '%98,53', partial: true, comparison: 'Ayın yalnızca 18 günü var. Önceki ayla tutar karşılaştırması yapılmıyor.', status: 'positive', expenses: 'Gider incelemesi bekleniyor' },
  '2025-09': { name: 'Eylül 2025', period: '1–30 Eylül 2025', sales: '1.286.420,00 ₺', cost: '998.000,00 ₺', knownSales: '1.282.620,00 ₺', gross: '284.620,00 ₺', margin: '%22,19', coverage: '%99,70', comparison: 'Ağustos ayına göre tahmini brüt kâr %11,18 arttı.', status: 'positive', expenses: 'Gider incelemesi bekleniyor' },
  '2025-08': { name: 'Ağustos 2025', period: '1–31 Ağustos 2025', sales: '1.184.000,00 ₺', cost: '928.000,00 ₺', knownSales: '1.184.000,00 ₺', gross: '256.000,00 ₺', margin: '%21,62', coverage: '%100,00', comparison: 'Temmuz ayının tahmini brüt kârı sıfır olduğu için yüzde değişim hesaplanmıyor.', status: 'positive', expenses: 'Gider incelemesi bekleniyor' },
  '2025-07': { name: 'Temmuz 2025', period: '1–31 Temmuz 2025', sales: '100.000,00 ₺', cost: '100.000,00 ₺', knownSales: '100.000,00 ₺', gross: '0,00 ₺', margin: '%0,00', coverage: '%100,00', comparison: 'Önceki ayın tahmini brüt kârı negatif olduğu için yüzde değişim hesaplanmıyor.', status: 'zero', expenses: 'Gider incelemesi bekleniyor' },
  '2025-06': { name: 'Haziran 2025', period: '1–30 Haziran 2025', sales: '200.000,00 ₺', cost: '214.000,00 ₺', knownSales: '200.000,00 ₺', gross: '−14.000,00 ₺', margin: '−%7,00', coverage: '%100,00', comparison: 'Mayıs ayının maliyet bilgisi eksik. Önceki ayla karşılaştırma yapılamıyor.', status: 'loss', expenses: 'Gider incelemesi bekleniyor' },
  '2025-05': { name: 'Mayıs 2025', period: '1–31 Mayıs 2025', sales: '24.600,00 ₺', cost: null, knownSales: null, gross: null, margin: null, coverage: '%0,00', comparison: 'Önceki ay bu örnek veri paketinde yok.', status: 'unknown', expenses: 'Gider incelemesi bekleniyor' },
  '2025-04': { name: 'Nisan 2025', period: null, sales: null, cost: null, knownSales: null, gross: null, margin: null, coverage: null, comparison: 'Bu ay örnek veri paketinin dışında.', status: 'absent', expenses: 'Bu ay için gider örneği yok' },
};
const septemberProducts = [
  { id: '1042', name: 'Tam yağlı süt 1 L', group: 'Süt ve kahvaltılık', quantity: '1.240 adet', sales: '62.000,00 ₺', cost: '45.880,00 ₺', gross: '16.120,00 ₺', margin: '%26,00', note: 'Pozitif brüt kâr', kind: 'normal' },
  { id: '2081', name: 'Ayçiçek yağı 5 L', group: 'Temel gıda', quantity: '180 adet', sales: '81.000,00 ₺', cost: '70.200,00 ₺', gross: '10.800,00 ₺', margin: '%13,33', note: 'Marj düştü', kind: 'warning' },
  { id: '3096', name: 'Domates', group: 'Meyve ve sebze', quantity: '320,500 kg', sales: '19.230,00 ₺', cost: '20.512,00 ₺', gross: '−1.282,00 ₺', margin: '−%6,67', note: 'Zarar', kind: 'loss' },
  { id: '4158', name: 'Bulaşık deterjanı 750 ml', group: 'Temizlik', quantity: 'Bilinmiyor', sales: '3.800,00 ₺', cost: null, gross: null, margin: null, note: 'Maliyet eksik', kind: 'missing' },
  { id: '5073', name: 'İçme suyu 1,5 L', group: 'İçecekler', quantity: '800 adet', sales: '12.000,00 ₺', cost: '12.000,00 ₺', gross: '0,00 ₺', margin: '%0,00', note: 'Sıfır brüt kâr', kind: 'zero' },
];
const state = { direction: 'a', month: '2025-09', page: 'month', largeText: false };
const app = document.querySelector('#app');
const dialog = document.querySelector('#detail-dialog');
let dialogTrigger;
const icon = (name) => {
  const paths = {
    month: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4m10-4v4M3 11h18m-13 5h2m4 0h2"/>',
    products: '<path d="m12 3 9 5-9 5-9-5 9-5Zm-9 5v9l9 5 9-5V8m-9 5v9m-4-16 9 5"/>',
    expenses: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6m-6 4h6m-6 4h3"/>',
    settings: '<path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z"/><path d="m9 3 1-1h4l1 3 3 1 3 1v4l-2 2-1 3-1 3h-4l-2-2-3-1-3-1v-4l2-2 1-3Z"/>',
    arrow: '<path d="m9 5 7 7-7 7"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v.1"/>',
    upload: '<path d="M12 16V3m-5 5 5-5 5 5M4 15v5h16v-5"/>',
    search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
    close: '<path d="m6 6 12 12M6 18 18 6"/>',
  };
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] ?? paths.info}</svg>`;
};
const money = value => value ?? 'Bilinmiyor';
const brand = () => '<div class="brand"><span class="brand-mark" aria-hidden="true">e<span>.</span></span><div><strong>Esmer Market</strong><small>Aylık işletme görünümü</small></div></div>';
function navigation() {
  return `<nav class="app-nav" aria-label="Ana gezinme">${[['month', 'Ayın özeti'], ['products', 'Ürünler'], ['expenses', 'Giderler']].map(([key, title]) => `<button data-page="${key}" ${state.page === key ? 'aria-current="page"' : ''}>${icon(key === 'month' ? 'month' : key)}<span>${title}</span></button>`).join('')}</nav>`;
}
function monthPicker() {
  return `<label class="month-picker"><span>Görüntülenen ay</span><select aria-label="Görüntülenen ay">${Object.entries(months).map(([key, value]) => `<option value="${key}" ${key === state.month ? 'selected' : ''}>${value.name}${value.partial ? ' · kısmi' : ''}</option>`).join('')}</select></label>`;
}
function products() {
  if (state.month === '2025-09') return septemberProducts;
  const current = months[state.month];
  if (current.status === 'absent') return [];
  return [{ id: '9001', name: 'Örnek temel gıda ürünü', group: 'Sentetik ay örneği', quantity: current.status === 'unknown' ? 'Bilinmiyor' : '1.000 adet', sales: current.sales, cost: current.cost, gross: current.gross, margin: current.margin, note: current.status === 'loss' ? 'Zarar' : current.status === 'zero' ? 'Sıfır brüt kâr' : current.status === 'unknown' ? 'Maliyet eksik' : 'Örnek ürün', kind: current.status === 'unknown' ? 'missing' : current.status }];
}
function trust() {
  const data = months[state.month];
  return `<button class="trust" data-dialog="estimate">${icon('info')}<span>Tahmini sonuçlar${data.coverage ? ` · maliyeti bilinen satış ${data.coverage}` : ''}</span></button>`;
}
function result() {
  const data = months[state.month];
  if (data.status === 'absent') return `<section class="empty-result"><span class="empty-symbol">${icon('month')}</span><h2>Bu ayın verisi yok</h2><p>Nisan 2025 örnek veri paketinde bulunmuyor. Bu durum sıfır satış anlamına gelmez.</p><button class="primary" data-latest>Son veri olan aya git</button></section>`;
  return `<section class="result-panel ${data.status}" aria-label="Aylık sonuç">
    <div class="result-heading"><h2>Tahmini brüt kâr</h2><button class="text-button" data-dialog="calculation">Nasıl hesaplandı? ${icon('info')}</button></div>
    <p class="result-amount ${data.gross === null ? 'unavailable' : ''}" data-testid="gross-result">${data.gross === null ? 'Hesaplanamıyor' : data.gross}</p>
    <p class="result-description">${data.status === 'loss' ? 'Maliyeti bilinen satışlarda zarar var.' : data.status === 'zero' ? 'Maliyeti bilinen satışlar ile tahmini maliyet eşit.' : data.status === 'unknown' ? 'Satışların maliyeti bilinmediği için brüt kâr gösterilemiyor.' : 'Maliyeti bilinen satışlardan, tahmini ürün maliyeti çıktıktan sonra.'}</p>
    <p class="comparison ${data.status === 'loss' || data.status === 'unknown' ? 'quiet' : ''}">${data.comparison}</p>
    <dl class="supporting-facts"><div><dt>Satış</dt><dd>${money(data.sales)}</dd></div><div><dt>Tahmini ürün maliyeti</dt><dd>${money(data.cost)}</dd></div><div><dt>Marj</dt><dd>${data.margin ?? 'Bilinmiyor'}</dd></div></dl>
  </section>`;
}
function productTable(compact = false) {
  const rows = products();
  return `<section class="product-panel"><div class="section-heading"><div><h2>${state.page === 'products' ? 'Ürünler' : 'Ürünlerde dikkat çekenler'}</h2><p>${state.month === '2025-09' ? '24 ürün içinden 5 temsilî örnek' : 'Seçilen aya ait temsilî örnek'}${compact ? '' : ' · bir ürünü açarak ayrıntısını inceleyin'}</p></div>${state.page !== 'products' ? '<button class="text-button" data-page="products">Tüm ürün örnekleri</button>' : ''}</div>
    ${state.page === 'products' ? `<label class="search-field">${icon('search')}<input id="product-search" type="search" placeholder="Ürün adı veya numarası ara" aria-label="Ürün adı veya numarası ara"></label><p class="simulation-note">Bu ilk prototipte arama yalnızca ekrandaki örneklerde çalışır. Tam katalog, sıralama ve filtre akışı sonraki tasarım aşamasındadır.</p>` : ''}
    <div class="table-scroll" tabindex="0" aria-label="Ürün tablosu, yatay kaydırılabilir"><table><thead><tr><th scope="col">Ürün</th><th scope="col">Satış</th><th scope="col">Tahmini brüt kâr</th><th scope="col">Marj</th></tr></thead><tbody id="product-rows">${rows.map(productRow).join('')}</tbody></table></div>
    <p class="no-products" ${rows.length ? 'hidden' : ''}>Bu ay için ürün örneği yok. Ay seçimini değiştirebilirsiniz.</p>
  </section>`;
}
function productRow(item) {
  return `<tr><td><button class="product-name" data-product="${item.id}">${item.name}${icon('arrow')}</button><span class="product-meta">${item.group} <span class="product-state ${item.kind}">${item.note}</span></span></td><td>${money(item.sales)}</td><td class="${item.kind === 'loss' ? 'loss-text' : ''}">${money(item.gross)}</td><td>${item.margin ?? 'Bilinmiyor'}</td></tr>`;
}
function expensePanel() {
  const data = months[state.month];
  const isSeptember = state.month === '2025-09';
  return `<section class="expense-panel"><div class="section-heading"><div><h2>${state.page === 'expenses' ? 'Giderleri gözden geçirin' : 'Giderlerden sonra ne kalıyor?'}</h2><p>${data.name}</p></div><span class="status-label">İnceleme bekliyor</span></div>
    <div class="net-status"><span>Tahmini net kâr</span><strong>${data.partial ? 'Tam ay verisi gerekiyor' : data.status === 'absent' ? 'Veri yok' : data.gross === null ? 'Maliyet bilgisi gerekiyor' : 'Giderler tamamlanmalı'}</strong><p>${data.partial ? 'Kısmi ay için tahmini net kâr gösterilmiyor.' : data.gross === null ? 'Brüt kârın ön koşulları sağlanmadan net kâr gösterilmez.' : 'Giderler gözden geçirilip ay tamamlandı olarak işaretlendiğinde gösterilir.'}</p></div>
    <div class="expense-records"><div><span>Kayıtlı giderler</span><strong>${isSeptember ? '86.400,00 ₺' : 'Kayıt örneği yok'}</strong></div>${isSeptember ? '<ul><li><span>Kira</span><span>48.000,00 ₺</span></li><li><span>Elektrik ve su</span><span>18.400,00 ₺</span></li><li><span>İşletme giderleri</span><span>20.000,00 ₺</span></li></ul><p class="expense-warning">İşgücü giderleri henüz incelenmedi.</p>' : '<p>Gider kaydı olmaması, bu ay hiç gider olmadığı anlamına gelmez.</p>'}</div>
    <button class="primary" data-dialog="expense-import">${icon('upload')}Excel’den gider ekle</button><div class="secondary-actions"><button class="text-button" data-dialog="template">Şablonu incele</button><button class="text-button" data-dialog="manual">Elle ekle</button></div>
    <button class="review-expenses" ${state.page === 'expenses' ? 'data-dialog="expense-review"' : 'data-page="expenses"'}>Giderleri incele ${icon('arrow')}</button>
  </section>`;
}
function render() {
  const data = months[state.month];
  app.className = `direction-${state.direction}${state.largeText ? ' large-text' : ''}`;
  dialog.classList.toggle('large-text-dialog', state.largeText);
  app.innerHTML = `<div class="app-shell"><header class="app-chrome">${brand()}${navigation()}<div class="chrome-tools"><button class="icon-button" aria-label="Görünüm ve araçlar" data-dialog="settings">${icon('settings')}</button></div><div class="rail-foot"><span class="offline-indicator"></span>Çevrimdışı çalışma<small>Veri sonu: 18 Ekim 2025</small></div></header>
    <main id="workspace" tabindex="-1"><div class="workspace-head"><div><p class="page-context">${state.page === 'month' ? 'Ayın özeti' : state.page === 'products' ? 'Ürün incelemesi' : 'Gider incelemesi'}</p><h1>${data.name}</h1><p class="period">${data.period ? `${data.period}${data.partial ? ' · Kısmi ay' : ' · Tam ay'}` : 'Veri paketi dışında'}</p></div><div class="workspace-tools">${monthPicker()}<button class="secondary" data-dialog="export">Excel’e aktar</button></div></div>
    <div class="provenance">${trust()}<span>Veri sonu: 18 Ekim 2025 <span class="provenance-secondary">· Örnek paket</span></span></div>
    ${state.page === 'month' ? `<div class="overview-layout">${result()}${productTable(true)}${expensePanel()}</div>` : state.page === 'products' ? productTable() : `<div class="expense-workspace">${expensePanel()}<aside class="expense-guidance"><h2>Ayı nasıl tamamlarsınız?</h2><ol><li>Excel’den giderleri ekleyin veya tek bir gider girin.</li><li>Tür, KDV bilgisi ve olası tekrarları inceleyin.</li><li>Tüm giderleriniz hazır olduğunda ayı açıkça onaylayın.</li></ol><p>Dosya eklemek, ayın giderlerinin tamamlandığını kendiliğinden onaylamaz.</p><button class="text-button" data-page="month">Ayın özetine dön</button></aside></div>`}
    <footer class="workspace-footer"><span>Sentetik verilerle hazırlanmış etkileşimli tasarım örneği</span><button class="text-button" data-dialog="limits">Prototipin sınırları</button></footer></main></div>`;
  app.querySelector('select').addEventListener('change', event => { state.month = event.target.value; render(); app.querySelector('select').focus(); });
  const search = document.querySelector('#product-search');
  search?.addEventListener('input', event => {
    const term = event.target.value.toLocaleLowerCase('tr');
    const matched = products().filter(item => `${item.name} ${item.id}`.toLocaleLowerCase('tr').includes(term));
    document.querySelector('#product-rows').innerHTML = matched.map(productRow).join('');
    const empty = document.querySelector('.no-products');
    empty.hidden = matched.length > 0;
    empty.textContent = 'Bu aramada ürün bulunamadı. Aramayı temizleyerek örnekleri yeniden görebilirsiniz.';
  });
}
function openDialog(title, content, trigger) {
  dialogTrigger = trigger;
  document.querySelector('#dialog-content').innerHTML = `<div class="dialog-head"><h2 id="dialog-title">${title}</h2><button class="icon-button" aria-label="Kapat" data-close>${icon('close')}</button></div><div class="dialog-body">${content}</div><div class="dialog-foot"><button class="secondary" data-close>Görünüme dön</button></div>`;
  dialog.showModal();
}
function showDialog(name, trigger) {
  const data = months[state.month];
  const content = {
    estimate: ['Bu sonuçlar neden tahmini?', `<p>Ürün maliyeti, belge tarihindeki son alış fiyatı üzerinden tahmin edilir. Kaynak alanlarının ekonomik anlamı doğrulanmış değildir.</p><dl class="detail-facts"><div><dt>Maliyeti bilinen satış</dt><dd>${data.coverage ?? 'Bilinmiyor'}</dd></div><div><dt>Gerçekte gözlenen dönem</dt><dd>${data.period ?? 'Bu ay veri yok'}</dd></div><div><dt>Veri sonu</dt><dd>18 Ekim 2025</dd></div></dl><p>Eksik, sıfır veya negatif maliyetli satırlar brüt kâra dahil edilmez. İadelerin kâra etkisi, özgün satış maliyetiyle eşleştirilemediği için dışarıdadır. Sonuç, işletmenin doğrulanmış toplam kârı değildir.</p><p class="dialog-note">Tüm rakamlar sentetik örneklerdir. Bu inceleme bir kaynağı doğrulamaz.</p>`],
    calculation: ['Tahmini brüt kârın hesabı', `<p>${data.name} için gösterilen tutarlar:</p><dl class="calculation-rows"><div><dt>Satış</dt><dd>${money(data.sales)}</dd></div><div><dt>Maliyeti bilinen satış</dt><dd>${money(data.knownSales)}</dd></div><div><dt>Tahmini ürün maliyeti</dt><dd>${money(data.cost)}</dd></div><div class="calculation-total"><dt>Tahmini brüt kâr</dt><dd>${money(data.gross)}</dd></div><div><dt>Marj</dt><dd>${data.margin ?? 'Bilinmiyor'}</dd></div></dl><p>Brüt kâr yalnızca maliyeti bilinen satışlardan hesaplanır. Marj aynı satış grubuna dayanır. Satış tutarı doğrulanmış gelir veya KDV hariç net satış iddiası değildir.</p>${data.status === 'unknown' ? '<p class="dialog-note">Bu ay maliyet eksik. Bilinmeyen maliyet sıfır sayılmadığı için sonuç gösterilmiyor.</p>' : ''}<p class="dialog-note">Prototip hazır, bağımsız olarak belirtilmiş örnek tutarları gösterir; finansal hesaplama çalıştırmaz.</p>`],
    'expense-import': ['Excel’den gider ekle', '<p class="dialog-note">Görsel akış örneği. Gerçek dosya seçilmez veya kaydedilmez.</p><div class="upload-preview"><span class="file-icon">XLSX</span><strong>giderler-ornek.xlsx</strong><span>3 sentetik kayıt · inceleme önizlemesi</span></div><ol class="preview-steps"><li>Dosya ve sütunları incele</li><li>Eksik KDV bilgisi ve olası tekrarları kontrol et</li><li>Geçerli kayıtları açıkça onayla</li></ol><p>Kaydetme, hata düzeltme ve tekrar kararları, seçilecek tasarımın bağlantılı prototipinde tamamlanacak. Bu ilk örnek, işlemin yerini ve görünümünü değerlendirmek içindir.</p>'],
    template: ['Gider şablonu', '<p>Asıl uygulamada Excel şablonu kullanılır. Bu prototipte indirme yapılmaz.</p><div class="table-scroll"><table><thead><tr><th>Alan</th><th>Örnek</th></tr></thead><tbody><tr><td>Dönem / gider türü</td><td>Eylül 2025 / Kira</td></tr><tr><td>Tutar ve KDV bilgisi</td><td>Kayıt ve kanıta göre</td></tr><tr><td>Kaynak / açıklama</td><td>Sentetik gider belgesi</td></tr></tbody></table></div><p>Gider sınıfı ve KDV uygulaması tahmin edilmez. Bilinmeyen bilgi net kârı engelleyebilir.</p>'],
    manual: ['Tek bir gider ekleme', '<p>Elle ekleme, Excel’in yanında ikincil giriş yoludur.</p><div class="form-preview"><div><span>Gider türü</span><strong>Seçilmesi gerekir</strong></div><div><span>Tutar ve dönem</span><strong>Girilen kayda göre</strong></div><div><span>KDV uygulaması ve kanıt</span><strong>Bilinmiyorsa net kâr gösterilmez</strong></div></div><p class="dialog-note">Bu ilk görsel prototipte form ve kayıt işlemi uygulanmadı. Hiçbir gider eklenmedi.</p>'],
    'expense-review': ['Gider incelemesi henüz tamamlanmadı', `<p>${data.name} için giderlerin eksiksiz olduğu henüz onaylanmadı. Boş bir gider grubu kendiliğinden sıfır sayılmaz.</p><p>Gerçek akışta gider türleri, KDV bilgisi ve eksik gruplar incelenir. Ayda hiç gider yoksa bunun ayrıca açıkça bildirilmesi gerekir.</p><p class="dialog-note">Onaylama ve sonradan yapılan değişikliklerin net sonucu geri çekmesi, sonraki bağlantılı prototipte gösterilecek. Bu örnek herhangi bir onay kaydetmez.</p>`],
    settings: ['Görünüm ve araçlar', `<div class="settings-row"><div><strong>Yazı boyutu</strong><p>Bu prototipte tüm çalışma alanını büyütür.</p></div><button class="secondary" data-text-size>${state.largeText ? 'Normal yazıya dön' : 'Büyük yazı kullan'}</button></div><div class="utility-list"><div><strong>Veri paketi ve kaynak ayrıntıları</strong><span>Örnek veri sonu 18 Ekim 2025. Gerçek içe aktarma bu prototipte uygulanmadı.</span></div><div><strong>Yedekleme / geri yükleme</strong><span>İlk görsel prototipte uygulanmadı. Gerçek dosya, anahtar veya profil kullanılmaz.</span></div><div><strong>Bağlantı</strong><span>Kapalı. Yerel sentetik örnek çevrimdışı kullanılabilir.</span></div></div>`],
    export: ['Excel’e aktarım önizlemesi', `<p>${data.name} için dışa aktarılacak görünümün örneği:</p><dl class="detail-facts"><div><dt>Dönem</dt><dd>${data.period ?? 'Veri yok'}</dd></div><div><dt>Satış</dt><dd>${money(data.sales)}</dd></div><div><dt>Tahmini brüt kâr</dt><dd>${money(data.gross)}</dd></div><div><dt>Tahmini net kâr</dt><dd>Gösterilmiyor</dd></div></dl><p class="dialog-note">Bu prototip dosya üretmez. Gerçek Excel, seçilen dönemi, veri sonunu ve sonucun sınırlamalarını taşımalıdır.</p>`],
    limits: ['Bu prototipin sınırları', '<p>Bu sürüm üç görsel yönü karşılaştırır. Ay seçimi, açıklamalar, örnek ürün ayrıntısı, örnekler içinde arama, gezinme ve yazı boyutu etkileşimlidir.</p><p>Gider kaydı, Excel dosyası işlemleri, gerçek veri paketi, yedekleme ve bağlantı uygulanmadı. Bunlar açıkça etiketlenmiş önizlemelerdir. Değişiklikler kalıcı değildir.</p><p>Görsel yön seçildikten sonra ürün, gider ve destek işlemlerinin tam bağlantılı akışları ayrı incelemeye hazırlanacaktır.</p>'],
  };
  const entry = content[name];
  if (entry) openDialog(entry[0], entry[1], trigger);
}
document.addEventListener('click', event => {
  const button = event.target.closest('button');
  if (!button) return;
  if (button.dataset.direction) {
    state.direction = button.dataset.direction;
    document.querySelectorAll('[data-direction]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    render();
  } else if (button.dataset.page) {
    state.page = button.dataset.page; render(); document.querySelector('#workspace').focus();
  } else if ('latest' in button.dataset) {
    state.month = '2025-10'; render(); document.querySelector('#workspace').focus();
  } else if (button.dataset.dialog) showDialog(button.dataset.dialog, button);
  else if (button.dataset.product) {
    const item = products().find(product => product.id === button.dataset.product);
    openDialog(item.name, `<p class="product-dialog-subtitle">Ürün #${item.id} · ${months[state.month].name} · ${item.group}</p><dl class="detail-facts"><div><dt>Satış</dt><dd>${money(item.sales)}</dd></div><div><dt>Tahmini ürün maliyeti</dt><dd>${money(item.cost)}</dd></div><div><dt>Tahmini brüt kâr</dt><dd>${money(item.gross)}</dd></div><div><dt>Marj</dt><dd>${item.margin ?? 'Bilinmiyor'}</dd></div><div><dt>Maliyeti bilinen satış miktarı</dt><dd>${item.quantity}</dd></div></dl>${item.kind === 'missing' ? '<p class="dialog-note">Maliyet eksik olduğu için brüt kâr ve marj bilinmiyor. Bilinmeyen miktar veya maliyet sıfır değildir.</p>' : item.kind === 'loss' ? '<p class="loss-note">Zarar: bu ürünün tahmini maliyeti, maliyeti bilinen satış tutarından yüksek.</p>' : '<p>Tutarlar, seçilen aya ait maliyeti bilinen satış örneğini gösterir.</p>'}<p class="dialog-note">Sentetik ürün örneği. Kaynak satırlara geçiş ve tam katalogdaki dönüş akışı sonraki prototip aşamasında bağlanacak.</p>`, button);
  } else if ('close' in button.dataset) dialog.close();
  else if ('textSize' in button.dataset) {
    state.largeText = !state.largeText;
    app.classList.toggle('large-text', state.largeText);
    dialog.classList.toggle('large-text-dialog', state.largeText);
    button.textContent = state.largeText ? 'Normal yazıya dön' : 'Büyük yazı kullan';
  }
});
dialog.addEventListener('close', () => dialogTrigger?.isConnected && dialogTrigger.focus());
document.querySelector('#review-guide').addEventListener('click', event => openDialog('Üç yönü nasıl karşılaştırmalı?', '<p>A, B ve C aynı örnek veriyi ve seçilen ayı kullanır. Önce açıklama almadan şu üç işi deneyin:</p><ol><li>Hangi aya baktığınızı ve ana sonucun ne anlattığını söyleyin.</li><li>Bir ürünü açın; zarar veya eksik maliyetin nedenini bulun.</li><li>Giderlerin nereden eklendiğini ve net sonucun neden görünmediğini bulun.</li></ol><p>Sonra kompozisyonu, yazıların rahatlığını, bilgi yoğunluğunu ve eylemlerin görünürlüğünü karşılaştırın. Hangi yönü geliştirmek istediğinizi ve hangi parçanın değişmesini istediğinizi belirtin.</p><p class="dialog-note">Bu inceleme görsel yönü seçmek içindir. Tam görev akışları ve üretim uygulaması henüz onaylanmış sayılmaz.</p>', event.currentTarget));
render();

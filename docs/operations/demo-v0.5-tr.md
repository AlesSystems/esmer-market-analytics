# v0.5 Mac sunumu

Bu sürüm, Apple Silicon Mac için çevrimdışı demo önizlemesidir. Windows kurulumu veya doğrulanmış mali rapor kabulü yerine geçmez. [Sürüm kanıtı](../evidence/2026-10-09-v0.5-demo.md) kontrol sonuçlarını ve açık sınırları kaydeder.

## Uygulamayı aç

1. Sürümün Mac ZIP dosyasını açın.
2. `Esmer Market Analytics.app` uygulamasını çalıştırın. Mevcut uygulama veri konumu korunur; içe aktarılmış kayıtları yeniden yüklemek gerekmez.
3. **Ayarlar** bölümünde sürümün **0.5.0** olduğunu kontrol edin.
4. Sunum sırasında **Canlı bağlantı kapalı** durumunu koruyun. Mevcut yerel kayıtları görmek için SQL kaynağını yeniden okumak gerekmez.

Uygulama imzasızdır. macOS uygulamayı engellerse Sistem Ayarları içindeki Gizlilik ve Güvenlik bölümünden bu uygulamanın açılmasına izin verin.

## Sunumu yürüt

1. **Özet** sayfasında dönemi ve kaynak kapsamını gösterin. Paket yalnızca kaydedilmiş satırlar içeriyorsa belge ve satır sayıları gösterilir. Maliyet adayı içeren hazırlanmış pakette tahmini satış katkısı yalnızca kapsanan satırlara aittir.
2. **Satışlar** sayfasında bir ürün kayıt ID’si arayın. Ürünü seçerek kaydedilmiş belgeleri, ardından bir belgenin satırlarını açın. Hazırlanmış pakette ürün tahminleri de kullanılabilir. Kayıt listesinde katkı hesabından dışlanan satırlar bulunabilir.
3. **Alışlar ve maliyet** sayfasındaki **Faturalar** girişinden kaydedilmiş alış belgelerini açın. Eksik fatura numarası veya tedarikçi bilgisi tamamlanmış gibi gösterilmez.
4. **Giderler** sayfasında Excel aktarımı ve gider ekleme girişlerini gösterin. Kayıt bulunmaması, gider olmadığı anlamına gelmez.
5. **Raporlar** sayfasında aynı dönem ve kaynağın ayrıntılarını gösterin. Maliyet adayları eksikse tahmin ve tahmini Excel aktarımı kullanılamaz; hazırlanmış paket girişini açıklayın. Tahmini destekleyen pakette **Tahmini Excel olarak kaydet** bütün ürün ve günleri aktarır.
6. Önceki raporları göstermek gerekiyorsa **Önceki kaydedilmiş raporlar** girişini kullanın. Bu raporların kendi kaynak ve dönemleri vardır. **Güncel rapora dön** geçerli yedek görünümüne döner.

Seçili dönem sayfalar arasında ve yeniden açılışta korunur. Yedek kapsamı dışındaki aylar eksik veridir; sıfır faaliyet olarak okunmaz. Ürün adları onaylanmış pakette bulunmadığından ürünler kayıt ID’siyle gösterilir.

## Sayıları açıklarken

Tahmini katkı, doğrulanmış net kâr değildir. Kaynak birimi, vergi temeli, işlem tamamlanması ve tarihsel maliyet anlamları henüz doğrulanmamıştır. Giderler katkıdan çıkarılmaz. İadelerin maliyet ve katkısı eşleştirilmemiştir; katkı iadelerin ekonomik etkisini içermez ve sonucu yüksek gösterebilir. Eksik, sıfır veya negatif maliyetli satırlar kapsanan katkıya dahil edilmez. Bilinmeyen tutarlar sıfır kabul edilmez.

**Veri ve hesaplama ayrıntıları**, **Maliyet kapsamı ve dışlanan satırlar** ve **Tahmin yöntemi ve kaynak sürümü** açıklamalarını gerektiğinde açın. Tahminler mali rapor olarak onaylanamaz; eski kabul edilmiş raporlar korunur. [Kaydedilmiş tahmin sözleşmesi](../contracts/recorded-estimates.md) bu sınırları tanımlar.

# Önizlemenin bilinen sınırları

0.2.0 bir geliştirme önizlemesidir. Gerçek market verileriyle ilk sürüm kabulü tamamlanmamıştır. [Kabul kaydı](../evidence/release-acceptance.md) açık kontrolleri gösterir.

- Doğrulanmış mali veri yolu yalnızca sentetik eşlemeyi kabul eder. İzole SQL paketi ham kayıtları gösterebilir. Ayrı `sql-backup-estimate-v1` paketi ürün, gün ve ay için doğrulanmamış katkı tahmini sağlar. Bu tahmin kaynak anlamlarını doğrulamaz veya mali rapor veri setini etkinleştirmez. [Tahmin sözleşmesi](../contracts/recorded-estimates.md) kapsamı ve varsayımları açıklar.
- Katkı tahmini yalnızca maliyet adayı olan kapsanan satış satırlarını kullanır. İade katkısı ve desteklenmeyen maliyetler dışarıda kalır. İadelerin ekonomik etkisi sonuçtan eksik olduğu için tahmin yüksek görünebilir. Kaynak paketi değişince uygulamadaki tahmin değişir; kabul edilmiş mali rapor sürümü oluşturmaz. Excel çıktısı dışarıda saklanabilir.
- Eski denetim 12 Ekim 2025'e kadar kayıtlar bildirmiştir. Ekim ayı ve son gün kısmi kapsamdadır. Bu tarih, önizlemeye gerçek veri yüklendiği anlamına gelmez. Yeni işlem uydurulmaz.
- Tarihsel maliyet son alış fiyatına dayanan tahmindir. Ağırlıklı ortalama stok maliyeti veya doğrulanmış net kâr değildir. Güncel yerine koyma maliyeti ayrı gösterilir.
- Eksik maliyet sıfır değildir. Gider kanıtı ve sahibinin tamlık onayı olmadan faaliyet kârı hesaplanmaz. Excel aktarımı ve elle kayıt aynı doğrulama ve geçmiş kurallarını kullanır. Başarılı kayıt tamlık onayı sayılmaz. Ürün brüt sonucu giderlerden önce değerlendirilir; ayrı faaliyet sonucu kendi koşullarına bağlıdır.
- Tedarikçi iade belgesi ödemenin veya ürün değişiminin gerçekleştiğini tek başına kanıtlamaz. Müşteri iadeleri ayrı değerlendirilir.
- 25.000 belgeli sentetik paketteki ölçümler tam market geçmişinin performansını kanıtlamaz. Geçerli paket sınırları 32 MiB ve paket başına toplam 100.000 kayıttır. Tarihsel denetimdeki yaklaşık 1,87 milyon satır bu sürümde doğrulanmış değildir.
- Windows kurtarma testleri aynı bilgisayarda ayrı sentetik profiller kullanır. Ayrı temiz bilgisayar ve bağımsız ortamla kurtarma kabulü açık kalır. Windows dizin değişikliklerinin elektrik kesintisinde kalıcılığı kanıtlanmamıştır.
- Kurucu ve taşınabilir dosya imzasızdır. Windows yayıncı uyarısı gösterebilir. Taşınabilir uygulama aynı hesapta kurulu uygulamayla aynı veri klasörünü kullanır.
- Canlı market bağlantısı kapalı başlar. İsteğe bağlı izole test bağlantısı mali kayıtları etkinleştirmez. Bu önizleme vergi beyannamesi, bordro, müşteri analizi veya satış sistemi değildir. KKTC vergi kuralları hakkında varsayım yapmaz.

[Güncel kanıt dizini](../evidence/index.md) sonraki testleri ve açık kontrolleri gösterir. Eski işlerin kapatılması yeni Windows, bağımsız kurtarma veya doğrulanmış mali kaynak kanıtı sağlamaz. Gerçek kaynak doğrulaması ve kurulum yönlendirmesi ayrıca gereklidir. Bu çalışma Eralp'e ulaşmaz veya onun bilgisayarına yazılım kurmaz.

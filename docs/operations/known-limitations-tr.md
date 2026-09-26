# Önizlemenin bilinen sınırları

0.2.0 bir geliştirme önizlemesidir. Gerçek market verileriyle ilk sürüm kabulü tamamlanmamıştır. [Kabul kaydı](../evidence/release-acceptance.md) açık kontrolleri gösterir.

- Mali raporlar yalnızca sentetik eşlemeyle etkinleşir. Gösterim kayıtları gerçek satış değildir. Hazırlanmış gerçek market paketi bu çalışmaya sağlanmadı. İzole SQL yedeği ham kayıt önizlemesi olarak içe aktarılabilir. Bu önizleme mali raporu değiştirmez.
- Eski denetim 12 Ekim 2025'e kadar kayıtlar bildirmiştir. Ekim ayı ve son gün kısmi kapsamdadır. Bu tarih, önizlemeye gerçek veri yüklendiği anlamına gelmez. Yeni işlem uydurulmaz.
- Tarihsel maliyet son alış fiyatına dayanan tahmindir. Ağırlıklı ortalama stok maliyeti veya doğrulanmış net kâr değildir. Güncel yerine koyma maliyeti ayrı gösterilir.
- Eksik maliyet sıfır değildir. Gider dosyası ve sahibinin tamamlık onayı olmadan faaliyet kârı hesaplanmaz. Teknik olarak başarılı gider aktarımı tamamlık onayı sayılmaz.
- Tedarikçi iade belgesi ödemenin veya ürün değişiminin gerçekleştiğini tek başına kanıtlamaz. Müşteri iadeleri ayrı değerlendirilir.
- 25.000 belgeli sentetik paketteki ölçümler tam market geçmişinin performansını kanıtlamaz. Geçerli paket sınırları 32 MiB ve paket başına toplam 100.000 kayıttır. Tarihsel denetimdeki yaklaşık 1,87 milyon satır bu sürümde doğrulanmış değildir.
- Windows kurtarma testleri aynı bilgisayarda ayrı sentetik profiller kullanır. Ayrı temiz bilgisayar ve bağımsız ortamla kurtarma kabulü açık kalır. Windows dizin değişikliklerinin elektrik kesintisinde kalıcılığı kanıtlanmamıştır.
- Kurucu ve taşınabilir dosya imzasızdır. Windows yayıncı uyarısı gösterebilir. Taşınabilir uygulama aynı hesapta kurulu uygulamayla aynı veri klasörünü kullanır.
- Canlı market bağlantısı kapalı başlar. İsteğe bağlı izole test bağlantısı mali kayıtları etkinleştirmez. Bu önizleme vergi beyannamesi, bordro, müşteri analizi veya satış sistemi değildir. KKTC vergi kuralları hakkında varsayım yapmaz.

Gerçek kaynak doğrulaması ve kurulum yönlendirmesi ayrıca gereklidir. Bu çalışma Eralp'e ulaşmaz veya onun bilgisayarına yazılım kurmaz.

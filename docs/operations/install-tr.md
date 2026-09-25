# Windows kurulum ve veri konumu

Esmer Market Analytics çevrimdışı çalışır. Windows x64 için NSIS kurucusu ve taşınabilir `.exe` ayrı dağıtılır. Her ikisi de normal açılışta aynı Electron kullanıcı veri klasörünü kullanır: `%APPDATA%\esmer-market-analytics`. `analytics.sqlite` ve yerel kurtarma ayarı bu klasördedir. Taşınabilir dosyanın yanında ayrı bir veri klasörü oluşturulmaz. Taşınabilir sürümü kurulu sürümle aynı Windows hesabında açmak aynı verileri kullanır.

Kurulumdan önce şifreli yedeğin doğrulandığını ve kurtarma anahtarının ayrı yerde tutulduğunu kontrol edin. Kurucuyu açın ve Windows yayıncı uyarılarını değerlendirin. İlk sürüm imzasızdır. Uygulamayı açıp veri paketi içe aktarma, rapor geçmişi ve yedekleme durumunu kontrol edin. Yeniden başlatmada aynı kayıtlar görünmelidir.

Güncelleme öncesinde uygulamayı kapatın ve doğrulanmış bir yedek saklayın. Yeni kurucuyu aynı kurulum üzerinde çalıştırın. Açılıştan sonra giderleri, düzeltmeleri, ayarları, kabul edilmiş raporları ve kurtarma durumunu kontrol edin. Kurulum başarısız olursa eski uygulamanın ve son geçerli verilerin açılabildiğini doğrulamadan yeni bir deneme yapmayın. Eski verileri elle silmeyin.

Kaldırma işlemi uygulama dosyalarını kaldırır. Kullanıcı veri klasörünün saklanması beklenir; değerli verileri kaldırma davranışına güvenerek korumayın. Kaldırma öncesi ayrı yedek ve kurtarma anahtarı tutun. Veri klasörünü silme kararı yalnızca sahibine aittir. Bu yönerge canlı market sistemine bağlanma veya başka bir bilgisayara kurulum izni vermez.

## Geliştirme bilgisayarında tekrar edilebilir kontrol

Bu prosedür yalnızca `work/phase-10-lifecycle` içindeki sentetik profil ve kurulum içindir. `scripts/windows-lifecycle.ps1` önce HKCU/HKLM kayıtlarını denetler ve başka bir Esmer kurulumuna işaret eden kayıt varsa durur. Kurucu gerçek Windows kayıtlarını ve kısayollarını değiştirdiğinden testi kişisel kurulumla aynı anda çalıştırmayın. Komutları PowerShell 7'de depo kökünden, tek tek çalıştırın. Test sonuçlarını ve SHA-256 değerlerini kabul kaydına ekleyin. Her aşamanın kanıt dosyası aynı adla tekrar yazılmaz.

```powershell
$env:ESMER_LIFECYCLE_PROFILE = (Join-Path (Get-Location) 'work/phase-10-lifecycle/profile')
pwsh -NoProfile -File scripts/windows-lifecycle.ps1 -Stage install -Installer 'C:\path\to\approved-prior-setup.exe'
$env:ESMER_EXECUTABLE = (Join-Path (Get-Location) 'work/phase-10-lifecycle/installed/Esmer Market Analytics.exe')
npx playwright test tests/desktop/package-lifecycle.test.ts
pwsh -NoProfile -File scripts/windows-lifecycle.ps1 -Stage upgrade -Installer 'C:\path\to\candidate-setup.exe'
npx playwright test tests/desktop/package-lifecycle.test.ts
$env:ESMER_EXECUTABLE = (Join-Path (Get-Location) 'release/Esmer Market Analytics 0.1.0.exe')
npx playwright test tests/desktop/package-lifecycle.test.ts
pwsh -NoProfile -File scripts/windows-lifecycle.ps1 -Stage uninstall
```

İlk test sentetik satış, gider, düzeltme ve kabul edilmiş rapor oluşturur. Sonraki testler aynı profilin mantıksal kayıtlarını karşılaştırır. Kurucu aşamaları uygulama kapalıyken veritabanının SHA-256 değerini karşılaştırır. Taşınabilir adını ve önceki kurucu yolunu gerçekten üretilen dosyalara göre değiştirin. `upgrade-proof.json` önceki ve sonraki ürün sürümünü ve uygulama arşivi özetini ayrı kaydeder. Aynı sürümlü kod değişimini sürüm artışı saymayın. Başarısız güncelleme bu prosedürle henüz kanıtlanmaz; kontrollü gerçek hata ve eski kurulumun yeniden açılması ayrıca belgelenmelidir.

Test `--user-data-dir` ile açıkça ayrılmış profili kullanır. Gerçek kullanıcı varsayılan profilinin kaldırma davranışı, ayrı temiz Windows hesabı, fiziksel ağ bağlantısı kesilmesi ve bağımsız ortamdan kurtarma bu sentetik kontrolün dışında ayrıca doğrulanmalıdır.

Önceki Phase 8 sentetik kurulum hâlâ `work/windows-phase-8/lifecycle/installed` konumunda kayıtlıysa yeni temiz kurulum adımı kaydı reddeder. Bu durumda önce bütün `work/windows-phase-8/lifecycle` dizinini `work/phase-10-lifecycle/phase-8-preserved` içine kopyalayın. Kopyadaki uygulama arşivinin, veri tabanının ve `monthly-expected.json` dosyasının özetleri asılla eşit olmalıdır. Sonra sürüm yükseltmesini mevcut atıl kurulum üzerinde aşağıdaki komutlarla çalıştırın. Başka bir kurulum kaydı varsa işlem durmalıdır.

```powershell
$copy = (Join-Path (Get-Location) 'work/phase-10-lifecycle/phase-8-preserved')
pwsh -NoProfile -File scripts/windows-lifecycle.ps1 -Stage upgrade -ReusePhase8 -PreservedCopy $copy -Installer 'C:\path\to\candidate-setup-0.2.0.exe'
$env:ESMER_LIFECYCLE_PROFILE = (Join-Path (Get-Location) 'work/windows-phase-8/lifecycle/synthetic-profile')
$env:ESMER_LIFECYCLE_REUSE_PHASE8 = '1'
$env:ESMER_EXECUTABLE = (Join-Path (Get-Location) 'work/windows-phase-8/lifecycle/installed/Esmer Market Analytics.exe')
npx playwright test tests/desktop/package-lifecycle.test.ts
pwsh -NoProfile -File scripts/windows-lifecycle.ps1 -Stage uninstall -ReusePhase8 -PreservedCopy $copy
```

Phase 8 profili sürüm 5 şeması, sentetik giderler ve kabul edilmiş rapor içerir. Yeni paket açılışta şema geçişini yapar; test kabul edilmiş 100 ₺ satış, 40 ₺ kapsanan brüt kâr ve 50 ₺ gideri, ayrıca değişmeyen kayıtları iki açılışta doğrular. Yükseltme öncesi eski paketin bu profil üzerindeki açılışı Phase 8 kanıtında yer alır; yeni bir eski-paket açılışı yapıldıysa ayrıca kaydedin. Bu akış yalnızca gerçek 0.1.0 kurucusu ve 0.2.0 aday kurucusu kullanılırsa sürüm artışını kanıtlar. Kopyalanan kanıt arşivini veya varsayılan kullanıcı profilini silmeyin.

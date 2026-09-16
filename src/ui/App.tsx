import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import type { Availability, RequestError } from "../domain/contracts";

function App() {
  const [availability, setAvailability] = useState<
    Availability | RequestError
  >();
  useEffect(() => {
    window.esmer
      .getAvailability()
      .then(setAvailability)
      .catch(() =>
        setAvailability({
          status: "unavailable",
          code: "SERVICE_UNAVAILABLE",
          message: "Yerel hizmete ulaşılamadı. Uygulamayı yeniden açın.",
        }),
      );
  }, []);

  return (
    <main>
      <header>
        <span className="brand">ESMER MARKET</span>
        <span>Yerel analiz</span>
      </header>
      <section aria-live="polite">
        <p className="eyebrow">MARKETİNİZİN GENEL GÖRÜNÜMÜ</p>
        {!availability ? (
          <h1>Yerel hizmet başlatılıyor…</h1>
        ) : availability.status === "ready" ? (
          <>
            <h1>Henüz veri içe aktarılmadı</h1>
            <p>
              Analizleriniz, hazırlanmış veriler bu bilgisayara aktarıldığında
              burada görünecek.
            </p>
            <div className="status">
              <span aria-hidden="true">●</span> Canlı bağlantı kapalı
            </div>
            <p className="note">
              Uygulama çevrimdışı çalışır. Market sistemine bağlanmaz.
            </p>
          </>
        ) : (
          <>
            <h1>Yerel hizmet kullanılamıyor</h1>
            <p>{availability.message}</p>
          </>
        )}
      </section>
      <footer>Esmer Market · Çevrimdışı analiz</footer>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<App />);

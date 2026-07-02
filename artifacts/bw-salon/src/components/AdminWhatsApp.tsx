import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Wifi, WifiOff, RefreshCw, LogOut, Smartphone, Loader2 } from "lucide-react";

type WAStatus = "disconnected" | "qr_pending" | "authenticated" | "ready" | "auth_failure";

interface StatusData {
  status: WAStatus;
  phone: string | null;
}

export function AdminWhatsApp() {
  const [statusData, setStatusData] = useState<StatusData>({ status: "disconnected", phone: null });
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/whatsapp/status");
      const data = await res.json() as StatusData;
      setStatusData(data);
      return data.status;
    } catch {
      return null;
    }
  }, []);

  const fetchQr = useCallback(async () => {
    try {
      const res = await fetch("/api/whatsapp/qr");
      if (!res.ok) { setQrDataUrl(null); return; }
      const data = await res.json() as { qr: string };
      setQrDataUrl(data.qr);
    } catch {
      setQrDataUrl(null);
    }
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    async function tick() {
      const status = await fetchStatus();
      setLoading(false);

      if (status === "qr_pending") {
        await fetchQr();
        timer = setTimeout(tick, 5000);
      } else if (status === "authenticated") {
        timer = setTimeout(tick, 3000);
      } else if (status === "ready") {
        setQrDataUrl(null);
        timer = setTimeout(tick, 10000);
      } else {
        setQrDataUrl(null);
        timer = setTimeout(tick, 5000);
      }
    }

    void tick();
    return () => clearTimeout(timer);
  }, [fetchStatus, fetchQr]);

  const handleLogout = async () => {
    if (!confirm("WhatsApp bağlantısını kesmek istediğinizden emin misiniz?")) return;
    setLogoutLoading(true);
    try {
      await fetch("/api/whatsapp/logout", { method: "POST" });
      setStatusData({ status: "disconnected", phone: null });
      setQrDataUrl(null);
    } finally {
      setLogoutLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const { status, phone } = statusData;

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
          <Smartphone className="w-5 h-5 text-green-500" />
        </div>
        <div>
          <h2 className="font-semibold text-base">WhatsApp Entegrasyonu</h2>
          <p className="text-xs text-muted-foreground">Randevu bildirimlerini WhatsApp üzerinden personellere ilet.</p>
        </div>
      </div>

      {status === "ready" && (
        <div className="p-5 rounded-xl border border-green-500/30 bg-green-500/5 space-y-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0" />
            <div>
              <p className="font-semibold text-green-500">WhatsApp Hattı Aktif (Bağlı)</p>
              {phone && (
                <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1.5">
                  <Wifi className="w-3.5 h-3.5" />
                  +{phone}
                </p>
              )}
            </div>
          </div>

          <p className="text-xs text-muted-foreground border-t border-border/50 pt-3">
            Yeni randevular alındığında ilgili personele WhatsApp mesajı otomatik gönderilecektir.
          </p>

          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            disabled={logoutLoading}
            className="w-full gap-2 text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/5"
          >
            {logoutLoading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Bağlantı kesiliyor...</>
              : <><LogOut className="w-4 h-4" /> Bağlantıyı Kopar / Çıkış Yap</>
            }
          </Button>
        </div>
      )}

      {(status === "qr_pending" || status === "authenticated") && (
        <div className="p-5 rounded-xl border border-border bg-background space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RefreshCw className={`w-4 h-4 ${status === "authenticated" ? "text-yellow-500 animate-spin" : "text-primary"}`} />
              <p className="font-medium text-sm">
                {status === "authenticated" ? "Kimlik doğrulanıyor..." : "QR Kodu ile Bağlanın"}
              </p>
            </div>
            <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              Her ~20sn yenilenir
            </span>
          </div>

          {status === "qr_pending" && qrDataUrl ? (
            <div className="flex flex-col items-center gap-4">
              <div className="p-3 bg-white rounded-xl border border-border shadow-sm">
                <img src={qrDataUrl} alt="WhatsApp QR Kodu" className="w-56 h-56 object-contain" />
              </div>
              <div className="text-center space-y-1.5">
                <p className="text-sm font-medium">WhatsApp'ı açın</p>
                <ol className="text-xs text-muted-foreground space-y-0.5 text-left">
                  <li>1. Telefonda <strong>WhatsApp</strong> &gt; <strong>⋮ Menü</strong> &gt; <strong>Bağlı cihazlar</strong></li>
                  <li>2. <strong>"Cihaz bağla"</strong> seçin</li>
                  <li>3. Yukarıdaki QR kodu kameranızla tarayın</li>
                </ol>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      )}

      {(status === "disconnected" || status === "auth_failure") && (
        <div className="p-5 rounded-xl border border-border bg-background space-y-3">
          <div className="flex items-center gap-3">
            <WifiOff className={`w-5 h-5 ${status === "auth_failure" ? "text-destructive" : "text-muted-foreground"}`} />
            <div>
              <p className="font-medium text-sm">
                {status === "auth_failure" ? "Kimlik Doğrulama Başarısız" : "Bağlantı Kuruluyor..."}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {status === "auth_failure"
                  ? "Oturum geçersiz sayıldı. QR kod otomatik yenileniyor."
                  : "WhatsApp istemcisi başlatılıyor, lütfen bekleyin."}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            <span className="text-xs text-muted-foreground">QR kodu bekleniyor...</span>
          </div>
        </div>
      )}

      <div className="p-4 bg-muted/30 border border-border/50 rounded-xl text-xs text-muted-foreground">
        <p className="font-medium text-foreground mb-1">💡 Nasıl çalışır?</p>
        <p>QR kodu telefonunuzda taradıktan sonra bu panel <strong>WhatsApp Hattı Aktif</strong> durumuna geçer. Sunucu kapansa bile oturum saklanır, yeniden açıldığında otomatik bağlanır.</p>
      </div>
    </div>
  );
}

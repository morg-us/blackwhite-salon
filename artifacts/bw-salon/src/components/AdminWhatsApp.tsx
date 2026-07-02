import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle2,
  Wifi,
  WifiOff,
  RefreshCw,
  LogOut,
  Smartphone,
  Loader2,
  MessageSquare,
  RotateCcw,
  Save,
  User,
  Users,
} from "lucide-react";

type WAStatus = "disconnected" | "qr_pending" | "authenticated" | "ready" | "auth_failure";

interface StatusData {
  status: WAStatus;
  phone: string | null;
}

const STAFF_PLACEHOLDERS = [
  { key: "{musteri}", label: "Müşteri Adı" },
  { key: "{tarih}", label: "Randevu Tarihi" },
  { key: "{saat}", label: "Randevu Saati" },
  { key: "{hizmet}", label: "Hizmet / İşlem" },
  { key: "{telefon}", label: "Müşteri Telefonu" },
];

const CUSTOMER_PLACEHOLDERS = [
  { key: "{musteri}", label: "Müşteri Adı" },
  { key: "{tarih}", label: "Randevu Tarihi" },
  { key: "{saat}", label: "Randevu Saati" },
  { key: "{hizmet}", label: "Hizmet / İşlem" },
];

// ── Yeniden kullanılabilir şablon editörü ─────────────────────────────────────

interface TemplateEditorProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  getEndpoint: string;
  patchEndpoint: string;
  resetEndpoint: string;
  placeholders: { key: string; label: string }[];
  previewVars: Record<string, string>;
}

function TemplateEditor({
  title,
  description,
  icon,
  getEndpoint,
  patchEndpoint,
  resetEndpoint,
  placeholders,
  previewVars,
}: TemplateEditorProps) {
  const [template, setTemplate] = useState("");
  const [defaultTemplate, setDefaultTemplate] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    fetch(getEndpoint)
      .then(r => r.json())
      .then((d: { template: string; default: string }) => {
        setTemplate(d.template);
        setDefaultTemplate(d.default);
      })
      .catch(() => setMsg({ type: "err", text: "Şablon yüklenemedi" }))
      .finally(() => setLoading(false));
  }, [getEndpoint]);

  const handleSave = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch(patchEndpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template }),
      });
      if (!res.ok) throw new Error();
      setMsg({ type: "ok", text: "Şablon başarıyla kaydedildi." });
    } catch {
      setMsg({ type: "err", text: "Kayıt sırasında hata oluştu." });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm("Şablonu varsayılana sıfırlamak istediğinizden emin misiniz?")) return;
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch(resetEndpoint, { method: "POST" });
      if (!res.ok) throw new Error();
      setTemplate(defaultTemplate);
      setMsg({ type: "ok", text: "Şablon varsayılana sıfırlandı." });
    } catch {
      setMsg({ type: "err", text: "Sıfırlama sırasında hata oluştu." });
    } finally {
      setSaving(false);
    }
  };

  const insertPlaceholder = (key: string) => {
    setTemplate(t => t + key);
  };

  const preview = placeholders.reduce(
    (acc, p) => acc.replace(new RegExp(p.key.replace(/[{}]/g, "\\$&"), "g"), previewVars[p.key] ?? p.key),
    template
  );

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-4 text-muted-foreground text-sm">
        <Loader2 className="w-4 h-4 animate-spin" /> Şablon yükleniyor...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {icon}
        <div>
          <h3 className="font-semibold text-sm">{title}</h3>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>

      <div className="p-3 bg-muted/30 border border-border/50 rounded-xl">
        <p className="text-xs text-muted-foreground mb-2 font-medium">Kullanılabilir değişkenler — tıklayarak ekleyin:</p>
        <div className="flex flex-wrap gap-2">
          {placeholders.map(p => (
            <button
              key={p.key}
              onClick={() => insertPlaceholder(p.key)}
              className="text-xs font-mono bg-background border border-border px-2 py-1 rounded-lg hover:bg-primary/10 hover:border-primary/40 transition-colors"
            >
              {p.key}
              <span className="text-muted-foreground ml-1.5 font-sans not-italic">→ {p.label}</span>
            </button>
          ))}
        </div>
      </div>

      <Textarea
        value={template}
        onChange={e => setTemplate(e.target.value)}
        rows={8}
        className="font-mono text-sm bg-background border-border resize-none"
        placeholder="Mesaj şablonunu buraya yazın..."
      />

      {msg && (
        <p className={`text-sm px-3 py-2 rounded-lg ${msg.type === "ok" ? "bg-green-500/10 text-green-500" : "bg-destructive/10 text-destructive"}`}>
          {msg.text}
        </p>
      )}

      <div className="flex gap-2">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Kaydet
        </Button>
        <Button
          variant="outline"
          onClick={handleReset}
          disabled={saving}
          className="gap-2 text-muted-foreground"
        >
          <RotateCcw className="w-4 h-4" />
          Varsayıla Sıfırla
        </Button>
      </div>

      <div className="p-3 bg-muted/20 border border-border/40 rounded-xl">
        <p className="text-xs text-muted-foreground font-medium mb-1">Örnek çıktı:</p>
        <pre className="text-xs text-foreground whitespace-pre-wrap font-sans leading-relaxed">{preview}</pre>
      </div>
    </div>
  );
}

// ── Ana bileşen ───────────────────────────────────────────────────────────────

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

      {/* ── Başlık ── */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
          <Smartphone className="w-5 h-5 text-green-500" />
        </div>
        <div>
          <h2 className="font-semibold text-base">WhatsApp Entegrasyonu</h2>
          <p className="text-xs text-muted-foreground">Randevu bildirimlerini WhatsApp üzerinden personellere ve müşterilere ilet.</p>
        </div>
      </div>

      {/* ── Bağlı ── */}
      {status === "ready" && (
        <div className="p-5 rounded-xl border border-green-500/30 bg-green-500/5 space-y-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0" />
            <div>
              <p className="font-semibold text-green-500">WhatsApp Hattı Aktif (Bağlı)</p>
              {phone && (
                <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1.5">
                  <Wifi className="w-3.5 h-3.5" />+{phone}
                </p>
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground border-t border-border/50 pt-3">
            Yeni randevular alındığında ilgili personele ve müşteriye WhatsApp mesajı otomatik gönderilecektir.
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
              : <><LogOut className="w-4 h-4" /> Bağlantıyı Kopar / Çıkış Yap</>}
          </Button>
        </div>
      )}

      {/* ── QR Bekleniyor ── */}
      {(status === "qr_pending" || status === "authenticated") && (
        <div className="p-5 rounded-xl border border-border bg-background space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RefreshCw className={`w-4 h-4 ${status === "authenticated" ? "text-yellow-500 animate-spin" : "text-primary"}`} />
              <p className="font-medium text-sm">
                {status === "authenticated" ? "Kimlik doğrulanıyor..." : "QR Kodu ile Bağlanın"}
              </p>
            </div>
            <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Her ~20sn yenilenir</span>
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

      {/* ── Bağlantı Kuruluyor ── */}
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
                  ? "Oturum geçersiz. QR kod otomatik yenileniyor."
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

      {/* ── Mesaj Şablonları ── */}
      <div className="border-t border-border pt-6 space-y-8">

        {/* Personel şablonu */}
        <TemplateEditor
          title="Personel Bildirim Şablonu"
          description="Yeni randevu alındığında ilgili personele gönderilir."
          icon={<Users className="w-4 h-4 text-primary" />}
          getEndpoint="/api/whatsapp/template"
          patchEndpoint="/api/whatsapp/template"
          resetEndpoint="/api/whatsapp/template/reset"
          placeholders={STAFF_PLACEHOLDERS}
          previewVars={{
            "{musteri}": "Ayşe Kaya",
            "{tarih}": "2026-07-05",
            "{saat}": "14:30",
            "{hizmet}": "Saç Boyama",
            "{telefon}": "0532 123 45 67",
          }}
        />

        <div className="border-t border-border/50" />

        {/* Müşteri şablonu */}
        <TemplateEditor
          title="Müşteri Onay Şablonu"
          description="Randevu oluşturulduğu anda müşterinin kendi numarasına gönderilir."
          icon={<User className="w-4 h-4 text-green-500" />}
          getEndpoint="/api/whatsapp/customer-template"
          patchEndpoint="/api/whatsapp/customer-template"
          resetEndpoint="/api/whatsapp/customer-template/reset"
          placeholders={CUSTOMER_PLACEHOLDERS}
          previewVars={{
            "{musteri}": "Ayşe Kaya",
            "{tarih}": "2026-07-05",
            "{saat}": "14:30",
            "{hizmet}": "Saç Boyama",
          }}
        />
      </div>

      {/* ── Bilgi kutusu ── */}
      <div className="p-4 bg-muted/30 border border-border/50 rounded-xl text-xs text-muted-foreground">
        <p className="font-medium text-foreground mb-1">💡 Nasıl çalışır?</p>
        <ul className="space-y-1">
          <li>• Müşteri randevu formunu gönderdiğinde <strong>iki mesaj</strong> tetiklenir.</li>
          <li>• <strong>Personel</strong> mesajı ilgili çalışanların numarasına gider.</li>
          <li>• <strong>Müşteri</strong> mesajı formda girilen telefon numarasına gider (90 ülke kodu otomatik eklenir).</li>
          <li>• Müşteri numarası hatalıysa sistem çökmez — personel bildirimi yine de gönderilir.</li>
        </ul>
      </div>
    </div>
  );
}

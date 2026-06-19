import { useState } from "react";
import { useStore } from "@/lib/store";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { User, Lock, ShoppingBag, Settings, LogOut, Sun, Moon, Globe } from "lucide-react";

export function ProfileModal() {
  const { isProfileModalOpen, setIsProfileModalOpen, currentUser, updateUser, orders, logoutUser, theme, setTheme, language, setLanguage } = useStore();
  const { toast } = useToast();

  const [profileName, setProfileName] = useState(currentUser?.name ?? "");
  const [profileEmail, setProfileEmail] = useState(currentUser?.email ?? "");
  const [profileError, setProfileError] = useState("");

  const [pwCurrent, setPwCurrent] = useState("");
  const [pwNext, setPwNext] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [pwError, setPwError] = useState("");

  if (!currentUser) return null;

  const userOrders = orders.filter(o => o.userId === currentUser.id || o.userEmail === currentUser.email);

  const initials = currentUser.name.split(" ").map(w => w[0] ?? "").join("").toUpperCase().slice(0, 2);

  const handleOpen = (open: boolean) => {
    if (open) {
      setProfileName(currentUser.name);
      setProfileEmail(currentUser.email);
      setProfileError("");
      setPwCurrent(""); setPwNext(""); setPwConfirm(""); setPwError("");
    }
    setIsProfileModalOpen(open);
  };

  const handleProfileSave = async () => {
    setProfileError("");
    if (!profileName.trim() || !profileEmail.trim()) {
      setProfileError("Ad ve e-posta boş bırakılamaz.");
      return;
    }
    const ok = await updateUser(currentUser.id, { name: profileName.trim(), email: profileEmail.trim() });
    if (!ok) {
      setProfileError("Bu e-posta başka bir hesapta kullanılıyor.");
      return;
    }
    toast({ title: "Profil güncellendi", description: "Bilgileriniz başarıyla kaydedildi." });
  };

  const handlePasswordSave = async () => {
    setPwError("");
    if (pwCurrent !== currentUser.password) {
      setPwError("Mevcut şifre hatalı.");
      return;
    }
    if (pwNext.length < 6) {
      setPwError("Yeni şifre en az 6 karakter olmalıdır.");
      return;
    }
    if (pwNext !== pwConfirm) {
      setPwError("Yeni şifreler eşleşmiyor.");
      return;
    }
    await updateUser(currentUser.id, { password: pwNext });
    setPwCurrent(""); setPwNext(""); setPwConfirm("");
    toast({ title: "Şifre güncellendi", description: "Yeni şifreniz kaydedildi." });
  };

  return (
    <Dialog open={isProfileModalOpen} onOpenChange={handleOpen}>
      <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-[520px] bg-card border-border p-0 overflow-hidden max-h-[90vh] flex flex-col">
        <DialogHeader className="px-5 pt-5 pb-0 shrink-0">
          <DialogTitle className="text-xl font-serif">Hesabım</DialogTitle>
        </DialogHeader>

        {/* Avatar info bar */}
        <div className="flex items-center gap-4 px-5 py-4 border-b border-border shrink-0">
          <div
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-white text-lg sm:text-xl font-bold shrink-0 select-none"
            style={{ backgroundColor: currentUser.avatarColor }}
          >
            {initials}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm sm:text-base truncate">{currentUser.name}</p>
            <p className="text-xs text-muted-foreground truncate">{currentUser.email}</p>
            <p className="text-xs text-muted-foreground/70 mt-0.5">
              Üye: {format(new Date(currentUser.createdAt), "dd MMM yyyy", { locale: tr })}
            </p>
          </div>
        </div>

        <Tabs defaultValue="profile" className="flex-1 flex flex-col overflow-hidden">
          {/* Tab bar */}
          <TabsList className="grid grid-cols-4 w-full rounded-none bg-transparent border-b border-border h-auto shrink-0 p-0 gap-0">
            <TabsTrigger
              value="profile"
              className="flex flex-col items-center gap-1 py-2.5 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent bg-transparent text-xs font-medium"
            >
              <User className="w-4 h-4" />
              <span>Profil</span>
            </TabsTrigger>
            <TabsTrigger
              value="password"
              className="flex flex-col items-center gap-1 py-2.5 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent bg-transparent text-xs font-medium"
            >
              <Lock className="w-4 h-4" />
              <span>Şifre</span>
            </TabsTrigger>
            <TabsTrigger
              value="orders"
              className="flex flex-col items-center gap-1 py-2.5 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent bg-transparent text-xs font-medium"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Siparişler</span>
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="flex flex-col items-center gap-1 py-2.5 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent bg-transparent text-xs font-medium"
            >
              <Settings className="w-4 h-4" />
              <span>Ayarlar</span>
            </TabsTrigger>
          </TabsList>

          {/* Scrollable content area */}
          <div className="flex-1 overflow-y-auto">

            {/* ── PROFİL ── */}
            <TabsContent value="profile" className="p-5 space-y-4 mt-0">
              {profileError && (
                <div className="p-3 bg-destructive/10 text-destructive border border-destructive/20 rounded-lg text-sm">
                  {profileError}
                </div>
              )}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Ad Soyad</label>
                <Input
                  value={profileName}
                  onChange={e => setProfileName(e.target.value)}
                  placeholder="Adınız Soyadınız"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">E-Posta</label>
                <Input
                  type="email"
                  value={profileEmail}
                  onChange={e => setProfileEmail(e.target.value)}
                  placeholder="ornek@email.com"
                />
              </div>
              <Button
                onClick={handleProfileSave}
                className="w-full bg-[#b84d5b] hover:bg-[#b84d5b]/90 text-white"
              >
                Değişiklikleri Kaydet
              </Button>
            </TabsContent>

            {/* ── ŞİFRE ── */}
            <TabsContent value="password" className="p-5 space-y-4 mt-0">
              {pwError && (
                <div className="p-3 bg-destructive/10 text-destructive border border-destructive/20 rounded-lg text-sm">
                  {pwError}
                </div>
              )}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Mevcut Şifre</label>
                <Input
                  type="password"
                  value={pwCurrent}
                  onChange={e => setPwCurrent(e.target.value)}
                  placeholder="Mevcut şifreniz"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Yeni Şifre</label>
                <Input
                  type="password"
                  value={pwNext}
                  onChange={e => setPwNext(e.target.value)}
                  placeholder="En az 6 karakter"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Yeni Şifre (Tekrar)</label>
                <Input
                  type="password"
                  value={pwConfirm}
                  onChange={e => setPwConfirm(e.target.value)}
                  placeholder="Yeni şifrenizi tekrar girin"
                />
              </div>
              <Button
                onClick={handlePasswordSave}
                className="w-full bg-[#b84d5b] hover:bg-[#b84d5b]/90 text-white"
              >
                Şifreyi Güncelle
              </Button>
            </TabsContent>

            {/* ── SİPARİŞLER ── */}
            <TabsContent value="orders" className="p-5 mt-0">
              {userOrders.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">Henüz bir siparişiniz bulunmamaktadır.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {userOrders.slice().reverse().map(order => (
                    <div key={order.id} className="p-4 border border-border rounded-xl bg-background/50 space-y-2">
                      <div className="flex justify-between items-center pb-2 border-b border-border/50">
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(order.date), "dd MMM yyyy HH:mm", { locale: tr })}
                        </span>
                        <span className="font-bold text-[#b84d5b] text-sm">{order.total} TL</span>
                      </div>
                      <div className="space-y-1">
                        {order.items.map(item => (
                          <div key={item.id} className="flex justify-between text-xs">
                            <span className="text-foreground/80">{item.quantity}x {item.name}</span>
                            <span className="text-muted-foreground">{item.price * item.quantity} TL</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* ── AYARLAR ── */}
            <TabsContent value="settings" className="p-5 space-y-5 mt-0">

              {/* Theme */}
              <div>
                <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                  {theme === "dark" ? <Moon className="w-4 h-4 text-primary" /> : <Sun className="w-4 h-4 text-yellow-400" />}
                  Görünüm
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setTheme("dark")}
                    className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all ${theme === "dark" ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/40"}`}
                  >
                    <Moon className="w-4 h-4" /> Karanlık
                  </button>
                  <button
                    onClick={() => setTheme("light")}
                    className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all ${theme === "light" ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/40"}`}
                  >
                    <Sun className="w-4 h-4" /> Aydınlık
                  </button>
                </div>
              </div>

              {/* Language */}
              <div>
                <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-primary" /> Dil / Language
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setLanguage("tr")}
                    className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all ${language === "tr" ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/40"}`}
                  >
                    🇹🇷 Türkçe
                  </button>
                  <button
                    onClick={() => setLanguage("en")}
                    className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all ${language === "en" ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/40"}`}
                  >
                    🇬🇧 English
                  </button>
                </div>
              </div>

              {/* Notifications */}
              <div>
                <h4 className="font-medium text-sm mb-3">Bildirim Tercihleri</h4>
                <div className="space-y-2">
                  {["Randevu hatırlatmaları", "Sipariş güncellemeleri", "Kampanya ve fırsatlar"].map(label => (
                    <label key={label} className="flex items-center justify-between p-3 border border-border rounded-xl cursor-pointer hover:bg-muted/30 transition-colors">
                      <span className="text-sm">{label}</span>
                      <span className="relative inline-flex">
                        <input type="checkbox" defaultChecked className="sr-only peer" />
                        <span className="w-10 h-6 bg-muted rounded-full peer-checked:bg-[#b84d5b] transition-colors block" />
                        <span className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4 block" />
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-border">
                <h4 className="font-medium text-sm mb-3">Hesap</h4>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2 text-destructive border-destructive/30 hover:bg-destructive/10 hover:border-destructive/50"
                  onClick={() => { logoutUser(); setIsProfileModalOpen(false); }}
                >
                  <LogOut className="w-4 h-4" />
                  Çıkış Yap
                </Button>
              </div>
            </TabsContent>

          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

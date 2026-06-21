import { useState, useRef } from "react";
import { useStore } from "@/lib/store";
import { useUser } from "@clerk/react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { User, Lock, ShoppingBag, Camera, Loader2 } from "lucide-react";

export function ProfileModal() {
  const { isProfileModalOpen, setIsProfileModalOpen, currentUser, updateUser, orders } = useStore();
  const { user: clerkUser } = useUser();
  const { toast } = useToast();

  const [profileName, setProfileName] = useState(currentUser?.name ?? "");
  const [profileEmail, setProfileEmail] = useState(currentUser?.email ?? "");
  const [profileError, setProfileError] = useState("");

  const [pwCurrent, setPwCurrent] = useState("");
  const [pwNext, setPwNext] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [pwError, setPwError] = useState("");

  const [photoUploading, setPhotoUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!currentUser) return null;

  const isOAuthUser = currentUser.password === "__clerk_oauth__";
  const avatarUrl = clerkUser?.imageUrl;
  const initials = currentUser.name.split(" ").map(w => w[0] ?? "").join("").toUpperCase().slice(0, 2);

  const userOrders = orders.filter(o => o.userId === currentUser.id || o.userEmail === currentUser.email);

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
    if (!profileName.trim() || (!isOAuthUser && !profileEmail.trim())) {
      setProfileError("Ad boş bırakılamaz.");
      return;
    }
    const ok = await updateUser(currentUser.id, {
      name: profileName.trim(),
      ...(isOAuthUser ? {} : { email: profileEmail.trim() }),
    });
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

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !clerkUser) return;
    setPhotoUploading(true);
    try {
      await clerkUser.setProfileImage({ file });
      toast({ title: "Fotoğraf güncellendi", description: "Profil fotoğrafınız değiştirildi." });
    } catch {
      toast({ title: "Hata", description: "Fotoğraf yüklenemedi. Lütfen tekrar deneyin.", variant: "destructive" });
    } finally {
      setPhotoUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <Dialog open={isProfileModalOpen} onOpenChange={handleOpen}>
      <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-[520px] bg-card border-border p-0 overflow-hidden max-h-[90vh] flex flex-col">
        <DialogHeader className="px-5 pt-5 pb-0 shrink-0">
          <DialogTitle className="text-xl font-serif">Hesabım</DialogTitle>
        </DialogHeader>

        {/* Avatar info bar */}
        <div className="flex items-center gap-4 px-5 py-4 border-b border-border shrink-0">
          <div className="relative shrink-0">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold select-none overflow-hidden"
              style={{ backgroundColor: currentUser.avatarColor }}
            >
              {avatarUrl
                ? <img src={avatarUrl} alt={initials} className="w-full h-full object-cover" />
                : initials
              }
            </div>
            {clerkUser && (
              <>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={photoUploading}
                  title="Fotoğraf değiştir"
                  className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-md hover:bg-primary/80 transition-colors disabled:opacity-60"
                >
                  {photoUploading
                    ? <Loader2 className="w-3 h-3 text-white animate-spin" />
                    : <Camera className="w-3 h-3 text-white" />
                  }
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
              </>
            )}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm sm:text-base truncate">{currentUser.name}</p>
            <p className="text-xs text-muted-foreground truncate">{currentUser.email}</p>
            <p className="text-xs text-muted-foreground/70 mt-0.5">
              Üye: {format(new Date(currentUser.createdAt), "dd MMM yyyy", { locale: tr })}
            </p>
            {isOAuthUser && (
              <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-medium">
                Google hesabı
              </span>
            )}
          </div>
        </div>

        <Tabs defaultValue="profile" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid grid-cols-3 w-full rounded-none bg-transparent border-b border-border h-auto shrink-0 p-0 gap-0">
            <TabsTrigger
              value="profile"
              className="flex flex-col items-center gap-1 py-2.5 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent bg-transparent text-xs font-medium"
            >
              <User className="w-4 h-4" />
              <span>Profil</span>
            </TabsTrigger>
            {!isOAuthUser && (
              <TabsTrigger
                value="password"
                className="flex flex-col items-center gap-1 py-2.5 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent bg-transparent text-xs font-medium"
              >
                <Lock className="w-4 h-4" />
                <span>Şifre</span>
              </TabsTrigger>
            )}
            {isOAuthUser && (
              <div className="flex flex-col items-center gap-1 py-2.5 text-xs font-medium text-muted-foreground/40 cursor-not-allowed select-none">
                <Lock className="w-4 h-4" />
                <span>Şifre</span>
              </div>
            )}
            <TabsTrigger
              value="orders"
              className="flex flex-col items-center gap-1 py-2.5 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent bg-transparent text-xs font-medium"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Siparişler</span>
            </TabsTrigger>
          </TabsList>

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
              {!isOAuthUser && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">E-Posta</label>
                  <Input
                    type="email"
                    value={profileEmail}
                    onChange={e => setProfileEmail(e.target.value)}
                    placeholder="ornek@email.com"
                  />
                </div>
              )}
              {isOAuthUser && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-muted-foreground">E-Posta</label>
                  <div className="px-3 py-2 rounded-md bg-muted/50 border border-border text-sm text-muted-foreground">
                    {currentUser.email}
                    <span className="ml-2 text-[10px] text-muted-foreground/60">(Google hesabından geliyor)</span>
                  </div>
                </div>
              )}
              <Button
                onClick={handleProfileSave}
                className="w-full bg-[#b84d5b] hover:bg-[#b84d5b]/90 text-white"
              >
                Değişiklikleri Kaydet
              </Button>
              {clerkUser && (
                <div className="pt-1">
                  <p className="text-xs text-muted-foreground text-center">
                    Profil fotoğrafını değiştirmek için avatar üzerindeki{" "}
                    <button onClick={() => fileInputRef.current?.click()} className="text-primary hover:underline">
                      kamera ikonuna
                    </button>{" "}
                    tıklayın.
                  </p>
                </div>
              )}
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
                <Input type="password" value={pwCurrent} onChange={e => setPwCurrent(e.target.value)} placeholder="Mevcut şifreniz" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Yeni Şifre</label>
                <Input type="password" value={pwNext} onChange={e => setPwNext(e.target.value)} placeholder="En az 6 karakter" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Yeni Şifre (Tekrar)</label>
                <Input type="password" value={pwConfirm} onChange={e => setPwConfirm(e.target.value)} placeholder="Yeni şifrenizi tekrar girin" />
              </div>
              <Button onClick={handlePasswordSave} className="w-full bg-[#b84d5b] hover:bg-[#b84d5b]/90 text-white">
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

          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

import { useState, useEffect, useMemo, useCallback } from "react";
import { useStore } from "@/lib/store";
import { AdminFinance } from "@/components/AdminFinance";
import { AdminStock } from "@/components/AdminStock";
import { AdminContent } from "@/components/AdminContent";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, isSameDay, isBefore, startOfDay } from "date-fns";
import { tr } from "date-fns/locale";
import { LogOut, Users, ShoppingBag, Calendar, MessageSquare, TrendingUp, Star, Trash2, CheckCircle2, XCircle, Clock, KeyRound, ShieldCheck, ChevronLeft, ChevronRight } from "lucide-react";
import type { AppointmentStatus, Appointment } from "@/lib/store";

export function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const { appointments, messages, orders, users, reviews, deleteReview, transactions, updateAppointmentStatus, siteContent, updateSiteContent } = useStore();

  const adminCreds = siteContent.adminCredentials ?? { username: "admin", password: "admin123" };

  const getCategoryLabel = (key: string) => {
    const found = siteContent.appointmentSettings.categories.find(c => c.key === key);
    return found ? found.label : key;
  };

  useEffect(() => {
    const auth = sessionStorage.getItem("bw_admin_auth");
    if (auth === "true") setIsAuthenticated(true);
  }, []);

  const [loginLoading, setLoginLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setError("");
    try {
      const res = await fetch("/api/site-content/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json() as { ok: boolean };
      if (data.ok) {
        setIsAuthenticated(true);
        sessionStorage.setItem("bw_admin_auth", "true");
      } else {
        setError("Hatalı kullanıcı adı veya şifre.");
      }
    } catch {
      setError("Sunucuya bağlanılamadı, lütfen tekrar deneyin.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem("bw_admin_auth");
    setUsername("");
    setPassword("");
  };

  // Analytics
  const totalRevenue = transactions.filter(t => t.type === "gelir").reduce((s, t) => s + t.amount, 0);
  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : "—";
  const todayAppts = appointments.filter(a => {
    const d = new Date(a.date);
    const today = new Date();
    return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
  }).length;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md bg-card p-8 rounded-2xl border border-border shadow-xl">
          <div className="text-center mb-8">
            <div className="w-12 h-12 mx-auto rounded-full border border-primary/50 flex items-center justify-center bg-background mb-4">
              <span className="font-serif font-bold text-lg text-primary">BW</span>
            </div>
            <h1 className="text-2xl font-serif font-bold">Yönetici Girişi</h1>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <Input placeholder="Kullanıcı Adı" value={username} onChange={e => setUsername(e.target.value)} className="bg-background border-border" data-testid="input-username" />
            <Input type="password" placeholder="Şifre" value={password} onChange={e => setPassword(e.target.value)} className="bg-background border-border" data-testid="input-password" />
            {error && <p className="text-destructive text-sm text-center">{error}</p>}
            <Button type="submit" disabled={loginLoading} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" data-testid="btn-login">
              {loginLoading ? "Doğrulanıyor..." : "Giriş Yap"}
            </Button>
            <Button type="button" variant="ghost" className="w-full" onClick={() => window.location.hash = ""}>Ana Sayfaya Dön</Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-background p-2 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-4 bg-card p-3 md:p-4 rounded-xl border border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full border border-primary/50 flex items-center justify-center bg-background">
              <span className="font-serif font-bold text-sm text-primary">BW</span>
            </div>
            <div>
              <h1 className="text-base font-bold leading-tight">Admin Paneli</h1>
              <p className="text-xs text-muted-foreground">Black White Güzellik Salonu</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2 text-xs" data-testid="btn-logout">
            <LogOut className="w-3.5 h-3.5" /> Çıkış
          </Button>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {[
            { icon: Users, label: "Kayıtlı Üye", value: users.length, color: "text-blue-400" },
            { icon: Calendar, label: "Bugün Randevu", value: todayAppts, color: "text-green-400" },
            { icon: ShoppingBag, label: "Toplam Sipariş", value: orders.length, color: "text-purple-400" },
            { icon: TrendingUp, label: "Toplam Gelir", value: `${totalRevenue.toLocaleString()} TL`, color: "text-accent" },
          ].map(stat => (
            <div key={stat.label} className="bg-card border border-border rounded-xl p-3 md:p-4 flex items-center gap-3">
              <stat.icon className={`w-7 h-7 ${stat.color} shrink-0`} />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground truncate">{stat.label}</p>
                <p className="text-lg font-bold leading-tight">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Main tabs */}
        <Tabs defaultValue="icerik" className="w-full">
          <TabsList className="mb-4 flex w-full overflow-x-auto gap-1 bg-card border border-border rounded-xl p-1 h-auto">
            {[
              { value: "icerik", label: "İçerik" },
              { value: "veri", label: `Üyeler (${users.length})` },
              { value: "finans", label: "Finansal" },
              { value: "stok", label: "Stok" },
              { value: "randevular", label: `Randevular (${appointments.length})` },
              { value: "yorumlar", label: `Yorumlar (${reviews.length})` },
              { value: "mesajlar", label: `Mesajlar (${messages.length})` },
              { value: "siparisler", label: `Siparişler (${orders.length})` },
              { value: "hesap", label: "🔑 Admin Hesabı" },
            ].map(tab => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="text-xs whitespace-nowrap data-[state=active]:bg-primary data-[state=active]:text-primary-foreground shrink-0"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* ── İçerik Yönetimi ── */}
          <TabsContent value="icerik">
            <div className="bg-card border border-border rounded-xl p-4 md:p-6 shadow-lg">
              <AdminContent />
            </div>
          </TabsContent>

          {/* ── Üye & Veri Analizi ── */}
          <TabsContent value="veri">
            <div className="bg-card border border-border rounded-xl p-4 md:p-6 shadow-lg space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { icon: Users, label: "Toplam Üye", value: users.length, sub: "Kayıtlı kullanıcı" },
                  { icon: Star, label: "Ortalama Puan", value: avgRating, sub: `${reviews.length} yorum` },
                  { icon: MessageSquare, label: "İletişim Formu", value: messages.length, sub: "Mesaj" },
                ].map(s => (
                  <div key={s.label} className="bg-background border border-border rounded-xl p-4 text-center">
                    <s.icon className="w-8 h-8 text-primary mx-auto mb-2" />
                    <p className="text-2xl font-bold">{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-0.5">{s.sub}</p>
                  </div>
                ))}
              </div>

              <div>
                <h3 className="font-semibold text-sm mb-3 text-muted-foreground uppercase tracking-wider">Kayıtlı Üyeler</h3>
                {users.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm border border-border rounded-xl">
                    Henüz kayıtlı üye bulunmamaktadır.
                  </div>
                ) : (
                  <div className="rounded-xl border border-border overflow-hidden">
                    <Table>
                      <TableHeader className="bg-background">
                        <TableRow>
                          <TableHead>Üye</TableHead>
                          <TableHead className="hidden sm:table-cell">E-Posta</TableHead>
                          <TableHead className="hidden md:table-cell">Kayıt Tarihi</TableHead>
                          <TableHead>Siparişler</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map(user => {
                          const userOrders = orders.filter(o => o.userId === user.id || o.userEmail === user.email);
                          return (
                            <TableRow key={user.id}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                                    style={{ backgroundColor: user.avatarColor }}>
                                    {user.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)}
                                  </div>
                                  <span className="font-medium text-sm truncate max-w-[100px] sm:max-w-none">{user.name}</span>
                                </div>
                              </TableCell>
                              <TableCell className="hidden sm:table-cell text-sm text-muted-foreground truncate max-w-[160px]">{user.email}</TableCell>
                              <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                                {format(new Date(user.createdAt), "dd MMM yyyy", { locale: tr })}
                              </TableCell>
                              <TableCell>
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${userOrders.length > 0 ? "bg-green-500/15 text-green-400" : "bg-muted text-muted-foreground"}`}>
                                  {userOrders.length} sipariş
                                </span>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* ── Finansal Yönetim ── */}
          <TabsContent value="finans">
            <div className="bg-card border border-border rounded-xl p-4 md:p-6 shadow-lg">
              <AdminFinance />
            </div>
          </TabsContent>

          {/* ── Stok Takibi ── */}
          <TabsContent value="stok">
            <div className="bg-card border border-border rounded-xl p-4 md:p-6 shadow-lg">
              <AdminStock />
            </div>
          </TabsContent>

          {/* ── Randevular ── */}
          <TabsContent value="randevular">
            <RandevuCalendar
              appointments={appointments}
              getCategoryLabel={getCategoryLabel}
              updateAppointmentStatus={updateAppointmentStatus}
            />
          </TabsContent>

          {/* ── Yorumlar ── */}
          <TabsContent value="yorumlar">
            <div className="bg-card border border-border rounded-xl p-4 md:p-6 shadow-lg">
              {reviews.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Star className="w-10 h-10 mx-auto mb-3 opacity-20" />
                  <p>Henüz müşteri yorumu bulunmamaktadır.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {reviews.slice().reverse().map(r => (
                    <div key={r.id} className="flex items-start gap-3 p-4 border border-border rounded-xl bg-background/50">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                        style={{ backgroundColor: r.avatarColor }}>
                        {r.userName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-semibold text-sm">{r.userName}</span>
                          <div className="flex gap-0.5">
                            {[1,2,3,4,5].map(i => <Star key={i} className={`w-3 h-3 ${i <= r.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`} />)}
                          </div>
                          {r.staffMember !== "Genel" && <span className="text-[10px] text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">{r.staffMember}</span>}
                          <span className="text-xs text-muted-foreground ml-auto">{format(new Date(r.date), "dd MMM yyyy", { locale: tr })}</span>
                        </div>
                        <p className="text-sm text-muted-foreground italic">"{r.text}"</p>
                      </div>
                      <button onClick={() => deleteReview(r.id)} className="text-destructive hover:bg-destructive/10 p-1.5 rounded-lg transition-colors shrink-0">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* ── Mesajlar ── */}
          <TabsContent value="mesajlar">
            <div className="bg-card border border-border rounded-xl p-4 md:p-6 shadow-lg overflow-x-auto">
              <Table>
                <TableHeader className="bg-background">
                  <TableRow>
                    <TableHead>Gönderen</TableHead>
                    <TableHead className="hidden sm:table-cell">Email</TableHead>
                    <TableHead>Mesaj</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {messages.length === 0 ? (
                    <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">Kayıt bulunamadı.</TableCell></TableRow>
                  ) : (
                    messages.slice().reverse().map(msg => (
                      <TableRow key={msg.id}>
                        <TableCell className="font-medium text-sm whitespace-nowrap">{msg.name}</TableCell>
                        <TableCell className="hidden sm:table-cell text-sm">{msg.email}</TableCell>
                        <TableCell className="text-sm max-w-xs break-words">{msg.message}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* ── Siparişler ── */}
          <TabsContent value="siparisler">
            <div className="bg-card border border-border rounded-xl p-4 md:p-6 shadow-lg overflow-x-auto">
              <Table>
                <TableHeader className="bg-background">
                  <TableRow>
                    <TableHead>Tarih</TableHead>
                    <TableHead>Müşteri</TableHead>
                    <TableHead className="hidden sm:table-cell">Ürünler</TableHead>
                    <TableHead className="text-right">Toplam</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Kayıt bulunamadı.</TableCell></TableRow>
                  ) : (
                    orders.slice().reverse().map(order => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium text-sm">{format(new Date(order.date), "dd MMM HH:mm", { locale: tr })}</TableCell>
                        <TableCell className="text-sm">{order.customerName}</TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <div className="flex flex-col gap-0.5">
                            {order.items.map(i => <span key={i.id} className="text-xs text-muted-foreground">{i.quantity}x {i.name}</span>)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-bold text-accent text-sm">{order.total} TL</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* ── Admin Hesabı ── */}
          <TabsContent value="hesap">
            <div className="bg-card border border-border rounded-xl p-4 md:p-6 shadow-lg">
              <AdminCredentials
                currentUsername={adminCreds.username}
                currentPassword={adminCreds.password}
                onSave={async (u, p) => {
                  updateSiteContent({ adminCredentials: { username: u, password: p } });
                  await fetch("/api/site-content/admin-credentials", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username: u, password: p }),
                  }).catch(console.error);
                }}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function AdminCredentials({
  currentUsername,
  currentPassword,
  onSave,
}: {
  currentUsername: string;
  currentPassword: string;
  onSave: (username: string, password: string) => void;
}) {
  const [curPass, setCurPass] = useState("");
  const [newUser, setNewUser] = useState(currentUsername);
  const [newPass, setNewPass] = useState("");
  const [newPassConfirm, setNewPassConfirm] = useState("");
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);

    if (curPass !== currentPassword) {
      setMsg({ type: "err", text: "Mevcut şifre yanlış." });
      return;
    }
    if (!newUser.trim()) {
      setMsg({ type: "err", text: "Kullanıcı adı boş olamaz." });
      return;
    }
    if (newPass && newPass !== newPassConfirm) {
      setMsg({ type: "err", text: "Yeni şifreler eşleşmiyor." });
      return;
    }
    if (newPass && newPass.length < 6) {
      setMsg({ type: "err", text: "Yeni şifre en az 6 karakter olmalıdır." });
      return;
    }

    onSave(newUser.trim(), newPass || currentPassword);
    setCurPass("");
    setNewPass("");
    setNewPassConfirm("");
    setMsg({ type: "ok", text: "Admin hesabı güncellendi. Yeni bilgilerle giriş yapabilirsiniz." });
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <KeyRound className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="font-semibold text-base">Admin Hesabı</h2>
          <p className="text-xs text-muted-foreground">Giriş kullanıcı adı ve şifreyi buradan değiştirin.</p>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-background border border-border flex items-center gap-3">
        <ShieldCheck className="w-4 h-4 text-green-400 shrink-0" />
        <div>
          <p className="text-xs text-muted-foreground">Mevcut kullanıcı adı</p>
          <p className="font-medium text-sm">{currentUsername}</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Mevcut Şifre (doğrulama)</label>
          <Input
            type="password"
            placeholder="Mevcut şifrenizi girin"
            value={curPass}
            onChange={e => setCurPass(e.target.value)}
            required
            className="bg-background border-border"
          />
        </div>

        <div className="h-px bg-border" />

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Yeni Kullanıcı Adı</label>
          <Input
            placeholder="Yeni kullanıcı adı"
            value={newUser}
            onChange={e => setNewUser(e.target.value)}
            className="bg-background border-border"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Yeni Şifre <span className="text-muted-foreground/50 normal-case font-normal">(değiştirmek istemiyorsanız boş bırakın)</span></label>
          <Input
            type="password"
            placeholder="Yeni şifre (min. 6 karakter)"
            value={newPass}
            onChange={e => setNewPass(e.target.value)}
            className="bg-background border-border"
          />
        </div>

        {newPass && (
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Yeni Şifre Tekrar</label>
            <Input
              type="password"
              placeholder="Yeni şifreyi tekrar girin"
              value={newPassConfirm}
              onChange={e => setNewPassConfirm(e.target.value)}
              className="bg-background border-border"
            />
          </div>
        )}

        {msg && (
          <p className={`text-sm px-3 py-2 rounded-lg ${msg.type === "ok" ? "bg-green-500/10 text-green-400" : "bg-destructive/10 text-destructive"}`}>
            {msg.text}
          </p>
        )}

        <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
          <KeyRound className="w-4 h-4 mr-2" /> Hesabı Güncelle
        </Button>
      </form>
    </div>
  );
}

// ─── Randevu Takvimi ──────────────────────────────────────────────────────────
const GUN_BASLIKLARI = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

function RandevuCalendar({
  appointments,
  getCategoryLabel,
  updateAppointmentStatus,
}: {
  appointments: Appointment[];
  getCategoryLabel: (key: string) => string;
  updateAppointmentStatus: (id: string, status: AppointmentStatus) => void;
}) {
  const today = startOfDay(new Date());

  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<Date>(today);

  // Günlük randevu haritası  "YYYY-MM-DD" → Appointment[]
  const dayMap = useMemo(() => {
    const map: Record<string, Appointment[]> = {};
    appointments.forEach(a => {
      const d = startOfDay(new Date(a.date));
      const k = format(d, "yyyy-MM-dd");
      if (!map[k]) map[k] = [];
      map[k].push(a);
    });
    // Her gün saate göre sırala
    Object.values(map).forEach(arr => arr.sort((a, b) => a.time.localeCompare(b.time)));
    return map;
  }, [appointments]);

  // Takvim hücreleri
  const cells = useMemo(() => {
    const firstDay = new Date(calYear, calMonth, 1);
    let offset = firstDay.getDay() - 1;
    if (offset < 0) offset = 6;
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const arr: (number | null)[] = Array(offset).fill(null);
    for (let d = 1; d <= daysInMonth; d++) arr.push(d);
    while (arr.length % 7 !== 0) arr.push(null);
    return arr;
  }, [calYear, calMonth]);

  const prevMonth = useCallback(() => {
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); }
    else setCalMonth(m => m - 1);
  }, [calMonth]);

  const nextMonth = useCallback(() => {
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); }
    else setCalMonth(m => m + 1);
  }, [calMonth]);

  // Seçili gün verileri
  const selectedKey = format(selectedDate, "yyyy-MM-dd");
  const selectedAppts = dayMap[selectedKey] ?? [];
  const isSelectedPast = isBefore(selectedDate, today);
  const isSelectedToday = isSameDay(selectedDate, today);
  const isSelectedFuture = !isSelectedPast && !isSelectedToday;

  // Özet sayaçlar
  const todayCount = (dayMap[format(today, "yyyy-MM-dd")] ?? []).length;
  const futureCount = appointments.filter(a => {
    const d = startOfDay(new Date(a.date));
    return !isBefore(d, today) && !isSameDay(d, today);
  }).length;
  const totalCount = appointments.length;

  return (
    <div className="space-y-4">
      {/* Üst özet bandı */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Bugün", value: todayCount, color: "text-[#b84d5b]", bg: "bg-[#b84d5b]/10 border-[#b84d5b]/20" },
          { label: "Gelecek", value: futureCount, color: "text-blue-500", bg: "bg-blue-500/10 border-blue-500/20" },
          { label: "Toplam", value: totalCount, color: "text-muted-foreground", bg: "bg-muted/50 border-border" },
        ].map(s => (
          <div key={s.label} className={`rounded-xl border p-3 text-center ${s.bg}`}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-[340px_1fr] gap-4 items-start">
        {/* ── Takvim ── */}
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
          {/* Ay navigasyon */}
          <div className="flex items-center justify-between mb-3">
            <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-semibold capitalize">
              {format(new Date(calYear, calMonth, 1), "MMMM yyyy", { locale: tr })}
            </span>
            <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Gün başlıkları */}
          <div className="grid grid-cols-7 mb-1">
            {GUN_BASLIKLARI.map(g => (
              <div key={g} className="text-center text-[11px] text-muted-foreground font-medium py-1">{g}</div>
            ))}
          </div>

          {/* Takvim hücreleri */}
          <div className="grid grid-cols-7 gap-0.5">
            {cells.map((day, idx) => {
              if (!day) return <div key={`e-${idx}`} />;
              const cellDate = startOfDay(new Date(calYear, calMonth, day));
              const k = format(cellDate, "yyyy-MM-dd");
              const count = (dayMap[k] ?? []).length;
              const isPast = isBefore(cellDate, today);
              const isToday = isSameDay(cellDate, today);
              const isSelected = isSameDay(cellDate, selectedDate);

              return (
                <button
                  key={k}
                  onClick={() => {
                    setSelectedDate(cellDate);
                    setCalYear(cellDate.getFullYear());
                    setCalMonth(cellDate.getMonth());
                  }}
                  className={[
                    "relative flex flex-col items-center justify-center rounded-lg h-10 text-xs font-medium transition-all",
                    isSelected
                      ? "bg-[#b84d5b] text-white shadow-md"
                      : isToday
                        ? "bg-[#b84d5b]/15 text-[#b84d5b] font-bold ring-1 ring-[#b84d5b]/40"
                        : isPast
                          ? "text-muted-foreground/50 hover:bg-muted/50"
                          : "hover:bg-muted",
                  ].join(" ")}
                >
                  <span className="leading-none">{day}</span>
                  {count > 0 && (
                    <span className={[
                      "mt-0.5 text-[9px] font-bold leading-none",
                      isSelected ? "text-white/80" : isToday ? "text-[#b84d5b]" : isPast ? "text-muted-foreground/40" : "text-blue-500",
                    ].join(" ")}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Renk açıklaması */}
          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#b84d5b]/30 inline-block" />Bugün</span>
            <span className="flex items-center gap-1"><span className="text-blue-500 font-bold">•</span>Gelecek</span>
            <span className="flex items-center gap-1"><span className="text-muted-foreground/40 font-bold">•</span>Geçmiş</span>
          </div>
        </div>

        {/* ── Seçili gün detayı ── */}
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          {/* Gün başlığı */}
          <div className={[
            "px-4 py-3 border-b border-border flex items-center justify-between",
            isSelectedToday ? "bg-[#b84d5b]/8" : isSelectedFuture ? "bg-blue-500/5" : "bg-muted/30",
          ].join(" ")}>
            <div>
              <p className="font-semibold text-sm capitalize">
                {format(selectedDate, "d MMMM yyyy, EEEE", { locale: tr })}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isSelectedToday
                  ? "Bugün"
                  : isSelectedFuture
                    ? "Gelecek randevular"
                    : "Geçmiş randevular"}
                {" — "}
                <span className="font-medium">{selectedAppts.length} randevu</span>
              </p>
            </div>
            {isSelectedToday && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#b84d5b] text-white">BUGÜN</span>
            )}
            {isSelectedFuture && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-500">GELECEK</span>
            )}
          </div>

          {/* Randevu listesi */}
          {selectedAppts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-muted-foreground">
              <Calendar className="w-10 h-10 mb-3 opacity-20" />
              <p className="text-sm">Bu gün için randevu yok.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {selectedAppts.map(app => (
                <div key={app.id} className={[
                  "flex items-center gap-3 px-4 py-3",
                  isSelectedPast ? "opacity-70" : "",
                ].join(" ")}>
                  {/* Saat */}
                  <div className={[
                    "shrink-0 w-14 h-14 rounded-xl flex flex-col items-center justify-center text-xs font-bold",
                    isSelectedToday
                      ? "bg-[#b84d5b]/10 text-[#b84d5b]"
                      : isSelectedFuture
                        ? "bg-blue-500/10 text-blue-500"
                        : "bg-muted text-muted-foreground",
                  ].join(" ")}>
                    <Clock className="w-3.5 h-3.5 mb-0.5 opacity-60" />
                    <span className="text-sm leading-tight">{app.time}</span>
                  </div>

                  {/* Bilgiler */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{app.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{getCategoryLabel(app.category)} · {app.staff}</p>
                    <p className="text-xs text-muted-foreground">{app.phone}</p>
                  </div>

                  {/* Durum toggle */}
                  <div className="shrink-0">
                    <AppointmentStatusToggle
                      status={(app.status ?? "pending") as AppointmentStatus}
                      onChange={s => updateAppointmentStatus(app.id, s)}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AppointmentStatusToggle({
  status,
  onChange,
}: {
  status: AppointmentStatus;
  onChange: (s: AppointmentStatus) => void;
}) {
  if (status === "came") {
    return (
      <div className="flex flex-col items-center gap-1">
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/15 text-green-600 dark:text-green-400 text-xs font-semibold">
          <CheckCircle2 className="w-3.5 h-3.5" /> Geldi
        </span>
        <button onClick={() => onChange("pending")} className="text-[10px] text-muted-foreground hover:text-foreground underline underline-offset-2">
          sıfırla
        </button>
      </div>
    );
  }
  if (status === "no_show") {
    return (
      <div className="flex flex-col items-center gap-1">
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/15 text-red-600 dark:text-red-400 text-xs font-semibold">
          <XCircle className="w-3.5 h-3.5" /> Gelmedi
        </span>
        <button onClick={() => onChange("pending")} className="text-[10px] text-muted-foreground hover:text-foreground underline underline-offset-2">
          sıfırla
        </button>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center gap-1.5">
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs">
        <Clock className="w-3 h-3" /> Bekliyor
      </span>
      <div className="flex gap-1">
        <button
          onClick={() => onChange("came")}
          title="Geldi olarak işaretle"
          className="flex items-center gap-0.5 px-2 py-1 rounded-md bg-green-500/10 hover:bg-green-500/25 text-green-600 dark:text-green-400 text-[11px] font-medium transition-colors"
        >
          <CheckCircle2 className="w-3 h-3" /> Geldi
        </button>
        <button
          onClick={() => onChange("no_show")}
          title="Gelmedi olarak işaretle"
          className="flex items-center gap-0.5 px-2 py-1 rounded-md bg-red-500/10 hover:bg-red-500/25 text-red-600 dark:text-red-400 text-[11px] font-medium transition-colors"
        >
          <XCircle className="w-3 h-3" /> Gelmedi
        </button>
      </div>
    </div>
  );
}

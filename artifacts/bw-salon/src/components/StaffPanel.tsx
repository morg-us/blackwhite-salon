import { useState, useMemo } from "react";
import { useStore } from "@/lib/store";
import type { StaffUser } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { LogOut, Calendar, Users, Clock, LogIn, LogOutIcon, ShieldCheck, MessageSquare } from "lucide-react";

function formatDuration(checkIn: string, checkOut?: string): string {
  const start = new Date(checkIn).getTime();
  const end = checkOut ? new Date(checkOut).getTime() : Date.now();
  const diff = Math.floor((end - start) / 1000 / 60);
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  return h > 0 ? `${h}s ${m}dk` : `${m}dk`;
}

export function StaffPanel() {
  const {
    staffUsers, loginStaffUser, currentStaffUser, setCurrentStaffUser,
    appointments, messages, workEntries, addWorkEntry, closeWorkEntry,
    siteContent,
  } = useStore();

  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = await loginStaffUser(username, pin);
    if (user) {
      setError("");
    } else {
      setError("Kullanıcı adı veya PIN hatalı.");
    }
  };

  const handleLogout = () => {
    setCurrentStaffUser(null);
    setUsername("");
    setPin("");
  };

  if (!currentStaffUser) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md bg-card p-8 rounded-2xl border border-border shadow-xl">
          <div className="text-center mb-8">
            <div className="w-12 h-12 mx-auto rounded-full border border-primary/50 flex items-center justify-center bg-background mb-4">
              <span className="font-serif font-bold text-lg text-primary">BW</span>
            </div>
            <h1 className="text-2xl font-serif font-bold">Personel Girişi</h1>
            <p className="text-sm text-muted-foreground mt-1">Black White Güzellik Salonu</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Kullanıcı Adı</label>
              <Input
                placeholder="Kullanıcı adınız"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="bg-background border-border"
                autoComplete="username"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">PIN (4 Hane)</label>
              <Input
                type="password"
                placeholder="••••"
                value={pin}
                maxLength={4}
                onChange={e => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                className="bg-background border-border text-center tracking-widest text-lg"
                autoComplete="current-password"
              />
            </div>
            {error && <p className="text-destructive text-sm text-center">{error}</p>}
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
              Giriş Yap
            </Button>
            <Button type="button" variant="ghost" className="w-full" onClick={() => window.location.hash = ""}>
              Ana Sayfaya Dön
            </Button>
          </form>

          {staffUsers.length === 0 && (
            <div className="mt-6 p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground text-center">
              Henüz personel hesabı oluşturulmamış.<br />Admin panelinden hesap ekleyin.
            </div>
          )}
        </div>
      </div>
    );
  }

  return <StaffDashboard staffUser={currentStaffUser} onLogout={handleLogout} />;
}

function StaffDashboard({ staffUser, onLogout }: { staffUser: StaffUser; onLogout: () => void }) {
  const {
    appointments, messages, workEntries, addWorkEntry, closeWorkEntry, siteContent,
  } = useStore();

  const myAppointments = useMemo(() => {
    const name = staffUser.name;
    return appointments.filter(a => a.staff === name || a.staff.includes(name.split(" ")[0]));
  }, [appointments, staffUser.name]);

  const myWorkEntries = useMemo(() => {
    return workEntries.filter(e => e.staffUserId === staffUser.id).slice().reverse();
  }, [workEntries, staffUser.id]);

  const openEntry = myWorkEntries.find(e => !e.checkOut);

  const todayAppointments = useMemo(() => {
    const today = new Date();
    return myAppointments.filter(a => {
      const d = new Date(a.date);
      return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
    });
  }, [myAppointments]);

  const uniqueCustomers = useMemo(() => {
    const names = new Set(myAppointments.map(a => a.name.toLowerCase()));
    return names.size;
  }, [myAppointments]);

  const member = siteContent.staffMembers.find(s => s.name === staffUser.name);

  return (
    <div className="min-h-screen w-full bg-background p-2 md:p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-4 bg-card p-3 md:p-4 rounded-xl border border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border border-primary/50 flex items-center justify-center bg-background">
              {member?.imageUrl ? (
                <img src={member.imageUrl} alt={staffUser.name} className="w-full h-full rounded-full object-cover" />
              ) : (
                <span className="font-serif font-bold text-sm text-primary">{member?.initials || staffUser.name.slice(0, 2).toUpperCase()}</span>
              )}
            </div>
            <div>
              <h1 className="text-base font-bold leading-tight">{staffUser.name}</h1>
              <div className="flex items-center gap-1.5">
                <p className="text-xs text-muted-foreground">{member?.title || "Personel"}</p>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${staffUser.role === "yonetici" ? "bg-accent/15 text-accent" : "bg-primary/10 text-primary"}`}>
                  {staffUser.role === "yonetici" ? "Yönetici" : "Uzman"}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {openEntry ? (
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs border-red-500/50 text-red-400 hover:bg-red-500/10"
                onClick={() => closeWorkEntry(openEntry.id)}
              >
                <LogOutIcon className="w-3.5 h-3.5" /> Çıkış Yap
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs border-green-500/50 text-green-400 hover:bg-green-500/10"
                onClick={() => addWorkEntry(staffUser.id, staffUser.name)}
              >
                <LogIn className="w-3.5 h-3.5" /> Giriş Yap
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={onLogout} className="gap-2 text-xs">
              <LogOut className="w-3.5 h-3.5" /> Çıkış
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {[
            { icon: Calendar, label: "Bugün Randevu", value: todayAppointments.length, color: "text-blue-400" },
            { icon: Calendar, label: "Toplam Randevu", value: myAppointments.length, color: "text-purple-400" },
            { icon: Users, label: "Müşteri Sayısı", value: uniqueCustomers, color: "text-green-400" },
            { icon: Clock, label: "Çalışma Durumu", value: openEntry ? "Aktif" : "Çıkış Yapıldı", color: openEntry ? "text-green-400" : "text-muted-foreground" },
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

        {/* Tabs */}
        <Tabs defaultValue="randevular" className="w-full">
          <TabsList className="mb-4 flex w-full gap-1 bg-card border border-border rounded-xl p-1 h-auto">
            <TabsTrigger value="randevular" className="flex-1 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Calendar className="w-3.5 h-3.5 mr-1" /> Randevularım ({myAppointments.length})
            </TabsTrigger>
            <TabsTrigger value="musteriler" className="flex-1 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Users className="w-3.5 h-3.5 mr-1" /> Müşterilerim ({uniqueCustomers})
            </TabsTrigger>
            <TabsTrigger value="saatler" className="flex-1 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Clock className="w-3.5 h-3.5 mr-1" /> Çalışma Saatleri
            </TabsTrigger>
            {staffUser.role === "yonetici" && (
              <TabsTrigger value="mesajlar" className="flex-1 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <MessageSquare className="w-3.5 h-3.5 mr-1" /> Mesajlar
              </TabsTrigger>
            )}
          </TabsList>

          {/* Randevularım */}
          <TabsContent value="randevular">
            <div className="bg-card border border-border rounded-xl p-4 shadow-lg overflow-x-auto">
              <Table>
                <TableHeader className="bg-background">
                  <TableRow>
                    <TableHead>Tarih & Saat</TableHead>
                    <TableHead>Müşteri</TableHead>
                    <TableHead className="hidden sm:table-cell">Telefon</TableHead>
                    <TableHead>Kategori</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myAppointments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                        <Calendar className="w-8 h-8 mx-auto mb-2 opacity-20" />
                        Henüz randevunuz bulunmamaktadır.
                      </TableCell>
                    </TableRow>
                  ) : (
                    myAppointments.slice().reverse().map(app => (
                      <TableRow key={app.id}>
                        <TableCell className="font-medium text-sm">
                          {format(new Date(app.date), "dd MMM yyyy", { locale: tr })}
                          <br /><span className="text-primary text-xs">{app.time}</span>
                        </TableCell>
                        <TableCell className="text-sm">{app.name}</TableCell>
                        <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">{app.phone}</TableCell>
                        <TableCell>
                          <span className="text-xs capitalize bg-primary/10 text-primary px-2 py-0.5 rounded-full">{app.category}</span>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Müşterilerim */}
          <TabsContent value="musteriler">
            <div className="bg-card border border-border rounded-xl p-4 shadow-lg">
              {uniqueCustomers === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">Henüz müşteriniz bulunmamaktadır.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {Array.from(new Map(myAppointments.map(a => [a.name.toLowerCase(), a]))).map(([, app]) => {
                    const count = myAppointments.filter(a => a.name.toLowerCase() === app.name.toLowerCase()).length;
                    return (
                      <div key={app.id} className="flex items-center justify-between p-3 bg-background border border-border rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-xs font-bold text-primary">{app.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)}</span>
                          </div>
                          <div>
                            <p className="font-medium text-sm">{app.name}</p>
                            <p className="text-xs text-muted-foreground">{app.phone}</p>
                          </div>
                        </div>
                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
                          {count} randevu
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Çalışma Saatleri */}
          <TabsContent value="saatler">
            <div className="bg-card border border-border rounded-xl p-4 shadow-lg space-y-4">
              {openEntry && (
                <div className="flex items-center justify-between p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
                  <div>
                    <p className="text-sm font-medium text-green-400">Aktif Oturum</p>
                    <p className="text-xs text-muted-foreground">
                      Giriş: {format(new Date(openEntry.checkIn), "HH:mm", { locale: tr })} · Süre: {formatDuration(openEntry.checkIn)}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                    onClick={() => closeWorkEntry(openEntry.id)}
                  >
                    <LogOutIcon className="w-3.5 h-3.5 mr-1" /> Çıkış Yap
                  </Button>
                </div>
              )}

              {myWorkEntries.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <Clock className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">Henüz çalışma kaydı bulunmamaktadır.</p>
                  <p className="text-xs mt-1">Yukarıdaki "Giriş Yap" butonunu kullanın.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-background">
                      <TableRow>
                        <TableHead>Tarih</TableHead>
                        <TableHead>Giriş</TableHead>
                        <TableHead>Çıkış</TableHead>
                        <TableHead>Süre</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {myWorkEntries.map(entry => (
                        <TableRow key={entry.id}>
                          <TableCell className="text-sm font-medium">
                            {format(new Date(entry.checkIn), "dd MMM yyyy", { locale: tr })}
                          </TableCell>
                          <TableCell className="text-sm text-green-400">
                            {format(new Date(entry.checkIn), "HH:mm", { locale: tr })}
                          </TableCell>
                          <TableCell className="text-sm">
                            {entry.checkOut ? (
                              <span className="text-red-400">{format(new Date(entry.checkOut), "HH:mm", { locale: tr })}</span>
                            ) : (
                              <span className="text-green-400 text-xs">Devam ediyor...</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm font-medium">
                            {formatDuration(entry.checkIn, entry.checkOut)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Mesajlar (Yönetici only) */}
          {staffUser.role === "yonetici" && (
            <TabsContent value="mesajlar">
              <div className="bg-card border border-border rounded-xl p-4 shadow-lg space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck className="w-4 h-4 text-accent" />
                  <span className="text-xs text-muted-foreground">Yönetici erişimi — tüm iletişim mesajları</span>
                </div>
                {messages.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    <p className="text-sm">Henüz mesaj bulunmamaktadır.</p>
                  </div>
                ) : (
                  messages.slice().reverse().map(msg => (
                    <div key={msg.id} className="p-4 border border-border rounded-xl bg-background/50">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium text-sm">{msg.name}</p>
                          <p className="text-xs text-muted-foreground">{msg.email}</p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{msg.message}</p>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>
          )}
        </Tabs>

        <div className="mt-4 text-center">
          <p className="text-xs text-muted-foreground">
            Black White Güzellik Salonu · Personel Paneli
          </p>
        </div>
      </div>
    </div>
  );
}

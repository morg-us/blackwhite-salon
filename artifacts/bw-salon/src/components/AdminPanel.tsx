import { useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { LogOut } from "lucide-react";

export function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const { appointments, messages, orders } = useStore();

  useEffect(() => {
    const auth = sessionStorage.getItem("bw_admin_auth");
    if (auth === "true") setIsAuthenticated(true);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === "admin" && password === "admin123") {
      setIsAuthenticated(true);
      sessionStorage.setItem("bw_admin_auth", "true");
      setError("");
    } else {
      setError("Hatalı kullanıcı adı veya şifre.");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem("bw_admin_auth");
    setUsername("");
    setPassword("");
  };

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
            <div>
              <Input 
                placeholder="Kullanıcı Adı" 
                value={username} 
                onChange={e => setUsername(e.target.value)} 
                className="bg-background border-border"
              />
            </div>
            <div>
              <Input 
                type="password" 
                placeholder="Şifre" 
                value={password} 
                onChange={e => setPassword(e.target.value)}
                className="bg-background border-border"
              />
            </div>
            {error && <p className="text-destructive text-sm text-center">{error}</p>}
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">Giriş Yap</Button>
            <Button type="button" variant="ghost" className="w-full" onClick={() => window.location.hash = ""}>Ana Sayfaya Dön</Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8 bg-card p-4 rounded-xl border border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border border-primary/50 flex items-center justify-center bg-background">
              <span className="font-serif font-bold text-primary">BW</span>
            </div>
            <h1 className="text-xl font-bold">Admin Paneli</h1>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2">
            <LogOut className="w-4 h-4" /> Çıkış
          </Button>
        </div>

        <Tabs defaultValue="randevular" className="w-full bg-card border border-border rounded-xl p-4 md:p-6 shadow-lg">
          <TabsList className="mb-6 grid w-full grid-cols-3 bg-background border border-border rounded-lg p-1">
            <TabsTrigger value="randevular" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Randevular ({appointments.length})</TabsTrigger>
            <TabsTrigger value="mesajlar" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Mesajlar ({messages.length})</TabsTrigger>
            <TabsTrigger value="siparisler" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Siparişler ({orders.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="randevular">
            <div className="rounded-md border border-border overflow-hidden">
              <Table>
                <TableHeader className="bg-background">
                  <TableRow>
                    <TableHead>Tarih & Saat</TableHead>
                    <TableHead>Müşteri</TableHead>
                    <TableHead>Telefon</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Uzman</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appointments.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Kayıt bulunamadı.</TableCell></TableRow>
                  ) : (
                    appointments.slice().reverse().map(app => (
                      <TableRow key={app.id}>
                        <TableCell className="font-medium">
                          {format(new Date(app.date), "dd MMM yyyy", { locale: tr })} <br/>
                          <span className="text-accent">{app.time}</span>
                        </TableCell>
                        <TableCell>{app.name}</TableCell>
                        <TableCell>{app.phone}</TableCell>
                        <TableCell className="capitalize">{app.category}</TableCell>
                        <TableCell className="capitalize">{app.staff}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="mesajlar">
            <div className="rounded-md border border-border overflow-hidden">
              <Table>
                <TableHeader className="bg-background">
                  <TableRow>
                    <TableHead>Gönderen</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Mesaj</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {messages.length === 0 ? (
                    <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">Kayıt bulunamadı.</TableCell></TableRow>
                  ) : (
                    messages.slice().reverse().map(msg => (
                      <TableRow key={msg.id}>
                        <TableCell className="font-medium whitespace-nowrap">{msg.name}</TableCell>
                        <TableCell>{msg.email}</TableCell>
                        <TableCell className="max-w-md break-words">{msg.message}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="siparisler">
            <div className="rounded-md border border-border overflow-hidden">
              <Table>
                <TableHeader className="bg-background">
                  <TableRow>
                    <TableHead>Tarih</TableHead>
                    <TableHead>Müşteri</TableHead>
                    <TableHead>Ürünler</TableHead>
                    <TableHead className="text-right">Toplam Tutar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Kayıt bulunamadı.</TableCell></TableRow>
                  ) : (
                    orders.slice().reverse().map(order => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">
                          {format(new Date(order.date), "dd MMM HH:mm", { locale: tr })}
                        </TableCell>
                        <TableCell>{order.customerName}</TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {order.items.map(i => (
                              <span key={i.id} className="text-xs text-muted-foreground">{i.quantity}x {i.name}</span>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-bold text-accent">{order.total} TL</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

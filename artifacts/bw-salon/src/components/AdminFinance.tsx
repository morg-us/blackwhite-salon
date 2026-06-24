import { useState, useMemo } from "react";
import { useStore, Adisyon, AdisyonItem, Transaction, InventoryProduct, StockMovement } from "@/lib/store";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";
import {
  Plus, Trash2, CheckCircle, Receipt, TrendingUp, TrendingDown, Wallet, ChevronDown, ChevronUp, X
} from "lucide-react";

const PRICE_CAT_LABELS: Record<string, string> = {
  sac: "Saç",
  gelin: "Gelin",
  manikur: "Manikür",
  agda: "Ağda",
  makyaj: "Makyaj",
};

function parsePriceTL(s: string): number {
  return Number(String(s).replace(/[^0-9,]/g, "").replace(",", ".")) || 0;
}

const GIDER_KATEGORILERI = [
  "Ürün / Malzeme Alımı",
  "Kira",
  "Elektrik / Su / Doğalgaz",
  "Personel Maaşı",
  "Reklam / Pazarlama",
  "Bakım / Onarım",
  "Diğer Gider",
];

const GELIR_KATEGORILERI = [
  "Adisyon",
  "Online Satış",
  "Hediye Çeki",
  "Diğer Gelir",
];

const PALETTE = {
  rose: "#b84d5b",
  softPink: "#e8a5b2",
  caramel: "#bd8c74",
  cream: "#e6dac7",
  brown: "#54352b",
  green: "#4caf7d",
  red: "#e05c5c",
};

function fmt(n: number) {
  return n.toLocaleString("tr-TR") + " TL";
}

function uid() {
  return Math.random().toString(36).substring(2, 9);
}

// ─── KPI Card ────────────────────────────────────────────────────────────────
function KpiCard({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
      <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0" style={{ background: color + "22" }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <div>
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <p className="text-xl font-bold">{value}</p>
      </div>
    </div>
  );
}

// ─── Özet Tab ────────────────────────────────────────────────────────────────
function OzetTab() {
  const { transactions, adisyonlar, orders } = useStore();

  const totalGelir = useMemo(() =>
    transactions.filter(t => t.type === "gelir").reduce((s, t) => s + t.amount, 0),
    [transactions]
  );
  const totalGider = useMemo(() =>
    transactions.filter(t => t.type === "gider").reduce((s, t) => s + t.amount, 0),
    [transactions]
  );
  const netKar = totalGelir - totalGider;

  const thisMonth = useMemo(() => {
    const now = new Date();
    return transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
  }, [transactions]);

  const thisMonthGelir = thisMonth.filter(t => t.type === "gelir").reduce((s, t) => s + t.amount, 0);
  const thisMonthGider = thisMonth.filter(t => t.type === "gider").reduce((s, t) => s + t.amount, 0);

  // Monthly bar chart data (last 6 months)
  const monthlyData = useMemo(() => {
    const result: Record<string, { ay: string; gelir: number; gider: number }> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      result[key] = { ay: format(d, "MMM", { locale: tr }), gelir: 0, gider: 0 };
    }
    transactions.forEach(t => {
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (result[key]) {
        if (t.type === "gelir") result[key].gelir += t.amount;
        else result[key].gider += t.amount;
      }
    });
    return Object.values(result);
  }, [transactions]);

  // Gelir category pie data
  const gelirByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    transactions.filter(t => t.type === "gelir").forEach(t => {
      map[t.category] = (map[t.category] || 0) + t.amount;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [transactions]);

  // Gider category pie data
  const giderByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    transactions.filter(t => t.type === "gider").forEach(t => {
      map[t.category] = (map[t.category] || 0) + t.amount;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [transactions]);

  // Top services from adisyonlar
  const topServices = useMemo(() => {
    const map: Record<string, { count: number; total: number }> = {};
    adisyonlar.forEach(a => {
      a.items.filter(i => i.type === "hizmet").forEach(i => {
        if (!map[i.name]) map[i.name] = { count: 0, total: 0 };
        map[i.name].count += i.quantity;
        map[i.name].total += i.total;
      });
    });
    return Object.entries(map)
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 6);
  }, [adisyonlar]);

  const PIE_COLORS = [PALETTE.rose, PALETTE.caramel, PALETTE.softPink, PALETTE.cream, PALETTE.brown, "#7b68ee", "#48b6a3"];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Toplam Gelir" value={fmt(totalGelir)} icon={<TrendingUp className="w-5 h-5" />} color={PALETTE.green} />
        <KpiCard label="Toplam Gider" value={fmt(totalGider)} icon={<TrendingDown className="w-5 h-5" />} color={PALETTE.red} />
        <KpiCard label="Net Kar" value={fmt(netKar)} icon={<Wallet className="w-5 h-5" />} color={netKar >= 0 ? PALETTE.green : PALETTE.red} />
        <KpiCard label="Bu Ay Net" value={fmt(thisMonthGelir - thisMonthGider)} icon={<Receipt className="w-5 h-5" />} color={PALETTE.caramel} />
      </div>

      {/* Monthly bar chart */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">Son 6 Ay Gelir / Gider</h3>
        {monthlyData.some(d => d.gelir > 0 || d.gider > 0) ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="ay" tick={{ fill: "#888", fontSize: 12 }} />
              <YAxis tick={{ fill: "#888", fontSize: 11 }} tickFormatter={v => v >= 1000 ? (v / 1000).toFixed(0) + "k" : v} />
              <Tooltip formatter={(val: number) => fmt(val)} contentStyle={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: 8 }} />
              <Bar dataKey="gelir" name="Gelir" fill={PALETTE.rose} radius={[4, 4, 0, 0]} />
              <Bar dataKey="gider" name="Gider" fill={PALETTE.brown} radius={[4, 4, 0, 0]} />
              <Legend formatter={(val) => <span style={{ color: "#ccc", fontSize: 12 }}>{val}</span>} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-center text-muted-foreground py-10 text-sm">Henüz veri yok. Gelir/gider kaydı ekleyin.</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Gelir dağılımı */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">Gelir Kategorileri</h3>
          {gelirByCategory.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={gelirByCategory} cx="50%" cy="50%" outerRadius={70} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {gelirByCategory.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(val: number) => fmt(val)} contentStyle={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-muted-foreground py-10 text-sm">Veri yok</p>
          )}
        </div>

        {/* Gider dağılımı */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">Gider Kategorileri</h3>
          {giderByCategory.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={giderByCategory} cx="50%" cy="50%" outerRadius={70} dataKey="value" nameKey="name" label={({ name, percent }) => `${name.split(" ")[0]} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {giderByCategory.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(val: number) => fmt(val)} contentStyle={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-muted-foreground py-10 text-sm">Veri yok</p>
          )}
        </div>
      </div>

      {/* Top services */}
      {topServices.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">En Çok Yapılan Hizmetler</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={topServices} layout="vertical" margin={{ left: 20, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis type="number" tick={{ fill: "#888", fontSize: 11 }} tickFormatter={v => v >= 1000 ? (v / 1000).toFixed(0) + "k" : v} />
              <YAxis type="category" dataKey="name" tick={{ fill: "#ccc", fontSize: 11 }} width={130} />
              <Tooltip formatter={(val: number) => fmt(val)} contentStyle={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: 8 }} />
              <Bar dataKey="total" name="Ciro" fill={PALETTE.rose} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* This month breakdown */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl p-4 space-y-1">
          <p className="text-xs text-muted-foreground">Bu Ay Gelir</p>
          <p className="text-lg font-bold" style={{ color: PALETTE.green }}>{fmt(thisMonthGelir)}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 space-y-1">
          <p className="text-xs text-muted-foreground">Bu Ay Gider</p>
          <p className="text-lg font-bold" style={{ color: PALETTE.red }}>{fmt(thisMonthGider)}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 space-y-1">
          <p className="text-xs text-muted-foreground">Toplam Adisyon</p>
          <p className="text-lg font-bold">{adisyonlar.length}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 space-y-1">
          <p className="text-xs text-muted-foreground">Toplam Sipariş</p>
          <p className="text-lg font-bold">{orders.length}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Adisyon Tab ─────────────────────────────────────────────────────────────
function AdisyonTab() {
  const { adisyonlar, addAdisyon, updateAdisyon, deleteAdisyon, siteContent } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Fiyat listesinden hizmetleri dinamik olarak oluştur
  const hizmetOptions = useMemo(() => {
    const list: { name: string; price: number; category: string }[] = [];
    (Object.keys(siteContent.priceList) as (keyof typeof siteContent.priceList)[]).forEach(cat => {
      siteContent.priceList[cat].forEach(item => {
        const price = parsePriceTL(item.price);
        if (item.name && price > 0) list.push({ name: item.name, price, category: PRICE_CAT_LABELS[cat] ?? cat });
      });
    });
    return list;
  }, [siteContent.priceList]);

  // Mağaza ürünlerini dinamik olarak oluştur
  const urunOptions = useMemo(() => {
    return siteContent.storeProducts.map(p => ({ name: p.name, price: Number(p.price) }));
  }, [siteContent.storeProducts]);

  // Form state
  const [customerName, setCustomerName] = useState("");
  const [staff, setStaff] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"nakit" | "kart" | "havale">("nakit");
  const [discount, setDiscount] = useState(0);
  const [note, setNote] = useState("");
  const [items, setItems] = useState<AdisyonItem[]>([]);
  const [itemType, setItemType] = useState<"hizmet" | "urun">("hizmet");
  const [selectedItem, setSelectedItem] = useState(() => hizmetOptions[0]?.name ?? "");
  const [itemQty, setItemQty] = useState(1);

  const options = itemType === "hizmet" ? hizmetOptions : urunOptions;

  const addItem = () => {
    const opt = options.find(o => o.name === selectedItem);
    if (!opt) return;
    const existing = items.find(i => i.name === opt.name && i.type === itemType);
    if (existing) {
      setItems(prev => prev.map(i =>
        i.id === existing.id
          ? { ...i, quantity: i.quantity + itemQty, total: (i.quantity + itemQty) * i.unitPrice }
          : i
      ));
    } else {
      setItems(prev => [...prev, {
        id: uid(), type: itemType, name: opt.name, quantity: itemQty, unitPrice: opt.price, total: itemQty * opt.price
      }]);
    }
  };

  const removeItem = (id: string) => setItems(prev => prev.filter(i => i.id !== id));

  const subtotal = items.reduce((s, i) => s + i.total, 0);
  const total = Math.max(0, subtotal - discount);

  const handleSubmit = (closeNow: boolean) => {
    if (!customerName.trim() || items.length === 0) return;
    addAdisyon({ customerName, staff, items, subtotal, discount, total, paymentMethod, note, status: closeNow ? "kapali" : "acik" });
    setCustomerName(""); setStaff("Gülcan K."); setDiscount(0); setNote(""); setItems([]); setShowForm(false);
  };

  const sorted = [...adisyonlar].reverse();

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{adisyonlar.length} adisyon kayıtlı</p>
        <Button size="sm" className="gap-2" style={{ background: PALETTE.rose }} onClick={() => setShowForm(s => !s)}>
          <Plus className="w-4 h-4" /> Yeni Adisyon
        </Button>
      </div>

      {/* New adisyon form */}
      {showForm && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-4" data-testid="adisyon-form">
          <h3 className="font-semibold text-sm uppercase tracking-wider" style={{ color: PALETTE.softPink }}>Yeni Adisyon Oluştur</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Müşteri Adı</label>
              <Input data-testid="input-customer" placeholder="Ad Soyad" value={customerName} onChange={e => setCustomerName(e.target.value)} className="bg-background border-border" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Uzman</label>
              <Select value={staff} onValueChange={setStaff}>
                <SelectTrigger className="bg-background border-border">
                  <SelectValue placeholder="Uzman seçin" />
                </SelectTrigger>
                <SelectContent>
                  {siteContent.staffMembers.map(s => (
                    <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Ödeme Yöntemi</label>
              <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as "nakit" | "kart" | "havale")}>
                <SelectTrigger className="bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nakit">Nakit</SelectItem>
                  <SelectItem value="kart">Kart</SelectItem>
                  <SelectItem value="havale">Havale / EFT</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Add items row */}
          <div className="border border-border rounded-lg p-3 space-y-3">
            <p className="text-xs text-muted-foreground font-medium">Hizmet / Ürün Ekle</p>
            <div className="flex flex-wrap gap-2 items-end">
              <div>
                <Select value={itemType} onValueChange={(v) => {
                  const t = v as "hizmet" | "urun";
                  setItemType(t);
                  setSelectedItem(t === "hizmet" ? (hizmetOptions[0]?.name ?? "") : (urunOptions[0]?.name ?? ""));
                }}>
                  <SelectTrigger className="bg-background border-border w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hizmet">Hizmet</SelectItem>
                    <SelectItem value="urun">Ürün</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 min-w-40">
                {options.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2 px-3 border border-border rounded-md bg-background">
                    {itemType === "hizmet" ? "Fiyat listesine hizmet ekleyin" : "Mağazaya ürün ekleyin"}
                  </p>
                ) : (
                  <Select value={selectedItem} onValueChange={setSelectedItem}>
                    <SelectTrigger className="bg-background border-border">
                      <SelectValue placeholder="Seçin..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 overflow-y-auto">
                      {itemType === "hizmet" ? (
                        // Kategori bazlı gruplandırma
                        (Object.keys(PRICE_CAT_LABELS) as string[]).map(catKey => {
                          const catItems = hizmetOptions.filter(o => o.category === PRICE_CAT_LABELS[catKey]);
                          if (catItems.length === 0) return null;
                          return (
                            <div key={catKey}>
                              <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border/40 mt-1">
                                {PRICE_CAT_LABELS[catKey]}
                              </div>
                              {catItems.map(o => (
                                <SelectItem key={o.name} value={o.name}>{o.name} — {fmt(o.price)}</SelectItem>
                              ))}
                            </div>
                          );
                        })
                      ) : (
                        urunOptions.map(o => (
                          <SelectItem key={o.name} value={o.name}>{o.name} — {fmt(o.price)}</SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="w-20">
                <Input type="number" min={1} value={itemQty} onChange={e => setItemQty(Math.max(1, Number(e.target.value)))} className="bg-background border-border" />
              </div>
              <Button size="sm" variant="outline" onClick={addItem} data-testid="btn-add-item">
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {items.length > 0 && (
              <div className="mt-2 space-y-1">
                {items.map(item => (
                  <div key={item.id} className="flex items-center justify-between text-sm py-1 border-b border-border/40 last:border-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">{item.type === "hizmet" ? "Hizmet" : "Ürün"}</Badge>
                      <span>{item.name}</span>
                      <span className="text-muted-foreground">x{item.quantity}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{fmt(item.total)}</span>
                      <button onClick={() => removeItem(item.id)} className="text-muted-foreground hover:text-destructive">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">İndirim (TL)</label>
              <Input type="number" min={0} value={discount} onChange={e => setDiscount(Number(e.target.value))} className="bg-background border-border" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Not</label>
              <Input placeholder="Opsiyonel not..." value={note} onChange={e => setNote(e.target.value)} className="bg-background border-border" />
            </div>
          </div>

          {items.length > 0 && (
            <div className="flex justify-between items-center pt-2 border-t border-border">
              <div className="text-sm space-y-0.5">
                <p className="text-muted-foreground">Ara Toplam: <span className="text-foreground font-medium">{fmt(subtotal)}</span></p>
                {discount > 0 && <p className="text-muted-foreground">İndirim: <span style={{ color: PALETTE.red }}>-{fmt(discount)}</span></p>}
                <p className="font-bold text-base">Toplam: <span style={{ color: PALETTE.rose }}>{fmt(total)}</span></p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleSubmit(false)} data-testid="btn-save-open">Açık Bırak</Button>
                <Button size="sm" onClick={() => handleSubmit(true)} data-testid="btn-close-adisyon" style={{ background: PALETTE.rose }}>
                  <CheckCircle className="w-4 h-4 mr-1" /> Kapat & Kaydet
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Adisyon list */}
      <div className="space-y-2">
        {sorted.length === 0 && (
          <p className="text-center text-muted-foreground py-10 text-sm">Henüz adisyon yok.</p>
        )}
        {sorted.map(a => (
          <div key={a.id} className="border border-border rounded-xl overflow-hidden">
            <div
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-background/50 transition-colors"
              onClick={() => setExpandedId(expandedId === a.id ? null : a.id)}
              data-testid={`adisyon-row-${a.id}`}
            >
              <div className="flex items-center gap-3">
                <Badge
                  className="text-xs"
                  style={a.status === "kapali"
                    ? { background: PALETTE.green + "22", color: PALETTE.green, border: "1px solid " + PALETTE.green + "44" }
                    : { background: PALETTE.caramel + "22", color: PALETTE.caramel, border: "1px solid " + PALETTE.caramel + "44" }}
                >
                  {a.status === "kapali" ? "Kapalı" : "Açık"}
                </Badge>
                <div>
                  <p className="font-medium text-sm">{a.customerName}</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(a.date), "dd MMM yyyy HH:mm", { locale: tr })} — {a.staff}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold" style={{ color: PALETTE.rose }}>{fmt(a.total)}</span>
                {expandedId === a.id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
              </div>
            </div>

            {expandedId === a.id && (
              <div className="border-t border-border p-4 bg-background/30 space-y-3">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tür</TableHead>
                      <TableHead>İsim</TableHead>
                      <TableHead className="text-center">Adet</TableHead>
                      <TableHead className="text-right">Birim Fiyat</TableHead>
                      <TableHead className="text-right">Toplam</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {a.items.map(item => (
                      <TableRow key={item.id}>
                        <TableCell><Badge variant="outline" className="text-xs">{item.type === "hizmet" ? "Hizmet" : "Ürün"}</Badge></TableCell>
                        <TableCell>{item.name}</TableCell>
                        <TableCell className="text-center">{item.quantity}</TableCell>
                        <TableCell className="text-right">{fmt(item.unitPrice)}</TableCell>
                        <TableCell className="text-right font-medium">{fmt(item.total)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="flex items-center justify-between pt-2">
                  <div className="text-sm space-y-0.5">
                    {a.discount > 0 && <p className="text-muted-foreground text-xs">İndirim: -{fmt(a.discount)}</p>}
                    <p className="text-xs text-muted-foreground">Ödeme: <span className="capitalize text-foreground">{a.paymentMethod}</span></p>
                    {a.note && <p className="text-xs text-muted-foreground">Not: {a.note}</p>}
                  </div>
                  <div className="flex gap-2">
                    {a.status === "acik" && (
                      <Button size="sm" style={{ background: PALETTE.rose }} onClick={() => updateAdisyon(a.id, { status: "kapali" })}>
                        <CheckCircle className="w-3 h-3 mr-1" /> Kapat
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => { if (confirm("Silinsin mi?")) deleteAdisyon(a.id); }}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Gelir-Gider Tab ─────────────────────────────────────────────────────────
function GelirGiderTab() {
  const { transactions, addTransaction, deleteTransaction } = useStore();
  const [type, setType] = useState<"gelir" | "gider">("gelir");
  const [category, setCategory] = useState(GELIR_KATEGORILERI[1]);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"nakit" | "kart" | "havale">("nakit");
  const [filterType, setFilterType] = useState<"tumu" | "gelir" | "gider">("tumu");

  const categories = type === "gelir" ? GELIR_KATEGORILERI : GIDER_KATEGORILERI;

  const handleAdd = () => {
    const amountNum = parseFloat(amount);
    if (!description.trim() || isNaN(amountNum) || amountNum <= 0) return;
    addTransaction({ type, category, description, amount: amountNum, paymentMethod });
    setDescription(""); setAmount("");
  };

  const filtered = [...transactions]
    .filter(t => filterType === "tumu" || t.type === filterType)
    .reverse();

  const totalGelir = transactions.filter(t => t.type === "gelir").reduce((s, t) => s + t.amount, 0);
  const totalGider = transactions.filter(t => t.type === "gider").reduce((s, t) => s + t.amount, 0);

  return (
    <div className="space-y-5">
      {/* Quick summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card border border-border rounded-xl p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">Gelir</p>
          <p className="font-bold text-sm" style={{ color: PALETTE.green }}>{fmt(totalGelir)}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">Gider</p>
          <p className="font-bold text-sm" style={{ color: PALETTE.red }}>{fmt(totalGider)}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">Net</p>
          <p className="font-bold text-sm" style={{ color: totalGelir - totalGider >= 0 ? PALETTE.green : PALETTE.red }}>{fmt(totalGelir - totalGider)}</p>
        </div>
      </div>

      {/* Add transaction form */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: PALETTE.softPink }}>Yeni Kayıt Ekle</h3>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={type === "gelir" ? "default" : "outline"}
            onClick={() => { setType("gelir"); setCategory(GELIR_KATEGORILERI[1]); }}
            data-testid="btn-type-gelir"
            style={type === "gelir" ? { background: PALETTE.green } : {}}
          >
            Gelir
          </Button>
          <Button
            size="sm"
            variant={type === "gider" ? "default" : "outline"}
            onClick={() => { setType("gider"); setCategory(GIDER_KATEGORILERI[0]); }}
            data-testid="btn-type-gider"
            style={type === "gider" ? { background: PALETTE.red } : {}}
          >
            Gider
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Kategori</label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="bg-background border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-1">
            <label className="text-xs text-muted-foreground mb-1 block">Açıklama</label>
            <Input data-testid="input-description" placeholder="Açıklama..." value={description} onChange={e => setDescription(e.target.value)} className="bg-background border-border" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Tutar (TL)</label>
            <Input data-testid="input-amount" type="number" min={0} placeholder="0" value={amount} onChange={e => setAmount(e.target.value)} className="bg-background border-border" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Ödeme</label>
            <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as "nakit" | "kart" | "havale")}>
              <SelectTrigger className="bg-background border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nakit">Nakit</SelectItem>
                <SelectItem value="kart">Kart</SelectItem>
                <SelectItem value="havale">Havale</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button size="sm" onClick={handleAdd} data-testid="btn-add-transaction" style={{ background: type === "gelir" ? PALETTE.green : PALETTE.red }}>
          <Plus className="w-4 h-4 mr-1" /> Ekle
        </Button>
      </div>

      {/* Filter + table */}
      <div className="space-y-3">
        <div className="flex gap-2">
          {(["tumu", "gelir", "gider"] as const).map(f => (
            <Button key={f} size="sm" variant={filterType === f ? "default" : "outline"} onClick={() => setFilterType(f)}
              style={filterType === f ? { background: PALETTE.rose } : {}}>
              {f === "tumu" ? "Tümü" : f.charAt(0).toUpperCase() + f.slice(1)} ({
                f === "tumu" ? transactions.length : transactions.filter(t => t.type === f).length
              })
            </Button>
          ))}
        </div>

        <div className="border border-border rounded-xl overflow-hidden">
          <Table>
            <TableHeader className="bg-background">
              <TableRow>
                <TableHead>Tarih</TableHead>
                <TableHead>Tür</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Açıklama</TableHead>
                <TableHead>Ödeme</TableHead>
                <TableHead className="text-right">Tutar</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Kayıt bulunamadı.</TableCell></TableRow>
              ) : (
                filtered.map((t: Transaction) => (
                  <TableRow key={t.id} data-testid={`transaction-row-${t.id}`}>
                    <TableCell className="text-xs whitespace-nowrap">{format(new Date(t.date), "dd MMM HH:mm", { locale: tr })}</TableCell>
                    <TableCell>
                      <Badge className="text-xs" style={t.type === "gelir"
                        ? { background: PALETTE.green + "22", color: PALETTE.green, border: "1px solid " + PALETTE.green + "44" }
                        : { background: PALETTE.red + "22", color: PALETTE.red, border: "1px solid " + PALETTE.red + "44" }}>
                        {t.type === "gelir" ? "Gelir" : "Gider"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{t.category}</TableCell>
                    <TableCell className="text-sm max-w-xs truncate">{t.description}</TableCell>
                    <TableCell className="text-sm capitalize">{t.paymentMethod}</TableCell>
                    <TableCell className="text-right font-bold text-sm" style={{ color: t.type === "gelir" ? PALETTE.green : PALETTE.red }}>
                      {t.type === "gelir" ? "+" : "-"}{fmt(t.amount)}
                    </TableCell>
                    <TableCell>
                      <button onClick={() => { if (confirm("Silinsin mi?")) deleteTransaction(t.id); }} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

// ─── Stok/Ürün Analizi Tab ───────────────────────────────────────────────────
function UrunAnalizTab() {
  const { adisyonlar, orders } = useStore();

  const productStats = useMemo(() => {
    const map: Record<string, { name: string; count: number; total: number; source: string }> = {};

    adisyonlar.forEach(a => {
      a.items.filter(i => i.type === "urun").forEach(i => {
        if (!map[i.name]) map[i.name] = { name: i.name, count: 0, total: 0, source: "Adisyon" };
        map[i.name].count += i.quantity;
        map[i.name].total += i.total;
      });
    });

    orders.forEach(o => {
      o.items.forEach(i => {
        const key = i.name + "_order";
        if (!map[key]) map[key] = { name: i.name, count: 0, total: 0, source: "Online" };
        map[key].count += i.quantity;
        map[key].total += i.price * i.quantity;
      });
    });

    return Object.values(map).sort((a, b) => b.count - a.count);
  }, [adisyonlar, orders]);

  const serviceStats = useMemo(() => {
    const map: Record<string, { name: string; count: number; total: number }> = {};
    adisyonlar.forEach(a => {
      a.items.filter(i => i.type === "hizmet").forEach(i => {
        if (!map[i.name]) map[i.name] = { name: i.name, count: 0, total: 0 };
        map[i.name].count += i.quantity;
        map[i.name].total += i.total;
      });
    });
    return Object.values(map).sort((a, b) => b.count - a.count);
  }, [adisyonlar]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Ürün kullanım tablosu */}
        <div>
          <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-3">Ürün Kullanım / Satış</h3>
          <div className="border border-border rounded-xl overflow-hidden">
            <Table>
              <TableHeader className="bg-background">
                <TableRow>
                  <TableHead>Ürün</TableHead>
                  <TableHead>Kaynak</TableHead>
                  <TableHead className="text-center">Adet</TableHead>
                  <TableHead className="text-right">Ciro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productStats.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-6 text-muted-foreground text-sm">Veri yok</TableCell></TableRow>
                ) : (
                  productStats.map((p, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-sm font-medium">{p.name}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{p.source}</Badge></TableCell>
                      <TableCell className="text-center font-bold">{p.count}</TableCell>
                      <TableCell className="text-right" style={{ color: PALETTE.rose }}>{fmt(p.total)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Hizmet analizi */}
        <div>
          <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-3">Hizmet Analizi</h3>
          <div className="border border-border rounded-xl overflow-hidden">
            <Table>
              <TableHeader className="bg-background">
                <TableRow>
                  <TableHead>Hizmet</TableHead>
                  <TableHead className="text-center">Adet</TableHead>
                  <TableHead className="text-right">Ciro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {serviceStats.length === 0 ? (
                  <TableRow><TableCell colSpan={3} className="text-center py-6 text-muted-foreground text-sm">Veri yok</TableCell></TableRow>
                ) : (
                  serviceStats.map((s, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-sm font-medium">{s.name}</TableCell>
                      <TableCell className="text-center font-bold">{s.count}</TableCell>
                      <TableCell className="text-right" style={{ color: PALETTE.rose }}>{fmt(s.total)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Bar chart - ürünler */}
      {productStats.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-4">Ürün Satış Adedi</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={productStats.slice(0, 8)} layout="vertical" margin={{ left: 20, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis type="number" tick={{ fill: "#888", fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fill: "#ccc", fontSize: 11 }} width={120} />
              <Tooltip contentStyle={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: 8 }} />
              <Bar dataKey="count" name="Adet" fill={PALETTE.caramel} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

// ─── Stok Finans Tab ─────────────────────────────────────────────────────────
function StokFinansTab() {
  const { transactions, inventory, stockMovements } = useStore();

  const STOK_GIDER_CATS = ["Ürün Alımı", "Hizmet Malzeme", "Fire / Bozulma", "Stok Çıkışı"];
  const STOK_GELIR_CATS = ["Stok Satışı", "Stok İadesi"];

  const stokTxns = useMemo(
    () => transactions.filter(t => [...STOK_GIDER_CATS, ...STOK_GELIR_CATS].includes(t.category)),
    [transactions]
  );

  const totalAlinan = useMemo(() =>
    transactions.filter(t => t.category === "Ürün Alımı").reduce((s, t) => s + t.amount, 0),
    [transactions]
  );
  const totalSatilan = useMemo(() =>
    transactions.filter(t => t.category === "Stok Satışı" || t.category === "Stok İadesi").reduce((s, t) => s + t.amount, 0),
    [transactions]
  );
  const totalMalzeme = useMemo(() =>
    transactions.filter(t => t.category === "Hizmet Malzeme").reduce((s, t) => s + t.amount, 0),
    [transactions]
  );
  const totalFire = useMemo(() =>
    transactions.filter(t => t.category === "Fire / Bozulma").reduce((s, t) => s + t.amount, 0),
    [transactions]
  );
  const stokGelir = totalSatilan;
  const stokGider = totalAlinan + totalMalzeme + totalFire;
  const stokKar = stokGelir - stokGider;

  // Stock value in hand (cost-based)
  const stokDegeri = useMemo(() =>
    inventory.reduce((s, p) => s + p.stock * p.costPrice, 0),
    [inventory]
  );
  const stokSatisDegeri = useMemo(() =>
    inventory.reduce((s, p) => s + p.stock * p.salePrice, 0),
    [inventory]
  );
  const potansiyelKar = stokSatisDegeri - stokDegeri;

  // Monthly chart data for stock transactions
  const monthlyData = useMemo(() => {
    const result: Record<string, { ay: string; gelir: number; gider: number }> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      result[key] = { ay: format(d, "MMM", { locale: tr }), gelir: 0, gider: 0 };
    }
    stokTxns.forEach(t => {
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (result[key]) {
        if (t.type === "gelir") result[key].gelir += t.amount;
        else result[key].gider += t.amount;
      }
    });
    return Object.values(result);
  }, [stokTxns]);

  // Movement breakdown by type
  const movementSummary = useMemo(() => {
    const giris = stockMovements.filter(m => m.type === "giris");
    const cikis = stockMovements.filter(m => m.type === "cikis");
    const duzeltme = stockMovements.filter(m => m.type === "duzeltme");
    return {
      girisCount: giris.length,
      cikisCount: cikis.length,
      duzeltmeCount: duzeltme.length,
      satirSatis: cikis.filter(m => m.reason === "Satış").length,
      satirHizmet: cikis.filter(m => m.reason === "Hizmet Kullanımı").length,
      satirFire: cikis.filter(m => m.reason === "Fire / Bozulma").length,
    };
  }, [stockMovements]);

  const PIE_COLORS = [PALETTE.rose, PALETTE.caramel, PALETTE.softPink, PALETTE.cream, PALETTE.brown, "#7b68ee"];

  const giderByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    transactions.filter(t => STOK_GIDER_CATS.includes(t.category)).forEach(t => {
      map[t.category] = (map[t.category] || 0) + t.amount;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [transactions]);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Ürün Alım Maliyeti" value={fmt(totalAlinan)} icon={<TrendingDown className="w-5 h-5" />} color={PALETTE.red} />
        <KpiCard label="Stok Satış Geliri" value={fmt(totalSatilan)} icon={<TrendingUp className="w-5 h-5" />} color={PALETTE.green} />
        <KpiCard label="Hizmet Malzeme" value={fmt(totalMalzeme)} icon={<TrendingDown className="w-5 h-5" />} color={PALETTE.caramel} />
        <KpiCard
          label="Stok Net Kar/Zarar"
          value={fmt(stokKar)}
          icon={<Wallet className="w-5 h-5" />}
          color={stokKar >= 0 ? PALETTE.green : PALETTE.red}
        />
      </div>

      {/* Stok değeri */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-5 space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Mevcut Stok Değeri (Maliyet)</p>
          <p className="text-2xl font-bold" style={{ color: PALETTE.caramel }}>{fmt(stokDegeri)}</p>
          <p className="text-xs text-muted-foreground">Depodaki ürünlerin toplam maliyeti</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Potansiyel Satış Değeri</p>
          <p className="text-2xl font-bold" style={{ color: PALETTE.rose }}>{fmt(stokSatisDegeri)}</p>
          <p className="text-xs text-muted-foreground">Tüm stok satılırsa elde edilecek gelir</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Potansiyel Brüt Kar</p>
          <p className="text-2xl font-bold" style={{ color: potansiyelKar >= 0 ? PALETTE.green : PALETTE.red }}>{fmt(potansiyelKar)}</p>
          <p className="text-xs text-muted-foreground">Satış değeri − maliyet değeri</p>
        </div>
      </div>

      {/* Stok hareket istatistikleri */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[
          { label: "Toplam Giriş", value: movementSummary.girisCount, color: PALETTE.green },
          { label: "Toplam Çıkış", value: movementSummary.cikisCount, color: PALETTE.red },
          { label: "Düzeltme", value: movementSummary.duzeltmeCount, color: PALETTE.caramel },
          { label: "Satış Çıkışı", value: movementSummary.satirSatis, color: PALETTE.rose },
          { label: "Hizmet Kullanımı", value: movementSummary.satirHizmet, color: PALETTE.softPink },
          { label: "Fire / Bozulma", value: movementSummary.satirFire, color: PALETTE.brown },
        ].map(stat => (
          <div key={stat.label} className="bg-card border border-border rounded-xl p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
            <p className="text-xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Monthly chart */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">Son 6 Ay — Stok Gelir / Gider</h3>
        {monthlyData.some(d => d.gelir > 0 || d.gider > 0) ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="ay" tick={{ fill: "#888", fontSize: 12 }} />
              <YAxis tick={{ fill: "#888", fontSize: 11 }} tickFormatter={v => v >= 1000 ? (v / 1000).toFixed(0) + "k" : v} />
              <Tooltip formatter={(val: number) => fmt(val)} contentStyle={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: 8 }} />
              <Bar dataKey="gelir" name="Stok Geliri" fill={PALETTE.green} radius={[4, 4, 0, 0]} />
              <Bar dataKey="gider" name="Stok Gideri" fill={PALETTE.rose} radius={[4, 4, 0, 0]} />
              <Legend formatter={(val) => <span style={{ color: "#ccc", fontSize: 12 }}>{val}</span>} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-center text-muted-foreground py-10 text-sm">Henüz stok hareketi kayıtlı değil.</p>
        )}
      </div>

      {/* Gider dağılımı */}
      {giderByCategory.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">Stok Gider Dağılımı</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={giderByCategory} cx="50%" cy="50%" outerRadius={70} dataKey="value" nameKey="name"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                {giderByCategory.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(val: number) => fmt(val)} contentStyle={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent stock transactions */}
      {stokTxns.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">Son Stok İşlemleri</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {[...stokTxns].reverse().slice(0, 30).map(t => (
              <div key={t.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{
                      background: t.type === "gelir" ? PALETTE.green + "22" : PALETTE.red + "22",
                      color: t.type === "gelir" ? PALETTE.green : PALETTE.red,
                    }}>
                    {t.type === "gelir" ? "Gelir" : "Gider"}
                  </span>
                  <div>
                    <p className="text-sm font-medium">{t.category}</p>
                    <p className="text-xs text-muted-foreground">{t.description}</p>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <p className="text-sm font-bold" style={{ color: t.type === "gelir" ? PALETTE.green : PALETTE.red }}>
                    {t.type === "gelir" ? "+" : "-"}{fmt(t.amount)}
                  </p>
                  <p className="text-xs text-muted-foreground">{format(new Date(t.date), "d MMM HH:mm", { locale: tr })}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export function AdminFinance() {
  return (
    <Tabs defaultValue="ozet" className="w-full">
      <TabsList className="mb-6 grid w-full grid-cols-5 bg-background border border-border rounded-lg p-1">
        <TabsTrigger value="ozet" className="text-xs md:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Özet</TabsTrigger>
        <TabsTrigger value="adisyon" className="text-xs md:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Adisyon</TabsTrigger>
        <TabsTrigger value="gelir-gider" className="text-xs md:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Gelir / Gider</TabsTrigger>
        <TabsTrigger value="urun" className="text-xs md:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Ürün Analizi</TabsTrigger>
        <TabsTrigger value="stok" className="text-xs md:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">📦 Stok Finans</TabsTrigger>
      </TabsList>
      <TabsContent value="ozet"><OzetTab /></TabsContent>
      <TabsContent value="adisyon"><AdisyonTab /></TabsContent>
      <TabsContent value="gelir-gider"><GelirGiderTab /></TabsContent>
      <TabsContent value="urun"><UrunAnalizTab /></TabsContent>
      <TabsContent value="stok"><StokFinansTab /></TabsContent>
    </Tabs>
  );
}

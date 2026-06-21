import { useState, useRef, useEffect, useCallback } from "react";
import { useStore, InventoryProduct, StockMovement } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import {
  Scan, Plus, Minus, Package, Edit2, Trash2, AlertTriangle, CheckCircle2, ArrowDownToLine, ArrowUpFromLine, SlidersHorizontal, X, Save, History
} from "lucide-react";

const CATEGORIES = ["Saç Bakım", "Cilt Bakım", "Tırnak", "Makyaj", "Ağda", "Temizlik", "Diğer"];
const UNITS = ["Adet", "Şişe", "Kutu", "Paket", "Lt", "ml", "gr", "kg"];
const MOVEMENT_REASONS = {
  giris: ["Satın Alım", "İade", "Sayım Düzeltme", "Diğer"],
  cikis: ["Satış", "Hizmet Kullanımı", "Fire / Bozulma", "Diğer"],
  duzeltme: ["Stok Sayımı", "Sistem Düzeltme", "Diğer"],
};

const ROSE = "#b84d5b";
const CARAMEL = "#bd8c74";
const GREEN = "#4caf7d";
const RED = "#e05c5c";
const SOFT_PINK = "#e8a5b2";

function fmt(n: number) { return n.toLocaleString("tr-TR") + " TL"; }

// ─── Barcode Scanner Zone ─────────────────────────────────────────────────────
//
// Hardware scanners act like keyboards: they type very fast then press Enter.
// We detect "scanner speed" via a global keydown listener (chars arriving < 60ms apart).
// When a form is open (disabled=true) the global listener is off so the scanner
// types naturally into whichever form field is focused (e.g. the barcode field).
//
function ScannerZone({ onScan, disabled }: { onScan: (code: string) => void; disabled?: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const [scanning, setScanning] = useState(false);   // visual indicator while scanner is sending chars

  const bufferRef = useRef("");
  const lastKeyTimeRef = useRef(0);
  const scanTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Global hardware-scanner listener ────────────────────────────────────────
  // Only active when no form is open (disabled=false).
  // Detects chars arriving faster than human typing (< 60 ms apart) = scanner.
  // Ignores keystrokes when any INPUT / TEXTAREA / SELECT other than our own is focused.
  useEffect(() => {
    if (disabled) return;

    const SCANNER_GAP_MS = 60;   // scanner chars arrive < 60 ms apart
    const MIN_LEN = 3;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const tag = target.tagName;
      const isOtherInput =
        (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") &&
        target !== inputRef.current;

      // Let the focused form field handle its own keystrokes
      if (isOtherInput) return;

      const now = Date.now();
      const gap = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      // If gap is too large this is human typing — reset buffer
      if (gap > 200 && bufferRef.current) {
        bufferRef.current = "";
        setScanning(false);
      }

      if (e.key === "Enter") {
        const code = bufferRef.current.trim() || value.trim();
        if (code.length >= MIN_LEN) {
          onScan(code);
          bufferRef.current = "";
          setValue("");
          setScanning(false);
          if (scanTimerRef.current) clearTimeout(scanTimerRef.current);
          e.preventDefault();
        }
        return;
      }

      // Only accumulate single printable chars from scanner speed bursts
      if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        if (target !== inputRef.current) {
          // Global capture — only if scanner speed
          if (gap <= SCANNER_GAP_MS || bufferRef.current.length > 0) {
            bufferRef.current += e.key;
            setScanning(true);
            if (scanTimerRef.current) clearTimeout(scanTimerRef.current);
            // Auto-clear if Enter never comes (scanner malfunction / stray key)
            scanTimerRef.current = setTimeout(() => {
              bufferRef.current = "";
              setScanning(false);
            }, 500);
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (scanTimerRef.current) clearTimeout(scanTimerRef.current);
    };
  }, [disabled, onScan, value]);

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && value.trim()) {
      onScan(value.trim());
      setValue("");
    }
  };

  const statusBadge = () => {
    if (disabled) return <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">Form açık — odak serbest</span>;
    if (scanning) return <span className="text-xs px-2 py-0.5 rounded-full animate-pulse" style={{ background: GREEN + "33", color: GREEN }}>Taranıyor…</span>;
    if (focused) return <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: GREEN + "33", color: GREEN }}>Hazır</span>;
    return <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">Aktif — her yerden okutun</span>;
  };

  return (
    <div
      className={`relative flex flex-col items-center justify-center gap-4 p-6 rounded-2xl border-2 transition-colors ${
        disabled ? "border-dashed border-border/40 bg-card/20 opacity-60" :
        scanning ? "border-primary bg-card" :
        focused ? "border-primary bg-card" :
        "border-dashed border-border bg-card/50 cursor-text"
      }`}
      onClick={() => !disabled && inputRef.current?.focus()}
      data-testid="scanner-zone"
    >
      <div className="absolute top-3 right-3">{statusBadge()}</div>

      <div className="flex items-center gap-4 w-full">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-colors ${scanning ? "animate-pulse" : ""}`}
          style={{ background: ROSE + "22" }}>
          <Scan className="w-6 h-6" style={{ color: ROSE }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">Barkod Okuyucu</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {disabled
              ? "Form açıkken barkod okuyucu doğrudan barkod alanına yazar"
              : "Gerçek barkod okuyucuyu herhangi bir yerde kullanın — ya da aşağıya yazıp Enter'a basın"}
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Input
            ref={inputRef}
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={handleKey}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Barkod..."
            className="bg-background border-border text-center tracking-widest font-mono w-36"
            autoComplete="off"
            disabled={disabled}
            data-testid="input-barcode-scan"
          />
          <Button
            onClick={() => { if (value.trim()) { onScan(value.trim()); setValue(""); } }}
            style={{ background: ROSE }}
            disabled={disabled || !value.trim()}
            data-testid="btn-scan-submit"
          >
            <Scan className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Scanned Product Card ─────────────────────────────────────────────────────
function ScannedCard({
  product,
  onClose,
  onMovement,
}: {
  product: InventoryProduct;
  onClose: () => void;
  onMovement: (type: "giris" | "cikis" | "duzeltme", qty: number, reason: string, note: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<"giris" | "cikis" | "duzeltme">("cikis");
  const [qty, setQty] = useState(1);
  const [reason, setReason] = useState(MOVEMENT_REASONS.cikis[0]);
  const [note, setNote] = useState("");

  const isLow = product.stock <= product.minStock;

  const handleTabChange = (t: string) => {
    const tab = t as "giris" | "cikis" | "duzeltme";
    setActiveTab(tab);
    setReason(MOVEMENT_REASONS[tab][0]);
    setQty(tab === "duzeltme" ? product.stock : 1);
  };

  const handleSubmit = () => {
    onMovement(activeTab, qty, reason, note);
    setQty(activeTab === "duzeltme" ? product.stock : 1);
    setNote("");
  };

  // Calculate expected financial impact for the current movement
  const calcAmount = (): { label: string; amount: number; color: string } | null => {
    if (activeTab === "duzeltme") return null;
    if (activeTab === "giris") {
      const amt = qty * product.costPrice;
      return amt > 0 ? { label: "Gider (maliyet)", amount: amt, color: RED } : null;
    }
    // cikis
    if (reason === "Satış" || reason === "İade") {
      const amt = qty * product.salePrice;
      return amt > 0 ? { label: reason === "İade" ? "Gelir (iade)" : "Gelir (satış)", amount: amt, color: GREEN } : null;
    }
    const amt = qty * product.costPrice;
    return amt > 0 ? { label: "Gider (maliyet)", amount: amt, color: RED } : null;
  };
  const txnPreview = calcAmount();

  return (
    <div className="bg-card border-2 rounded-2xl p-5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200" style={{ borderColor: ROSE + "55" }} data-modal-open="true">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: ROSE + "22" }}>
            <Package className="w-6 h-6" style={{ color: ROSE }} />
          </div>
          <div>
            <p className="font-bold text-lg leading-tight">{product.name}</p>
            <p className="text-xs text-muted-foreground font-mono">{product.barcode} — {product.category}</p>
          </div>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors" data-testid="btn-close-scan">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Stock info row */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-background rounded-xl p-3 text-center border border-border">
          <p className="text-xs text-muted-foreground">Mevcut Stok</p>
          <p className="text-2xl font-bold mt-1" style={{ color: isLow ? RED : GREEN }}>{product.stock}</p>
          <p className="text-xs text-muted-foreground">{product.unit}</p>
        </div>
        <div className="bg-background rounded-xl p-3 text-center border border-border">
          <p className="text-xs text-muted-foreground">Min. Stok</p>
          <p className="text-2xl font-bold mt-1">{product.minStock}</p>
          <p className="text-xs text-muted-foreground">{product.unit}</p>
        </div>
        <div className="bg-background rounded-xl p-3 text-center border border-border">
          <p className="text-xs text-muted-foreground">Maliyet</p>
          <p className="text-base font-bold mt-1" style={{ color: CARAMEL }}>{product.costPrice > 0 ? product.costPrice + " TL" : "—"}</p>
          <p className="text-xs text-muted-foreground">/{product.unit}</p>
        </div>
        <div className="bg-background rounded-xl p-3 text-center border border-border">
          <p className="text-xs text-muted-foreground">Satış Fiyatı</p>
          <p className="text-base font-bold mt-1" style={{ color: CARAMEL }}>{product.salePrice > 0 ? product.salePrice + " TL" : "—"}</p>
          <p className="text-xs text-muted-foreground">/{product.unit}</p>
        </div>
      </div>

      {isLow && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm" style={{ background: RED + "15", color: RED, border: "1px solid " + RED + "30" }}>
          <AlertTriangle className="w-4 h-4 shrink-0" />
          Stok kritik seviyede! Minimum stok sınırının altında.
        </div>
      )}

      {/* Movement tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid grid-cols-3 bg-background border border-border rounded-lg p-1 w-full">
          <TabsTrigger value="cikis" className="text-xs gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <ArrowUpFromLine className="w-3 h-3" /> Çıkış
          </TabsTrigger>
          <TabsTrigger value="giris" className="text-xs gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <ArrowDownToLine className="w-3 h-3" /> Giriş
          </TabsTrigger>
          <TabsTrigger value="duzeltme" className="text-xs gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <SlidersHorizontal className="w-3 h-3" /> Düzeltme
          </TabsTrigger>
        </TabsList>

        {(["giris", "cikis", "duzeltme"] as const).map(tab => (
          <TabsContent key={tab} value={tab} className="space-y-3 mt-3">
            <div className="flex items-center gap-3">
              <p className="text-sm text-muted-foreground shrink-0 w-20">
                {tab === "duzeltme" ? "Yeni Stok" : "Miktar"}
              </p>
              <div className="flex items-center gap-2">
                <Button size="icon" variant="outline" className="h-8 w-8"
                  onClick={() => setQty(q => Math.max(tab === "duzeltme" ? 0 : 1, q - 1))}>
                  <Minus className="w-3 h-3" />
                </Button>
                <Input
                  type="number"
                  min={tab === "duzeltme" ? 0 : 1}
                  value={qty}
                  onChange={e => setQty(Math.max(tab === "duzeltme" ? 0 : 1, Number(e.target.value)))}
                  className="w-20 text-center bg-background border-border font-bold text-lg"
                  data-testid={`input-qty-${tab}`}
                />
                <Button size="icon" variant="outline" className="h-8 w-8"
                  onClick={() => setQty(q => q + 1)}>
                  <Plus className="w-3 h-3" />
                </Button>
                <span className="text-sm text-muted-foreground">{product.unit}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <p className="text-sm text-muted-foreground shrink-0 w-20">Sebep</p>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger className="bg-background border-border flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MOVEMENT_REASONS[tab].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-3">
              <p className="text-sm text-muted-foreground shrink-0 w-20">Not</p>
              <Input
                placeholder="Opsiyonel..."
                value={note}
                onChange={e => setNote(e.target.value)}
                className="bg-background border-border flex-1"
                data-testid={`input-note-${tab}`}
              />
            </div>

            <div className="flex justify-between items-center pt-1 flex-wrap gap-2">
              <div className="flex flex-col gap-0.5">
                <p className="text-sm text-muted-foreground">
                  {tab === "giris" && `Sonraki stok: ${product.stock + qty} ${product.unit}`}
                  {tab === "cikis" && `Sonraki stok: ${Math.max(0, product.stock - qty)} ${product.unit}`}
                  {tab === "duzeltme" && `Fark: ${qty - product.stock >= 0 ? "+" : ""}${qty - product.stock} ${product.unit}`}
                </p>
                {txnPreview && (
                  <p className="text-xs font-semibold" style={{ color: txnPreview.color }}>
                    ↳ {txnPreview.label}: {txnPreview.amount.toLocaleString("tr-TR")} TL finansal kaydı oluşturulacak
                  </p>
                )}
              </div>
              <Button
                onClick={handleSubmit}
                data-testid={`btn-confirm-${tab}`}
                style={{
                  background: tab === "giris" ? GREEN : tab === "cikis" ? ROSE : CARAMEL
                }}
              >
                <CheckCircle2 className="w-4 h-4 mr-1" />
                {tab === "giris" ? "Giriş Yap" : tab === "cikis" ? "Çıkış Yap" : "Düzelt"}
              </Button>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

// ─── Add/Edit Product Form ────────────────────────────────────────────────────
function ProductForm({
  initial,
  onSave,
  onCancel,
  prefillBarcode,
}: {
  initial?: InventoryProduct;
  onSave: (p: Omit<InventoryProduct, "id">) => void;
  onCancel: () => void;
  prefillBarcode?: string;
}) {
  const [barcode, setBarcode] = useState(initial?.barcode ?? prefillBarcode ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  const [category, setCategory] = useState(initial?.category ?? CATEGORIES[0]);
  const [unit, setUnit] = useState(initial?.unit ?? UNITS[0]);
  const [costPrice, setCostPrice] = useState(String(initial?.costPrice ?? ""));
  const [salePrice, setSalePrice] = useState(String(initial?.salePrice ?? ""));
  const [stock, setStock] = useState(String(initial?.stock ?? "0"));
  const [minStock, setMinStock] = useState(String(initial?.minStock ?? "3"));
  const [note, setNote] = useState(initial?.note ?? "");

  const handleSave = () => {
    if (!barcode.trim() || !name.trim()) return;
    onSave({
      barcode: barcode.trim(),
      name: name.trim(),
      category,
      unit,
      costPrice: Number(costPrice) || 0,
      salePrice: Number(salePrice) || 0,
      stock: Number(stock) || 0,
      minStock: Number(minStock) || 0,
      note,
    });
  };

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-4" data-testid="product-form">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm uppercase tracking-wider" style={{ color: SOFT_PINK }}>
          {initial ? "Ürünü Düzenle" : "Yeni Ürün Ekle"}
        </h3>
        <button onClick={onCancel} className="text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Barkod *</label>
          <Input value={barcode} onChange={e => setBarcode(e.target.value)} placeholder="Barkod numarası" className="bg-background border-border font-mono" data-testid="input-product-barcode" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Ürün Adı *</label>
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ürün adı" className="bg-background border-border" data-testid="input-product-name" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Kategori</label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
            <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Birim</label>
          <Select value={unit} onValueChange={setUnit}>
            <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
            <SelectContent>{UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Maliyet Fiyatı (TL)</label>
          <Input type="number" min={0} value={costPrice} onChange={e => setCostPrice(e.target.value)} placeholder="0" className="bg-background border-border" data-testid="input-cost-price" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Satış Fiyatı (TL)</label>
          <Input type="number" min={0} value={salePrice} onChange={e => setSalePrice(e.target.value)} placeholder="0" className="bg-background border-border" data-testid="input-sale-price" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Başlangıç Stok</label>
          <Input type="number" min={0} value={stock} onChange={e => setStock(e.target.value)} placeholder="0" className="bg-background border-border" data-testid="input-stock" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Minimum Stok (Alarm)</label>
          <Input type="number" min={0} value={minStock} onChange={e => setMinStock(e.target.value)} placeholder="3" className="bg-background border-border" data-testid="input-min-stock" />
        </div>
        <div className="md:col-span-2">
          <label className="text-xs text-muted-foreground mb-1 block">Not</label>
          <Input value={note} onChange={e => setNote(e.target.value)} placeholder="Opsiyonel not..." className="bg-background border-border" />
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <Button variant="outline" onClick={onCancel} className="flex-1">İptal</Button>
        <Button onClick={handleSave} disabled={!barcode.trim() || !name.trim()} className="flex-1" style={{ background: ROSE }} data-testid="btn-save-product">
          <Save className="w-4 h-4 mr-1" />
          {initial ? "Güncelle" : "Ürünü Kaydet"}
        </Button>
      </div>
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export function AdminStock() {
  const {
    inventory, addInventoryProduct, updateInventoryProduct, deleteInventoryProduct,
    stockMovements, addStockMovement,
  } = useStore();

  const [scannedProduct, setScannedProduct] = useState<InventoryProduct | null>(null);
  const [unknownBarcode, setUnknownBarcode] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editProduct, setEditProduct] = useState<InventoryProduct | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [movementFilter, setMovementFilter] = useState<"tumu" | "giris" | "cikis" | "duzeltme">("tumu");
  const [successMsg, setSuccessMsg] = useState("");

  const showSuccess = useCallback((msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 2500);
  }, []);

  const handleScan = useCallback((code: string) => {
    const found = inventory.find(p => p.barcode === code);
    setUnknownBarcode(null);
    if (found) {
      setScannedProduct(found);
      setShowAddForm(false);
      setEditProduct(null);
    } else {
      setScannedProduct(null);
      setUnknownBarcode(code);
    }
  }, [inventory]);

  const handleMovement = useCallback((
    type: "giris" | "cikis" | "duzeltme",
    qty: number,
    reason: string,
    note: string
  ) => {
    if (!scannedProduct) return;
    addStockMovement({
      productId: scannedProduct.id,
      productName: scannedProduct.name,
      barcode: scannedProduct.barcode,
      type, quantity: qty, reason, note,
    });
    // Re-read updated product from inventory after state update
    setScannedProduct(prev => {
      if (!prev) return null;
      let newStock = prev.stock;
      if (type === "giris") newStock += qty;
      else if (type === "cikis") newStock = Math.max(0, newStock - qty);
      else newStock = qty;
      return { ...prev, stock: newStock };
    });
    const labels = { giris: "Giriş", cikis: "Çıkış", duzeltme: "Düzeltme" };
    showSuccess(`${labels[type]} yapıldı: ${scannedProduct.name} (${qty} ${scannedProduct.unit})`);
  }, [scannedProduct, addStockMovement, showSuccess]);

  const lowStockCount = inventory.filter(p => p.stock <= p.minStock).length;

  const filteredInventory = inventory.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.barcode.includes(searchQuery) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredMovements = [...stockMovements]
    .filter(m => movementFilter === "tumu" || m.type === movementFilter)
    .reverse();

  return (
    <div className="space-y-5">
      {/* Success toast */}
      {successMsg && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium animate-in fade-in slide-in-from-top-1"
          style={{ background: GREEN + "22", color: GREEN, border: "1px solid " + GREEN + "44" }}>
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {successMsg}
        </div>
      )}

      {/* Summary row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">Toplam Ürün</p>
          <p className="text-2xl font-bold">{inventory.length}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">Kritik Stok</p>
          <p className="text-2xl font-bold" style={{ color: lowStockCount > 0 ? RED : GREEN }}>{lowStockCount}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">Toplam Hareket</p>
          <p className="text-2xl font-bold">{stockMovements.length}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">Stok Değeri</p>
          <p className="text-lg font-bold" style={{ color: CARAMEL }}>
            {fmt(inventory.reduce((s, p) => s + p.stock * p.costPrice, 0))}
          </p>
        </div>
      </div>

      {/* Scanner zone — disabled when a form is open so scanner types into form fields directly */}
      <ScannerZone onScan={handleScan} disabled={showAddForm || !!editProduct} />

      {/* Unknown barcode: offer to add */}
      {unknownBarcode && !scannedProduct && !showAddForm && !editProduct && (
        <div className="flex items-center justify-between p-4 rounded-xl border" style={{ background: CARAMEL + "11", borderColor: CARAMEL + "44" }}>
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0" style={{ color: CARAMEL }} />
            <div>
              <p className="font-medium text-sm">Barkod tanımsız: <span className="font-mono">{unknownBarcode}</span></p>
              <p className="text-xs text-muted-foreground">Bu barkodla kayıtlı ürün yok. Yeni ürün olarak ekleyebilirsiniz.</p>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button size="sm" style={{ background: ROSE }} onClick={() => setShowAddForm(true)} data-testid="btn-add-unknown">
              <Plus className="w-3 h-3 mr-1" /> Ekle
            </Button>
            <Button size="sm" variant="outline" onClick={() => setUnknownBarcode(null)}>
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>
      )}

      {/* Scanned product card */}
      {scannedProduct && !showAddForm && !editProduct && (
        <ScannedCard
          product={scannedProduct}
          onClose={() => { setScannedProduct(null); }}
          onMovement={handleMovement}
        />
      )}

      {/* Add form (triggered by "Yeni Ürün Ekle" button or unknown barcode) */}
      {showAddForm && !editProduct && (
        <ProductForm
          prefillBarcode={unknownBarcode ?? ""}
          onSave={(p) => {
            addInventoryProduct(p);
            setShowAddForm(false);
            setUnknownBarcode(null);
            showSuccess(`"${p.name}" ürünü eklendi.`);
          }}
          onCancel={() => { setShowAddForm(false); }}
        />
      )}

      {/* Edit form */}
      {editProduct && (
        <ProductForm
          initial={editProduct}
          onSave={(p) => {
            updateInventoryProduct(editProduct.id, p);
            setEditProduct(null);
            if (scannedProduct?.id === editProduct.id) setScannedProduct({ ...editProduct, ...p });
            showSuccess(`"${p.name}" güncellendi.`);
          }}
          onCancel={() => setEditProduct(null)}
        />
      )}

      {/* Tabs: Product list + Movement history */}
      <Tabs defaultValue="urunler">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <TabsList className="bg-background border border-border rounded-lg p-1">
            <TabsTrigger value="urunler" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-1.5">
              <Package className="w-3 h-3" /> Ürün Listesi ({inventory.length})
            </TabsTrigger>
            <TabsTrigger value="hareketler" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-1.5">
              <History className="w-3 h-3" /> Stok Hareketleri ({stockMovements.length})
            </TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            <Input
              placeholder="Ürün / barkod ara..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-background border-border text-sm w-48"
              data-testid="input-product-search"
            />
            {!showAddForm && !editProduct && (
              <Button size="sm" style={{ background: ROSE }} onClick={() => { setShowAddForm(true); setUnknownBarcode(null); setScannedProduct(null); }} data-testid="btn-new-product">
                <Plus className="w-4 h-4 mr-1" /> Ürün Ekle
              </Button>
            )}
          </div>
        </div>

        {/* ── Ürün Listesi ── */}
        <TabsContent value="urunler">
          <div className="border border-border rounded-xl overflow-hidden">
            <Table>
              <TableHeader className="bg-background">
                <TableRow>
                  <TableHead>Barkod</TableHead>
                  <TableHead>Ürün Adı</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead className="text-center">Stok</TableHead>
                  <TableHead className="text-right">Maliyet</TableHead>
                  <TableHead className="text-right">Satış</TableHead>
                  <TableHead className="text-center">Durum</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInventory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                      {inventory.length === 0 ? "Henüz ürün eklenmedi. Barkod okutun veya manuel ekleyin." : "Arama sonucu bulunamadı."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInventory.map(p => {
                    const isLow = p.stock <= p.minStock;
                    return (
                      <TableRow key={p.id} className="cursor-pointer hover:bg-background/50" onClick={() => setScannedProduct(p)} data-testid={`product-row-${p.id}`}>
                        <TableCell className="font-mono text-xs text-muted-foreground">{p.barcode}</TableCell>
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell className="text-sm">{p.category}</TableCell>
                        <TableCell className="text-center">
                          <span className="font-bold" style={{ color: isLow ? RED : GREEN }}>{p.stock}</span>
                          <span className="text-xs text-muted-foreground ml-1">{p.unit}</span>
                        </TableCell>
                        <TableCell className="text-right text-sm">{p.costPrice > 0 ? p.costPrice + " TL" : "—"}</TableCell>
                        <TableCell className="text-right text-sm font-medium" style={{ color: CARAMEL }}>{p.salePrice > 0 ? p.salePrice + " TL" : "—"}</TableCell>
                        <TableCell className="text-center">
                          {isLow ? (
                            <Badge className="text-xs" style={{ background: RED + "22", color: RED, border: "1px solid " + RED + "44" }}>
                              <AlertTriangle className="w-3 h-3 mr-1" />Kritik
                            </Badge>
                          ) : (
                            <Badge className="text-xs" style={{ background: GREEN + "22", color: GREEN, border: "1px solid " + GREEN + "44" }}>
                              Normal
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                            <button
                              onClick={() => { setEditProduct(p); setScannedProduct(null); setShowAddForm(false); }}
                              className="p-1.5 rounded hover:bg-background text-muted-foreground hover:text-foreground transition-colors"
                              data-testid={`btn-edit-${p.id}`}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => { if (confirm(`"${p.name}" silinsin mi?`)) deleteInventoryProduct(p.id); }}
                              className="p-1.5 rounded hover:bg-background text-muted-foreground hover:text-destructive transition-colors"
                              data-testid={`btn-delete-${p.id}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* ── Stok Hareketleri ── */}
        <TabsContent value="hareketler">
          <div className="flex gap-2 mb-3">
            {(["tumu", "giris", "cikis", "duzeltme"] as const).map(f => (
              <Button key={f} size="sm" variant={movementFilter === f ? "default" : "outline"}
                onClick={() => setMovementFilter(f)}
                style={movementFilter === f ? { background: ROSE } : {}}>
                {f === "tumu" ? "Tümü" : f === "giris" ? "Giriş" : f === "cikis" ? "Çıkış" : "Düzeltme"}
                {" "}({f === "tumu" ? stockMovements.length : stockMovements.filter(m => m.type === f).length})
              </Button>
            ))}
          </div>

          <div className="border border-border rounded-xl overflow-hidden">
            <Table>
              <TableHeader className="bg-background">
                <TableRow>
                  <TableHead>Tarih</TableHead>
                  <TableHead>Barkod</TableHead>
                  <TableHead>Ürün</TableHead>
                  <TableHead className="text-center">İşlem</TableHead>
                  <TableHead className="text-center">Miktar</TableHead>
                  <TableHead>Sebep</TableHead>
                  <TableHead className="text-center">Sonraki Stok</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMovements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                      Henüz stok hareketi yok.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMovements.map((m: StockMovement) => (
                    <TableRow key={m.id} data-testid={`movement-row-${m.id}`}>
                      <TableCell className="text-xs whitespace-nowrap">{format(new Date(m.date), "dd MMM HH:mm", { locale: tr })}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{m.barcode}</TableCell>
                      <TableCell className="text-sm font-medium">{m.productName}</TableCell>
                      <TableCell className="text-center">
                        <Badge className="text-xs" style={
                          m.type === "giris"
                            ? { background: GREEN + "22", color: GREEN, border: "1px solid " + GREEN + "44" }
                            : m.type === "cikis"
                            ? { background: RED + "22", color: RED, border: "1px solid " + RED + "44" }
                            : { background: CARAMEL + "22", color: CARAMEL, border: "1px solid " + CARAMEL + "44" }
                        }>
                          {m.type === "giris" ? (
                            <><ArrowDownToLine className="w-3 h-3 mr-1 inline" />Giriş</>
                          ) : m.type === "cikis" ? (
                            <><ArrowUpFromLine className="w-3 h-3 mr-1 inline" />Çıkış</>
                          ) : (
                            <><SlidersHorizontal className="w-3 h-3 mr-1 inline" />Düzeltme</>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center font-bold">
                        <span style={{ color: m.type === "giris" ? GREEN : m.type === "cikis" ? RED : CARAMEL }}>
                          {m.type === "giris" ? "+" : m.type === "cikis" ? "-" : "→"}{m.quantity}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">{m.reason}{m.note ? ` — ${m.note}` : ""}</TableCell>
                      <TableCell className="text-center font-medium">{m.stockAfter}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

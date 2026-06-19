import { useState, useRef, useEffect, Component } from "react";
import type { ReactNode } from "react";
import { useStore } from "@/lib/store";
import type { StaffMember, ContactInfo, PriceList, StaffRole } from "@/lib/store";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Edit2, Upload, Link as LinkIcon, Star, MapPin, Phone, Instagram, MessageCircle, Clock, Facebook, KeyRound, UserPlus, ShieldCheck, MessageSquare, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

type SmsNotification = {
  id: number;
  to: string;
  recipientName: string;
  message: string;
  type: string;
  appointmentId: number | null;
  status: string;
  createdAt: string;
};

function SmsLog() {
  const [logs, setLogs] = useState<SmsNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/sms-notifications")
      .then(r => r.json())
      .then(data => { setLogs(Array.isArray(data) ? data : []); })
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, []);

  const statusIcon = (status: string) => {
    if (status === "sent") return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    if (status.startsWith("failed")) return <AlertCircle className="w-4 h-4 text-destructive" />;
    return <MessageSquare className="w-4 h-4 text-muted-foreground" />;
  };

  const statusLabel = (status: string) => {
    if (status === "sent") return <span className="text-green-600 font-medium text-xs">Gönderildi</span>;
    if (status.startsWith("failed")) return <span className="text-destructive font-medium text-xs">Başarısız</span>;
    return <span className="text-muted-foreground text-xs">Simüle</span>;
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-lg flex items-center gap-2"><MessageSquare className="w-5 h-5 text-primary" /> SMS Bildirimleri</h3>
          <p className="text-sm text-muted-foreground mt-1">Randevu alındığında personele gönderilen SMS kayıtları.</p>
        </div>
        <button
          onClick={() => { setLoading(true); fetch("/api/sms-notifications").then(r => r.json()).then(d => setLogs(Array.isArray(d) ? d : [])).finally(() => setLoading(false)); }}
          className="text-xs text-primary hover:underline"
        >
          Yenile
        </button>
      </div>

      <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl text-xs text-muted-foreground space-y-1">
        <p className="font-medium text-foreground">📡 Netgsm entegrasyonu</p>
        <p>Gerçek SMS göndermek için <code className="bg-muted px-1 rounded">NETGSM_USERNAME</code> ve <code className="bg-muted px-1 rounded">NETGSM_PASSWORD</code> ortam değişkenlerini ekleyin. Eklenene kadar SMS'ler burada "Simüle" olarak görünür.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
          <Loader2 className="w-5 h-5 animate-spin" /> Yükleniyor...
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-xl">
          <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm">Henüz SMS kaydı yok.</p>
          <p className="text-xs mt-1">Bir randevu alındığında burada görünecek.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map(log => (
            <div key={log.id} className="p-4 border border-border rounded-xl bg-background space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  {statusIcon(log.status)}
                  <div>
                    <p className="font-medium text-sm">{log.recipientName}</p>
                    <p className="text-xs text-muted-foreground">{log.to}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {statusLabel(log.status)}
                  <span className="text-[10px] text-muted-foreground/60">
                    {new Date(log.createdAt).toLocaleString("tr-TR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground/80 bg-muted/40 rounded-lg p-2 whitespace-pre-wrap">{log.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

class ErrorBoundary extends Component<{ children: ReactNode }, { error: string | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(err: unknown) {
    return { error: err instanceof Error ? err.message : "Bilinmeyen hata" };
  }
  render() {
    if (this.state.error) {
      return (
        <div className="p-6 rounded-xl border border-destructive bg-destructive/10 text-destructive text-sm space-y-2">
          <p className="font-semibold">Bir hata oluştu, sayfa yenileyin</p>
          <p className="text-xs opacity-75">{this.state.error}</p>
          <button className="text-xs underline" onClick={() => this.setState({ error: null })}>
            Tekrar dene
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function useImageInput(onResult: (dataUrl: string) => void) {
  const ref = useRef<HTMLInputElement>(null);
  const trigger = () => ref.current?.click();
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) onResult(ev.target.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };
  return { ref, trigger, onChange };
}

function ImageInputField({
  value,
  onChange,
  placeholder,
  previewClass = "w-full h-32 rounded-md bg-cover bg-center",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  previewClass?: string;
}) {
  const upload = useImageInput(onChange);

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          placeholder={placeholder}
          value={value.startsWith("data:") ? "(Yüklenen dosya)" : value}
          onChange={e => onChange(e.target.value)}
          className="flex-1 text-sm"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0 gap-1.5 text-xs"
          onClick={upload.trigger}
          title="Bilgisayardan yükle"
        >
          <Upload className="w-3.5 h-3.5" />
          Dosya
        </Button>
        <input ref={upload.ref} type="file" accept="image/*" className="hidden" onChange={upload.onChange} />
      </div>
      {value && (
        <div className={previewClass} style={{ backgroundImage: `url(${value})`, backgroundSize: "cover" }} />
      )}
    </div>
  );
}

const EMPTY_PRODUCT = { id: "", name: "", description: "", price: "", imageUrl: "" };
const EMPTY_STAFF: Omit<StaffMember, "id"> = { name: "", title: "", experience: "", rating: 5.0, initials: "", tags: [], imageUrl: "" };

const SAC_SUBCATS = ["ombre", "sombre", "kesim", "boyama", "röfle", "keratin", "gelin"];
const PRICE_CAT_LABELS: Record<keyof PriceList, string> = {
  sac: "Saç Hizmetleri", makyaj: "Makyaj", gelin: "Gelin & Özel", manikur: "Manikür & Pedikür", agda: "Ağda",
};

export function AdminContent() {
  const {
    isLoaded,
    siteContent,
    updateSiteContent,
    addStoreProduct, updateStoreProduct, deleteStoreProduct,
    addGalleryItem, deleteGalleryItem,
    addStaffMember, updateStaffMember, deleteStaffMember,
    updatePriceItem, addPriceItem, deletePriceItem,
    staffUsers, addStaffUser, updateStaffUser, deleteStaffUser,
  } = useStore();
  const { toast } = useToast();

  const [heroUrl, setHeroUrl] = useState(siteContent.heroImageUrl);
  const [logoUrl, setLogoUrl] = useState(siteContent.logoImageUrl);
  const heroUpload = useImageInput(setHeroUrl);
  const logoUpload = useImageInput(setLogoUrl);

  // Sync form fields once after API data loads (prevents default values overwriting saved data)
  useEffect(() => {
    if (isLoaded) {
      setHeroUrl(siteContent.heroImageUrl);
      setLogoUrl(siteContent.logoImageUrl);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded]);

  const saveHeroLogo = () => {
    updateSiteContent({ heroImageUrl: heroUrl, logoImageUrl: logoUrl });
    toast({ title: "Başarılı", description: "Görseller güncellendi." });
  };

  const [productForm, setProductForm] = useState(EMPTY_PRODUCT);
  const [showProductForm, setShowProductForm] = useState(false);
  const productImgUpload = useImageInput(v => setProductForm(p => ({ ...p, imageUrl: v })));

  const handleProductSubmit = () => {
    if (!productForm.name || !productForm.price) return;
    if (productForm.id) {
      updateStoreProduct(productForm.id, { ...productForm, price: Number(productForm.price) });
    } else {
      addStoreProduct({ name: productForm.name, description: productForm.description, price: Number(productForm.price), imageUrl: productForm.imageUrl });
    }
    setShowProductForm(false);
    setProductForm(EMPTY_PRODUCT);
    toast({ title: "Başarılı", description: "Ürün kaydedildi." });
  };

  const [galleryForm, setGalleryForm] = useState({ url: "", category: "sac" as "sac" | "tirnak", subcategory: "", label: "" });
  const [galleryFilter, setGalleryFilter] = useState("all");
  const galleryUpload = useImageInput(v => setGalleryForm(f => ({ ...f, url: v })));

  const handleGallerySubmit = () => {
    if (!galleryForm.url) return;
    const sub = galleryForm.subcategory === "_none" ? undefined : (galleryForm.subcategory || undefined);
    addGalleryItem({ url: galleryForm.url, category: galleryForm.category, subcategory: sub, label: galleryForm.label });
    setGalleryForm({ url: "", category: "sac", subcategory: "", label: "" });
    toast({ title: "Başarılı", description: "Görsel eklendi." });
  };

  // Price list editing
  const [priceTab, setPriceTab] = useState<keyof PriceList>("sac");
  const [editingPrice, setEditingPrice] = useState<{ index: number; name: string; price: string } | null>(null);
  const [newPriceItem, setNewPriceItem] = useState({ name: "", price: "" });

  const handleSavePrice = () => {
    if (!editingPrice) return;
    updatePriceItem(priceTab, editingPrice.index, { name: editingPrice.name, price: editingPrice.price });
    setEditingPrice(null);
    toast({ title: "Başarılı", description: "Fiyat güncellendi." });
  };

  const handleAddPrice = () => {
    if (!newPriceItem.name || !newPriceItem.price) return;
    addPriceItem(priceTab, newPriceItem);
    setNewPriceItem({ name: "", price: "" });
    toast({ title: "Başarılı", description: "Fiyat eklendi." });
  };

  // Staff user management
  const [staffUserForm, setStaffUserForm] = useState({ staffMemberId: "", username: "", pin: "", role: "uzman" as StaffRole, phone: "" });
  const [showStaffUserForm, setShowStaffUserForm] = useState(false);
  const [editingStaffUserId, setEditingStaffUserId] = useState<string | null>(null);

  const handleStaffUserSubmit = async () => {
    if (!staffUserForm.username || !staffUserForm.pin || !staffUserForm.staffMemberId) {
      toast({ title: "Hata", description: "Tüm alanları doldurun.", variant: "destructive" });
      return;
    }
    if (staffUserForm.pin.length !== 4 || !/^\d{4}$/.test(staffUserForm.pin)) {
      toast({ title: "Hata", description: "PIN 4 haneli rakam olmalı.", variant: "destructive" });
      return;
    }
    if (editingStaffUserId) {
      updateStaffUser(editingStaffUserId, { ...staffUserForm, name: siteContent.staffMembers.find(s => s.id === staffUserForm.staffMemberId)?.name ?? staffUserForm.username });
      toast({ title: "Başarılı", description: "Hesap güncellendi." });
    } else {
      const staffName = siteContent.staffMembers.find(s => s.id === staffUserForm.staffMemberId)?.name ?? staffUserForm.username;
      const ok = await addStaffUser({ ...staffUserForm, name: staffName });
      if (!ok) {
        toast({ title: "Hata", description: "Bu kullanıcı adı zaten kullanılıyor.", variant: "destructive" });
        return;
      }
      toast({ title: "Başarılı", description: "Personel hesabı oluşturuldu." });
    }
    setStaffUserForm({ staffMemberId: "", username: "", pin: "", role: "uzman", phone: "" });
    setShowStaffUserForm(false);
    setEditingStaffUserId(null);
  };

  const [contactForm, setContactForm] = useState<ContactInfo>({ ...siteContent.contactInfo });

  const saveContact = () => {
    updateSiteContent({ contactInfo: contactForm });
    toast({ title: "Başarılı", description: "İletişim bilgileri güncellendi." });
  };

  const [staffForm, setStaffForm] = useState<Omit<StaffMember, "id"> & { id?: string; tagsInput: string }>({
    ...EMPTY_STAFF,
    tagsInput: "",
  });
  const [showStaffForm, setShowStaffForm] = useState(false);
  const staffImgUpload = useImageInput(v => setStaffForm(s => ({ ...s, imageUrl: v })));

  const openStaffForm = (s?: StaffMember) => {
    if (s) {
      setStaffForm({ ...s, tagsInput: s.tags.join(", ") });
    } else {
      setStaffForm({ ...EMPTY_STAFF, tagsInput: "" });
    }
    setShowStaffForm(true);
  };

  const handleStaffSubmit = () => {
    if (!staffForm.name || !staffForm.title) return;
    const tags = staffForm.tagsInput.split(",").map(t => t.trim()).filter(Boolean);
    const initials = staffForm.initials || staffForm.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
    const payload = { name: staffForm.name, title: staffForm.title, experience: staffForm.experience, rating: Number(staffForm.rating), initials, tags, imageUrl: staffForm.imageUrl };
    if (staffForm.id) {
      updateStaffMember(staffForm.id, payload);
    } else {
      addStaffMember(payload);
    }
    setShowStaffForm(false);
    setStaffForm({ ...EMPTY_STAFF, tagsInput: "" });
    toast({ title: "Başarılı", description: "Personel kaydedildi." });
  };

  return (
    <Tabs defaultValue="hero" className="w-full">
      <TabsList className="mb-6 flex w-full overflow-x-auto gap-1 bg-background border border-border rounded-xl p-1 h-auto">
        <TabsTrigger value="hero" className="text-xs whitespace-nowrap shrink-0 data-[state=active]:bg-primary">Hero & Logo</TabsTrigger>
        <TabsTrigger value="store" className="text-xs whitespace-nowrap shrink-0 data-[state=active]:bg-primary">Mağaza</TabsTrigger>
        <TabsTrigger value="gallery" className="text-xs whitespace-nowrap shrink-0 data-[state=active]:bg-primary">Galeri</TabsTrigger>
        <TabsTrigger value="staff" className="text-xs whitespace-nowrap shrink-0 data-[state=active]:bg-primary">Personel</TabsTrigger>
        <TabsTrigger value="prices" className="text-xs whitespace-nowrap shrink-0 data-[state=active]:bg-primary">Fiyat Listesi</TabsTrigger>
        <TabsTrigger value="accounts" className="text-xs whitespace-nowrap shrink-0 data-[state=active]:bg-primary">Personel Hesapları</TabsTrigger>
        <TabsTrigger value="contact" className="text-xs whitespace-nowrap shrink-0 data-[state=active]:bg-primary">İletişim</TabsTrigger>
        <TabsTrigger value="sms" className="text-xs whitespace-nowrap shrink-0 data-[state=active]:bg-primary">📱 SMS Geçmişi</TabsTrigger>
        <TabsTrigger value="preview" className="text-xs whitespace-nowrap shrink-0 data-[state=active]:bg-primary">Önizleme</TabsTrigger>
      </TabsList>

      {/* ── HERO & LOGO ── */}
      <TabsContent value="hero" className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4 p-5 border border-border rounded-xl bg-background">
            <h3 className="font-semibold">Hero Arka Plan Görseli</h3>
            <div className="flex gap-2">
              <Input
                placeholder="Resim URL'si"
                value={heroUrl.startsWith("data:") ? "(Yüklenen dosya)" : heroUrl}
                onChange={e => setHeroUrl(e.target.value)}
                className="flex-1 text-sm"
              />
              <Button type="button" variant="outline" size="sm" className="shrink-0 gap-1.5 text-xs" onClick={heroUpload.trigger}>
                <Upload className="w-3.5 h-3.5" /> Dosya
              </Button>
              <input ref={heroUpload.ref} type="file" accept="image/*" className="hidden" onChange={heroUpload.onChange} />
            </div>
            {heroUrl && (
              <div className="w-full h-36 rounded-md bg-cover bg-center border border-border" style={{ backgroundImage: `url(${heroUrl})` }} />
            )}
          </div>

          <div className="space-y-4 p-5 border border-border rounded-xl bg-background">
            <h3 className="font-semibold">Logo Görseli</h3>
            <p className="text-xs text-muted-foreground">Boş bırakırsanız "BW" yazısı gösterilir.</p>
            <div className="flex gap-2">
              <Input
                placeholder="Logo URL'si"
                value={logoUrl.startsWith("data:") ? "(Yüklenen dosya)" : logoUrl}
                onChange={e => setLogoUrl(e.target.value)}
                className="flex-1 text-sm"
              />
              <Button type="button" variant="outline" size="sm" className="shrink-0 gap-1.5 text-xs" onClick={logoUpload.trigger}>
                <Upload className="w-3.5 h-3.5" /> Dosya
              </Button>
              <input ref={logoUpload.ref} type="file" accept="image/*" className="hidden" onChange={logoUpload.onChange} />
            </div>
            <div className="w-16 h-16 rounded-full border border-primary/50 flex items-center justify-center bg-card overflow-hidden">
              {logoUrl ? <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" /> : <span className="font-serif font-bold text-primary text-xl">BW</span>}
            </div>
          </div>
        </div>
        <Button onClick={saveHeroLogo} className="bg-[#b84d5b] text-white hover:bg-[#b84d5b]/90">Güncelle</Button>
      </TabsContent>

      {/* ── MAĞAZA ÜRÜNLERİ ── */}
      <TabsContent value="store" className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-lg">Mağaza Ürünleri ({siteContent.storeProducts.length})</h3>
          <Button onClick={() => { setProductForm(EMPTY_PRODUCT); setShowProductForm(true); }} className="gap-2 bg-[#b84d5b] text-white hover:bg-[#b84d5b]/90">
            <Plus className="w-4 h-4" /> Yeni Ürün Ekle
          </Button>
        </div>

        {showProductForm && (
          <div className="p-5 border border-border rounded-xl bg-background space-y-4">
            <h4 className="font-medium text-sm">{productForm.id ? "Ürünü Düzenle" : "Yeni Ürün Ekle"}</h4>
            <div className="grid md:grid-cols-2 gap-4">
              <Input placeholder="Ürün Adı" value={productForm.name} onChange={e => setProductForm(p => ({ ...p, name: e.target.value }))} />
              <Input type="number" placeholder="Fiyat (TL)" value={productForm.price} onChange={e => setProductForm(p => ({ ...p, price: e.target.value }))} />
              <div className="md:col-span-2">
                <Textarea placeholder="Açıklama" value={productForm.description} onChange={e => setProductForm(p => ({ ...p, description: e.target.value }))} />
              </div>
              <div className="md:col-span-2 space-y-2">
                <p className="text-xs text-muted-foreground flex items-center gap-1"><LinkIcon className="w-3 h-3" /> URL girin veya bilgisayardan yükleyin</p>
                <div className="flex gap-2 items-center">
                  <Input
                    placeholder="Ürün görseli URL'si"
                    value={productForm.imageUrl.startsWith("data:") ? "(Yüklenen dosya)" : productForm.imageUrl}
                    onChange={e => setProductForm(p => ({ ...p, imageUrl: e.target.value }))}
                    className="flex-1 text-sm"
                  />
                  <Button type="button" variant="outline" size="sm" className="shrink-0 gap-1.5 text-xs" onClick={productImgUpload.trigger}>
                    <Upload className="w-3.5 h-3.5" /> Dosya
                  </Button>
                  <input ref={productImgUpload.ref} type="file" accept="image/*" className="hidden" onChange={productImgUpload.onChange} />
                  {productForm.imageUrl && (
                    <div
                      className="w-10 h-10 rounded border border-border shrink-0"
                      style={{ background: productForm.imageUrl.startsWith("http") || productForm.imageUrl.startsWith("data:") ? `url(${productForm.imageUrl}) center/cover` : productForm.imageUrl }}
                    />
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleProductSubmit} className="bg-[#b84d5b] text-white">Kaydet</Button>
              <Button variant="outline" onClick={() => setShowProductForm(false)}>İptal</Button>
            </div>
          </div>
        )}

        <div className="grid gap-4">
          {siteContent.storeProducts.map(p => (
            <div key={p.id} className="flex items-center justify-between p-4 border border-border rounded-xl bg-background">
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-md border border-border shrink-0"
                  style={{ background: (p.imageUrl.startsWith("http") || p.imageUrl.startsWith("data:")) ? `url(${p.imageUrl}) center/cover` : p.imageUrl }}
                />
                <div>
                  <h4 className="font-medium">{p.name}</h4>
                  <p className="text-sm text-muted-foreground">{p.price} TL</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="icon" variant="outline" onClick={() => { setProductForm({ id: p.id, name: p.name, description: p.description, price: String(p.price), imageUrl: p.imageUrl }); setShowProductForm(true); }}>
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="outline" className="text-destructive hover:bg-destructive/10" onClick={() => deleteStoreProduct(p.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </TabsContent>

      {/* ── GALERİ ── */}
      <TabsContent value="gallery" className="space-y-6">
      <ErrorBoundary>
        <div className="p-5 border border-border rounded-xl bg-background space-y-4">
          <h4 className="font-medium text-sm">Fotoğraf Ekle</h4>
          <div className="flex gap-3 items-start flex-wrap">
            <div className="flex-1 min-w-[180px] space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Görsel URL'si"
                  value={galleryForm.url.startsWith("data:") ? "(Yüklenen dosya)" : galleryForm.url}
                  onChange={e => setGalleryForm(f => ({ ...f, url: e.target.value }))}
                  className="flex-1 text-sm"
                />
                <Button type="button" variant="outline" size="sm" className="shrink-0 gap-1.5 text-xs" onClick={galleryUpload.trigger}>
                  <Upload className="w-3.5 h-3.5" /> Dosya
                </Button>
                <input ref={galleryUpload.ref} type="file" accept="image/*" className="hidden" onChange={galleryUpload.onChange} />
              </div>
              {galleryForm.url && (
                <div className="w-full h-20 rounded bg-cover bg-center border border-border" style={{ backgroundImage: `url(${galleryForm.url})` }} />
              )}
            </div>
            <div className="w-[140px]">
              <Select value={galleryForm.category} onValueChange={v => setGalleryForm(f => ({ ...f, category: v as "sac" | "tirnak", subcategory: "" }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sac">Saç</SelectItem>
                  <SelectItem value="tirnak">Tırnak</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {galleryForm.category === "sac" && (
              <div className="w-[150px]">
                <Select value={galleryForm.subcategory} onValueChange={v => setGalleryForm(f => ({ ...f, subcategory: v }))}>
                  <SelectTrigger><SelectValue placeholder="Alt kategori" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">Belirtme</SelectItem>
                    {SAC_SUBCATS.map(s => (
                      <SelectItem key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="w-[140px]">
              <Input placeholder="Etiket (Opsiyonel)" value={galleryForm.label} onChange={e => setGalleryForm(f => ({ ...f, label: e.target.value }))} />
            </div>
            <Button onClick={handleGallerySubmit} className="bg-[#b84d5b] text-white">Ekle</Button>
          </div>
        </div>

        <div className="flex gap-2">
          {["all", "sac", "tirnak"].map(f => (
            <Button key={f} size="sm" variant={galleryFilter === f ? "default" : "outline"} onClick={() => setGalleryFilter(f)}>
              {f === "all" ? "Tümü" : f === "sac" ? "Saç" : "Tırnak"}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-4">
          {(siteContent.galleryItems ?? []).filter(i => galleryFilter === "all" || i.category === galleryFilter).map(img => (
            <div key={img.id ?? img.url} className="relative aspect-square rounded-md overflow-hidden group">
              <img src={img.url} alt={img.label ?? ""} className="w-full h-full object-cover" loading="lazy" />
              <button
                className="absolute top-2 right-2 w-8 h-8 bg-black/50 hover:bg-destructive text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => deleteGalleryItem(img.id)}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {(siteContent.galleryItems ?? []).length === 0 && (
            <p className="col-span-full text-xs text-muted-foreground text-center py-8">Henüz fotoğraf eklenmemiş.</p>
          )}
        </div>
      </ErrorBoundary>
      </TabsContent>

      {/* ── PERSONEL ── */}
      <TabsContent value="staff" className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-lg">Personel ({siteContent.staffMembers.length})</h3>
          <Button onClick={() => openStaffForm()} className="gap-2 bg-[#b84d5b] text-white hover:bg-[#b84d5b]/90">
            <Plus className="w-4 h-4" /> Yeni Personel Ekle
          </Button>
        </div>

        {showStaffForm && (
          <div className="p-5 border border-border rounded-xl bg-background space-y-4">
            <h4 className="font-medium text-sm">{staffForm.id ? "Personeli Düzenle" : "Yeni Personel Ekle"}</h4>
            <div className="grid md:grid-cols-2 gap-4">
              <Input placeholder="Ad Soyad" value={staffForm.name} onChange={e => setStaffForm(s => ({ ...s, name: e.target.value }))} />
              <Input placeholder="Unvan (Örn: Saç Uzmanı)" value={staffForm.title} onChange={e => setStaffForm(s => ({ ...s, title: e.target.value }))} />
              <Input placeholder="Deneyim (Örn: 8 yıl deneyim)" value={staffForm.experience} onChange={e => setStaffForm(s => ({ ...s, experience: e.target.value }))} />
              <Input
                type="number" min="1" max="5" step="0.1"
                placeholder="Puan (1-5)"
                value={staffForm.rating}
                onChange={e => setStaffForm(s => ({ ...s, rating: Number(e.target.value) }))}
              />
              <Input placeholder="Baş harfler (Opsiyonel, Örn: GK)" value={staffForm.initials} onChange={e => setStaffForm(s => ({ ...s, initials: e.target.value.toUpperCase().slice(0, 2) }))} />
              <Input placeholder="Uzmanlık etiketleri (virgülle: Kesim, Boya)" value={staffForm.tagsInput} onChange={e => setStaffForm(s => ({ ...s, tagsInput: e.target.value }))} />
              <div className="md:col-span-2 space-y-2">
                <p className="text-xs text-muted-foreground">Fotoğraf (URL veya bilgisayardan yükle)</p>
                <div className="flex gap-2 items-center">
                  <Input
                    placeholder="Fotoğraf URL'si"
                    value={staffForm.imageUrl.startsWith("data:") ? "(Yüklenen dosya)" : staffForm.imageUrl}
                    onChange={e => setStaffForm(s => ({ ...s, imageUrl: e.target.value }))}
                    className="flex-1 text-sm"
                  />
                  <Button type="button" variant="outline" size="sm" className="shrink-0 gap-1.5 text-xs" onClick={staffImgUpload.trigger}>
                    <Upload className="w-3.5 h-3.5" /> Dosya
                  </Button>
                  <input ref={staffImgUpload.ref} type="file" accept="image/*" className="hidden" onChange={staffImgUpload.onChange} />
                  <Avatar className="w-10 h-10 shrink-0">
                    {staffForm.imageUrl ? <AvatarImage src={staffForm.imageUrl} className="object-cover" /> : null}
                    <AvatarFallback className="bg-muted text-primary text-sm">
                      {staffForm.initials || staffForm.name.slice(0, 2).toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleStaffSubmit} className="bg-[#b84d5b] text-white">Kaydet</Button>
              <Button variant="outline" onClick={() => setShowStaffForm(false)}>İptal</Button>
            </div>
          </div>
        )}

        <div className="grid gap-4">
          {siteContent.staffMembers.map(s => (
            <div key={s.id} className="flex items-center justify-between p-4 border border-border rounded-xl bg-background">
              <div className="flex items-center gap-4">
                <Avatar className="w-12 h-12 border border-border">
                  {s.imageUrl ? <AvatarImage src={s.imageUrl} className="object-cover" /> : null}
                  <AvatarFallback className="bg-muted text-primary font-serif">{s.initials}</AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-medium">{s.name}</h4>
                  <p className="text-sm text-muted-foreground">{s.title} · {s.experience}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Star className="w-3 h-3 fill-accent text-accent" />
                    <span className="text-xs text-muted-foreground">{s.rating}</span>
                    {s.tags.length > 0 && (
                      <span className="text-xs text-muted-foreground ml-2">{s.tags.join(", ")}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="icon" variant="outline" onClick={() => openStaffForm(s)}>
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="outline" className="text-destructive hover:bg-destructive/10" onClick={() => deleteStaffMember(s.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </TabsContent>

      {/* ── FİYAT LİSTESİ ── */}
      <TabsContent value="prices" className="space-y-6">
        <div className="flex flex-wrap gap-2 mb-4">
          {(Object.keys(PRICE_CAT_LABELS) as (keyof PriceList)[]).map(cat => (
            <button
              key={cat}
              onClick={() => { setPriceTab(cat); setEditingPrice(null); }}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${priceTab === cat ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:border-primary/50"}`}
            >
              {PRICE_CAT_LABELS[cat]}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          {siteContent.priceList[priceTab].map((item, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-background border border-border rounded-xl">
              {editingPrice?.index === i ? (
                <>
                  <Input className="flex-1 h-8 text-sm" value={editingPrice.name} onChange={e => setEditingPrice(p => p ? { ...p, name: e.target.value } : null)} />
                  <Input className="w-32 h-8 text-sm" value={editingPrice.price} onChange={e => setEditingPrice(p => p ? { ...p, price: e.target.value } : null)} placeholder="500 TL" />
                  <Button size="sm" className="bg-[#b84d5b] text-white h-8 px-3" onClick={handleSavePrice}>Kaydet</Button>
                  <Button size="sm" variant="outline" className="h-8 px-3" onClick={() => setEditingPrice(null)}>İptal</Button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm font-medium">{item.name}</span>
                  <span className="text-sm font-bold text-accent">{item.price}</span>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingPrice({ index: i, name: item.name, price: item.price })}>
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => deletePriceItem(priceTab, i)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </>
              )}
            </div>
          ))}
        </div>

        <div className="p-4 border border-dashed border-border rounded-xl bg-background space-y-3">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Yeni Fiyat Ekle</p>
          <div className="flex gap-2 flex-wrap">
            <Input className="flex-1 min-w-[180px]" placeholder="Hizmet adı (Örn: Saç Kesim)" value={newPriceItem.name} onChange={e => setNewPriceItem(p => ({ ...p, name: e.target.value }))} />
            <Input className="w-36" placeholder="Fiyat (Örn: 500 TL)" value={newPriceItem.price} onChange={e => setNewPriceItem(p => ({ ...p, price: e.target.value }))} />
            <Button onClick={handleAddPrice} className="gap-2 bg-[#b84d5b] text-white">
              <Plus className="w-4 h-4" /> Ekle
            </Button>
          </div>
        </div>
      </TabsContent>

      {/* ── PERSONEL HESAPLARI ── */}
      <TabsContent value="accounts" className="space-y-6">
        <div className="p-4 border border-border/60 rounded-xl bg-background/50 text-sm text-muted-foreground">
          <p className="flex items-center gap-2 font-medium text-foreground mb-1"><ShieldCheck className="w-4 h-4 text-primary" /> Personel Giriş Sistemi</p>
          <p>Personeller <strong>/#personel</strong> adresinden kullanıcı adı ve PIN ile giriş yapabilir. Admin yetkisi yoktur — sadece kendi randevularını, müşterilerini ve çalışma saatlerini görebilirler.</p>
        </div>

        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-lg">Personel Hesapları ({staffUsers.length})</h3>
          <Button onClick={() => { setStaffUserForm({ staffMemberId: "", username: "", pin: "", role: "uzman", phone: "" }); setEditingStaffUserId(null); setShowStaffUserForm(true); }} className="gap-2 bg-[#b84d5b] text-white hover:bg-[#b84d5b]/90">
            <UserPlus className="w-4 h-4" /> Hesap Oluştur
          </Button>
        </div>

        {showStaffUserForm && (
          <div className="p-5 border border-border rounded-xl bg-background space-y-4">
            <h4 className="font-medium text-sm flex items-center gap-2"><KeyRound className="w-4 h-4 text-primary" />{editingStaffUserId ? "Hesabı Düzenle" : "Yeni Personel Hesabı"}</h4>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Personel Seç</label>
                <Select value={staffUserForm.staffMemberId} onValueChange={v => setStaffUserForm(f => ({ ...f, staffMemberId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Personel seçin" /></SelectTrigger>
                  <SelectContent>
                    {siteContent.staffMembers.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name} — {s.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Kullanıcı Adı</label>
                <Input placeholder="Örn: gulcan" value={staffUserForm.username} onChange={e => setStaffUserForm(f => ({ ...f, username: e.target.value.toLowerCase().replace(/\s/g, "") }))} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">PIN (4 haneli)</label>
                <Input placeholder="Örn: 1234" maxLength={4} value={staffUserForm.pin} onChange={e => setStaffUserForm(f => ({ ...f, pin: e.target.value.replace(/\D/g, "").slice(0, 4) }))} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Rütbe</label>
                <Select value={staffUserForm.role} onValueChange={v => setStaffUserForm(f => ({ ...f, role: v as StaffRole }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="uzman">Uzman (Kısıtlı)</SelectItem>
                    <SelectItem value="yonetici">Yönetici (Geniş Erişim)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Telefon (SMS için)</label>
                <Input
                  type="tel"
                  placeholder="05xx xxx xx xx"
                  value={staffUserForm.phone}
                  onChange={e => setStaffUserForm(f => ({ ...f, phone: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleStaffUserSubmit} className="bg-[#b84d5b] text-white">Kaydet</Button>
              <Button variant="outline" onClick={() => { setShowStaffUserForm(false); setEditingStaffUserId(null); }}>İptal</Button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {staffUsers.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground border border-dashed border-border rounded-xl">
              <KeyRound className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Henüz personel hesabı oluşturulmadı.</p>
            </div>
          ) : (
            staffUsers.map(su => {
              const member = siteContent.staffMembers.find(s => s.id === su.staffMemberId);
              return (
                <div key={su.id} className="flex items-center justify-between p-4 border border-border rounded-xl bg-background">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
                      <span className="text-xs font-bold text-primary">{member?.initials || su.name.slice(0, 2).toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">{su.name}</p>
                      <p className="text-xs text-muted-foreground">@{su.username} · PIN: {"•".repeat(4)} · <span className={su.role === "yonetici" ? "text-accent" : "text-muted-foreground"}>{su.role === "yonetici" ? "Yönetici" : "Uzman"}</span></p>
                      {su.phone && <p className="text-xs text-muted-foreground/70 flex items-center gap-1"><Phone className="w-3 h-3" /> {su.phone}</p>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => {
                      setStaffUserForm({ staffMemberId: su.staffMemberId, username: su.username, pin: su.pin, role: su.role, phone: su.phone ?? "" });
                      setEditingStaffUserId(su.id);
                      setShowStaffUserForm(true);
                    }}>
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="icon" variant="outline" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => deleteStaffUser(su.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </TabsContent>

      {/* ── İLETİŞİM BİLGİLERİ ── */}
      <TabsContent value="contact" className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-lg">İletişim Bilgileri</h3>
          <Button onClick={saveContact} className="bg-[#b84d5b] text-white hover:bg-[#b84d5b]/90">Kaydet</Button>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          <div className="p-5 border border-border rounded-xl bg-background space-y-4">
            <h4 className="font-medium text-sm flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" /> Adres & Konum</h4>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Adres</label>
                <Input placeholder="Altınordu, Ordu, Türkiye" value={contactForm.address} onChange={e => setContactForm(f => ({ ...f, address: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Google Maps Embed URL <span className="text-muted-foreground/60">(harita için)</span></label>
                <Input placeholder="https://maps.google.com/maps?..." value={contactForm.mapUrl} onChange={e => setContactForm(f => ({ ...f, mapUrl: e.target.value }))} />
                <p className="text-xs text-muted-foreground/60 mt-1">Google Maps → Haritayı paylaş → Sayfaya ekle → src değerini yapıştırın</p>
              </div>
            </div>
          </div>

          <div className="p-5 border border-border rounded-xl bg-background space-y-4">
            <h4 className="font-medium text-sm flex items-center gap-2"><Phone className="w-4 h-4 text-primary" /> Telefon & E-Posta</h4>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Telefon 1</label>
                <Input placeholder="+90 452 123 45 67" value={contactForm.phone1} onChange={e => setContactForm(f => ({ ...f, phone1: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Telefon 2 <span className="text-muted-foreground/60">(opsiyonel)</span></label>
                <Input placeholder="+90 532 987 65 43" value={contactForm.phone2} onChange={e => setContactForm(f => ({ ...f, phone2: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">E-Posta</label>
                <Input placeholder="info@blackwhitesalon.com" value={contactForm.email} onChange={e => setContactForm(f => ({ ...f, email: e.target.value }))} />
              </div>
            </div>
          </div>

          <div className="p-5 border border-border rounded-xl bg-background space-y-4">
            <h4 className="font-medium text-sm flex items-center gap-2"><Instagram className="w-4 h-4 text-primary" /> Sosyal Medya</h4>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Instagram Kullanıcı Adı</label>
                <Input placeholder="@blackwhite_guzelliks" value={contactForm.instagramHandle} onChange={e => setContactForm(f => ({ ...f, instagramHandle: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Instagram Profil URL</label>
                <Input placeholder="https://instagram.com/..." value={contactForm.instagramUrl} onChange={e => setContactForm(f => ({ ...f, instagramUrl: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block"><Facebook className="w-3 h-3 inline mr-1" />Facebook URL <span className="text-muted-foreground/60">(opsiyonel)</span></label>
                <Input placeholder="https://facebook.com/..." value={contactForm.facebookUrl} onChange={e => setContactForm(f => ({ ...f, facebookUrl: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block"><MessageCircle className="w-3 h-3 inline mr-1" />WhatsApp Numarası</label>
                <Input placeholder="+905329876543" value={contactForm.whatsappNumber} onChange={e => setContactForm(f => ({ ...f, whatsappNumber: e.target.value }))} />
                <p className="text-xs text-muted-foreground/60 mt-1">Boşluksuz, başında + ile: +905XXXXXXXXX</p>
              </div>
            </div>
          </div>

          <div className="p-5 border border-border rounded-xl bg-background space-y-4">
            <h4 className="font-medium text-sm flex items-center gap-2"><Clock className="w-4 h-4 text-primary" /> Çalışma Saatleri & Slogan</h4>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Hafta içi / Cumartesi</label>
                <Input placeholder="Pzt - Cmt: 09:00 - 20:00" value={contactForm.workingHoursWeekday} onChange={e => setContactForm(f => ({ ...f, workingHoursWeekday: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Pazar</label>
                <Input placeholder="Paz: 10:00 - 18:00" value={contactForm.workingHoursSunday} onChange={e => setContactForm(f => ({ ...f, workingHoursSunday: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Footer Slogan</label>
                <Textarea placeholder="Kısa tanıtım cümlesi..." value={contactForm.salonSlogan} onChange={e => setContactForm(f => ({ ...f, salonSlogan: e.target.value }))} className="min-h-[80px]" />
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-background/50 border border-border/50 rounded-xl text-xs text-muted-foreground">
          <p className="font-medium text-foreground mb-1">💡 Bilgi</p>
          <p>Kaydet butonuna tıkladığınızda tüm değişiklikler anında sitede yansır. Değişiklikleri kaydetmeden sekme değiştirirseniz form sıfırlanmaz.</p>
        </div>
      </TabsContent>

      {/* ── SMS GEÇMİŞİ ── */}
      <TabsContent value="sms">
        <SmsLog />
      </TabsContent>

      {/* ── ÖNİZLEME ── */}
      <TabsContent value="preview">
        <div className="w-full max-w-2xl mx-auto rounded-xl overflow-hidden border border-border shadow-xl">
          <div
            className="h-[300px] w-full relative flex flex-col justify-center items-center text-center p-8 bg-cover bg-center"
            style={{ backgroundImage: `url(${siteContent.heroImageUrl})` }}
          >
            <div className="absolute inset-0 bg-black/50" />
            <div className="relative z-10">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full border border-primary/50 flex items-center justify-center bg-card overflow-hidden">
                {siteContent.logoImageUrl
                  ? <img src={siteContent.logoImageUrl} alt="Logo" className="w-full h-full object-cover" />
                  : <span className="font-serif font-bold text-primary text-xl">BW</span>
                }
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">Black White</h2>
              <p className="text-white/80">Önizleme görünümü</p>
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}

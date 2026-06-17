import { useState, useRef } from "react";
import { useStore } from "@/lib/store";
import type { StaffMember, ContactInfo } from "@/lib/store";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Edit2, Upload, Link as LinkIcon, Star, MapPin, Phone, Mail, Instagram, MessageCircle, Clock, Facebook } from "lucide-react";

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

export function AdminContent() {
  const {
    siteContent,
    updateSiteContent,
    addStoreProduct, updateStoreProduct, deleteStoreProduct,
    addGalleryItem, deleteGalleryItem,
    addStaffMember, updateStaffMember, deleteStaffMember,
  } = useStore();
  const { toast } = useToast();

  const [heroUrl, setHeroUrl] = useState(siteContent.heroImageUrl);
  const [logoUrl, setLogoUrl] = useState(siteContent.logoImageUrl);
  const heroUpload = useImageInput(setHeroUrl);
  const logoUpload = useImageInput(setLogoUrl);

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

  const [galleryForm, setGalleryForm] = useState({ url: "", category: "sac" as "sac" | "tirnak", label: "" });
  const [galleryFilter, setGalleryFilter] = useState("all");
  const galleryUpload = useImageInput(v => setGalleryForm(f => ({ ...f, url: v })));

  const handleGallerySubmit = () => {
    if (!galleryForm.url) return;
    addGalleryItem(galleryForm);
    setGalleryForm({ url: "", category: "sac", label: "" });
    toast({ title: "Başarılı", description: "Görsel eklendi." });
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
      <TabsList className="mb-6 grid w-full grid-cols-6 bg-background border border-border rounded-xl p-1">
        <TabsTrigger value="hero" className="text-xs md:text-sm data-[state=active]:bg-primary">Hero & Logo</TabsTrigger>
        <TabsTrigger value="store" className="text-xs md:text-sm data-[state=active]:bg-primary">Mağaza</TabsTrigger>
        <TabsTrigger value="gallery" className="text-xs md:text-sm data-[state=active]:bg-primary">Galeri</TabsTrigger>
        <TabsTrigger value="staff" className="text-xs md:text-sm data-[state=active]:bg-primary">Personel</TabsTrigger>
        <TabsTrigger value="contact" className="text-xs md:text-sm data-[state=active]:bg-primary">İletişim</TabsTrigger>
        <TabsTrigger value="preview" className="text-xs md:text-sm data-[state=active]:bg-primary">Önizleme</TabsTrigger>
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
              <Select value={galleryForm.category} onValueChange={v => setGalleryForm(f => ({ ...f, category: v as "sac" | "tirnak" }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sac">Saç</SelectItem>
                  <SelectItem value="tirnak">Tırnak</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
          {siteContent.galleryItems.filter(i => galleryFilter === "all" || i.category === galleryFilter).map(img => (
            <div key={img.id} className="relative aspect-square rounded-md overflow-hidden group">
              <img src={img.url} alt={img.label} className="w-full h-full object-cover" />
              <button
                className="absolute top-2 right-2 w-8 h-8 bg-black/50 hover:bg-destructive text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => deleteGalleryItem(img.id)}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
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

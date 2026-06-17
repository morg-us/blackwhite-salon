import { useState } from "react";
import { useStore } from "@/lib/store";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Edit2, Image as ImageIcon } from "lucide-react";

export function AdminContent() {
  const { siteContent, updateSiteContent, addStoreProduct, updateStoreProduct, deleteStoreProduct, addGalleryItem, deleteGalleryItem } = useStore();
  const { toast } = useToast();

  const [heroUrl, setHeroUrl] = useState(siteContent.heroImageUrl);
  const [logoUrl, setLogoUrl] = useState(siteContent.logoImageUrl);

  const saveHeroLogo = () => {
    updateSiteContent({ heroImageUrl: heroUrl, logoImageUrl: logoUrl });
    toast({ title: "Başarılı", description: "Görseller güncellendi." });
  };

  const [productForm, setProductForm] = useState({ id: "", name: "", description: "", price: "", imageUrl: "" });
  const [showProductForm, setShowProductForm] = useState(false);

  const handleProductSubmit = () => {
    if (!productForm.name || !productForm.price) return;
    if (productForm.id) {
      updateStoreProduct(productForm.id, { ...productForm, price: Number(productForm.price) });
    } else {
      addStoreProduct({ ...productForm, price: Number(productForm.price) });
    }
    setShowProductForm(false);
    setProductForm({ id: "", name: "", description: "", price: "", imageUrl: "" });
    toast({ title: "Başarılı", description: "Ürün kaydedildi." });
  };

  const [galleryForm, setGalleryForm] = useState({ url: "", category: "sac" as "sac"|"tirnak", label: "" });
  const [galleryFilter, setGalleryFilter] = useState("all");

  const handleGallerySubmit = () => {
    if (!galleryForm.url) return;
    addGalleryItem(galleryForm);
    setGalleryForm({ url: "", category: "sac", label: "" });
    toast({ title: "Başarılı", description: "Görsel eklendi." });
  };

  return (
    <Tabs defaultValue="hero" className="w-full">
      <TabsList className="mb-6 grid w-full grid-cols-4 bg-background border border-border rounded-xl p-1">
        <TabsTrigger value="hero" className="text-xs md:text-sm data-[state=active]:bg-primary">Hero & Logo</TabsTrigger>
        <TabsTrigger value="store" className="text-xs md:text-sm data-[state=active]:bg-primary">Mağaza Ürünleri</TabsTrigger>
        <TabsTrigger value="gallery" className="text-xs md:text-sm data-[state=active]:bg-primary">Galeri</TabsTrigger>
        <TabsTrigger value="preview" className="text-xs md:text-sm data-[state=active]:bg-primary">Önizleme</TabsTrigger>
      </TabsList>

      <TabsContent value="hero" className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4 p-5 border border-border rounded-xl bg-background">
            <h3 className="font-semibold">Hero Arka Plan Görseli</h3>
            <Input placeholder="Resim URL'si" value={heroUrl} onChange={e => setHeroUrl(e.target.value)} />
            {heroUrl && (
              <div className="w-full h-32 rounded-md bg-cover bg-center" style={{ backgroundImage: `url(${heroUrl})` }} />
            )}
          </div>
          <div className="space-y-4 p-5 border border-border rounded-xl bg-background">
            <h3 className="font-semibold">Logo Görseli</h3>
            <Input placeholder="Logo URL'si (Boş bırakılırsa yazı gösterilir)" value={logoUrl} onChange={e => setLogoUrl(e.target.value)} />
            <div className="w-16 h-16 rounded-full border border-primary/50 flex items-center justify-center bg-card overflow-hidden">
              {logoUrl ? <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" /> : <span className="font-serif font-bold text-primary text-xl">BW</span>}
            </div>
          </div>
        </div>
        <Button onClick={saveHeroLogo} className="bg-[#b84d5b] text-white hover:bg-[#b84d5b]/90">Güncelle</Button>
      </TabsContent>

      <TabsContent value="store" className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-lg">Mağaza Ürünleri ({siteContent.storeProducts.length})</h3>
          <Button onClick={() => { setProductForm({ id: "", name: "", description: "", price: "", imageUrl: "" }); setShowProductForm(true); }} className="gap-2 bg-[#b84d5b] text-white hover:bg-[#b84d5b]/90">
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
              <div className="md:col-span-2 flex gap-4 items-end">
                <div className="flex-1">
                  <Input placeholder="Resim URL'si veya CSS Gradient (Örn: linear-gradient(...))" value={productForm.imageUrl} onChange={e => setProductForm(p => ({ ...p, imageUrl: e.target.value }))} />
                </div>
                {productForm.imageUrl && (
                  <div className="w-10 h-10 rounded border border-border shrink-0 bg-cover bg-center" style={{ background: productForm.imageUrl.startsWith("http") ? `url(${productForm.imageUrl})` : productForm.imageUrl }} />
                )}
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
                <div className="w-12 h-12 rounded-md border border-border shrink-0 bg-cover bg-center" style={{ background: p.imageUrl.startsWith("http") ? `url(${p.imageUrl})` : p.imageUrl }} />
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

      <TabsContent value="gallery" className="space-y-6">
        <div className="p-5 border border-border rounded-xl bg-background space-y-4">
          <h4 className="font-medium text-sm">Fotoğraf Ekle</h4>
          <div className="flex gap-3 items-start flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <Input placeholder="Görsel URL'si" value={galleryForm.url} onChange={e => setGalleryForm(f => ({ ...f, url: e.target.value }))} />
            </div>
            <div className="w-[150px]">
              <Select value={galleryForm.category} onValueChange={v => setGalleryForm(f => ({ ...f, category: v as any }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sac">Saç</SelectItem>
                  <SelectItem value="tirnak">Tırnak</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-[150px]">
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

      <TabsContent value="preview">
        <div className="w-full max-w-2xl mx-auto rounded-xl overflow-hidden border border-border shadow-xl">
          <div className="h-[300px] w-full relative flex flex-col justify-center items-center text-center p-8 bg-cover bg-center" style={{ backgroundImage: `url(${siteContent.heroImageUrl})` }}>
            <div className="absolute inset-0 bg-black/50" />
            <div className="relative z-10">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full border border-primary/50 flex items-center justify-center bg-card overflow-hidden">
                {siteContent.logoImageUrl ? <img src={siteContent.logoImageUrl} alt="Logo" className="w-full h-full object-cover" /> : <span className="font-serif font-bold text-primary text-xl">BW</span>}
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

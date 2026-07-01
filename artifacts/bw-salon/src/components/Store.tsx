import { useStore } from "@/lib/store";
import { useT } from "@/lib/translations";

export function OurProducts() {
  const { siteContent } = useStore();
  const t = useT();
  const products = siteContent.storeProducts;

  return (
    <section id="products" className="py-24 bg-background">
      <div className="container px-4 mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 font-serif">{t("store_title")}</h2>
          <div className="h-1 w-20 bg-primary mx-auto mb-6"></div>
          <p className="text-muted-foreground">{t("store_subtitle")}</p>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-sm">Henüz ürün eklenmemiş.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {products.map(product => (
              <div key={product.id} className="bg-card rounded-2xl overflow-hidden border border-border flex flex-col group">
                <div
                  className="w-full aspect-square flex items-center justify-center relative overflow-hidden bg-muted"
                  style={
                    product.imageUrl.startsWith("http") || product.imageUrl.startsWith("data:")
                      ? { backgroundImage: `url(${product.imageUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
                      : {}
                  }
                >
                  {!product.imageUrl.startsWith("http") && !product.imageUrl.startsWith("data:") && (
                    <div className="w-16 h-16 rounded-full border border-white/10 flex items-center justify-center">
                      <span className="font-serif italic text-white/30 text-xl">BW</span>
                    </div>
                  )}
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <h3 className="font-bold text-sm leading-snug">{product.name}</h3>
                  {product.description && (
                    <p className="text-muted-foreground text-xs mt-1 leading-relaxed">{product.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/translations";

export function Store() {
  const { toast } = useToast();
  const { addToCart, siteContent, inventory } = useStore();
  const t = useT();
  const products = siteContent.storeProducts;

  const getStock = (inventoryProductId?: string) => {
    if (!inventoryProductId) return null;
    const inv = inventory.find(i => i.id === inventoryProductId);
    return inv ? inv.stock : null;
  };

  const handleAddToCart = (product: typeof products[0]) => {
    const stock = getStock(product.inventoryProductId);
    if (stock !== null && stock <= 0) return;
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      image: product.imageUrl,
      inventoryProductId: product.inventoryProductId,
    });
    toast({
      title: t("store_added"),
      description: `${product.name}`,
    });
  };

  return (
    <section id="store" className="py-24 bg-background">
      <div className="container px-4 mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 font-serif">{t("store_title")}</h2>
          <div className="h-1 w-20 bg-primary mx-auto mb-6"></div>
          <p className="text-muted-foreground">{t("store_subtitle")}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {products.map(product => {
            const stock = getStock(product.inventoryProductId);
            const isSoldOut = stock !== null && stock <= 0;
            return (
              <div key={product.id} className="bg-card rounded-2xl overflow-hidden border border-border flex flex-col group relative">
                <div
                  className="w-full aspect-[4/3] flex items-center justify-center relative overflow-hidden bg-cover bg-center"
                  style={{
                    background: (product.imageUrl.startsWith("http") || product.imageUrl.startsWith("data:"))
                      ? `url(${product.imageUrl}) center/cover`
                      : (product.imageUrl || "var(--card)"),
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                >
                  {!product.imageUrl.startsWith("http") && !product.imageUrl.startsWith("data:") && (
                    <div className="w-32 h-32 rounded-full border border-white/10 flex items-center justify-center">
                      <span className="font-serif italic text-white/30 text-2xl">BW</span>
                    </div>
                  )}
                  {isSoldOut && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <span className="text-white font-bold text-lg tracking-widest uppercase">Tükendi</span>
                    </div>
                  )}
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <h3 className="text-xl font-bold mb-2">{product.name}</h3>
                  <p className="text-muted-foreground text-sm mb-4 flex-1">{product.description}</p>
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/50">
                    <div>
                      <span className="text-lg font-bold text-accent">{product.price} TL</span>
                      {stock !== null && !isSoldOut && (
                        <p className="text-xs text-muted-foreground mt-0.5">Stok: {stock} adet</p>
                      )}
                      {isSoldOut && (
                        <p className="text-xs text-destructive mt-0.5 font-medium">Stok tükendi</p>
                      )}
                    </div>
                    <Button
                      onClick={() => handleAddToCart(product)}
                      variant="outline"
                      disabled={isSoldOut}
                      className="group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:group-hover:bg-transparent disabled:group-hover:text-foreground disabled:group-hover:border-border"
                      data-testid={`button-add-cart-${product.id}`}
                    >
                      <ShoppingBag className="w-4 h-4 mr-2" />
                      {isSoldOut ? "Tükendi" : t("store_add_cart")}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

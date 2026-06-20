import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/translations";

export function Store() {
  const { toast } = useToast();
  const { addToCart, siteContent } = useStore();
  const t = useT();
  const products = siteContent.storeProducts;

  const handleAddToCart = (product: typeof products[0]) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      image: product.imageUrl
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
          {products.map(product => (
            <div key={product.id} className="bg-card rounded-2xl overflow-hidden border border-border flex flex-col group">
              <div
                className="w-full aspect-[4/3] flex items-center justify-center relative overflow-hidden bg-cover bg-center"
                style={{ background: product.imageUrl.startsWith("http") ? `url(${product.imageUrl})` : product.imageUrl, backgroundSize: 'cover', backgroundPosition: 'center' }}
              >
                {!product.imageUrl.startsWith("http") && (
                  <div className="w-32 h-32 rounded-full border border-white/10 flex items-center justify-center">
                    <span className="font-serif italic text-white/30 text-2xl">BW</span>
                  </div>
                )}
              </div>
              <div className="p-6 flex flex-col flex-1">
                <h3 className="text-xl font-bold mb-2">{product.name}</h3>
                <p className="text-muted-foreground text-sm mb-4 flex-1">{product.description}</p>
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/50">
                  <span className="text-lg font-bold text-accent">{product.price} TL</span>
                  <Button
                    onClick={() => handleAddToCart(product)}
                    variant="outline"
                    className="group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-colors"
                    data-testid={`button-add-cart-${product.id}`}
                  >
                    <ShoppingBag className="w-4 h-4 mr-2" />
                    {t("store_add_cart")}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

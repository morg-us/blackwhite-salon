import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { Minus, Plus, Trash2, CreditCard, ExternalLink } from "lucide-react";
import { useUser } from "@clerk/react";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

export function CartDrawer() {
  const { isCartOpen, setIsCartOpen, cart, updateCartItem, removeFromCart, setIsAuthModalOpen } = useStore();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const { isSignedIn } = useUser();

  const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const handleStripeCheckout = async () => {
    if (cart.length === 0) return;
    setIsProcessing(true);

    try {
      // Build line items — each cart item needs a Stripe price ID.
      // Since we use localStorage cart with TL prices (not Stripe price IDs),
      // we create a dynamic checkout session using price_data.
      const lineItems = cart.map(item => ({
        price_data: {
          currency: "try",
          unit_amount: Math.round(item.price * 100), // TL → kuruş
          product_data: {
            name: item.name,
            images: item.image?.startsWith("http") ? [item.image] : [],
          },
        },
        quantity: item.quantity,
      }));

      const origin = window.location.origin;
      const res = await fetch(`${BASE}/api/stripe/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lineItems,
          successUrl: `${origin}/?checkout=success`,
          cancelUrl: `${origin}/?checkout=cancel`,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Bilinmeyen hata" }));
        throw new Error(err.error ?? "Checkout başlatılamadı");
      }

      const { url } = await res.json();
      if (url) {
        window.location.href = url;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Ödeme başlatılamadı";
      toast({ title: "Hata", description: msg, variant: "destructive" });
      setIsProcessing(false);
    }
  };

  return (
    <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
      <SheetContent className="w-full sm:max-w-md bg-card border-l-border flex flex-col">
        <SheetHeader className="pb-4 border-b border-border">
          <SheetTitle className="font-serif text-2xl">Sepetiniz</SheetTitle>
          <SheetDescription>
            {cart.length === 0 ? "Sepetiniz şu an boş." : `${cart.length} çeşit ürün bulunuyor.`}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-4">
          {cart.map(item => (
            <div key={item.id} className="flex gap-4 items-center bg-background p-3 rounded-lg border border-border">
              <div
                className="w-16 h-16 rounded-md flex-shrink-0 bg-cover bg-center"
                style={{ backgroundImage: item.image?.startsWith("http") ? `url(${item.image})` : undefined, background: item.image?.startsWith("http") ? undefined : item.image }}
              />
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm truncate">{item.name}</h4>
                <p className="text-accent font-bold text-sm">{item.price} TL</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => updateCartItem(item.id, item.quantity - 1)} className="p-1 text-muted-foreground hover:text-foreground">
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-4 text-center text-sm">{item.quantity}</span>
                <button onClick={() => updateCartItem(item.id, item.quantity + 1)} className="p-1 text-muted-foreground hover:text-foreground">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <button onClick={() => removeFromCart(item.id)} className="p-2 text-destructive hover:bg-destructive/10 rounded-md transition-colors ml-2">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <SheetFooter className="pt-4 border-t border-border flex-col items-stretch gap-3">
          <div className="flex justify-between items-center text-lg font-bold">
            <span>Toplam:</span>
            <span className="text-accent">{total} TL</span>
          </div>

          {!isSignedIn && cart.length > 0 && (
            <p className="text-xs text-muted-foreground text-center">
              <button className="text-primary hover:underline" onClick={() => { setIsCartOpen(false); setIsAuthModalOpen(true); }}>
                Giriş yapın
              </button>{" "}
              veya misafir olarak devam edin.
            </p>
          )}

          <Button
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            size="lg"
            disabled={cart.length === 0 || isProcessing}
            onClick={handleStripeCheckout}
            data-testid="button-proceed-checkout"
          >
            {isProcessing ? (
              "Yönlendiriliyor..."
            ) : (
              <>
                <CreditCard className="w-4 h-4 mr-2" />
                Stripe ile Güvenli Öde
                <ExternalLink className="w-3 h-3 ml-2 opacity-60" />
              </>
            )}
          </Button>
          <p className="text-[10px] text-muted-foreground text-center">
            256-bit SSL şifrelemeli güvenli ödeme
          </p>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

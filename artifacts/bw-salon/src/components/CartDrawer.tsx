import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { Minus, Plus, Trash2, MessageCircle } from "lucide-react";

export function CartDrawer() {
  const { isCartOpen, setIsCartOpen, cart, updateCartItem, removeFromCart, clearCart, addOrder, siteContent, refreshInventory } = useStore();

  const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const handleWhatsAppOrder = async () => {
    if (cart.length === 0) return;

    const lines = cart.map(item => `• ${item.name} x${item.quantity} — ${item.price * item.quantity} TL`).join("\n");
    const message = `Merhaba, aşağıdaki ürünleri sipariş etmek istiyorum:\n\n${lines}\n\nToplam: ${total} TL`;

    const phone = (siteContent.contactInfo.whatsappNumber || "").replace(/\D/g, "");
    const url = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;

    window.open(url, "_blank");

    // Stokla eşleşmiş ürünleri server'da düş
    const deductItems = cart
      .filter(item => item.inventoryProductId)
      .map(item => ({
        inventoryProductId: item.inventoryProductId!,
        productName: item.name,
        quantity: item.quantity,
        unitPrice: item.price,
      }));

    if (deductItems.length > 0) {
      fetch("/api/inventory/sale-deduct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: deductItems }),
      })
        .then(() => refreshInventory())
        .catch(console.error);
    }

    // Siparişi kaydet
    addOrder({
      customerName: "Online Müşteri",
      items: cart.map(i => ({ id: i.id, name: i.name, quantity: i.quantity, price: i.price, image: i.image })),
      total,
    });

    clearCart();
    setIsCartOpen(false);
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

          <Button
            className="w-full bg-green-600 hover:bg-green-700 text-white"
            size="lg"
            disabled={cart.length === 0}
            onClick={handleWhatsAppOrder}
            data-testid="button-proceed-checkout"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            WhatsApp ile Sipariş Ver
          </Button>
          <p className="text-[10px] text-muted-foreground text-center">
            Sepetinizdeki ürünler WhatsApp mesajı olarak gönderilecektir.
          </p>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

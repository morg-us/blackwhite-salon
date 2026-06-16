import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { Minus, Plus, Trash2, CreditCard } from "lucide-react";

export function CartDrawer() {
  const { isCartOpen, setIsCartOpen, cart, updateCartItem, removeFromCart, clearCart, addOrder } = useStore();
  const { toast } = useToast();
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [checkoutData, setCheckoutData] = useState({ name: "", card: "", exp: "", cvv: "" });

  const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    // Simulate payment processing
    setTimeout(() => {
      addOrder({
        items: [...cart],
        total,
        customerName: checkoutData.name || "Misafir Müşteri"
      });
      clearCart();
      setIsProcessing(false);
      setIsCheckoutOpen(false);
      setIsCartOpen(false);
      toast({
        title: "Siparişiniz Alındı!",
        description: "Teşekkürler. Siparişiniz başarıyla oluşturuldu.",
      });
    }, 1500);
  };

  return (
    <>
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
                  className="w-16 h-16 rounded-md flex-shrink-0"
                  style={{ background: item.image }}
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

          <SheetFooter className="pt-4 border-t border-border flex-col items-stretch gap-4">
            <div className="flex justify-between items-center text-lg font-bold">
              <span>Toplam:</span>
              <span className="text-accent">{total} TL</span>
            </div>
            <Button 
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" 
              size="lg"
              disabled={cart.length === 0}
              onClick={() => { setIsCartOpen(false); setIsCheckoutOpen(true); }}
              data-testid="button-proceed-checkout"
            >
              Ödemeye Geç
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              Güvenli Ödeme
            </DialogTitle>
            <DialogDescription>
              Toplam tutar: <span className="font-bold text-accent">{total} TL</span>
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCheckout} className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Kart Üzerindeki İsim</label>
              <Input 
                required
                value={checkoutData.name}
                onChange={e => setCheckoutData({...checkoutData, name: e.target.value})}
                placeholder="Örn: Ayşe Yılmaz"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Kart Numarası</label>
              <Input 
                required
                value={checkoutData.card}
                onChange={e => {
                  let val = e.target.value.replace(/\D/g, "");
                  if (val.length > 16) val = val.substring(0, 16);
                  val = val.replace(/(\d{4})/g, "$1-").replace(/-$/, "");
                  setCheckoutData({...checkoutData, card: val});
                }}
                placeholder="0000-0000-0000-0000"
                maxLength={19}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Son Kullanma (AA/YY)</label>
                <Input 
                  required
                  value={checkoutData.exp}
                  onChange={e => {
                    let val = e.target.value.replace(/\D/g, "");
                    if (val.length > 4) val = val.substring(0, 4);
                    if (val.length > 2) val = val.substring(0,2) + "/" + val.substring(2);
                    setCheckoutData({...checkoutData, exp: val});
                  }}
                  placeholder="12/25"
                  maxLength={5}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">CVV</label>
                <Input 
                  required
                  type="password"
                  value={checkoutData.cvv}
                  onChange={e => setCheckoutData({...checkoutData, cvv: e.target.value.replace(/\D/g, "").substring(0, 3)})}
                  placeholder="***"
                  maxLength={3}
                />
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsCheckoutOpen(false)}>İptal</Button>
              <Button type="submit" disabled={isProcessing} className="bg-primary text-primary-foreground hover:bg-primary/90" data-testid="button-complete-payment">
                {isProcessing ? "İşleniyor..." : "Ödemeyi Tamamla"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

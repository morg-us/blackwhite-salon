import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useStore } from "@/lib/store";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

export function UserOrdersModal({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { orders, currentUser } = useStore();

  if (!currentUser) return null;

  const userOrders = orders.filter(o => o.userId === currentUser.id || o.userEmail === currentUser.email);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-card border-border max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-serif mb-4">Geçmiş Siparişlerim</DialogTitle>
        </DialogHeader>
        
        {userOrders.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Henüz bir siparişiniz bulunmamaktadır.
          </div>
        ) : (
          <div className="space-y-4">
            {userOrders.slice().reverse().map(order => (
              <div key={order.id} className="p-4 border border-border rounded-xl bg-background/50 space-y-3">
                <div className="flex justify-between items-center border-b border-border/50 pb-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    {format(new Date(order.date), "dd MMM yyyy HH:mm", { locale: tr })}
                  </span>
                  <span className="font-bold text-[#b84d5b]">{order.total} TL</span>
                </div>
                <div className="space-y-2">
                  {order.items.map(item => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>{item.quantity}x {item.name}</span>
                      <span className="text-muted-foreground">{item.price * item.quantity} TL</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

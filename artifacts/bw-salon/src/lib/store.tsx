import { createContext, useContext, useState, ReactNode, useEffect } from "react";

export type Appointment = { id: string; name: string; phone: string; category: string; staff: string; date: string; time: string; };
export type Message = { id: string; name: string; email: string; message: string; };
export type CartItem = { id: string; name: string; price: number; quantity: number; image: string };
export type Order = { id: string; items: CartItem[]; total: number; date: string; customerName: string; };

export type AdisyonItem = {
  id: string;
  type: "hizmet" | "urun";
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
};

export type Adisyon = {
  id: string;
  date: string;
  customerName: string;
  staff: string;
  items: AdisyonItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: "nakit" | "kart" | "havale";
  note: string;
  status: "acik" | "kapali";
};

export type Transaction = {
  id: string;
  date: string;
  type: "gelir" | "gider";
  category: string;
  description: string;
  amount: number;
  paymentMethod: "nakit" | "kart" | "havale";
};

type StoreContextType = {
  appointments: Appointment[];
  addAppointment: (app: Omit<Appointment, "id">) => void;
  messages: Message[];
  addMessage: (msg: Omit<Message, "id">) => void;
  cart: CartItem[];
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
  addToCart: (item: CartItem) => void;
  updateCartItem: (id: string, quantity: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  orders: Order[];
  addOrder: (order: Omit<Order, "id" | "date">) => void;
  adisyonlar: Adisyon[];
  addAdisyon: (a: Omit<Adisyon, "id" | "date">) => void;
  updateAdisyon: (id: string, updates: Partial<Adisyon>) => void;
  deleteAdisyon: (id: string) => void;
  transactions: Transaction[];
  addTransaction: (t: Omit<Transaction, "id" | "date">) => void;
  deleteTransaction: (id: string) => void;
};

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [adisyonlar, setAdisyonlar] = useState<Adisyon[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const storedAppointments = localStorage.getItem("bw_appointments");
      const storedMessages = localStorage.getItem("bw_messages");
      const storedCart = localStorage.getItem("bw_cart");
      const storedOrders = localStorage.getItem("bw_orders");
      const storedAdisyonlar = localStorage.getItem("bw_adisyonlar");
      const storedTransactions = localStorage.getItem("bw_transactions");

      if (storedAppointments) setAppointments(JSON.parse(storedAppointments));
      if (storedMessages) setMessages(JSON.parse(storedMessages));
      if (storedCart) setCart(JSON.parse(storedCart));
      if (storedOrders) setOrders(JSON.parse(storedOrders));
      if (storedAdisyonlar) setAdisyonlar(JSON.parse(storedAdisyonlar));
      if (storedTransactions) setTransactions(JSON.parse(storedTransactions));
    } catch (e) {
      console.error("Error loading state", e);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem("bw_appointments", JSON.stringify(appointments));
    localStorage.setItem("bw_messages", JSON.stringify(messages));
    localStorage.setItem("bw_cart", JSON.stringify(cart));
    localStorage.setItem("bw_orders", JSON.stringify(orders));
    localStorage.setItem("bw_adisyonlar", JSON.stringify(adisyonlar));
    localStorage.setItem("bw_transactions", JSON.stringify(transactions));
  }, [appointments, messages, cart, orders, adisyonlar, transactions, isLoaded]);

  const addAppointment = (app: Omit<Appointment, "id">) => {
    setAppointments(prev => [...prev, { ...app, id: Math.random().toString(36).substring(2, 9) }]);
  };

  const addMessage = (msg: Omit<Message, "id">) => {
    setMessages(prev => [...prev, { ...msg, id: Math.random().toString(36).substring(2, 9) }]);
  };

  const addToCart = (item: CartItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i);
      }
      return [...prev, item];
    });
    setIsCartOpen(true);
  };

  const updateCartItem = (id: string, quantity: number) => {
    if (quantity <= 0) { removeFromCart(id); return; }
    setCart(prev => prev.map(i => i.id === id ? { ...i, quantity } : i));
  };

  const removeFromCart = (id: string) => setCart(prev => prev.filter(i => i.id !== id));
  const clearCart = () => setCart([]);

  const addOrder = (order: Omit<Order, "id" | "date">) => {
    setOrders(prev => [...prev, { ...order, id: Math.random().toString(36).substring(2, 9), date: new Date().toISOString() }]);
  };

  const addAdisyon = (a: Omit<Adisyon, "id" | "date">) => {
    const id = Math.random().toString(36).substring(2, 9);
    const date = new Date().toISOString();
    setAdisyonlar(prev => [...prev, { ...a, id, date }]);
    if (a.status === "kapali") {
      setTransactions(prev => [...prev, {
        id: Math.random().toString(36).substring(2, 9),
        date,
        type: "gelir",
        category: "Adisyon",
        description: `Adisyon #${id} — ${a.customerName}`,
        amount: a.total,
        paymentMethod: a.paymentMethod,
      }]);
    }
  };

  const updateAdisyon = (id: string, updates: Partial<Adisyon>) => {
    setAdisyonlar(prev => prev.map(a => {
      if (a.id !== id) return a;
      const updated = { ...a, ...updates };
      if (updates.status === "kapali" && a.status !== "kapali") {
        setTransactions(t => [...t, {
          id: Math.random().toString(36).substring(2, 9),
          date: new Date().toISOString(),
          type: "gelir",
          category: "Adisyon",
          description: `Adisyon #${id} kapatıldı — ${updated.customerName}`,
          amount: updated.total,
          paymentMethod: updated.paymentMethod,
        }]);
      }
      return updated;
    }));
  };

  const deleteAdisyon = (id: string) => setAdisyonlar(prev => prev.filter(a => a.id !== id));

  const addTransaction = (t: Omit<Transaction, "id" | "date">) => {
    setTransactions(prev => [...prev, { ...t, id: Math.random().toString(36).substring(2, 9), date: new Date().toISOString() }]);
  };

  const deleteTransaction = (id: string) => setTransactions(prev => prev.filter(t => t.id !== id));

  return (
    <StoreContext.Provider value={{
      appointments, addAppointment,
      messages, addMessage,
      cart, isCartOpen, setIsCartOpen, addToCart, updateCartItem, removeFromCart, clearCart,
      orders, addOrder,
      adisyonlar, addAdisyon, updateAdisyon, deleteAdisyon,
      transactions, addTransaction, deleteTransaction,
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useStore must be used within a StoreProvider");
  return context;
}

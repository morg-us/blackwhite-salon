import { createContext, useContext, useState, ReactNode, useEffect } from "react";

export type Appointment = { id: string; name: string; phone: string; category: string; staff: string; date: string; time: string; };
export type Message = { id: string; name: string; email: string; message: string; };
export type CartItem = { id: string; name: string; price: number; quantity: number; image: string };
export type Order = { id: string; items: CartItem[]; total: number; date: string; customerName: string; userId?: string; userEmail?: string; };

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

export type InventoryProduct = {
  id: string;
  barcode: string;
  name: string;
  category: string;
  unit: string;
  costPrice: number;
  salePrice: number;
  stock: number;
  minStock: number;
  note: string;
};

export type StockMovement = {
  id: string;
  date: string;
  productId: string;
  productName: string;
  barcode: string;
  type: "giris" | "cikis" | "duzeltme";
  quantity: number;
  reason: string;
  note: string;
  stockAfter: number;
};

export type SiteUser = {
  id: string;
  name: string;
  email: string;
  password: string; // plain text demo storage
  avatarColor: string; // hex color for avatar bg
  createdAt: string;
};

export type StoreProduct = {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string; // URL string or CSS gradient string
};

export type GalleryItem = {
  id: string;
  category: "sac" | "tirnak";
  url: string;
  label: string;
};

export type SiteContent = {
  heroImageUrl: string;
  logoImageUrl: string; // empty = show text "BW"
  storeProducts: StoreProduct[];
  galleryItems: GalleryItem[];
};

const DEFAULT_SITE_CONTENT: SiteContent = {
  heroImageUrl: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=2000",
  logoImageUrl: "",
  storeProducts: [
    { id: "p1", name: "Luxe Şampuan (Saç Bakım)", description: "Günlük kullanım için nemlendirici lüks şampuan.", price: 450, imageUrl: "linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)" },
    { id: "p2", name: "Argan Saç Yağı", description: "Saç uçlarını besleyen saf Fas argan yağı.", price: 380, imageUrl: "linear-gradient(135deg, #2a1f1f 0%, #1a1a1a 100%)" },
    { id: "p3", name: "Keratin Maske", description: "Yıpranmış saçlar için yoğun onarıcı bakım maskesi.", price: 520, imageUrl: "linear-gradient(135deg, #1f2a24 0%, #1a1a1a 100%)" },
    { id: "p4", name: "Kalıcı Oje Seti", description: "Profesyonel ev kullanımı için set.", price: 290, imageUrl: "linear-gradient(135deg, #2a1f26 0%, #1a1a1a 100%)" },
    { id: "p5", name: "Tırnak Bakım Yağı", description: "Kütikülleri yumuşatan E vitaminli yağ.", price: 220, imageUrl: "linear-gradient(135deg, #1f222a 0%, #1a1a1a 100%)" },
    { id: "p6", name: "Gül Yüz Bakım Kremi", description: "Saf gül özlü gece bakım kremi.", price: 680, imageUrl: "linear-gradient(135deg, #2a1f1f 0%, #1a1a1a 100%)" },
  ],
  galleryItems: [
    { id: "g1", category: "sac", url: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=800", label: "" },
    { id: "g2", category: "sac", url: "https://images.unsplash.com/photo-1595476108010-b4d1f10d5e43?auto=format&fit=crop&q=80&w=800", label: "" },
    { id: "g3", category: "sac", url: "https://images.unsplash.com/photo-1620331311520-246422fd82f9?auto=format&fit=crop&q=80&w=800", label: "" },
    { id: "g4", category: "sac", url: "https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&q=80&w=800", label: "" },
    { id: "g5", category: "tirnak", url: "https://images.unsplash.com/photo-1519014816548-bf5fe059e98b?auto=format&fit=crop&q=80&w=800", label: "" },
    { id: "g6", category: "tirnak", url: "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&q=80&w=800", label: "" },
    { id: "g7", category: "tirnak", url: "https://images.unsplash.com/photo-1599839619722-39751411ea63?auto=format&fit=crop&q=80&w=800", label: "" },
    { id: "g8", category: "tirnak", url: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=800", label: "" },
  ],
};

const USER_COLORS = ["#b84d5b", "#bd8c74", "#e8a5b2", "#4caf7d", "#54352b"];

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
  inventory: InventoryProduct[];
  addInventoryProduct: (p: Omit<InventoryProduct, "id">) => void;
  updateInventoryProduct: (id: string, updates: Partial<InventoryProduct>) => void;
  deleteInventoryProduct: (id: string) => void;
  stockMovements: StockMovement[];
  addStockMovement: (m: Omit<StockMovement, "id" | "date" | "stockAfter">) => void;
  
  users: SiteUser[];
  currentUser: SiteUser | null;
  registerUser: (name: string, email: string, password: string) => boolean;
  loginUser: (email: string, password: string) => boolean;
  logoutUser: () => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (isOpen: boolean) => void;

  siteContent: SiteContent;
  updateSiteContent: (updates: Partial<SiteContent>) => void;
  updateStoreProduct: (id: string, updates: Partial<StoreProduct>) => void;
  addStoreProduct: (p: Omit<StoreProduct, "id">) => void;
  deleteStoreProduct: (id: string) => void;
  addGalleryItem: (item: Omit<GalleryItem, "id">) => void;
  deleteGalleryItem: (id: string) => void;
};

const StoreContext = createContext<StoreContextType | undefined>(undefined);

function uid() { return Math.random().toString(36).substring(2, 9); }

export function StoreProvider({ children }: { children: ReactNode }) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [adisyonlar, setAdisyonlar] = useState<Adisyon[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [inventory, setInventory] = useState<InventoryProduct[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const [users, setUsers] = useState<SiteUser[]>([]);
  const [currentUser, setCurrentUser] = useState<SiteUser | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const [siteContent, setSiteContent] = useState<SiteContent>(DEFAULT_SITE_CONTENT);

  useEffect(() => {
    try {
      const keys = ["bw_appointments","bw_messages","bw_cart","bw_orders","bw_adisyonlar","bw_transactions","bw_inventory","bw_stock_movements","bw_users","bw_site_content"];
      const [a,m,c,o,ad,tr,inv,sm,usr,sc] = keys.map(k => localStorage.getItem(k));
      if (a) setAppointments(JSON.parse(a));
      if (m) setMessages(JSON.parse(m));
      if (c) setCart(JSON.parse(c));
      if (o) setOrders(JSON.parse(o));
      if (ad) setAdisyonlar(JSON.parse(ad));
      if (tr) setTransactions(JSON.parse(tr));
      if (inv) setInventory(JSON.parse(inv));
      if (sm) setStockMovements(JSON.parse(sm));
      if (usr) setUsers(JSON.parse(usr));
      if (sc) setSiteContent({ ...DEFAULT_SITE_CONTENT, ...JSON.parse(sc) });

      const currId = sessionStorage.getItem("bw_current_user_id");
      if (currId) {
        const uStr = usr ? JSON.parse(usr) : [];
        const found = uStr.find((x: SiteUser) => x.id === currId);
        if (found) setCurrentUser(found);
      }
    } catch (e) { console.error("Error loading state", e); }
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
    localStorage.setItem("bw_inventory", JSON.stringify(inventory));
    localStorage.setItem("bw_stock_movements", JSON.stringify(stockMovements));
    localStorage.setItem("bw_users", JSON.stringify(users));
    localStorage.setItem("bw_site_content", JSON.stringify(siteContent));

    if (currentUser) {
      sessionStorage.setItem("bw_current_user_id", currentUser.id);
    } else {
      sessionStorage.removeItem("bw_current_user_id");
    }
  }, [appointments, messages, cart, orders, adisyonlar, transactions, inventory, stockMovements, users, currentUser, siteContent, isLoaded]);

  const addAppointment = (app: Omit<Appointment, "id">) =>
    setAppointments(prev => [...prev, { ...app, id: uid() }]);

  const addMessage = (msg: Omit<Message, "id">) =>
    setMessages(prev => [...prev, { ...msg, id: uid() }]);

  const addToCart = (item: CartItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i);
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

  const addOrder = (order: Omit<Order, "id" | "date">) =>
    setOrders(prev => [...prev, { ...order, id: uid(), date: new Date().toISOString() }]);

  const addAdisyon = (a: Omit<Adisyon, "id" | "date">) => {
    const id = uid();
    const date = new Date().toISOString();
    setAdisyonlar(prev => [...prev, { ...a, id, date }]);
    if (a.status === "kapali") {
      setTransactions(prev => [...prev, {
        id: uid(), date, type: "gelir", category: "Adisyon",
        description: `Adisyon #${id} — ${a.customerName}`,
        amount: a.total, paymentMethod: a.paymentMethod,
      }]);
    }
  };

  const updateAdisyon = (id: string, updates: Partial<Adisyon>) => {
    setAdisyonlar(prev => prev.map(a => {
      if (a.id !== id) return a;
      const updated = { ...a, ...updates };
      if (updates.status === "kapali" && a.status !== "kapali") {
        setTransactions(t => [...t, {
          id: uid(), date: new Date().toISOString(), type: "gelir", category: "Adisyon",
          description: `Adisyon #${id} kapatıldı — ${updated.customerName}`,
          amount: updated.total, paymentMethod: updated.paymentMethod,
        }]);
      }
      return updated;
    }));
  };

  const deleteAdisyon = (id: string) => setAdisyonlar(prev => prev.filter(a => a.id !== id));

  const addTransaction = (t: Omit<Transaction, "id" | "date">) =>
    setTransactions(prev => [...prev, { ...t, id: uid(), date: new Date().toISOString() }]);

  const deleteTransaction = (id: string) => setTransactions(prev => prev.filter(t => t.id !== id));

  const addInventoryProduct = (p: Omit<InventoryProduct, "id">) =>
    setInventory(prev => [...prev, { ...p, id: uid() }]);

  const updateInventoryProduct = (id: string, updates: Partial<InventoryProduct>) =>
    setInventory(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));

  const deleteInventoryProduct = (id: string) => {
    setInventory(prev => prev.filter(p => p.id !== id));
    setStockMovements(prev => prev.filter(m => m.productId !== id));
  };

  const addStockMovement = (m: Omit<StockMovement, "id" | "date" | "stockAfter">) => {
    setInventory(prev => prev.map(p => {
      if (p.id !== m.productId) return p;
      let newStock = p.stock;
      if (m.type === "giris") newStock += m.quantity;
      else if (m.type === "cikis") newStock = Math.max(0, newStock - m.quantity);
      else newStock = m.quantity;
      const stockAfter = newStock;
      setStockMovements(sm => [...sm, { ...m, id: uid(), date: new Date().toISOString(), stockAfter }]);
      return { ...p, stock: newStock };
    }));
  };

  const registerUser = (name: string, email: string, password: string) => {
    if (users.find(u => u.email === email)) return false;
    const color = USER_COLORS[users.length % USER_COLORS.length];
    const newUser: SiteUser = { id: uid(), name, email, password, avatarColor: color, createdAt: new Date().toISOString() };
    setUsers(prev => [...prev, newUser]);
    setCurrentUser(newUser);
    return true;
  };

  const loginUser = (email: string, password: string) => {
    const u = users.find(x => x.email === email && x.password === password);
    if (!u) return false;
    setCurrentUser(u);
    return true;
  };

  const logoutUser = () => setCurrentUser(null);

  const updateSiteContent = (updates: Partial<SiteContent>) => setSiteContent(prev => ({ ...prev, ...updates }));
  const updateStoreProduct = (id: string, updates: Partial<StoreProduct>) => setSiteContent(prev => ({ ...prev, storeProducts: prev.storeProducts.map(p => p.id === id ? { ...p, ...updates } : p) }));
  const addStoreProduct = (p: Omit<StoreProduct, "id">) => setSiteContent(prev => ({ ...prev, storeProducts: [...prev.storeProducts, { ...p, id: uid() }] }));
  const deleteStoreProduct = (id: string) => setSiteContent(prev => ({ ...prev, storeProducts: prev.storeProducts.filter(p => p.id !== id) }));
  const addGalleryItem = (item: Omit<GalleryItem, "id">) => setSiteContent(prev => ({ ...prev, galleryItems: [...prev.galleryItems, { ...item, id: uid() }] }));
  const deleteGalleryItem = (id: string) => setSiteContent(prev => ({ ...prev, galleryItems: prev.galleryItems.filter(p => p.id !== id) }));

  return (
    <StoreContext.Provider value={{
      appointments, addAppointment,
      messages, addMessage,
      cart, isCartOpen, setIsCartOpen, addToCart, updateCartItem, removeFromCart, clearCart,
      orders, addOrder,
      adisyonlar, addAdisyon, updateAdisyon, deleteAdisyon,
      transactions, addTransaction, deleteTransaction,
      inventory, addInventoryProduct, updateInventoryProduct, deleteInventoryProduct,
      stockMovements, addStockMovement,
      users, currentUser, registerUser, loginUser, logoutUser, isAuthModalOpen, setIsAuthModalOpen,
      siteContent, updateSiteContent, updateStoreProduct, addStoreProduct, deleteStoreProduct, addGalleryItem, deleteGalleryItem,
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within a StoreProvider");
  return ctx;
}

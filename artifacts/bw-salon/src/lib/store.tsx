import { createContext, useContext, useState, ReactNode, useEffect, useRef } from "react";
import { useUser } from "@clerk/react";

export type AppointmentStatus = "pending" | "came" | "no_show";
export type Appointment = { id: string; name: string; phone: string; category: string; staff: string; date: string; time: string; status: AppointmentStatus; };
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
  password: string;
  avatarColor: string;
  createdAt: string;
};

export type StaffRole = "uzman" | "yonetici";

export type StaffUser = {
  id: string;
  name: string;
  staffMemberId: string;
  username: string;
  pin: string;
  role: StaffRole;
  phone: string;
  createdAt: string;
};

export type WorkEntry = {
  id: string;
  staffUserId: string;
  staffName: string;
  checkIn: string;
  checkOut?: string;
};

export type Review = {
  id: string;
  userId: string;
  userName: string;
  avatarColor: string;
  rating: number;
  text: string;
  staffMember: string;
  date: string;
};

export type StoreProduct = {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
};

export type GalleryItem = {
  id: string;
  category: "sac" | "tirnak";
  subcategory?: string;
  url: string;
  label: string;
};

export type StaffMember = {
  id: string;
  name: string;
  title: string;
  experience: string;
  rating: number;
  initials: string;
  tags: string[];
  imageUrl: string;
};

export type ContactInfo = {
  address: string;
  phone1: string;
  phone2: string;
  email: string;
  instagramHandle: string;
  instagramUrl: string;
  facebookUrl: string;
  whatsappNumber: string;
  workingHoursWeekday: string;
  workingHoursSunday: string;
  mapUrl: string;
  salonSlogan: string;
};

export type PriceItem = {
  name: string;
  price: string;
};

export type PriceList = {
  sac: PriceItem[];
  gelin: PriceItem[];
  manikur: PriceItem[];
  agda: PriceItem[];
  makyaj: PriceItem[];
};

export type AppointmentCategory = {
  key: string;
  label: string;
  enabled: boolean;
};

export type AppointmentSettings = {
  title: string;
  subtitle: string;
  timeSlots: string[];
  categories: AppointmentCategory[];
};

export type SiteContent = {
  heroImageUrl: string;
  logoImageUrl: string;
  storeProducts: StoreProduct[];
  galleryItems: GalleryItem[];
  staffMembers: StaffMember[];
  contactInfo: ContactInfo;
  priceList: PriceList;
  appointmentSettings: AppointmentSettings;
  adminCredentials: { username: string; password: string };
};

const DEFAULT_PRICE_LIST: PriceList = {
  sac: [
    { name: "Saç Kesim (Kısa)", price: "500 TL" },
    { name: "Saç Kesim (Uzun)", price: "800 TL" },
    { name: "Dip Boya", price: "1.200 TL" },
    { name: "Röfle/Balayage", price: "2.500 TL" },
    { name: "Ombre (başlangıç)", price: "5.000 TL" },
    { name: "Keratin Bakım", price: "3.000 TL" },
  ],
  gelin: [
    { name: "Gelin Paketi (Saç + Makyaj + Tırnak)", price: "12.500 TL" },
    { name: "Nişan Paketi", price: "7.500 TL" },
  ],
  manikur: [
    { name: "Klasik Manikür", price: "350 TL" },
    { name: "Kalıcı Oje", price: "500 TL" },
    { name: "Tırnak Uzatma", price: "1.200 TL" },
    { name: "Pedikür", price: "600 TL" },
  ],
  agda: [
    { name: "Tüm Vücut Ağda", price: "2.000 TL" },
    { name: "Bölgesel Ağda", price: "300-600 TL" },
  ],
  makyaj: [
    { name: "Günlük Makyaj", price: "1.000 TL" },
    { name: "Gece Makyajı", price: "1.500 TL" },
  ],
};

const DEFAULT_APPOINTMENT_SETTINGS: AppointmentSettings = {
  title: "Hızlı Randevu",
  subtitle: "Birkaç adımda online randevu alın, sizi bekliyoruz.",
  timeSlots: ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"],
  categories: [
    { key: "sac", label: "Saç Bakım & Kesim", enabled: true },
    { key: "makyaj", label: "Makyaj", enabled: true },
    { key: "gelin", label: "Gelin & Nişan Paketi", enabled: true },
    { key: "manikur", label: "Manikür & Pedikür", enabled: true },
    { key: "agda", label: "Ağda & Epilasyon", enabled: true },
    { key: "cilt", label: "Cilt Bakım", enabled: true },
  ],
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
    { id: "g1", category: "sac", subcategory: "kesim", url: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=800", label: "Saç Kesim" },
    { id: "g2", category: "sac", subcategory: "ombre", url: "https://images.unsplash.com/photo-1595476108010-b4d1f10d5e43?auto=format&fit=crop&q=80&w=800", label: "Ombre" },
    { id: "g3", category: "sac", subcategory: "boyama", url: "https://images.unsplash.com/photo-1620331311520-246422fd82f9?auto=format&fit=crop&q=80&w=800", label: "Boyama" },
    { id: "g4", category: "sac", subcategory: "sombre", url: "https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&q=80&w=800", label: "Sombre" },
    { id: "g5", category: "tirnak", url: "https://images.unsplash.com/photo-1519014816548-bf5fe059e98b?auto=format&fit=crop&q=80&w=800", label: "Kalıcı Oje" },
    { id: "g6", category: "tirnak", url: "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&q=80&w=800", label: "Tırnak Tasarımı" },
    { id: "g7", category: "tirnak", url: "https://images.unsplash.com/photo-1599839619722-39751411ea63?auto=format&fit=crop&q=80&w=800", label: "Protez Tırnak" },
    { id: "g8", category: "tirnak", url: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=800", label: "Nail Art" },
  ],
  staffMembers: [
    { id: "s1", name: "Gülcan K.", title: "Saç Uzmanı", experience: "10 yıl deneyim", rating: 4.9, initials: "GK", tags: ["Kesim", "Boya", "Keratin"], imageUrl: "" },
    { id: "s2", name: "Buse T.", title: "Makyaj Sanatçısı", experience: "8 yıl deneyim", rating: 5.0, initials: "BT", tags: ["Gelin Makyajı", "Gece Makyajı"], imageUrl: "" },
    { id: "s3", name: "Zeynep A.", title: "Tırnak Tasarımcısı", experience: "6 yıl deneyim", rating: 4.8, initials: "ZA", tags: ["Kalıcı Oje", "Protez Tırnak"], imageUrl: "" },
  ],
  contactInfo: {
    address: "Altınordu, Ordu, Türkiye",
    phone1: "+90 452 123 45 67",
    phone2: "+90 532 987 65 43",
    email: "info@blackwhitesalon.com",
    instagramHandle: "@blackwhite_guzelliks",
    instagramUrl: "https://instagram.com/blackwhite_guzelliks",
    facebookUrl: "",
    whatsappNumber: "+905329876543",
    workingHoursWeekday: "Pzt - Cmt: 09:00 - 20:00",
    workingHoursSunday: "Paz: 10:00 - 18:00",
    mapUrl: "",
    salonSlogan: "Ordu Altınordu'da Lüks Hizmet. Profesyonel kadromuzla güzelliğinize değer katıyoruz.",
  },
  priceList: DEFAULT_PRICE_LIST,
  appointmentSettings: DEFAULT_APPOINTMENT_SETTINGS,
  adminCredentials: { username: "admin", password: "admin123" },
};

const USER_COLORS = ["#b84d5b", "#bd8c74", "#e8a5b2", "#4caf7d", "#54352b"];

type StoreContextType = {
  isLoaded: boolean;
  siteContentReady: boolean;
  appointments: Appointment[];
  addAppointment: (app: Omit<Appointment, "id">) => Promise<void>;
  updateAppointmentStatus: (id: string, status: AppointmentStatus) => void;
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
  registerUser: (name: string, email: string, password: string) => Promise<boolean>;
  loginUser: (email: string, password: string) => Promise<boolean>;
  logoutUser: () => void;
  updateUser: (id: string, updates: Partial<Omit<SiteUser, "id">>) => Promise<boolean>;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (isOpen: boolean) => void;
  isProfileModalOpen: boolean;
  setIsProfileModalOpen: (v: boolean) => void;

  staffUsers: StaffUser[];
  addStaffUser: (s: Omit<StaffUser, "id" | "createdAt">) => Promise<boolean>;
  updateStaffUser: (id: string, updates: Partial<Omit<StaffUser, "id">>) => void;
  deleteStaffUser: (id: string) => void;
  loginStaffUser: (username: string, pin: string) => Promise<StaffUser | null>;
  currentStaffUser: StaffUser | null;
  setCurrentStaffUser: (u: StaffUser | null) => void;

  workEntries: WorkEntry[];
  addWorkEntry: (staffUserId: string, staffName: string) => void;
  closeWorkEntry: (id: string) => void;

  reviews: Review[];
  addReview: (r: Omit<Review, "id" | "date">) => void;
  deleteReview: (id: string) => void;

  theme: "dark" | "light";
  setTheme: (t: "dark" | "light") => void;
  language: "tr" | "en" | "ru";
  setLanguage: (l: "tr" | "en" | "ru") => void;

  siteContent: SiteContent;
  updateSiteContent: (updates: Partial<SiteContent>) => void;
  updateStoreProduct: (id: string, updates: Partial<StoreProduct>) => void;
  addStoreProduct: (p: Omit<StoreProduct, "id">) => void;
  deleteStoreProduct: (id: string) => void;
  addGalleryItem: (item: Omit<GalleryItem, "id">) => void;
  deleteGalleryItem: (id: string) => void;
  addStaffMember: (s: Omit<StaffMember, "id">) => void;
  updateStaffMember: (id: string, updates: Partial<StaffMember>) => void;
  deleteStaffMember: (id: string) => void;
  reorderStaffMembers: (id: string, direction: "up" | "down") => void;
  updatePriceItem: (category: keyof PriceList, index: number, updates: Partial<PriceItem>) => void;
  addPriceItem: (category: keyof PriceList, item: PriceItem) => void;
  deletePriceItem: (category: keyof PriceList, index: number) => void;
};

const StoreContext = createContext<StoreContextType | undefined>(undefined);

function uid() { return Math.random().toString(36).substring(2, 9) + Date.now().toString(36); }

async function api<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? `API error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

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
  const [siteContentReady, setSiteContentReady] = useState(false);

  const [users, setUsers] = useState<SiteUser[]>([]);
  const [currentUser, setCurrentUser] = useState<SiteUser | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);

  const [staffUsers, setStaffUsers] = useState<StaffUser[]>([]);
  const [currentStaffUser, setCurrentStaffUser] = useState<StaffUser | null>(null);
  const [workEntries, setWorkEntries] = useState<WorkEntry[]>([]);

  const [theme, setThemeState] = useState<"dark" | "light">(() => {
    return (localStorage.getItem("bw_theme") as "dark" | "light") ?? "dark";
  });
  const [language, setLanguageState] = useState<"tr" | "en" | "ru">(() => {
    return (localStorage.getItem("bw_language") as "tr" | "en" | "ru") ?? "tr";
  });

  const setTheme = (t: "dark" | "light") => {
    setThemeState(t);
    localStorage.setItem("bw_theme", t);
    if (t === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  };

  const setLanguage = (l: "tr" | "en" | "ru") => {
    setLanguageState(l);
    localStorage.setItem("bw_language", l);
    document.documentElement.lang = l;
  };

  const [siteContent, setSiteContent] = useState<SiteContent>(() => {
    try {
      const cached = localStorage.getItem("bw_site_content");
      if (cached) {
        const parsed = JSON.parse(cached) as SiteContent;
        return {
          ...DEFAULT_SITE_CONTENT,
          ...parsed,
          galleryItems: Array.isArray(parsed.galleryItems) ? parsed.galleryItems : DEFAULT_SITE_CONTENT.galleryItems,
          storeProducts: Array.isArray(parsed.storeProducts) ? parsed.storeProducts : DEFAULT_SITE_CONTENT.storeProducts,
          staffMembers: Array.isArray(parsed.staffMembers) ? parsed.staffMembers : DEFAULT_SITE_CONTENT.staffMembers,
          priceList: parsed.priceList ? { ...DEFAULT_PRICE_LIST, ...parsed.priceList } : DEFAULT_PRICE_LIST,
          appointmentSettings: parsed.appointmentSettings
            ? { ...DEFAULT_APPOINTMENT_SETTINGS, ...parsed.appointmentSettings, categories: Array.isArray(parsed.appointmentSettings.categories) ? parsed.appointmentSettings.categories : DEFAULT_APPOINTMENT_SETTINGS.categories }
            : DEFAULT_APPOINTMENT_SETTINGS,
        };
      }
    } catch { /* empty */ }
    return DEFAULT_SITE_CONTENT;
  });
  const siteContentLoaded = useRef(false);
  const siteContentDirty = useRef(false);
  const siteContentSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSSEUpdate = useRef(false);

  // ── Load all data from API on mount ──────────────────────
  useEffect(() => {
    async function loadAll() {
      try {
        // ── Step 1: site content önce yükle — sayfanın gerçek veriyle render olmasını sağla
        const content = await api<SiteContent | null>("/site-content").catch(() => null);
        if (content) {
          const c = content as SiteContent;
          const merged: SiteContent = {
            ...DEFAULT_SITE_CONTENT,
            ...content,
            galleryItems: Array.isArray(c.galleryItems) ? c.galleryItems : DEFAULT_SITE_CONTENT.galleryItems,
            storeProducts: Array.isArray(c.storeProducts) ? c.storeProducts : DEFAULT_SITE_CONTENT.storeProducts,
            staffMembers: Array.isArray(c.staffMembers) ? c.staffMembers : DEFAULT_SITE_CONTENT.staffMembers,
            priceList: c.priceList
              ? { ...DEFAULT_PRICE_LIST, ...c.priceList }
              : DEFAULT_PRICE_LIST,
            appointmentSettings: c.appointmentSettings
              ? { ...DEFAULT_APPOINTMENT_SETTINGS, ...c.appointmentSettings, categories: Array.isArray(c.appointmentSettings.categories) ? c.appointmentSettings.categories : DEFAULT_APPOINTMENT_SETTINGS.categories }
              : DEFAULT_APPOINTMENT_SETTINGS,
          };
          setSiteContent(merged);
          try { localStorage.setItem("bw_site_content", JSON.stringify(merged)); } catch { /* empty */ }
        }
        siteContentLoaded.current = true;
        setSiteContentReady(true);

        // ── Step 2: geri kalan tüm veriler paralel
        const [apts, msgs, adis, txns, inv, sm, rvs, su, we, usr] = await Promise.all([
          api<Record<string, unknown>[]>("/appointments").catch(() => []),
          api<Record<string, unknown>[]>("/contact-messages").catch(() => []),
          api<Adisyon[]>("/adisyonlar").catch(() => []),
          api<Transaction[]>("/transactions").catch(() => []),
          api<InventoryProduct[]>("/inventory").catch(() => []),
          api<StockMovement[]>("/stock-movements").catch(() => []),
          api<Record<string, unknown>[]>("/reviews").catch(() => []),
          api<StaffUser[]>("/staff-users").catch(() => []),
          api<WorkEntry[]>("/work-entries").catch(() => []),
          api<SiteUser[]>("/site-users").catch(() => []),
        ]);

        if (Array.isArray(apts)) {
          setAppointments(apts.map(a => ({
            id: String(a.id),
            name: String(a.name),
            phone: String(a.phone),
            category: String(a.category),
            staff: String(a.staff),
            date: String(a.date),
            time: String(a.time),
            status: (String(a.status ?? "pending")) as AppointmentStatus,
          })));
        }
        if (Array.isArray(msgs)) {
          setMessages(msgs.map(m => ({
            id: String(m.id),
            name: String(m.name),
            email: String(m.email),
            message: String(m.message),
          })));
        }
        if (Array.isArray(adis)) setAdisyonlar(adis as Adisyon[]);
        if (Array.isArray(txns)) setTransactions(txns as Transaction[]);
        if (Array.isArray(inv)) setInventory(inv as InventoryProduct[]);
        if (Array.isArray(sm)) setStockMovements(sm as StockMovement[]);
        if (Array.isArray(rvs)) {
          setReviews(rvs.map(r => ({
            id: String(r.id),
            userId: String(r.userId ?? ""),
            userName: String(r.userName ?? ""),
            avatarColor: String(r.avatarColor ?? "#b84d5b"),
            rating: Number(r.rating ?? 5),
            text: String(r.text ?? ""),
            staffMember: String(r.staffMember ?? "Genel"),
            date: String(r.createdAt ?? new Date().toISOString()),
          })));
        }
        if (Array.isArray(su)) setStaffUsers(su as StaffUser[]);
        if (Array.isArray(we)) setWorkEntries(we as WorkEntry[]);
        if (Array.isArray(usr)) setUsers(usr as SiteUser[]);

        // Restore sessions from sessionStorage
        const savedTheme = localStorage.getItem("bw_theme") as "dark" | "light" | null;
        if (savedTheme === "light") document.documentElement.classList.remove("dark");
        else document.documentElement.classList.add("dark");
        const savedLang = localStorage.getItem("bw_language");
        if (savedLang) document.documentElement.lang = savedLang;

        const currUserId = sessionStorage.getItem("bw_current_user_id");
        if (currUserId && Array.isArray(usr)) {
          const found = (usr as SiteUser[]).find(u => u.id === currUserId);
          if (found) setCurrentUser(found);
        }

        const currStaffId = sessionStorage.getItem("bw_current_staff_id");
        if (currStaffId && Array.isArray(su)) {
          const found = (su as StaffUser[]).find(u => u.id === currStaffId);
          if (found) setCurrentStaffUser(found);
        }

        // Restore cart from localStorage (device-specific)
        try {
          const savedCart = localStorage.getItem("bw_cart");
          if (savedCart) setCart(JSON.parse(savedCart));
        } catch { /* empty */ }
      } catch (e) {
        console.error("Failed to load data from API", e);
      }
      setIsLoaded(true);
    }
    loadAll();
  }, []);

  // ── Clerk OAuth sync ──────────────────────────────────────
  const { user: clerkUser, isSignedIn } = useUser();
  const clerkSynced = useRef(false);
  useEffect(() => {
    if (!isSignedIn || !clerkUser || currentUser || clerkSynced.current) return;
    clerkSynced.current = true;
    api<SiteUser>("/site-users/clerk-sync", { method: "POST" })
      .then(u => {
        setCurrentUser(u);
        setUsers(prev => prev.find(x => x.id === u.id) ? prev.map(x => x.id === u.id ? u : x) : [...prev, u]);
        sessionStorage.setItem("bw_current_user_id", u.id);
      })
      .catch(() => { clerkSynced.current = false; });
  }, [isSignedIn, clerkUser, currentUser]);

  useEffect(() => {
    if (!isSignedIn) clerkSynced.current = false;
  }, [isSignedIn]);

  // ── Persist cart locally ──────────────────────────────────
  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem("bw_cart", JSON.stringify(cart));
  }, [cart, isLoaded]);

  // ── Persist session ───────────────────────────────────────
  useEffect(() => {
    if (currentUser) sessionStorage.setItem("bw_current_user_id", currentUser.id);
    else sessionStorage.removeItem("bw_current_user_id");
  }, [currentUser]);

  useEffect(() => {
    if (currentStaffUser) sessionStorage.setItem("bw_current_staff_id", currentStaffUser.id);
    else sessionStorage.removeItem("bw_current_staff_id");
  }, [currentStaffUser]);

  // ── Sync siteContent to localStorage + API whenever it changes ───
  useEffect(() => {
    if (!siteContentLoaded.current) return;
    if (!siteContentDirty.current) { siteContentDirty.current = true; return; }
    // SSE'den gelen güncellemeler zaten sunucuda kayıtlı — tekrar kaydetme
    if (isSSEUpdate.current) { isSSEUpdate.current = false; return; }
    const json = JSON.stringify(siteContent);
    try { localStorage.setItem("bw_site_content", json); } catch { /* empty */ }
    if (siteContentSaveTimer.current) clearTimeout(siteContentSaveTimer.current);
    siteContentSaveTimer.current = setTimeout(() => {
      api("/site-content", { method: "PUT", body: json }).catch(console.error);
    }, 150);
  }, [siteContent]);

  // ── SSE: tüm tarayıcı/cihazlara anlık içerik senkronizasyonu ────
  useEffect(() => {
    function applySSEContent(raw: SiteContent) {
      const c = raw;
      const merged: SiteContent = {
        ...DEFAULT_SITE_CONTENT,
        ...raw,
        galleryItems: Array.isArray(c.galleryItems) ? c.galleryItems : DEFAULT_SITE_CONTENT.galleryItems,
        storeProducts: Array.isArray(c.storeProducts) ? c.storeProducts : DEFAULT_SITE_CONTENT.storeProducts,
        staffMembers: Array.isArray(c.staffMembers) ? c.staffMembers : DEFAULT_SITE_CONTENT.staffMembers,
        priceList: c.priceList ? { ...DEFAULT_PRICE_LIST, ...c.priceList } : DEFAULT_PRICE_LIST,
        appointmentSettings: c.appointmentSettings
          ? { ...DEFAULT_APPOINTMENT_SETTINGS, ...c.appointmentSettings, categories: Array.isArray(c.appointmentSettings.categories) ? c.appointmentSettings.categories : DEFAULT_APPOINTMENT_SETTINGS.categories }
          : DEFAULT_APPOINTMENT_SETTINGS,
      };
      isSSEUpdate.current = true;
      setSiteContent(merged);
      try { localStorage.setItem("bw_site_content", JSON.stringify(merged)); } catch { /* empty */ }
    }

    const es = new EventSource("/api/site-content/events");
    es.onmessage = (event) => {
      try {
        if (!event.data || event.data === "ping") return;
        applySSEContent(JSON.parse(event.data) as SiteContent);
      } catch { /* empty */ }
    };
    es.onerror = () => { /* tarayıcı otomatik yeniden bağlanır */ };
    return () => es.close();
  }, []);

  // ── Appointments ──────────────────────────────────────────
  const addAppointment = async (app: Omit<Appointment, "id">): Promise<void> => {
    const created = await api<Appointment>("/appointments", {
      method: "POST",
      body: JSON.stringify(app),
    });
    setAppointments(prev => [...prev, { ...created, id: String(created.id), status: (created.status ?? "pending") as AppointmentStatus }]);
  };

  const updateAppointmentStatus = (id: string, status: AppointmentStatus) => {
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    api(`/appointments/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }).catch(console.error);
  };

  // ── Messages ──────────────────────────────────────────────
  const addMessage = (msg: Omit<Message, "id">) => {
    const tempId = uid();
    setMessages(prev => [...prev, { ...msg, id: tempId }]);
    api<Message>("/contact-messages", { method: "POST", body: JSON.stringify(msg) })
      .then(created => {
        setMessages(prev => prev.map(m => m.id === tempId ? { ...created, id: String(created.id) } : m));
      })
      .catch(console.error);
  };

  // ── Cart ──────────────────────────────────────────────────
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

  // ── Adisyonlar ────────────────────────────────────────────
  const addAdisyon = (a: Omit<Adisyon, "id" | "date">) => {
    const id = uid();
    const newAdisyon: Adisyon = { ...a, id, date: new Date().toISOString() };
    setAdisyonlar(prev => [...prev, newAdisyon]);
    api("/adisyonlar", { method: "POST", body: JSON.stringify({ ...newAdisyon }) }).catch(console.error);
    if (a.status === "kapali") {
      const txn: Transaction = { id: uid(), date: newAdisyon.date, type: "gelir", category: "Adisyon", description: `Adisyon #${id} — ${a.customerName}`, amount: a.total, paymentMethod: a.paymentMethod };
      setTransactions(prev => [...prev, txn]);
    }
  };

  const updateAdisyon = (id: string, updates: Partial<Adisyon>) => {
    setAdisyonlar(prev => prev.map(a => {
      if (a.id !== id) return a;
      const updated = { ...a, ...updates };
      if (updates.status === "kapali" && a.status !== "kapali") {
        const txn: Transaction = { id: uid(), date: new Date().toISOString(), type: "gelir", category: "Adisyon", description: `Adisyon #${id} kapatıldı — ${updated.customerName}`, amount: updated.total, paymentMethod: updated.paymentMethod };
        setTransactions(t => [...t, txn]);
        api("/transactions", { method: "POST", body: JSON.stringify(txn) }).catch(console.error);
      }
      return updated;
    }));
    api(`/adisyonlar/${id}`, { method: "PUT", body: JSON.stringify(updates) }).catch(console.error);
  };

  const deleteAdisyon = (id: string) => {
    setAdisyonlar(prev => prev.filter(a => a.id !== id));
    api(`/adisyonlar/${id}`, { method: "DELETE" }).catch(console.error);
  };

  // ── Transactions ──────────────────────────────────────────
  const addTransaction = (t: Omit<Transaction, "id" | "date">) => {
    const txn: Transaction = { ...t, id: uid(), date: new Date().toISOString() };
    setTransactions(prev => [...prev, txn]);
    api("/transactions", { method: "POST", body: JSON.stringify(txn) }).catch(console.error);
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    api(`/transactions/${id}`, { method: "DELETE" }).catch(console.error);
  };

  // ── Inventory ─────────────────────────────────────────────
  const addInventoryProduct = (p: Omit<InventoryProduct, "id">) => {
    const id = uid();
    const product: InventoryProduct = { ...p, id };
    setInventory(prev => [...prev, product]);
    api("/inventory", { method: "POST", body: JSON.stringify(product) }).catch(console.error);
  };

  const updateInventoryProduct = (id: string, updates: Partial<InventoryProduct>) => {
    setInventory(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    api(`/inventory/${id}`, { method: "PUT", body: JSON.stringify(updates) }).catch(console.error);
  };

  const deleteInventoryProduct = (id: string) => {
    setInventory(prev => prev.filter(p => p.id !== id));
    setStockMovements(prev => prev.filter(m => m.productId !== id));
    api(`/inventory/${id}`, { method: "DELETE" }).catch(console.error);
  };

  const addStockMovement = (m: Omit<StockMovement, "id" | "date" | "stockAfter">) => {
    setInventory(prev => prev.map(p => {
      if (p.id !== m.productId) return p;
      let newStock = p.stock;
      if (m.type === "giris") newStock += m.quantity;
      else if (m.type === "cikis") newStock = Math.max(0, newStock - m.quantity);
      else newStock = m.quantity;
      const movement: StockMovement = { ...m, id: uid(), date: new Date().toISOString(), stockAfter: newStock };
      setStockMovements(sm => [...sm, movement]);
      api("/stock-movements", { method: "POST", body: JSON.stringify(movement) }).catch(console.error);
      return { ...p, stock: newStock };
    }));
  };

  // ── Site Users (custom auth) ──────────────────────────────
  const registerUser = async (name: string, email: string, password: string): Promise<boolean> => {
    const color = USER_COLORS[users.length % USER_COLORS.length];
    const id = uid();
    try {
      const created = await api<SiteUser>("/site-users/register", {
        method: "POST",
        body: JSON.stringify({ id, name, email, password, avatarColor: color }),
      });
      setUsers(prev => [...prev, created]);
      setCurrentUser(created);
      return true;
    } catch {
      return false;
    }
  };

  const loginUser = async (email: string, password: string): Promise<boolean> => {
    try {
      const user = await api<SiteUser>("/site-users/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setUsers(prev => prev.find(u => u.id === user.id) ? prev : [...prev, user]);
      setCurrentUser(user);
      return true;
    } catch {
      return false;
    }
  };

  const logoutUser = () => setCurrentUser(null);

  const updateUser = async (id: string, updates: Partial<Omit<SiteUser, "id">>): Promise<boolean> => {
    try {
      const updated = await api<SiteUser>(`/site-users/${id}`, {
        method: "PUT",
        body: JSON.stringify(updates),
      });
      setUsers(prev => prev.map(u => u.id === id ? updated : u));
      setCurrentUser(prev => prev?.id === id ? updated : prev);
      return true;
    } catch {
      return false;
    }
  };

  // ── Staff Users ───────────────────────────────────────────
  const addStaffUser = async (s: Omit<StaffUser, "id" | "createdAt">): Promise<boolean> => {
    try {
      const created = await api<StaffUser>("/staff-users", {
        method: "POST",
        body: JSON.stringify({ ...s, id: uid() }),
      });
      setStaffUsers(prev => [...prev, created]);
      return true;
    } catch {
      return false;
    }
  };

  const updateStaffUser = (id: string, updates: Partial<Omit<StaffUser, "id">>) => {
    setStaffUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
    setCurrentStaffUser(prev => prev?.id === id ? { ...prev, ...updates } as StaffUser : prev);
    api(`/staff-users/${id}`, { method: "PUT", body: JSON.stringify(updates) }).catch(console.error);
  };

  const deleteStaffUser = (id: string) => {
    setStaffUsers(prev => prev.filter(u => u.id !== id));
    if (currentStaffUser?.id === id) setCurrentStaffUser(null);
    api(`/staff-users/${id}`, { method: "DELETE" }).catch(console.error);
  };

  const loginStaffUser = async (username: string, pin: string): Promise<StaffUser | null> => {
    try {
      const user = await api<StaffUser>("/staff-users/login", {
        method: "POST",
        body: JSON.stringify({ username, pin }),
      });
      setCurrentStaffUser(user);
      return user;
    } catch {
      return null;
    }
  };

  // ── Work Entries ──────────────────────────────────────────
  const addWorkEntry = (staffUserId: string, staffName: string) => {
    const entry: WorkEntry = { id: uid(), staffUserId, staffName, checkIn: new Date().toISOString() };
    setWorkEntries(prev => [...prev, entry]);
    api("/work-entries", { method: "POST", body: JSON.stringify(entry) }).catch(console.error);
  };

  const closeWorkEntry = (id: string) => {
    const checkOut = new Date().toISOString();
    setWorkEntries(prev => prev.map(e => e.id === id ? { ...e, checkOut } : e));
    api(`/work-entries/${id}/checkout`, { method: "PUT", body: JSON.stringify({ checkOut }) }).catch(console.error);
  };

  // ── Reviews ───────────────────────────────────────────────
  const addReview = (r: Omit<Review, "id" | "date">) => {
    const tempId = uid();
    const review: Review = { ...r, id: tempId, date: new Date().toISOString() };
    setReviews(prev => [...prev, review]);
    api<{ id: number; createdAt: string } & Review>("/reviews", {
      method: "POST",
      body: JSON.stringify({ ...r }),
    }).then(created => {
      setReviews(prev => prev.map(rv => rv.id === tempId ? { ...created, id: String(created.id), date: created.createdAt } : rv));
    }).catch(console.error);
  };

  const deleteReview = (id: string) => {
    setReviews(prev => prev.filter(r => r.id !== id));
  };

  // ── Site Content mutations ────────────────────────────────
  const updateSiteContent = (updates: Partial<SiteContent>) =>
    setSiteContent(prev => ({ ...prev, ...updates }));

  const updateStoreProduct = (id: string, updates: Partial<StoreProduct>) =>
    setSiteContent(prev => ({ ...prev, storeProducts: prev.storeProducts.map(p => p.id === id ? { ...p, ...updates } : p) }));

  const addStoreProduct = (p: Omit<StoreProduct, "id">) =>
    setSiteContent(prev => ({ ...prev, storeProducts: [...prev.storeProducts, { ...p, id: uid() }] }));

  const deleteStoreProduct = (id: string) =>
    setSiteContent(prev => ({ ...prev, storeProducts: prev.storeProducts.filter(p => p.id !== id) }));

  const addGalleryItem = (item: Omit<GalleryItem, "id">) =>
    setSiteContent(prev => ({ ...prev, galleryItems: [...prev.galleryItems, { ...item, id: uid() }] }));

  const deleteGalleryItem = (id: string) =>
    setSiteContent(prev => ({ ...prev, galleryItems: prev.galleryItems.filter(p => p.id !== id) }));

  const addStaffMember = (s: Omit<StaffMember, "id">) =>
    setSiteContent(prev => ({ ...prev, staffMembers: [...prev.staffMembers, { ...s, id: uid() }] }));

  const updateStaffMember = (id: string, updates: Partial<StaffMember>) =>
    setSiteContent(prev => ({ ...prev, staffMembers: prev.staffMembers.map(s => s.id === id ? { ...s, ...updates } : s) }));

  const deleteStaffMember = (id: string) =>
    setSiteContent(prev => ({ ...prev, staffMembers: prev.staffMembers.filter(s => s.id !== id) }));

  const reorderStaffMembers = (id: string, direction: "up" | "down") =>
    setSiteContent(prev => {
      const arr = [...prev.staffMembers];
      const idx = arr.findIndex(s => s.id === id);
      if (idx === -1) return prev;
      const newIdx = direction === "up" ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= arr.length) return prev;
      [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
      return { ...prev, staffMembers: arr };
    });

  const updatePriceItem = (category: keyof PriceList, index: number, updates: Partial<PriceItem>) =>
    setSiteContent(prev => ({
      ...prev,
      priceList: { ...prev.priceList, [category]: prev.priceList[category].map((item, i) => i === index ? { ...item, ...updates } : item) },
    }));

  const addPriceItem = (category: keyof PriceList, item: PriceItem) =>
    setSiteContent(prev => ({
      ...prev,
      priceList: { ...prev.priceList, [category]: [...prev.priceList[category], item] },
    }));

  const deletePriceItem = (category: keyof PriceList, index: number) =>
    setSiteContent(prev => ({
      ...prev,
      priceList: { ...prev.priceList, [category]: prev.priceList[category].filter((_, i) => i !== index) },
    }));

  return (
    <StoreContext.Provider value={{
      appointments, addAppointment, updateAppointmentStatus,
      messages, addMessage,
      cart, isCartOpen, setIsCartOpen, addToCart, updateCartItem, removeFromCart, clearCart,
      orders, addOrder,
      adisyonlar, addAdisyon, updateAdisyon, deleteAdisyon,
      transactions, addTransaction, deleteTransaction,
      inventory, addInventoryProduct, updateInventoryProduct, deleteInventoryProduct,
      stockMovements, addStockMovement,
      users, currentUser, registerUser, loginUser, logoutUser, updateUser, isAuthModalOpen, setIsAuthModalOpen, isProfileModalOpen, setIsProfileModalOpen,
      staffUsers, addStaffUser, updateStaffUser, deleteStaffUser, loginStaffUser, currentStaffUser, setCurrentStaffUser,
      workEntries, addWorkEntry, closeWorkEntry,
      reviews, addReview, deleteReview,
      theme, setTheme, language, setLanguage,
      isLoaded,
      siteContentReady,
      siteContent, updateSiteContent, updateStoreProduct, addStoreProduct, deleteStoreProduct, addGalleryItem, deleteGalleryItem, addStaffMember, updateStaffMember, deleteStaffMember, reorderStaffMembers,
      updatePriceItem, addPriceItem, deletePriceItem,
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

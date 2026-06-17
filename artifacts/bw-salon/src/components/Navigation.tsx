import { ShoppingBag, Menu, X, User, LogOut, Package, Settings } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { AuthModal } from "@/components/AuthModal";
import { ProfileModal } from "@/components/ProfileModal";
import { UserOrdersModal } from "@/components/UserOrdersModal";

export function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isOrdersModalOpen, setIsOrdersModalOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const {
    cart, setIsCartOpen,
    currentUser, setIsAuthModalOpen, logoutUser,
    setIsProfileModalOpen,
    siteContent,
  } = useStore();

  const cartItemsCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close user menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const navLinks = [
    { name: "Anasayfa", href: "#hero" },
    { name: "Hakkımızda", href: "#staff" },
    { name: "Fiyat Listesi", href: "#pricing" },
    { name: "Koleksiyon", href: "#gallery" },
    { name: "Mağaza", href: "#store" },
    { name: "İletişim", href: "#contact" },
  ];

  const scrollTo = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const initials = currentUser
    ? currentUser.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
    : "";

  return (
    <>
      <nav className={`sticky top-0 z-50 w-full transition-all duration-300 ${isScrolled ? "bg-background/95 backdrop-blur-md shadow-sm" : "bg-transparent"}`}>
        <div className="container mx-auto px-4 md:px-8 h-16 md:h-20 flex items-center justify-between">

          {/* Logo */}
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full border border-primary/50 flex items-center justify-center bg-card overflow-hidden shrink-0">
              {siteContent.logoImageUrl
                ? <img src={siteContent.logoImageUrl} alt="Logo" className="w-full h-full object-cover" />
                : <span className="font-serif font-bold text-sm md:text-lg text-primary">BW</span>
              }
            </div>
            <span className={`font-bold text-base md:text-xl tracking-wider uppercase transition-colors ${isScrolled ? "text-foreground" : "text-white"}`}>
              Black White
            </span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6 lg:gap-8">
            <div className="flex gap-4 lg:gap-6">
              {navLinks.map(link => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={e => scrollTo(e, link.href)}
                  className={`text-sm font-medium hover:text-primary transition-colors ${isScrolled ? "text-foreground/80" : "text-white/90"}`}
                >
                  {link.name}
                </a>
              ))}
            </div>

            {/* Cart */}
            <button
              data-testid="button-cart"
              className={`relative p-2 hover:text-primary transition-colors ${isScrolled ? "text-foreground" : "text-white"}`}
              onClick={() => setIsCartOpen(true)}
            >
              <ShoppingBag className="w-5 h-5" />
              {cartItemsCount > 0 && (
                <span className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {cartItemsCount}
                </span>
              )}
            </button>

            {/* Auth */}
            {currentUser ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(v => !v)}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm transition-transform hover:scale-105 ring-2 ring-transparent hover:ring-primary/50"
                  style={{ backgroundColor: currentUser.avatarColor }}
                  data-testid="button-user-menu"
                >
                  {initials}
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 top-12 w-56 bg-card border border-border rounded-xl shadow-xl py-1 z-50">
                    <div className="px-4 py-3 border-b border-border">
                      <p className="font-semibold text-sm truncate">{currentUser.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{currentUser.email}</p>
                    </div>
                    <button
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted/50 transition-colors text-left"
                      onClick={() => { setIsUserMenuOpen(false); setIsProfileModalOpen(true); }}
                    >
                      <User className="w-4 h-4 text-primary" /> Profilim
                    </button>
                    <button
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted/50 transition-colors text-left"
                      onClick={() => { setIsUserMenuOpen(false); setIsOrdersModalOpen(true); }}
                    >
                      <Package className="w-4 h-4 text-primary" /> Siparişlerim
                    </button>
                    <button
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted/50 transition-colors text-left"
                      onClick={() => { setIsUserMenuOpen(false); setIsProfileModalOpen(true); }}
                    >
                      <Settings className="w-4 h-4 text-primary" /> Ayarlar
                    </button>
                    <div className="border-t border-border mt-1 pt-1">
                      <button
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-destructive/10 text-destructive transition-colors text-left"
                        onClick={() => { setIsUserMenuOpen(false); logoutUser(); }}
                      >
                        <LogOut className="w-4 h-4" /> Çıkış Yap
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className={`hover:bg-primary/20 hover:text-primary ${isScrolled ? "text-foreground" : "text-white"}`}
                onClick={() => setIsAuthModalOpen(true)}
              >
                Giriş Yap
              </Button>
            )}
          </div>

          {/* Mobile Right Side */}
          <div className="flex md:hidden items-center gap-2">
            <button
              className={`relative p-2 ${isScrolled ? "text-foreground" : "text-white"}`}
              onClick={() => setIsCartOpen(true)}
              data-testid="button-cart-mobile"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartItemsCount > 0 && (
                <span className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {cartItemsCount}
                </span>
              )}
            </button>

            {/* Mobile Avatar or Login */}
            {currentUser ? (
              <button
                onClick={() => setIsMobileMenuOpen(v => !v)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs"
                style={{ backgroundColor: currentUser.avatarColor }}
              >
                {initials}
              </button>
            ) : (
              <button
                className={`p-1.5 ${isScrolled ? "text-foreground" : "text-white"}`}
                onClick={() => setIsAuthModalOpen(true)}
                aria-label="Giriş Yap"
              >
                <User className="w-5 h-5" />
              </button>
            )}

            <button
              className={`p-1.5 ${isScrolled ? "text-foreground" : "text-white"}`}
              onClick={() => setIsMobileMenuOpen(v => !v)}
              aria-label="Menü"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 w-full bg-background/98 backdrop-blur-md border-b border-border shadow-xl z-40">
            {/* Nav Links */}
            <div className="px-4 py-2">
              {navLinks.map(link => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={e => scrollTo(e, link.href)}
                  className="flex items-center py-3 text-base font-medium text-foreground border-b border-border/50 last:border-0 hover:text-primary transition-colors"
                >
                  {link.name}
                </a>
              ))}
            </div>

            {/* User section in mobile */}
            <div className="border-t border-border px-4 py-3">
              {currentUser ? (
                <>
                  {/* User info */}
                  <div className="flex items-center gap-3 mb-3 pb-3 border-b border-border/50">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                      style={{ backgroundColor: currentUser.avatarColor }}
                    >
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{currentUser.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{currentUser.email}</p>
                    </div>
                  </div>
                  <button
                    className="w-full flex items-center gap-3 py-2.5 text-sm text-foreground hover:text-primary transition-colors"
                    onClick={() => { setIsMobileMenuOpen(false); setIsProfileModalOpen(true); }}
                  >
                    <User className="w-4 h-4 text-primary" /> Profilim
                  </button>
                  <button
                    className="w-full flex items-center gap-3 py-2.5 text-sm text-foreground hover:text-primary transition-colors"
                    onClick={() => { setIsMobileMenuOpen(false); setIsOrdersModalOpen(true); }}
                  >
                    <Package className="w-4 h-4 text-primary" /> Siparişlerim
                  </button>
                  <button
                    className="w-full flex items-center gap-3 py-2.5 text-sm text-foreground hover:text-primary transition-colors"
                    onClick={() => { setIsMobileMenuOpen(false); setIsProfileModalOpen(true); }}
                  >
                    <Settings className="w-4 h-4 text-primary" /> Ayarlar
                  </button>
                  <button
                    className="w-full flex items-center gap-3 py-2.5 text-sm text-destructive hover:bg-destructive/10 rounded-md transition-colors mt-1"
                    onClick={() => { setIsMobileMenuOpen(false); logoutUser(); }}
                  >
                    <LogOut className="w-4 h-4" /> Çıkış Yap
                  </button>
                </>
              ) : (
                <Button
                  className="w-full bg-[#b84d5b] hover:bg-[#b84d5b]/90 text-white"
                  onClick={() => { setIsMobileMenuOpen(false); setIsAuthModalOpen(true); }}
                >
                  Giriş Yap / Kayıt Ol
                </Button>
              )}
            </div>
          </div>
        )}
      </nav>

      <AuthModal />
      <ProfileModal />
      <UserOrdersModal open={isOrdersModalOpen} onOpenChange={setIsOrdersModalOpen} />
    </>
  );
}

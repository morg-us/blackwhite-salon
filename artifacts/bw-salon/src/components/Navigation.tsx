import { ShoppingBag, Menu, X, User } from "lucide-react";
import { useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AuthModal } from "@/components/AuthModal";
import { UserOrdersModal } from "@/components/UserOrdersModal";

export function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isOrdersModalOpen, setIsOrdersModalOpen] = useState(false);
  const { cart, setIsCartOpen, currentUser, setIsAuthModalOpen, logoutUser, siteContent } = useStore();

  const cartItemsCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
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
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <nav className={`sticky top-0 z-50 w-full transition-all duration-300 ${isScrolled ? "bg-background/95 backdrop-blur-md shadow-sm" : "bg-transparent"}`}>
      <div className="container mx-auto px-4 md:px-8 h-20 flex items-center justify-between">
        
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full border border-primary/50 flex items-center justify-center bg-card overflow-hidden">
            {siteContent.logoImageUrl ? (
              <img src={siteContent.logoImageUrl} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <span className="font-serif font-bold text-lg text-primary">BW</span>
            )}
          </div>
          <span className={`font-bold text-xl tracking-wider uppercase transition-colors ${isScrolled ? "text-foreground" : "text-white"}`}>
            Black White
          </span>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          <div className="flex gap-6">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => scrollTo(e, link.href)}
                className={`text-sm font-medium hover:text-primary transition-colors ${isScrolled ? "text-foreground/80" : "text-white/90"}`}
              >
                {link.name}
              </a>
            ))}
          </div>
          
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

          {currentUser ? (
            <Popover>
              <PopoverTrigger asChild>
                <button 
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white font-medium text-sm ml-2 transition-transform hover:scale-105"
                  style={{ backgroundColor: currentUser.avatarColor }}
                >
                  {currentUser.name.substring(0, 2).toUpperCase()}
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-56 p-2">
                <div className="px-2 py-1.5 border-b border-border mb-1">
                  <p className="font-medium text-sm truncate">{currentUser.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{currentUser.email}</p>
                </div>
                <Button variant="ghost" className="w-full justify-start text-sm h-8" onClick={() => {}}>Profilim</Button>
                <Button variant="ghost" className="w-full justify-start text-sm h-8" onClick={() => setIsOrdersModalOpen(true)}>Geçmiş Siparişlerim</Button>
                <Button variant="ghost" className="w-full justify-start text-sm h-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={logoutUser}>Çıkış Yap</Button>
              </PopoverContent>
            </Popover>
          ) : (
            <Button 
              variant="ghost" 
              className={`ml-2 hover:bg-primary/20 hover:text-primary ${isScrolled ? "text-foreground" : "text-white"}`}
              onClick={() => setIsAuthModalOpen(true)}
            >
              Giriş Yap
            </Button>
          )}
        </div>

        {/* Mobile Toggle */}
        <div className="flex md:hidden items-center gap-4">
          <button 
            className={`relative p-2 ${isScrolled ? "text-foreground" : "text-white"}`}
            onClick={() => setIsCartOpen(true)}
          >
            <ShoppingBag className="w-5 h-5" />
            {cartItemsCount > 0 && (
              <span className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {cartItemsCount}
              </span>
            )}
          </button>
          
          <button 
            className={isScrolled ? "text-foreground" : "text-white"}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-20 left-0 w-full bg-background border-b border-border shadow-lg py-4 px-4 flex flex-col gap-4">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              onClick={(e) => scrollTo(e, link.href)}
              className="text-base font-medium text-foreground py-2 border-b border-border/50 last:border-0 hover:text-primary transition-colors"
            >
              {link.name}
            </a>
          ))}
        </div>
      )}
      <AuthModal />
      <UserOrdersModal open={isOrdersModalOpen} onOpenChange={setIsOrdersModalOpen} />
    </nav>
  );
}

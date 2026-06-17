import { Instagram, Facebook, MessageCircle } from "lucide-react";
import { useStore } from "@/lib/store";

export function Footer() {
  const { siteContent } = useStore();
  const ci = siteContent.contactInfo;

  const handleLogoClick = (e: React.MouseEvent) => {
    if (e.detail === 3) {
      window.location.hash = "#admin";
    }
  };

  return (
    <footer className="bg-black py-12 border-t border-border text-center md:text-left">
      <div className="container px-4 mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-8">

          <div className="max-w-xs">
            <div
              className="flex items-center justify-center md:justify-start gap-3 mb-4 cursor-pointer select-none"
              onClick={handleLogoClick}
              title="Triple click for admin panel"
            >
              <div className="w-8 h-8 rounded-full border border-primary/50 flex items-center justify-center bg-card overflow-hidden">
                {siteContent.logoImageUrl
                  ? <img src={siteContent.logoImageUrl} alt="Logo" className="w-full h-full object-cover" />
                  : <span className="font-serif font-bold text-sm text-primary">BW</span>
                }
              </div>
              <span className="font-bold text-lg tracking-wider uppercase text-foreground">
                Black White
              </span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {ci.salonSlogan || "Ordu Altınordu'da Lüks Hizmet. Profesyonel kadromuzla güzelliğinize değer katıyoruz."}
            </p>
          </div>

          <div className="flex gap-8 text-sm">
            <div className="flex flex-col gap-2">
              <a href="#hero" className="text-muted-foreground hover:text-primary transition-colors">Anasayfa</a>
              <a href="#staff" className="text-muted-foreground hover:text-primary transition-colors">Hakkımızda</a>
              <a href="#pricing" className="text-muted-foreground hover:text-primary transition-colors">Fiyat Listesi</a>
            </div>
            <div className="flex flex-col gap-2">
              <a href="#gallery" className="text-muted-foreground hover:text-primary transition-colors">Koleksiyon</a>
              <a href="#store" className="text-muted-foreground hover:text-primary transition-colors">Mağaza</a>
              <a href="#contact" className="text-muted-foreground hover:text-primary transition-colors">İletişim</a>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {ci.instagramUrl && (
              <a
                href={ci.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
            )}
            {ci.facebookUrl && (
              <a
                href={ci.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
            )}
            {ci.whatsappNumber && (
              <a
                href={`https://wa.me/${ci.whatsappNumber.replace(/\D/g,"")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"
                aria-label="WhatsApp"
              >
                <MessageCircle className="w-5 h-5" />
              </a>
            )}
          </div>

        </div>

        <div className="border-t border-border mt-12 pt-8 text-center text-xs text-muted-foreground flex flex-col md:flex-row justify-between items-center gap-4">
          <p>© 2025 Black White Güzellik Salonu. Tüm hakları saklıdır.</p>
          <p className="font-serif italic">Tasarım & Yazılım</p>
        </div>
      </div>
    </footer>
  );
}

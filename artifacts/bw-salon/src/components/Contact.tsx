import { useState } from "react";
import { MapPin, Phone, Instagram, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useStore } from "@/lib/store";

export function Contact() {
  const { toast } = useToast();
  const { addMessage } = useStore();
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    setTimeout(() => {
      addMessage(formData);
      setFormData({ name: "", email: "", message: "" });
      setIsSubmitting(false);
      toast({
        title: "Mesajınız İletildi",
        description: "En kısa sürede size dönüş yapacağız.",
      });
    }, 1000);
  };

  return (
    <section id="contact" className="py-24 bg-card/50">
      <div className="container px-4 mx-auto max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 font-serif">İletişim</h2>
            <div className="h-1 w-20 bg-primary mb-8"></div>
            
            <div className="space-y-6 mb-8 text-muted-foreground">
              <div className="flex items-start gap-4">
                <MapPin className="w-6 h-6 text-primary flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-foreground">Adres</h4>
                  <p>Altınordu, Ordu, Türkiye</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Phone className="w-6 h-6 text-primary flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-foreground">Telefon</h4>
                  <p>+90 452 123 45 67</p>
                  <p>+90 532 987 65 43</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Instagram className="w-6 h-6 text-primary flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-foreground">Instagram</h4>
                  <a href="#" className="hover:text-primary transition-colors">@blackwhite_guzelliks</a>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Clock className="w-6 h-6 text-primary flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-foreground">Çalışma Saatleri</h4>
                  <p>Pzt - Cmt: 09:00 - 20:00</p>
                  <p>Paz: 10:00 - 18:00</p>
                </div>
              </div>
            </div>

            <div className="w-full h-64 bg-background border border-border rounded-xl flex items-center justify-center relative overflow-hidden group">
               <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=800')] bg-cover opacity-20 group-hover:opacity-30 transition-opacity grayscale" />
               <div className="flex flex-col items-center relative z-10 p-4 bg-background/80 backdrop-blur rounded-lg border border-border/50">
                 <MapPin className="w-8 h-8 text-primary mb-2" />
                 <span className="font-medium text-sm">Haritada Görüntüle</span>
               </div>
            </div>
          </div>

          <div className="bg-card p-8 rounded-2xl border border-border shadow-lg">
            <h3 className="text-2xl font-serif font-bold mb-6">Bize Yazın</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Ad Soyad</label>
                <Input 
                  required 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="bg-background border-border" 
                  placeholder="Adınız Soyadınız"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Email</label>
                <Input 
                  required 
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className="bg-background border-border" 
                  placeholder="ornek@email.com"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Mesajınız</label>
                <Textarea 
                  required 
                  value={formData.message}
                  onChange={e => setFormData({...formData, message: e.target.value})}
                  className="bg-background border-border min-h-[150px]" 
                  placeholder="Nasıl yardımcı olabiliriz?"
                />
              </div>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground mt-4"
                data-testid="button-submit-contact"
              >
                {isSubmitting ? "Gönderiliyor..." : "Mesaj Gönder"}
              </Button>
            </form>
          </div>

        </div>
      </div>
    </section>
  );
}

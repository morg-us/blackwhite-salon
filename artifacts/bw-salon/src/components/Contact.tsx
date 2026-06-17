import { useState } from "react";
import { MapPin, Phone, Instagram, Clock, Mail, MessageCircle, Facebook } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useStore } from "@/lib/store";

export function Contact() {
  const { toast } = useToast();
  const { addMessage, siteContent } = useStore();
  const ci = siteContent.contactInfo;
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      addMessage(formData);
      setFormData({ name: "", email: "", message: "" });
      setIsSubmitting(false);
      toast({ title: "Mesajınız İletildi", description: "En kısa sürede size dönüş yapacağız." });
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
                <MapPin className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-foreground">Adres</h4>
                  <p>{ci.address}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <Phone className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-foreground">Telefon</h4>
                  {ci.phone1 && <p><a href={`tel:${ci.phone1.replace(/\s/g,"")}`} className="hover:text-primary transition-colors">{ci.phone1}</a></p>}
                  {ci.phone2 && <p><a href={`tel:${ci.phone2.replace(/\s/g,"")}`} className="hover:text-primary transition-colors">{ci.phone2}</a></p>}
                </div>
              </div>

              {ci.email && (
                <div className="flex items-start gap-4">
                  <Mail className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-foreground">E-Posta</h4>
                    <a href={`mailto:${ci.email}`} className="hover:text-primary transition-colors">{ci.email}</a>
                  </div>
                </div>
              )}

              {ci.whatsappNumber && (
                <div className="flex items-start gap-4">
                  <MessageCircle className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-foreground">WhatsApp</h4>
                    <a
                      href={`https://wa.me/${ci.whatsappNumber.replace(/\D/g,"")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-primary transition-colors"
                    >
                      {ci.whatsappNumber}
                    </a>
                  </div>
                </div>
              )}

              {ci.instagramHandle && (
                <div className="flex items-start gap-4">
                  <Instagram className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-foreground">Instagram</h4>
                    <a
                      href={ci.instagramUrl || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-primary transition-colors"
                    >
                      {ci.instagramHandle}
                    </a>
                  </div>
                </div>
              )}

              {ci.facebookUrl && (
                <div className="flex items-start gap-4">
                  <Facebook className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-foreground">Facebook</h4>
                    <a href={ci.facebookUrl} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">{ci.facebookUrl}</a>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-4">
                <Clock className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-foreground">Çalışma Saatleri</h4>
                  {ci.workingHoursWeekday && <p>{ci.workingHoursWeekday}</p>}
                  {ci.workingHoursSunday && <p>{ci.workingHoursSunday}</p>}
                </div>
              </div>
            </div>

            {/* Map */}
            <div className="w-full h-64 bg-background border border-border rounded-xl flex items-center justify-center relative overflow-hidden group">
              {ci.mapUrl ? (
                <iframe
                  src={ci.mapUrl}
                  className="w-full h-full border-0"
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Konum"
                />
              ) : (
                <>
                  <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=800')] bg-cover opacity-20 group-hover:opacity-30 transition-opacity grayscale" />
                  <div className="flex flex-col items-center relative z-10 p-4 bg-background/80 backdrop-blur rounded-lg border border-border/50">
                    <MapPin className="w-8 h-8 text-primary mb-2" />
                    <span className="font-medium text-sm">Haritada Görüntüle</span>
                    {ci.address && <span className="text-xs text-muted-foreground mt-1 text-center">{ci.address}</span>}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="bg-card p-8 rounded-2xl border border-border shadow-lg">
            <h3 className="text-2xl font-serif font-bold mb-6">Bize Yazın</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Ad Soyad</label>
                <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="bg-background border-border" placeholder="Adınız Soyadınız" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Email</label>
                <Input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="bg-background border-border" placeholder="ornek@email.com" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Mesajınız</label>
                <Textarea required value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} className="bg-background border-border min-h-[150px]" placeholder="Nasıl yardımcı olabiliriz?" />
              </div>
              <Button type="submit" disabled={isSubmitting} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground mt-4" data-testid="button-submit-contact">
                {isSubmitting ? "Gönderiliyor..." : "Mesaj Gönder"}
              </Button>
            </form>
          </div>

        </div>
      </div>
    </section>
  );
}

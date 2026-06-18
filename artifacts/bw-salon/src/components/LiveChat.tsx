import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Phone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStore } from "@/lib/store";

type ChatMsg = { id: string; text: string; sender: "user" | "bot"; link?: { label: string; href: string } };

function getBotReply(input: string, contactInfo: { phone1: string; phone2: string; whatsappNumber: string; address: string; workingHoursWeekday: string; workingHoursSunday: string }, staffMembers: { name: string; title: string }[]): { text: string; link?: { label: string; href: string } } {
  const msg = input.toLowerCase().trim();

  // Greetings
  if (/^(merhaba|selam|hey|hi|hello|iyi günler|günaydın|iyi akşamlar)/.test(msg)) {
    return { text: "Merhaba! 👋 Black White Güzellik Salonu'na hoş geldiniz. Size nasıl yardımcı olabilirim?\n\n• Randevu almak\n• Fiyat öğrenmek\n• Çalışma saatleri\n• Uzmanlarımız\n• İletişim bilgileri" };
  }

  // Appointment
  if (/randev|book|appointment|rezerv/.test(msg)) {
    return { text: "Randevu almak çok kolay! 📅\n\nSayfamızın 'Hızlı Randevu' bölümünden online randevu oluşturabilirsiniz. Dilediğiniz uzmanı ve saati seçmeniz yeterli.\n\nYa da bizi aramak ister misiniz?", link: { label: `📞 ${contactInfo.phone1}`, href: `tel:${contactInfo.phone1.replace(/\s/g, "")}` } };
  }

  // WhatsApp
  if (/whatsapp|wts|wp/.test(msg)) {
    return { text: "WhatsApp'tan da bize ulaşabilirsiniz! 💬", link: { label: "WhatsApp'ta Yaz", href: `https://wa.me/${contactInfo.whatsappNumber.replace(/[^0-9]/g, "")}` } };
  }

  // Price / pricing
  if (/fiyat|ücret|kaç para|ne kadar|price|cost/.test(msg)) {
    return { text: "Fiyatlarımız hizmet türüne göre değişmektedir:\n\n✂️ Saç Kesimi: 250–450 TL\n🎨 Saç Boyama: 500–1200 TL\n💅 Manikür: 200–400 TL\n💄 Makyaj: 400–800 TL\n🌸 Gelin Paketi: 2500 TL'den başlayan fiyatlarla\n\nDetaylı fiyat listesi için 'Fiyat Listesi' bölümünü inceleyebilirsiniz." };
  }

  // Working hours
  if (/saat|çalış|açık|kaça kadar|ne zaman|zaman|hour|open|close/.test(msg)) {
    return { text: `⏰ Çalışma Saatlerimiz:\n\n${contactInfo.workingHoursWeekday}\n${contactInfo.workingHoursSunday}\n\nSizi bekliyoruz! 😊` };
  }

  // Address / location
  if (/adres|nerede|konum|lokasyon|where|location/.test(msg)) {
    return { text: `📍 Adresimiz:\n${contactInfo.address}\n\nYol tarifi için haritayı açabilirsiniz.` };
  }

  // Phone / contact
  if (/telefon|ara|call|numara|iletişim|contact/.test(msg)) {
    return { text: `📞 Bize ulaşın:\n${contactInfo.phone1}\n${contactInfo.phone2 ? contactInfo.phone2 : ""}\n\nAramanızı bekliyoruz!`, link: { label: `Hemen Ara: ${contactInfo.phone1}`, href: `tel:${contactInfo.phone1.replace(/\s/g, "")}` } };
  }

  // Staff / specialists
  if (/uzman|personel|staff|ekip|kim|çalışan|kuaför/.test(msg)) {
    const staffList = staffMembers.map(s => `👤 ${s.name} — ${s.title}`).join("\n");
    return { text: `Uzman kadromuz:\n\n${staffList}\n\nRandevu oluştururken tercih ettiğiniz uzmanı seçebilirsiniz!` };
  }

  // Services
  if (/hizmet|servis|service|ne yapıyor|neler yapıyor/.test(msg)) {
    return { text: "Sunduğumuz hizmetler:\n\n✂️ Saç Kesimi & Şekillendirme\n🎨 Saç Boyama & Röfle\n💆 Keratin & Bakım\n💄 Gelin & Davet Makyajı\n💅 Manikür & Pedikür\n🌸 Kalıcı Oje\n🪒 Ağda & Epilasyon\n🧴 Cilt Bakımı" };
  }

  // Hair
  if (/saç|kesim|boya|röfle|keratin|balayage/.test(msg)) {
    return { text: "Saç hizmetlerimiz için uzman ekibimiz hazır! 💇‍♀️\n\n• Kesim & Şekillendirme\n• Boya & Röfle\n• Balayage & Highlights\n• Keratin Düzleştirme\n• Saç Bakım Maskeleri\n\nRandevu almak ister misiniz?" };
  }

  // Nail
  if (/tırnak|manikür|pedikür|kalıcı oje|nail|protez/.test(msg)) {
    return { text: "Tırnak hizmetlerimiz için Zeynep hanım sizleri bekliyor! 💅\n\n• Manikür & Pedikür\n• Kalıcı Oje\n• Protez Tırnak\n• Nail Art Tasarımı\n\nRandevu almak için aşağıdaki butonu kullanabilirsiniz." };
  }

  // Makeup
  if (/makyaj|makeup|gelin|düğün|davet/.test(msg)) {
    return { text: "Özel günleriniz için profesyonel makyaj hizmetimiz mevcut! 💄\n\n• Gelin Makyajı\n• Davet & Gece Makyajı\n• Doğal Günlük Makyaj\n• Fotoğraf Çekimi Makyajı\n\nBuse hanım ile randevu almak ister misiniz?" };
  }

  // Teşekkür / thanks
  if (/teşekkür|sağ ol|tamam|anladım|thanks|thank you/.test(msg)) {
    return { text: "Rica ederiz! 😊 Başka bir konuda yardımcı olabilir miyiz? Sizi Black White Güzellik Salonu'nda ağırlamaktan mutluluk duyarız!" };
  }

  // Default fallback
  return {
    text: "Sorunuzu tam anlayamadım, ama size yardımcı olmaktan memnuniyet duyarım! 😊\n\nAşağıdaki konularda bilgi verebilirim:\n• Randevu almak\n• Fiyatlar\n• Çalışma saatleri\n• Uzmanlarımız\n• Adres & iletişim\n\nYa da doğrudan bizi aramak ister misiniz?",
    link: { label: `📞 Bizi Arayın`, href: `tel:${contactInfo.phone1.replace(/\s/g, "")}` }
  };
}

export function LiveChat() {
  const { siteContent } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([
    { id: "1", text: `Merhaba! 👋 Black White Güzellik Salonu'na hoş geldiniz.\n\nSize nasıl yardımcı olabilirim?\n• Randevu almak\n• Fiyat öğrenmek\n• Uzmanlarımız\n• Çalışma saatleri`, sender: "bot" }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping, isOpen]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;

    const userMsg: ChatMsg = { id: Date.now().toString(), text: trimmed, sender: "user" };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      const reply = getBotReply(trimmed, siteContent.contactInfo, siteContent.staffMembers);
      setIsTyping(false);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        text: reply.text,
        sender: "bot",
        link: reply.link,
      }]);
    }, 800 + Math.random() * 600);
  };

  const quickReplies = ["Randevu almak istiyorum", "Fiyatlar nedir?", "Çalışma saatleri?", "Uzmanlarınız kimler?"];

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-3 sm:right-6 z-50 w-[calc(100vw-24px)] max-w-[340px] h-[480px] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-primary p-3 flex justify-between items-center text-primary-foreground shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-sm leading-tight">Canlı Destek</p>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-[10px] opacity-80">Çevrimiçi</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <a
                  href={`tel:${siteContent.contactInfo.phone1.replace(/\s/g, "")}`}
                  className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                  title="Ara"
                >
                  <Phone className="w-4 h-4" />
                </a>
                <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3 bg-background">
              {messages.map(msg => (
                <div key={msg.id} className={`flex flex-col gap-1.5 ${msg.sender === "user" ? "items-end" : "items-start"}`}>
                  <div className={`max-w-[88%] p-3 rounded-2xl text-sm whitespace-pre-line leading-relaxed ${
                    msg.sender === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-sm"
                      : "bg-card border border-border rounded-tl-sm"
                  }`}>
                    {msg.text}
                  </div>
                  {msg.link && (
                    <a
                      href={msg.link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs bg-primary/10 text-primary border border-primary/20 px-3 py-1.5 rounded-full hover:bg-primary/20 transition-colors font-medium"
                    >
                      {msg.link.label}
                    </a>
                  )}
                </div>
              ))}

              {isTyping && (
                <div className="flex items-start">
                  <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-3">
                    <div className="flex gap-1">
                      {[0, 1, 2].map(i => (
                        <span key={i} className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick replies */}
            {messages.length <= 1 && (
              <div className="px-3 py-2 flex flex-wrap gap-1.5 border-t border-border bg-card/50 shrink-0">
                {quickReplies.map(q => (
                  <button
                    key={q}
                    onClick={() => {
                      setInput(q);
                      setTimeout(() => document.getElementById("chat-input")?.dispatchEvent(new Event("submit", { bubbles: true })), 50);
                      const userMsg: ChatMsg = { id: Date.now().toString(), text: q, sender: "user" };
                      setMessages(prev => [...prev, userMsg]);
                      setIsTyping(true);
                      setTimeout(() => {
                        const reply = getBotReply(q, siteContent.contactInfo, siteContent.staffMembers);
                        setIsTyping(false);
                        setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), text: reply.text, sender: "bot", link: reply.link }]);
                      }, 900);
                    }}
                    className="text-[11px] bg-background border border-border rounded-full px-2.5 py-1 hover:border-primary/50 hover:text-primary transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <form id="chat-input" onSubmit={handleSend} className="p-3 border-t border-border bg-card flex gap-2 shrink-0">
              <Input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Mesajınızı yazın..."
                className="bg-background border-border h-9 text-sm"
                autoComplete="off"
              />
              <Button type="submit" size="icon" className="h-9 w-9 shrink-0 bg-primary hover:bg-primary/90">
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(v => !v)}
        className="fixed bottom-6 right-4 sm:right-6 z-50 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-xl flex items-center justify-center hover:scale-110 transition-transform"
        data-testid="button-live-chat"
      >
        <AnimatePresence mode="wait">
          {isOpen
            ? <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}><X className="w-6 h-6" /></motion.span>
            : <motion.span key="msg" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}><MessageSquare className="w-6 h-6" /></motion.span>
          }
        </AnimatePresence>
      </button>
    </>
  );
}

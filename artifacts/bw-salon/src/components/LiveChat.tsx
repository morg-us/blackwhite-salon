import { useState, useRef, useEffect, useCallback } from "react";
import { MessageSquare, X, Send, Phone, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStore } from "@/lib/store";

type ChatMsg = { id: string; text: string; sender: "user" | "bot"; streaming?: boolean };

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

async function createSession(): Promise<{ sessionId: number; token: string } | null> {
  try {
    const r = await fetch(`${BASE}/api/chat/session`, { method: "POST", headers: { "Content-Type": "application/json" } });
    if (!r.ok) return null;
    return r.json();
  } catch { return null; }
}

export function LiveChat() {
  const { siteContent } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([
    { id: "0", text: "Merhaba! 👋 Black White Güzellik Salonu'na hoş geldiniz.\n\nSize nasıl yardımcı olabilirim?\n• Randevu almak\n• Fiyat öğrenmek\n• Uzmanlarımız\n• Çalışma saatleri", sender: "bot" }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [useAI, setUseAI] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping, isOpen]);

  useEffect(() => {
    if (isOpen && !sessionToken) {
      createSession().then(s => {
        if (s) setSessionToken(s.token);
        else setUseAI(false);
      });
    }
  }, [isOpen, sessionToken]);

  const sendWithAI = useCallback(async (text: string) => {
    if (!sessionToken) return false;
    try {
      const res = await fetch(`${BASE}/api/chat/session/${sessionToken}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      if (!res.ok || !res.body) return false;

      const botId = Date.now().toString() + "_bot";
      setMessages(prev => [...prev, { id: botId, text: "", sender: "bot", streaming: true }]);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const parsed = JSON.parse(line.slice(6));
            if (parsed.content) {
              setMessages(prev => prev.map(m =>
                m.id === botId ? { ...m, text: m.text + parsed.content } : m
              ));
            }
            if (parsed.done || parsed.error) {
              setMessages(prev => prev.map(m => m.id === botId ? { ...m, streaming: false } : m));
            }
          } catch {}
        }
      }
      return true;
    } catch {
      return false;
    }
  }, [sessionToken]);

  const sendKeywordFallback = useCallback((text: string) => {
    const msg = text.toLowerCase();
    const ci = siteContent.contactInfo;
    const sm = siteContent.staffMembers;

    let reply = "Sorunuzu tam anlayamadım. Size nasıl yardımcı olabilirim?\n• Randevu • Fiyatlar • Çalışma saatleri • Uzmanlar";

    if (/merhaba|selam|hey|hi/.test(msg)) reply = "Merhaba! 👋 Black White Güzellik Salonu'na hoş geldiniz! Size nasıl yardımcı olabilirim?";
    else if (/randev|book|rezerv/.test(msg)) reply = `Randevu almak için sayfamızdaki "Hızlı Randevu" bölümünü kullanabilirsiniz! 📅\n\nYa da bizi arayın: ${ci.phone1}`;
    else if (/fiyat|ücret|kaç para|ne kadar/.test(msg)) reply = "💇 Saç Kesimi: 250–450₺\n🎨 Boyama: 500–1200₺\n💅 Manikür: 200–400₺\n💄 Makyaj: 400–800₺\n🌸 Gelin Paketi: 2500₺+";
    else if (/saat|çalış|açık|kaç/.test(msg)) reply = `⏰ ${ci.workingHoursWeekday}\n${ci.workingHoursSunday}`;
    else if (/adres|nerede|konum/.test(msg)) reply = `📍 ${ci.address}`;
    else if (/telefon|ara|numara|iletişim/.test(msg)) reply = `📞 ${ci.phone1}${ci.phone2 ? "\n" + ci.phone2 : ""}`;
    else if (/uzman|personel|ekip|kim/.test(msg)) reply = sm.map(s => `👤 ${s.name} — ${s.title}`).join("\n");
    else if (/whatsapp/.test(msg)) reply = `WhatsApp: ${ci.whatsappNumber}`;
    else if (/teşekkür|sağ ol|tamam/.test(msg)) reply = "Rica ederiz! 😊 Başka bir konuda yardımcı olabilir miyiz?";

    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, { id: Date.now().toString(), text: reply, sender: "bot" }]);
    }, 700);
  }, [siteContent]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isTyping) return;

    const userMsg: ChatMsg = { id: Date.now().toString(), text: trimmed, sender: "user" };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    if (useAI && sessionToken) {
      const ok = await sendWithAI(trimmed);
      setIsTyping(false);
      if (!ok) sendKeywordFallback(trimmed);
    } else {
      sendKeywordFallback(trimmed);
    }
  };

  const handleQuickReply = (q: string) => {
    const userMsg: ChatMsg = { id: Date.now().toString(), text: q, sender: "user" };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);
    if (useAI && sessionToken) {
      sendWithAI(q).then(ok => {
        setIsTyping(false);
        if (!ok) sendKeywordFallback(q);
      });
    } else {
      sendKeywordFallback(q);
    }
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
            className="fixed bottom-24 right-3 sm:right-6 z-50 w-[calc(100vw-24px)] max-w-[340px] h-[500px] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-primary p-3 flex justify-between items-center text-primary-foreground shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  {useAI ? <Sparkles className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                </div>
                <div>
                  <p className="font-bold text-sm leading-tight">
                    {useAI ? "AI Asistan" : "Canlı Destek"}
                  </p>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-[10px] opacity-80">
                      {useAI ? "Yapay Zeka Aktif" : "Çevrimiçi"}
                    </span>
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
                    {msg.streaming && <span className="inline-block w-1 h-3 ml-0.5 bg-current animate-pulse rounded-sm" />}
                  </div>
                </div>
              ))}

              {isTyping && !messages[messages.length - 1]?.streaming && (
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
                    onClick={() => handleQuickReply(q)}
                    className="text-[11px] bg-background border border-border rounded-full px-2.5 py-1 hover:border-primary/50 hover:text-primary transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <form onSubmit={handleSend} className="p-3 border-t border-border bg-card flex gap-2 shrink-0">
              <Input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={useAI ? "AI asistana sorun..." : "Mesajınızı yazın..."}
                className="bg-background border-border h-9 text-sm"
                autoComplete="off"
                disabled={isTyping}
              />
              <Button type="submit" size="icon" disabled={isTyping || !input.trim()} className="h-9 w-9 shrink-0 bg-primary hover:bg-primary/90">
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

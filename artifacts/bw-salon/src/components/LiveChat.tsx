import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ChatMsg = { id: string; text: string; sender: "user" | "bot" };

export function LiveChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([
    { id: "1", text: "Merhaba! Size nasıl yardımcı olabiliriz?", sender: "bot" }
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newMsg: ChatMsg = { id: Date.now().toString(), text: input, sender: "user" };
    setMessages(prev => [...prev, newMsg]);
    setInput("");

    // Simulate bot reply
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        text: "Mesajınız alındı. En kısa sürede size dönüş yapacağız.",
        sender: "bot"
      }]);
    }, 1500);
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-4 z-50 w-[300px] h-[400px] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-primary p-4 flex justify-between items-center text-primary-foreground">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                <span className="font-bold text-sm">Canlı Destek</span>
              </div>
              <button onClick={() => setIsOpen(false)} className="hover:bg-black/20 p-1 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-background">
              {messages.map(msg => (
                <div key={msg.id} className={`max-w-[85%] p-3 rounded-2xl text-sm ${msg.sender === "user" ? "bg-accent text-accent-foreground rounded-tr-sm self-end" : "bg-card border border-border rounded-tl-sm self-start"}`}>
                  {msg.text}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-3 border-t border-border bg-card flex gap-2">
              <Input 
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Mesajınızı yazın..." 
                className="bg-background border-border h-9"
              />
              <Button type="submit" size="icon" className="h-9 w-9 bg-primary hover:bg-primary/90">
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
        data-testid="button-live-chat"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
      </button>
    </>
  );
}

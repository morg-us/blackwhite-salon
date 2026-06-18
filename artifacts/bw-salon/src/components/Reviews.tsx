import { useState } from "react";
import { motion } from "framer-motion";
import { Star, MessageSquare, Trash2, LogIn } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i}
          type="button"
          onClick={() => onChange?.(i)}
          onMouseEnter={() => onChange && setHovered(i)}
          onMouseLeave={() => onChange && setHovered(0)}
          className={onChange ? "cursor-pointer" : "cursor-default"}
        >
          <Star
            className={`w-5 h-5 transition-colors ${
              i <= (hovered || value) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/40"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export function Reviews() {
  const { reviews, addReview, deleteReview, currentUser, setIsAuthModalOpen, siteContent } = useStore();
  const { toast } = useToast();

  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [staffMember, setStaffMember] = useState("Genel");
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const allReviews = [
    // Seed reviews (static) shown when no real reviews exist yet
    ...(!reviews.length ? [
      { id: "seed1", userId: "seed", userName: "Ayşe K.", avatarColor: "#b84d5b", rating: 5, text: "Gülcan hanım saçlarımı tam hayalimde olduğu gibi yaptı. Kesinlikle tavsiye ederim!", staffMember: "Genel", date: "2025-03-12T10:00:00" },
      { id: "seed2", userId: "seed", userName: "Fatma S.", avatarColor: "#bd8c74", rating: 5, text: "Düğün makyajım için Buse hanımı tercih ettim, sonuç muhteşemdi!", staffMember: "Genel", date: "2025-04-20T14:00:00" },
      { id: "seed3", userId: "seed", userName: "Elif M.", avatarColor: "#e8a5b2", rating: 5, text: "Zeynep hanımın tırnak tasarımları gerçekten sanat eseri. Çok memnunum.", staffMember: "Genel", date: "2025-05-01T11:00:00" },
    ] : []),
    ...reviews,
  ];

  const handleSubmit = () => {
    if (!text.trim()) {
      toast({ title: "Lütfen yorum yazın", variant: "destructive" });
      return;
    }
    if (!currentUser) return;
    setSubmitting(true);
    setTimeout(() => {
      addReview({
        userId: currentUser.id,
        userName: currentUser.name,
        avatarColor: currentUser.avatarColor,
        rating,
        text: text.trim(),
        staffMember,
      });
      setText("");
      setRating(5);
      setStaffMember("Genel");
      setShowForm(false);
      setSubmitting(false);
      toast({ title: "Yorumunuz yayınlandı!", description: "Değerli görüşünüz için teşekkür ederiz." });
    }, 600);
  };

  const avgRating = allReviews.length
    ? (allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length).toFixed(1)
    : "5.0";

  return (
    <section id="reviews" className="py-16 md:py-24 bg-card/30">
      <div className="container px-4 mx-auto max-w-5xl">
        {/* Header */}
        <div className="text-center mb-10 md:mb-14">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 font-serif">Müşteri Yorumları</h2>
          <div className="h-1 w-20 bg-primary mx-auto mb-6"></div>
          <div className="flex items-center justify-center gap-3">
            <div className="flex gap-1">
              {[1,2,3,4,5].map(i => (
                <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <span className="text-2xl font-bold">{avgRating}</span>
            <span className="text-muted-foreground text-sm">({allReviews.length} yorum)</span>
          </div>
        </div>

        {/* Write review CTA */}
        <div className="mb-8 text-center">
          {currentUser ? (
            <Button
              onClick={() => setShowForm(v => !v)}
              className="gap-2 bg-primary/90 hover:bg-primary text-white"
            >
              <MessageSquare className="w-4 h-4" />
              {showForm ? "İptal" : "Yorum Yaz"}
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={() => setIsAuthModalOpen(true)}
              className="gap-2 border-primary/40 text-primary hover:bg-primary/10"
            >
              <LogIn className="w-4 h-4" />
              Yorum yazmak için giriş yapın
            </Button>
          )}
        </div>

        {/* Review form */}
        {showForm && currentUser && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 bg-card border border-border rounded-2xl p-5 md:p-6 max-w-2xl mx-auto"
          >
            <h3 className="font-semibold mb-4 text-sm text-muted-foreground uppercase tracking-wider">Deneyiminizi Paylaşın</h3>
            
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border/50">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                style={{ backgroundColor: currentUser.avatarColor }}
              >
                {currentUser.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)}
              </div>
              <div>
                <p className="font-semibold text-sm">{currentUser.name}</p>
                <StarRating value={rating} onChange={setRating} />
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Uzman (isteğe bağlı)</label>
                <Select value={staffMember} onValueChange={setStaffMember}>
                  <SelectTrigger className="bg-background border-border h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Genel">Genel</SelectItem>
                    {siteContent.staffMembers.map(s => (
                      <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Textarea
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Deneyiminizi paylaşın..."
                className="bg-background border-border resize-none h-24 text-sm"
                maxLength={500}
              />
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">{text.length}/500</span>
                <Button
                  onClick={handleSubmit}
                  disabled={submitting || !text.trim()}
                  size="sm"
                  className="bg-[#b84d5b] hover:bg-[#b84d5b]/90 text-white"
                >
                  {submitting ? "Gönderiliyor..." : "Yorumu Gönder"}
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Reviews grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {allReviews.slice().reverse().map((review, i) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: Math.min(i * 0.08, 0.4), duration: 0.4 }}
              className="bg-background p-5 md:p-6 rounded-2xl border border-border flex flex-col gap-3 relative group"
            >
              {/* Delete button (only for own reviews) */}
              {currentUser && review.userId === currentUser.id && (
                <button
                  onClick={() => deleteReview(review.id)}
                  className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-destructive/10 text-destructive"
                  title="Yorumu sil"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}

              <div className="flex items-start gap-3">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0"
                  style={{ backgroundColor: review.avatarColor }}
                >
                  {review.userName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm">{review.userName}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <StarRating value={review.rating} />
                    {review.staffMember !== "Genel" && (
                      <span className="text-[10px] text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">{review.staffMember}</span>
                    )}
                  </div>
                </div>
                <span className="text-[10px] text-muted-foreground shrink-0">
                  {format(new Date(review.date), "dd MMM yyyy", { locale: tr })}
                </span>
              </div>

              <p className="text-foreground/80 italic text-sm leading-relaxed">"{review.text}"</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

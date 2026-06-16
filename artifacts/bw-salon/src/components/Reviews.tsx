import { motion } from "framer-motion";
import { Star } from "lucide-react";

const reviews = [
  {
    id: 1,
    name: "Ayşe K.",
    text: "Gülcan hanım saçlarımı tam hayalimde olduğu gibi yaptı. Kesinlikle tavsiye ederim!",
    rating: 5,
    source: "Google"
  },
  {
    id: 2,
    name: "Fatma S.",
    text: "Düğün makyajım için Buse hanımı tercih ettim, sonuç muhteşemdi!",
    rating: 5,
    source: "Instagram"
  },
  {
    id: 3,
    name: "Elif M.",
    text: "Zeynep hanımın tırnak tasarımları gerçekten sanat eseri. Çok memnunum.",
    rating: 5,
    source: "Google"
  },
  {
    id: 4,
    name: "Merve T.",
    text: "Ağda hizmeti çok hijyenik ve profesyonel. Fiyatlar da çok uygun.",
    rating: 4,
    source: "Instagram"
  }
];

export function Reviews() {
  return (
    <section className="py-24 bg-card/30">
      <div className="container px-4 mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 font-serif">Müşteri Yorumları</h2>
          <div className="h-1 w-20 bg-primary mx-auto mb-6"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {reviews.map((review, i) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              className="bg-background p-8 rounded-2xl border border-border flex flex-col"
              data-testid={`card-review-${review.id}`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex gap-1 text-accent">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className={`w-4 h-4 ${j < review.rating ? "fill-current" : "opacity-30"}`} />
                  ))}
                </div>
                <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground px-2 py-1 rounded bg-muted/50">
                  {review.source}
                </span>
              </div>
              
              <p className="text-foreground/90 italic mb-6 flex-1 text-sm md:text-base leading-relaxed">
                "{review.text}"
              </p>
              
              <p className="font-bold text-primary">— {review.name}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

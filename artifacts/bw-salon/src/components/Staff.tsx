import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useStore } from "@/lib/store";

export function Staff() {
  const { siteContent } = useStore();
  const staffList = siteContent.staffMembers;

  return (
    <section id="staff" className="py-24 bg-background">
      <div className="container px-4 mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 font-serif">Uzman Kadromuz</h2>
          <div className="h-1 w-20 bg-primary mx-auto mb-6"></div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Alanında uzman, yenilikleri takip eden ve size en iyi hizmeti sunmak için sürekli kendini geliştiren profesyonel ekibimiz.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {staffList.map((staff, i) => (
            <motion.div
              key={staff.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.2, duration: 0.5 }}
              className="group bg-card rounded-2xl p-8 flex flex-col items-center text-center border border-border hover:border-primary/50 hover:shadow-[0_0_30px_rgba(184,77,91,0.1)] transition-all duration-300 relative overflow-hidden"
              data-testid={`card-staff-${staff.id}`}
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <Avatar className="w-24 h-24 mb-6 border-2 border-primary/20 ring-4 ring-background">
                {staff.imageUrl ? (
                  <AvatarImage src={staff.imageUrl} alt={staff.name} className="object-cover" />
                ) : null}
                <AvatarFallback className="bg-muted text-xl font-serif text-primary">{staff.initials}</AvatarFallback>
              </Avatar>

              <h3 className="text-xl font-bold mb-1">{staff.name}</h3>
              <p className="text-primary font-medium text-sm mb-2">{staff.title}</p>
              <p className="text-muted-foreground text-xs mb-4">{staff.experience}</p>

              <div className="flex gap-2 flex-wrap justify-center mb-6">
                {staff.tags.map(tag => (
                  <span key={tag} className="text-xs px-3 py-1 rounded-full bg-secondary/50 text-secondary-foreground">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="mt-auto flex items-center gap-1 text-accent">
                <Star className="w-4 h-4 fill-current" />
                <span className="font-bold text-sm text-foreground">{staff.rating}</span>
                <span className="text-xs text-muted-foreground">/ 5.0</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

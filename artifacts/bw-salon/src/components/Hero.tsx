import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";

export function Hero() {
  const { siteContent } = useStore();
  const scrollToForm = () => {
    document.getElementById("appointment")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="hero" className="relative w-full h-[100dvh] -mt-20 flex items-center justify-center overflow-hidden">
      {/* Background Image & Overlay */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url('${siteContent.heroImageUrl}')` }}
      />
      <div className="absolute inset-0 z-0 bg-background/70 bg-gradient-to-t from-background via-background/40 to-background/60" />

      {/* Content */}
      <div className="container relative z-10 px-4 flex flex-col items-center text-center mt-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="max-w-3xl"
        >
          <span className="text-primary font-medium tracking-[0.2em] uppercase text-sm md:text-base mb-6 block">
            Ordu'nun En İyisi
          </span>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
            Black White <br/>
            <span className="font-serif italic font-normal opacity-90">Güzellik Salonu</span>
          </h1>
          <p className="text-lg md:text-xl text-white/80 mb-10 font-light max-w-xl mx-auto">
            Lüks. Zariflik. Mükemmellik.
          </p>
          
          <Button 
            onClick={scrollToForm}
            size="lg" 
            className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground border-0 rounded-none px-8 py-6 text-lg font-medium tracking-wide"
            data-testid="button-hero-cta"
          >
            Online Randevu Al
          </Button>
        </motion.div>
      </div>
    </section>
  );
}

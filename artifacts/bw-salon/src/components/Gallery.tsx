import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/lib/store";

export function Gallery() {
  const { siteContent } = useStore();
  const images = siteContent.galleryItems;
  const [filter, setFilter] = useState("all");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const filtered = filter === "all" ? images : images.filter(img => img.category === filter);

  return (
    <section id="gallery" className="py-24 bg-card/30">
      <div className="container px-4 mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 font-serif">Koleksiyon</h2>
          <div className="h-1 w-20 bg-primary mx-auto mb-8"></div>
          
          <div className="flex justify-center gap-4 mb-12">
            {["all", "sac", "tirnak"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  filter === f ? "bg-primary text-primary-foreground" : "bg-card text-foreground hover:bg-muted"
                }`}
              >
                {f === "all" ? "Tümü" : f === "sac" ? "Saç Modelleri" : "Tırnak Modelleri"}
              </button>
            ))}
          </div>
        </div>

        <motion.div layout className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <AnimatePresence>
            {filtered.map(img => (
              <motion.div
                key={img.id}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
                className="aspect-square rounded-xl overflow-hidden cursor-pointer relative group"
                onClick={() => setSelectedImage(img.url)}
              >
                <div className="absolute inset-0 bg-background/40 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex items-center justify-center">
                  <span className="text-white font-medium tracking-widest text-xs uppercase">Büyüt</span>
                </div>
                <img 
                  src={img.url} 
                  alt="Gallery item" 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                  loading="lazy"
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Lightbox */}
        {selectedImage && (
          <div 
            className="fixed inset-0 z-50 bg-background/95 backdrop-blur flex items-center justify-center p-4 cursor-pointer"
            onClick={() => setSelectedImage(null)}
          >
            <div className="relative max-w-5xl w-full max-h-[90vh]">
              <img src={selectedImage} alt="Selected" className="w-full h-full object-contain rounded-md" />
              <button 
                className="absolute top-4 right-4 text-white bg-black/50 w-10 h-10 rounded-full flex items-center justify-center hover:bg-primary transition-colors"
                onClick={() => setSelectedImage(null)}
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

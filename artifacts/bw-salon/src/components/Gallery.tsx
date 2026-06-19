import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/lib/store";

const SAC_SUBCATEGORIES = [
  { value: "all", label: "Tümü" },
  { value: "ombre", label: "Ombre" },
  { value: "sombre", label: "Sombre" },
  { value: "kesim", label: "Kesim" },
  { value: "boyama", label: "Boyama" },
  { value: "röfle", label: "Röfle" },
  { value: "keratin", label: "Keratin" },
  { value: "gelin", label: "Gelin" },
];

export function Gallery() {
  const { siteContent } = useStore();
  const images = siteContent.galleryItems;
  const [filter, setFilter] = useState("all");
  const [sacSubcat, setSacSubcat] = useState("all");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const filtered = (() => {
    if (filter === "all") return images;
    if (filter === "sac") {
      const sacItems = images.filter(img => img.category === "sac");
      if (sacSubcat === "all") return sacItems;
      return sacItems.filter(img => img.subcategory === sacSubcat);
    }
    return images.filter(img => img.category === filter);
  })();

  return (
    <section id="gallery" className="py-24 bg-card/30">
      <div className="container px-4 mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 font-serif">Koleksiyon</h2>
          <div className="h-1 w-20 bg-primary mx-auto mb-8"></div>

          {/* Main category filter */}
          <div className="flex justify-center gap-3 mb-4 flex-wrap">
            {[
              { value: "all", label: "Tümü" },
              { value: "sac", label: "Saç Modelleri" },
              { value: "tirnak", label: "Tırnak Modelleri" },
            ].map(f => (
              <button
                key={f.value}
                onClick={() => { setFilter(f.value); if (f.value !== "sac") setSacSubcat("all"); }}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                  filter === f.value ? "bg-primary text-primary-foreground" : "bg-card text-foreground hover:bg-muted"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Hair subcategory filter */}
          <AnimatePresence>
            {filter === "sac" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="flex justify-center gap-2 flex-wrap mt-2 mb-4">
                  {SAC_SUBCATEGORIES.map(sub => (
                    <button
                      key={sub.value}
                      onClick={() => setSacSubcat(sub.value)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-all border ${
                        sacSubcat === sub.value
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-background text-muted-foreground hover:border-primary/50"
                      }`}
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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
                <div className="absolute inset-0 bg-background/40 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex flex-col items-center justify-center gap-1">
                  <span className="text-white font-medium tracking-widest text-xs uppercase">Büyüt</span>
                  {img.label && <span className="text-white/80 text-[10px]">{img.label}</span>}
                </div>
                <img
                  src={img.url}
                  alt={img.label || "Gallery item"}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                />
                {img.subcategory && img.category === "sac" && (
                  <div className="absolute bottom-2 left-2 z-20">
                    <span className="text-[10px] bg-black/60 text-white px-2 py-0.5 rounded-full capitalize">
                      {img.subcategory}
                    </span>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          {filtered.length === 0 && (
            <div className="col-span-4 text-center py-12 text-muted-foreground">
              Bu kategoride henüz fotoğraf bulunmamaktadır.
            </div>
          )}
        </motion.div>

        {/* Lightbox */}
        {selectedImage && (
          <div
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
            onClick={() => setSelectedImage(null)}
          >
            <div className="relative flex items-center justify-center max-w-5xl w-full" onClick={e => e.stopPropagation()}>
              <img
                src={selectedImage}
                alt="Selected"
                className="max-w-full max-h-[90vh] w-auto h-auto object-contain rounded-md shadow-2xl"
              />
              <button
                className="absolute top-2 right-2 text-white bg-black/60 w-10 h-10 rounded-full flex items-center justify-center hover:bg-primary transition-colors text-lg"
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

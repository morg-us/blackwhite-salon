import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";

const priceList = {
  sac: [
    { name: "Saç Kesim (Kısa)", price: "500 TL" },
    { name: "Saç Kesim (Uzun)", price: "800 TL" },
    { name: "Dip Boya", price: "1.200 TL" },
    { name: "Röfle/Balayage", price: "2.500 TL" },
    { name: "Ombre (başlangıç)", price: "5.000 TL" },
    { name: "Keratin Bakım", price: "3.000 TL" },
  ],
  gelin: [
    { name: "Gelin Paketi (Saç + Makyaj + Tırnak)", price: "12.500 TL" },
    { name: "Nişan Paketi", price: "7.500 TL" },
  ],
  manikur: [
    { name: "Klasik Manikür", price: "350 TL" },
    { name: "Kalıcı Oje", price: "500 TL" },
    { name: "Tırnak Uzatma", price: "1.200 TL" },
    { name: "Pedikür", price: "600 TL" },
  ],
  agda: [
    { name: "Tüm Vücut Ağda", price: "2.000 TL" },
    { name: "Bölgesel Ağda", price: "300-600 TL" },
  ],
  makyaj: [
    { name: "Günlük Makyaj", price: "1.000 TL" },
    { name: "Gece Makyajı", price: "1.500 TL" },
  ],
};

export function Pricing() {
  return (
    <section id="pricing" className="py-24 bg-background">
      <div className="container px-4 mx-auto max-w-4xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 font-serif">Fiyat Listesi</h2>
          <div className="h-1 w-20 bg-primary mx-auto mb-6"></div>
          <p className="text-muted-foreground">Premium hizmetlerimiz ve şeffaf fiyatlandırmamız.</p>
        </div>

        <Tabs defaultValue="sac" className="w-full">
          <TabsList className="w-full flex flex-wrap h-auto bg-transparent mb-8 justify-center gap-2">
            <TabsTrigger value="sac" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full px-6 py-2">Saç Hizmetleri</TabsTrigger>
            <TabsTrigger value="makyaj" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full px-6 py-2">Makyaj</TabsTrigger>
            <TabsTrigger value="gelin" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full px-6 py-2">Gelin & Özel</TabsTrigger>
            <TabsTrigger value="manikur" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full px-6 py-2">Manikür & Pedikür</TabsTrigger>
            <TabsTrigger value="agda" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full px-6 py-2">Ağda</TabsTrigger>
          </TabsList>

          {Object.entries(priceList).map(([category, items]) => (
            <TabsContent key={category} value={category} className="mt-4">
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-2xl p-6 md:p-8 border border-border shadow-lg"
              >
                <div className="space-y-4">
                  {items.map((item, i) => (
                    <div key={i} className="flex justify-between items-center py-4 border-b border-border/50 last:border-0 group">
                      <span className="text-foreground font-medium group-hover:text-primary transition-colors">{item.name}</span>
                      <div className="flex-1 mx-4 border-b border-dashed border-muted/50 hidden md:block" />
                      <span className="text-accent font-bold">{item.price}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  );
}

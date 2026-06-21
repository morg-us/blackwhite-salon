import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { useStore } from "@/lib/store";
import type { PriceList } from "@/lib/store";
import { useT } from "@/lib/translations";

export function Pricing() {
  const { siteContent } = useStore();
  const t = useT();
  const priceList = siteContent.priceList;
  const apptCategories = siteContent.appointmentSettings.categories;

  const getCategoryLabel = (key: keyof PriceList): string => {
    const found = apptCategories.find(c => c.key === key);
    if (found) return found.label;
    const fallbacks: Record<string, string> = {
      sac: "Saç",
      makyaj: "Makyaj",
      gelin: "Gelin",
      manikur: "Manikür",
      agda: "Ağda",
    };
    return fallbacks[key] ?? key;
  };

  const priceListKeys = Object.keys(priceList) as (keyof PriceList)[];

  return (
    <section id="pricing" className="py-24 bg-background">
      <div className="container px-4 mx-auto max-w-4xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 font-serif">{t("pricing_title")}</h2>
          <div className="h-1 w-20 bg-primary mx-auto mb-6"></div>
          <p className="text-muted-foreground">{t("pricing_subtitle")}</p>
        </div>

        <Tabs defaultValue={priceListKeys[0]} className="w-full">
          <TabsList className="w-full flex flex-wrap h-auto bg-transparent mb-8 justify-center gap-2">
            {priceListKeys.map(cat => (
              <TabsTrigger
                key={cat}
                value={cat}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full px-6 py-2"
              >
                {getCategoryLabel(cat)}
              </TabsTrigger>
            ))}
          </TabsList>

          {priceListKeys.map(category => (
            <TabsContent key={category} value={category} className="mt-4">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-2xl p-6 md:p-8 border border-border shadow-lg"
              >
                <div className="space-y-4">
                  {priceList[category].map((item, i) => (
                    <div key={i} className="flex justify-between items-center py-4 border-b border-border/50 last:border-0 group">
                      <span className="text-foreground font-medium group-hover:text-primary transition-colors">{item.name}</span>
                      <div className="flex-1 mx-4 border-b border-dashed border-muted/50 hidden md:block" />
                      <span className="text-accent font-bold">{item.price}</span>
                    </div>
                  ))}
                  {priceList[category].length === 0 && (
                    <p className="text-center text-muted-foreground py-8">{t("pricing_empty")}</p>
                  )}
                </div>
              </motion.div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  );
}

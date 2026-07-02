import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/lib/store";
import type { PriceList, Campaign } from "@/lib/store";
import { useT } from "@/lib/translations";
import { Timer, Zap } from "lucide-react";

function parsePriceTL(price: string): number | null {
  if (price.includes("-")) return null;
  const m = price.replace(/\./g, "").replace(",", ".").match(/^(\d+)/);
  return m ? parseInt(m[1], 10) : null;
}

function fmtTL(n: number): string {
  return n.toLocaleString("tr-TR") + " TL";
}

function applyDiscount(num: number, c: Campaign): number {
  if (c.discountType === "percent") return Math.round(num * (1 - c.discountValue / 100));
  return Math.max(0, num - c.discountValue);
}

function isCampaignActive(c: Campaign, now: Date): boolean {
  if (!c.enabled) return false;
  return new Date(c.startDate) <= now && new Date(c.endDate) >= now;
}

function scopeMatchesCategory(c: Campaign, catKey: string): boolean {
  if (c.scope === "all") return true;
  return Array.isArray(c.scope) && c.scope.includes(catKey);
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return "";
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}g ${h % 24}sa ${m % 60}dk`;
  if (h > 0) return `${h}sa ${m % 60}dk`;
  if (m > 0) return `${m}dk ${s % 60}sn`;
  return `${s}sn`;
}

function useNow(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

export function Pricing() {
  const { siteContent } = useStore();
  const t = useT();
  const now = useNow();
  const priceList = siteContent.priceList;
  const campaigns = siteContent.campaigns ?? [];
  const apptCategories = siteContent.appointmentSettings.categories;

  const activeCampaigns = campaigns.filter(c => isCampaignActive(c, now));
  const hasAnyActiveCampaign = activeCampaigns.length > 0;

  const soonestExpiry = activeCampaigns.reduce<Date | null>((best, c) => {
    const end = new Date(c.endDate);
    return !best || end < best ? end : best;
  }, null);

  const getCategoryLabel = (key: keyof PriceList): string => {
    const found = apptCategories.find(c => c.key === key);
    if (found) return found.label;
    const fallbacks: Record<string, string> = { sac: "Saç", makyaj: "Makyaj", gelin: "Gelin", manikur: "Manikür", agda: "Ağda" };
    return fallbacks[key] ?? key;
  };

  function getBestCampaign(catKey: string): Campaign | null {
    const applicable = activeCampaigns.filter(c => scopeMatchesCategory(c, catKey));
    if (!applicable.length) return null;
    return applicable.reduce((best, c) => {
      const score = (x: Campaign) => x.discountType === "percent" ? x.discountValue : x.discountValue / 500;
      return score(c) > score(best) ? c : best;
    });
  }

  const priceListKeys = Object.keys(priceList) as (keyof PriceList)[];

  return (
    <section id="pricing" className="py-24 bg-background">
      <div className="container px-4 mx-auto max-w-4xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 font-serif">{t("pricing_title")}</h2>
          <div className="h-1 w-20 bg-primary mx-auto mb-6"></div>
          <p className="text-muted-foreground">{t("pricing_subtitle")}</p>
        </div>

        <AnimatePresence>
          {hasAnyActiveCampaign && (
            <motion.div
              key="campaign-banner"
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="mb-8"
            >
              <div className="bg-gradient-to-r from-[#b84d5b] to-[#d4667a] rounded-2xl p-4 md:p-5 text-white relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none opacity-10">
                  <div className="absolute top-0 right-0 w-56 h-56 bg-white rounded-full translate-x-20 -translate-y-20" />
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-8 translate-y-8" />
                </div>
                <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <Zap className="w-6 h-6 shrink-0 mt-0.5" fill="white" />
                    <div>
                      <p className="font-bold text-base md:text-lg">Özel Dönem İndirimi Başladı!</p>
                      <p className="text-white/85 text-sm mt-0.5">
                        Hizmetlerimizde kaçırılmayacak fırsatları yakalamak için hemen randevunuzu oluşturun.
                      </p>
                    </div>
                  </div>
                  {soonestExpiry && (
                    <div className="shrink-0 flex items-center gap-2 bg-white/20 rounded-xl px-3 py-2">
                      <Timer className="w-4 h-4" />
                      <div className="text-xs leading-tight">
                        <p className="opacity-80">Kampanya bitiş</p>
                        <p className="font-bold tabular-nums text-sm">{formatCountdown(soonestExpiry.getTime() - now.getTime())}</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="relative mt-3 flex flex-wrap gap-2">
                  {activeCampaigns.map(c => (
                    <span key={c.id} className="text-xs bg-white/20 rounded-full px-3 py-1 font-medium">
                      {c.name} — {c.discountType === "percent" ? `%${c.discountValue}` : `${c.discountValue.toLocaleString("tr-TR")} TL`} indirim
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <Tabs defaultValue={priceListKeys[0]} className="w-full">
          <TabsList className="w-full flex flex-wrap h-auto bg-transparent mb-8 justify-center gap-2">
            {priceListKeys.map(cat => {
              const hasDeal = activeCampaigns.some(c => scopeMatchesCategory(c, cat));
              return (
                <TabsTrigger
                  key={cat}
                  value={cat}
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full px-6 py-2 relative"
                >
                  {getCategoryLabel(cat)}
                  {hasDeal && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-background" />
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {priceListKeys.map(category => {
            const bestCampaign = getBestCampaign(category);
            return (
              <TabsContent key={category} value={category} className="mt-4">
                {bestCampaign && (
                  <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2">
                    <Zap className="w-3.5 h-3.5 shrink-0" fill="currentColor" />
                    <span className="font-semibold">{bestCampaign.name}</span>
                    <span>—</span>
                    <span>
                      Bu kategoride {bestCampaign.discountType === "percent"
                        ? `%${bestCampaign.discountValue}`
                        : `${bestCampaign.discountValue.toLocaleString("tr-TR")} TL`} indirim aktif!
                    </span>
                    <span className="ml-auto font-medium opacity-75">Bu aya özel · Sınırlı kontenjan!</span>
                  </div>
                )}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card rounded-2xl p-6 md:p-8 border border-border shadow-lg"
                >
                  <div className="space-y-4">
                    {priceList[category].map((item, i) => {
                      const origNum = parsePriceTL(item.price);
                      const discNum = bestCampaign && origNum !== null ? applyDiscount(origNum, bestCampaign) : null;
                      const hasDiscount = discNum !== null && discNum !== origNum;
                      return (
                        <div key={i} className="flex justify-between items-center py-4 border-b border-border/50 last:border-0 group">
                          <span className="text-foreground font-medium group-hover:text-primary transition-colors">{item.name}</span>
                          <div className="flex-1 mx-4 border-b border-dashed border-muted/50 hidden md:block" />
                          <div className="text-right shrink-0">
                            {hasDiscount ? (
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground text-sm line-through">{item.price}</span>
                                <span className="text-emerald-500 font-bold text-base">{fmtTL(discNum!)}</span>
                              </div>
                            ) : (
                              <span className="text-accent font-bold">{item.price}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {priceList[category].length === 0 && (
                      <p className="text-center text-muted-foreground py-8">{t("pricing_empty")}</p>
                    )}
                  </div>
                </motion.div>
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    </section>
  );
}

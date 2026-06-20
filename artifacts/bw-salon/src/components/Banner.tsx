import { useT } from "@/lib/translations";

export function Banner() {
  const t = useT();
  return (
    <div className="w-full bg-gradient-to-r from-primary/90 to-accent/90 text-primary-foreground text-center py-2 text-xs md:text-sm font-medium tracking-widest uppercase">
      {t("banner_text")}
    </div>
  );
}

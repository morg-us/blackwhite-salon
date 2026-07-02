import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CalendarIcon, AlertTriangle, Info } from "lucide-react";
import { format, startOfDay, isToday } from "date-fns";
import { tr } from "date-fns/locale";

import { useToast } from "@/hooks/use-toast";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/translations";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

export function AppointmentForm() {
  const { toast } = useToast();
  const { addAppointment, siteContent, currentUser, appointments } = useStore();
  const t = useT();

  const apptSettings = siteContent.appointmentSettings;
  const enabledCategories = apptSettings.categories.filter(c => c.enabled);
  const allStaff = siteContent.staffMembers.map(s => s.name);
  const allSlots = apptSettings.timeSlots;

  // ── Doluluk haritası: staffName → "YYYY-MM-DD" → Set<time> ──────────────
  const takenSlots = useMemo(() => {
    const map: Record<string, Record<string, Set<string>>> = {};
    appointments.forEach(a => {
      const dk = format(startOfDay(new Date(a.date)), "yyyy-MM-dd");
      if (!map[a.staff]) map[a.staff] = {};
      if (!map[a.staff][dk]) map[a.staff][dk] = new Set();
      map[a.staff][dk].add(a.time);
    });
    return map;
  }, [appointments]);

  // Bir personel seçilen günde tamamen dolu mu?
  const isStaffFullDay = (staffName: string, dateKey: string) => {
    const slots = takenSlots[staffName]?.[dateKey];
    if (!slots || allSlots.length === 0) return false;
    return allSlots.every(t => slots.has(t));
  };

  // Seçilen günde bir saat personel için dolu mu?
  const isSlotTaken = (staffName: string, dateKey: string, time: string) => {
    return takenSlots[staffName]?.[dateKey]?.has(time) ?? false;
  };

  // Seçilen günde tüm personeller tüm saatlerde dolu mu? (gün tamamen dolu)
  const isDayFullyBooked = (date: Date) => {
    if (allStaff.length === 0 || allSlots.length === 0) return false;
    const dk = format(startOfDay(date), "yyyy-MM-dd");
    return allSlots.every(time => allStaff.every(staff => isSlotTaken(staff, dk, time)));
  };

  // "Farketmez" seçildiğinde bir saat dolu mu? (tüm personel o saatte dolu)
  const isSlotTakenForAll = (dateKey: string, time: string) => {
    if (allStaff.length === 0) return false;
    return allStaff.every(staff => isSlotTaken(staff, dateKey, time));
  };

  // ── Form ──────────────────────────────────────────────────────────────────
  const formSchema = z.object({
    name: z.string().min(2),
    phone: z.string().min(10),
    category: z.string().min(1),
    date: z.date({ required_error: t("appointment_date_ph") }),
    staff: z.string().min(1),
    time: z.string().min(1),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: currentUser?.name ?? "",
      phone: "",
      category: "",
      staff: "",
      time: "",
    },
  });

  // Reaktif değerler
  const watchedDate = form.watch("date");
  const watchedStaff = form.watch("staff");

  const selectedDateKey = watchedDate ? format(startOfDay(watchedDate), "yyyy-MM-dd") : null;

  // Seçilen gün tamamen dolu mu?
  const dayIsFull = watchedDate ? isDayFullyBooked(watchedDate) : false;

  // Seçilen personel, seçilen günde tamamen dolu mu?
  const selectedStaffFullDay =
    watchedStaff && selectedDateKey && watchedStaff !== "Farketmez"
      ? isStaffFullDay(watchedStaff, selectedDateKey)
      : false;

  // Mevcut personellerin doluluk durumu (seçilen gün için)
  const staffAvailability = useMemo(() => {
    if (!selectedDateKey) return {} as Record<string, boolean>;
    const result: Record<string, boolean> = {};
    allStaff.forEach(name => {
      result[name] = isStaffFullDay(name, selectedDateKey);
    });
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDateKey, takenSlots, allStaff.join(","), allSlots.join(",")]);

  // Şu anki saat "HH:MM" formatında (geçmiş saat kontrolü için)
  const nowTimeStr = useMemo(() => {
    const n = new Date();
    return `${String(n.getHours()).padStart(2, "0")}:${String(n.getMinutes()).padStart(2, "0")}`;
  }, []); // mount anında bir kez hesapla

  // Seçilen gün bugünse ve saat geçmişse slot pasif
  const isSlotPast = (time: string): boolean => {
    if (!watchedDate) return false;
    if (!isToday(watchedDate)) return false;
    return time <= nowTimeStr;
  };

  // Zaman slotu kullanılabilirliği (dolu veya geçmiş)
  const slotAvailability = useMemo(() => {
    if (!selectedDateKey) return {} as Record<string, boolean>;
    const result: Record<string, boolean> = {};
    allSlots.forEach(time => {
      const past = watchedDate ? (isToday(watchedDate) && time <= nowTimeStr) : false;
      if (past) {
        result[time] = true; // geçmiş = disabled
      } else if (!watchedStaff) {
        result[time] = false;
      } else if (watchedStaff === "Farketmez") {
        result[time] = isSlotTakenForAll(selectedDateKey, time);
      } else {
        result[time] = isSlotTaken(watchedStaff, selectedDateKey, time);
      }
    });
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDateKey, watchedStaff, takenSlots, watchedDate, nowTimeStr]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    // Çift kontrol — submit anında da doğrula
    const dk = format(startOfDay(values.date), "yyyy-MM-dd");
    if (isDayFullyBooked(values.date)) {
      toast({ title: "Gün dolu", description: "Seçtiğiniz gün için tüm randevu slotlarımız doludur. Lütfen başka bir gün seçiniz.", variant: "destructive" });
      return;
    }
    if (values.staff !== "Farketmez" && isSlotTaken(values.staff, dk, values.time)) {
      toast({ title: "Saat dolu", description: "Bu personelimiz belirtilen saatte doludur. Lütfen alternatif bir saat veya personel seçiniz.", variant: "destructive" });
      return;
    }
    if (values.staff === "Farketmez" && isSlotTakenForAll(dk, values.time)) {
      toast({ title: "Saat dolu", description: "Seçilen saat için tüm personellerimiz doludur. Lütfen farklı bir saat seçiniz.", variant: "destructive" });
      return;
    }

    try {
      await addAppointment({
        name: values.name,
        phone: values.phone,
        category: values.category,
        staff: values.staff,
        date: values.date.toISOString(),
        time: values.time,
        status: "pending",
      });
      form.reset({ name: currentUser?.name ?? "", phone: "", category: "", staff: "", time: "" });
      toast({ title: t("appointment_success"), description: t("appointment_success_desc") });
    } catch {
      toast({ title: "Hata", description: "Randevu oluşturulurken bir sorun oluştu.", variant: "destructive" });
    }
  }

  return (
    <section id="appointment" className="py-16 md:py-24 bg-card/50">
      <div className="container px-4 max-w-4xl mx-auto">
        <div className="text-center mb-10 md:mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 font-serif text-foreground">
            {apptSettings.title || t("appointment_quick")}
          </h2>
          <div className="h-1 w-20 bg-primary mx-auto mb-6"></div>
          <p className="text-muted-foreground text-sm md:text-base">
            {apptSettings.subtitle || t("appointment_subtitle")}
          </p>
        </div>

        <div className="bg-card p-5 md:p-8 rounded-xl border border-border shadow-lg">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">

                {/* Ad Soyad */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("appointment_name")}</FormLabel>
                      <FormControl>
                        <Input placeholder="Örn: Ayşe Yılmaz" {...field} className="bg-background border-border" data-testid="input-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Telefon */}
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("appointment_phone")}</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="05xx xxx xx xx" {...field} className="bg-background border-border" data-testid="input-phone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Kategori */}
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("appointment_category")}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background border-border" data-testid="select-category">
                            <SelectValue placeholder={t("appointment_category_ph")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {enabledCategories.map(cat => (
                            <SelectItem key={cat.key} value={cat.key}>{cat.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Tarih — önce gün seçilsin ki personel doluluk bilgisi hesaplanabilsin */}
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>{t("appointment_date")}</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={`w-full pl-3 text-left font-normal bg-background border-border hover:bg-background/80 ${!field.value && "text-muted-foreground"}`}
                              data-testid="button-date"
                            >
                              {field.value ? format(field.value, "PPP", { locale: tr }) : <span>{t("appointment_date_ph")}</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={(date) => {
                              field.onChange(date);
                              // Gün değişince personel ve saati sıfırla
                              form.setValue("staff", "");
                              form.setValue("time", "");
                            }}
                            disabled={date => {
                              const today = startOfDay(new Date());
                              if (date < today) return true;
                              return isDayFullyBooked(date);
                            }}
                            modifiers={{
                              fullyBooked: (date) => {
                                const today = startOfDay(new Date());
                                return date >= today && isDayFullyBooked(date);
                              }
                            }}
                            modifiersClassNames={{
                              fullyBooked: "line-through opacity-40 cursor-not-allowed"
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Personel */}
                <FormField
                  control={form.control}
                  name="staff"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("appointment_staff")}</FormLabel>
                      <Select
                        onValueChange={(v) => {
                          field.onChange(v);
                          form.setValue("time", ""); // Personel değişince saati sıfırla
                        }}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-background border-border" data-testid="select-staff">
                            <SelectValue placeholder={watchedDate ? t("appointment_staff_ph") : "Önce tarih seçiniz"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {siteContent.staffMembers.map(s => {
                            const isFull = selectedDateKey ? (staffAvailability[s.name] ?? false) : false;
                            return (
                              <SelectItem
                                key={s.id}
                                value={s.name}
                                disabled={isFull}
                                className={isFull ? "opacity-50 cursor-not-allowed" : ""}
                              >
                                <span className="flex items-center gap-2">
                                  {s.name} — {s.title}
                                  {isFull && (
                                    <span className="ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-500/15 text-red-500">DOLU</span>
                                  )}
                                </span>
                              </SelectItem>
                            );
                          })}
                          <SelectItem value="Farketmez">{t("appointment_nocare")}</SelectItem>
                        </SelectContent>
                      </Select>
                      {/* Personel dolu uyarısı */}
                      {selectedStaffFullDay && (
                        <div className="flex items-start gap-2 mt-1.5 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-600 dark:text-red-400">
                          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                          <span>Bu personelimiz belirtilen saatte doludur. Lütfen alternatif bir saat veya personel seçiniz.</span>
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Saat */}
                <FormField
                  control={form.control}
                  name="time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("appointment_time")}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background border-border" data-testid="select-time">
                            <SelectValue placeholder={watchedStaff ? t("appointment_time_ph") : "Önce personel seçiniz"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {allSlots.map(time => {
                            const past = isSlotPast(time);
                            const taken = !past && selectedDateKey && watchedStaff
                              ? (slotAvailability[time] ?? false)
                              : false;
                            const disabled = past || taken;
                            return (
                              <SelectItem
                                key={time}
                                value={time}
                                disabled={disabled}
                                className={disabled ? "opacity-40 cursor-not-allowed line-through" : ""}
                              >
                                {time}{past ? " — Geçmiş" : taken ? " — Dolu" : ""}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Gün tamamen dolu uyarısı */}
              {dayIsFull && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-600 dark:text-red-400">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>Seçtiğiniz gün için tüm randevu slotlarımız doludur. Lütfen başka bir gün seçiniz.</span>
                </div>
              )}

              {/* Tarih seçilmedi bilgi kutusu */}
              {!watchedDate && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/60 border border-border text-xs text-muted-foreground">
                  <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>Personel ve saat seçeneklerini görmek için önce tarih seçiniz. Tamamen dolu günler takvimde pasif görünür.</span>
                </div>
              )}

              <div className="pt-2 flex justify-center">
                <Button
                  type="submit"
                  size="lg"
                  disabled={dayIsFull}
                  className="w-full md:w-auto min-w-[220px] bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50"
                  data-testid="button-submit-appointment"
                >
                  {t("appointment_confirm")}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </section>
  );
}

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

import { useToast } from "@/hooks/use-toast";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

const formSchema = z.object({
  name: z.string().min(2, { message: "Ad soyad en az 2 karakter olmalıdır." }),
  phone: z.string().min(10, { message: "Geçerli bir telefon numarası giriniz." }),
  category: z.string().min(1, { message: "Kategori seçiniz." }),
  staff: z.string().min(1, { message: "Uzman seçiniz." }),
  date: z.date({ required_error: "Tarih seçiniz." }),
  time: z.string().min(1, { message: "Saat seçiniz." }),
});

const timeSlots = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"];

export function AppointmentForm() {
  const { toast } = useToast();
  const { addAppointment, siteContent, currentUser } = useStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      await addAppointment({
        name: values.name,
        phone: values.phone,
        category: values.category,
        staff: values.staff,
        date: values.date.toISOString(),
        time: values.time,
      });
    } finally {
      setIsSubmitting(false);
    }
    form.reset({ name: currentUser?.name ?? "", phone: "", category: "", staff: "", time: "" });
    toast({
      title: "Randevu Alındı ✓",
      description: "Randevunuz başarıyla oluşturuldu. Sizi bekliyoruz!",
    });
  }

  return (
    <section id="appointment" className="py-16 md:py-24 bg-card/50">
      <div className="container px-4 max-w-4xl mx-auto">
        <div className="text-center mb-10 md:mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 font-serif text-primary-foreground">Hızlı Randevu</h2>
          <div className="h-1 w-20 bg-primary mx-auto mb-6"></div>
          <p className="text-muted-foreground text-sm md:text-base">Size en uygun zamanı seçerek hemen randevunuzu oluşturun.</p>
        </div>

        <div className="bg-card p-5 md:p-8 rounded-xl border border-border shadow-lg">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ad Soyad</FormLabel>
                      <FormControl>
                        <Input placeholder="Örn: Ayşe Yılmaz" {...field} className="bg-background border-border" data-testid="input-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefon</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="05xx xxx xx xx" {...field} className="bg-background border-border" data-testid="input-phone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hizmet Kategorisi</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background border-border" data-testid="select-category">
                            <SelectValue placeholder="Hizmet seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="sac">Saç</SelectItem>
                          <SelectItem value="makyaj">Makyaj</SelectItem>
                          <SelectItem value="gelin">Gelin Paketi</SelectItem>
                          <SelectItem value="manikur">Manikür & Pedikür</SelectItem>
                          <SelectItem value="agda">Ağda</SelectItem>
                          <SelectItem value="cilt">Cilt Bakımı</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Dynamic staff list from admin panel */}
                <FormField
                  control={form.control}
                  name="staff"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Uzman Seçimi</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background border-border" data-testid="select-staff">
                            <SelectValue placeholder="Uzman seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {siteContent.staffMembers.map(s => (
                            <SelectItem key={s.id} value={s.name}>
                              {s.name} — {s.title}
                            </SelectItem>
                          ))}
                          <SelectItem value="Farketmez">Farketmez</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Tarih</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={`w-full pl-3 text-left font-normal bg-background border-border hover:bg-background/80 ${!field.value && "text-muted-foreground"}`}
                              data-testid="button-date"
                            >
                              {field.value ? format(field.value, "PPP", { locale: tr }) : <span>Tarih seçin</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={date => date < new Date(new Date().setHours(0, 0, 0, 0))}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Saat</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background border-border" data-testid="select-time">
                            <SelectValue placeholder="Saat seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {timeSlots.map(time => (
                            <SelectItem key={time} value={time}>{time}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="pt-2 flex justify-center">
                <Button
                  type="submit"
                  size="lg"
                  disabled={isSubmitting}
                  className="w-full md:w-auto min-w-[220px] bg-primary hover:bg-primary/90 text-primary-foreground"
                  data-testid="button-submit-appointment"
                >
                  {isSubmitting ? "İşleniyor..." : "Randevuyu Onayla"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </section>
  );
}

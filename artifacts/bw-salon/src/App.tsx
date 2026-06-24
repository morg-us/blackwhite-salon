import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { StoreProvider, useStore } from "@/lib/store";
import { ClerkProvider } from "@clerk/react";
import { trTR, enUS, ruRU } from "@clerk/localizations";

import { Banner } from "@/components/Banner";
import { Navigation } from "@/components/Navigation";
import { Hero } from "@/components/Hero";
import { AppointmentForm } from "@/components/AppointmentForm";
import { Staff } from "@/components/Staff";
import { Reviews } from "@/components/Reviews";
import { Pricing } from "@/components/Pricing";
import { Gallery } from "@/components/Gallery";
import { Store } from "@/components/Store";
import { CartDrawer } from "@/components/CartDrawer";
import { Contact } from "@/components/Contact";
import { LiveChat } from "@/components/LiveChat";
import { Footer } from "@/components/Footer";
import { AdminPanel } from "@/components/AdminPanel";
import { StaffPanel } from "@/components/StaffPanel";

type PageView = "main" | "admin" | "personel";

function MainApp() {
  const { siteContentReady } = useStore();
  const [view, setView] = useState<PageView>("main");

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash === "#admin") setView("admin");
      else if (hash === "#personel") setView("personel");
      else setView("main");
    };

    handleHashChange();
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  if (!siteContentReady) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <p className="text-sm text-muted-foreground font-serif tracking-widest uppercase">Black White</p>
      </div>
    );
  }

  if (view === "admin") return <AdminPanel />;
  if (view === "personel") return <StaffPanel />;

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground font-sans">
      <Banner />
      <Navigation />
      <main>
        <Hero />
        <AppointmentForm />
        <Staff />
        <Reviews />
        <Pricing />
        <Gallery />
        <Store />
        <Contact />
      </main>
      <Footer />

      <CartDrawer />
      <LiveChat />
    </div>
  );
}

function App() {
  useEffect(() => {
    const saved = localStorage.getItem("bw_theme");
    if (saved === "light") {
      document.documentElement.classList.remove("dark");
    } else {
      document.documentElement.classList.add("dark");
    }
    const lang = localStorage.getItem("bw_language");
    if (lang) document.documentElement.lang = lang;
  }, []);

  const isDev = import.meta.env.DEV;
  const basePath = import.meta.env.BASE_URL ?? "/";
  const clerkProxyUrl = isDev
    ? undefined
    : `${window.location.origin}${basePath}api/__clerk`.replace(/\/+/g, "/").replace(":/", "://");

  const lang = localStorage.getItem("bw_language") ?? "tr";
  const clerkLocalization = lang === "en" ? enUS : lang === "ru" ? ruRU : trTR;

  return (
    <ClerkProvider
      publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}
      localization={clerkLocalization}
      {...(clerkProxyUrl ? { proxyUrl: clerkProxyUrl } : {})}
    >
      <StoreProvider>
        <TooltipProvider>
          <MainApp />
          <Toaster />
        </TooltipProvider>
      </StoreProvider>
    </ClerkProvider>
  );
}

export default App;

import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { StoreProvider } from "@/lib/store";
import { ClerkProvider } from "@clerk/react";

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

function MainApp() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const handleHashChange = () => {
      setIsAdmin(window.location.hash === "#admin");
    };

    handleHashChange();
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  if (isAdmin) {
    return <AdminPanel />;
  }

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
  // Theme is initialized inside StoreProvider from localStorage.
  // Apply dark mode on first load before provider initialises:
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

  const basePath = import.meta.env.BASE_URL ?? "/";
  const clerkProxyUrl = `${window.location.origin}${basePath}api/__clerk`.replace(/\/+/g, "/").replace(":/", "://");

  return (
    <ClerkProvider
      publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}
      proxyUrl={clerkProxyUrl}
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

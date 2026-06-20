import { useStore } from "@/lib/store";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SignIn, SignUp } from "@clerk/react";
import { useState } from "react";
import { useT } from "@/lib/translations";

export function AuthModal() {
  const { isAuthModalOpen, setIsAuthModalOpen } = useStore();
  const [mode, setMode] = useState<"login" | "register">("login");
  const t = useT();

  return (
    <Dialog open={isAuthModalOpen} onOpenChange={setIsAuthModalOpen}>
      <DialogContent className="sm:max-w-[460px] p-0 overflow-hidden border-0 shadow-2xl bg-transparent">
        <DialogHeader className="sr-only">
          <DialogTitle>{t("auth_title")}</DialogTitle>
        </DialogHeader>

        <div className="relative flex flex-col bg-card rounded-2xl overflow-hidden">

          <div className="relative px-8 pt-8 pb-6 text-center bg-gradient-to-b from-black to-card border-b border-border/40">
            <div className="absolute inset-0 opacity-20"
              style={{ backgroundImage: "radial-gradient(circle at 50% 0%, #b84d5b 0%, transparent 70%)" }} />

            <div className="relative flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-2xl bg-black border border-white/10 flex items-center justify-center shadow-lg ring-1 ring-primary/30">
                <span className="text-white font-bold text-xl tracking-widest">BW</span>
              </div>
              <div>
                <p className="text-white/90 font-semibold text-base tracking-wide">Black White</p>
                <p className="text-white/50 text-xs tracking-[0.2em] uppercase mt-0.5">Güzellik Salonu</p>
              </div>
            </div>
          </div>

          <div className="px-6 pt-5 pb-2">
            <div className="relative flex rounded-xl bg-muted/60 p-1 gap-1">
              <div
                className="absolute top-1 bottom-1 rounded-lg bg-background shadow-sm transition-all duration-300 ease-out"
                style={{ width: "calc(50% - 4px)", left: mode === "login" ? "4px" : "calc(50%)" }}
              />
              <button
                onClick={() => setMode("login")}
                className={`relative flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 z-10 ${
                  mode === "login" ? "text-foreground" : "text-muted-foreground hover:text-foreground/70"
                }`}
              >
                {t("auth_login")}
              </button>
              <button
                onClick={() => setMode("register")}
                className={`relative flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 z-10 ${
                  mode === "register" ? "text-foreground" : "text-muted-foreground hover:text-foreground/70"
                }`}
              >
                {t("auth_register")}
              </button>
            </div>

            <p className="text-center text-xs text-muted-foreground mt-3 mb-1">
              {mode === "login" ? t("auth_login_desc") : t("auth_register_desc")}
            </p>
          </div>

          <div className="px-6 pb-6">
            {mode === "login" ? (
              <SignIn
                appearance={{
                  elements: {
                    rootBox: "w-full",
                    card: "shadow-none border-0 bg-transparent p-0 w-full",
                    headerTitle: "hidden",
                    headerSubtitle: "hidden",
                    socialButtonsBlockButton: "border border-border bg-background/80 hover:bg-muted text-foreground text-sm font-medium rounded-lg transition-colors",
                    socialButtonsBlockButtonText: "font-medium",
                    dividerLine: "bg-border",
                    dividerText: "text-muted-foreground text-xs",
                    formFieldLabel: "text-foreground/80 text-sm font-medium",
                    formFieldInput: "bg-background border-border text-foreground rounded-lg focus:ring-1 focus:ring-primary focus:border-primary text-sm",
                    formButtonPrimary: "bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg text-sm transition-colors shadow-sm",
                    footerAction: "hidden",
                    identityPreviewEditButton: "text-primary",
                    formResendCodeLink: "text-primary",
                    formFieldInputShowPasswordButton: "text-muted-foreground hover:text-foreground",
                    alertText: "text-sm",
                    formFieldErrorText: "text-destructive text-xs",
                    otpCodeFieldInput: "border-border bg-background text-foreground",
                  }
                }}
                afterSignInUrl={window.location.href}
                signUpUrl="#"
              />
            ) : (
              <SignUp
                appearance={{
                  elements: {
                    rootBox: "w-full",
                    card: "shadow-none border-0 bg-transparent p-0 w-full",
                    headerTitle: "hidden",
                    headerSubtitle: "hidden",
                    socialButtonsBlockButton: "border border-border bg-background/80 hover:bg-muted text-foreground text-sm font-medium rounded-lg transition-colors",
                    socialButtonsBlockButtonText: "font-medium",
                    dividerLine: "bg-border",
                    dividerText: "text-muted-foreground text-xs",
                    formFieldLabel: "text-foreground/80 text-sm font-medium",
                    formFieldInput: "bg-background border-border text-foreground rounded-lg focus:ring-1 focus:ring-primary focus:border-primary text-sm",
                    formButtonPrimary: "bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg text-sm transition-colors shadow-sm",
                    footerAction: "hidden",
                    formFieldInputShowPasswordButton: "text-muted-foreground hover:text-foreground",
                    alertText: "text-sm",
                    formFieldErrorText: "text-destructive text-xs",
                    otpCodeFieldInput: "border-border bg-background text-foreground",
                  }
                }}
                afterSignUpUrl={window.location.href}
                signInUrl="#"
              />
            )}
          </div>

          <div className="px-6 pb-5 -mt-2 text-center">
            <p className="text-xs text-muted-foreground/60">
              {t("auth_terms")}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { useStore } from "@/lib/store";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SignIn, SignUp } from "@clerk/react";
import { useState } from "react";

export function AuthModal() {
  const { isAuthModalOpen, setIsAuthModalOpen } = useStore();
  const [mode, setMode] = useState<"login" | "register">("login");

  return (
    <Dialog open={isAuthModalOpen} onOpenChange={setIsAuthModalOpen}>
      <DialogContent className="sm:max-w-[420px] bg-card border-border p-0 overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>Hesabım</DialogTitle>
        </DialogHeader>
        <div className="p-4">
          <div className="flex mb-4 rounded-lg bg-muted p-1">
            <button
              onClick={() => setMode("login")}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${mode === "login" ? "bg-background shadow text-foreground" : "text-muted-foreground"}`}
            >
              Giriş Yap
            </button>
            <button
              onClick={() => setMode("register")}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${mode === "register" ? "bg-background shadow text-foreground" : "text-muted-foreground"}`}
            >
              Kayıt Ol
            </button>
          </div>

          {mode === "login" ? (
            <SignIn
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "shadow-none border-0 bg-transparent p-0",
                  headerTitle: "hidden",
                  headerSubtitle: "hidden",
                  socialButtonsBlockButton: "border border-border bg-background hover:bg-muted text-foreground",
                  formFieldInput: "bg-background border-border text-foreground",
                  formButtonPrimary: "bg-primary hover:bg-primary/90 text-primary-foreground",
                  footerAction: "hidden",
                  identityPreviewEditButton: "text-primary",
                  formResendCodeLink: "text-primary",
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
                  card: "shadow-none border-0 bg-transparent p-0",
                  headerTitle: "hidden",
                  headerSubtitle: "hidden",
                  socialButtonsBlockButton: "border border-border bg-background hover:bg-muted text-foreground",
                  formFieldInput: "bg-background border-border text-foreground",
                  formButtonPrimary: "bg-primary hover:bg-primary/90 text-primary-foreground",
                  footerAction: "hidden",
                }
              }}
              afterSignUpUrl={window.location.href}
              signInUrl="#"
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

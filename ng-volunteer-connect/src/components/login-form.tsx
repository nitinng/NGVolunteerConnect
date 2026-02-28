"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSignIn } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

const slides = [
  {
    title: "Stand Beside Those Who Dream Big 🌱",
    description: "Volunteer your time to uplift students from underserved communities. Your guidance strengthens not just learners, but the teams building their future."
  },
  {
    title: "Together, We Rise Further 💙",
    description: "Support our students. Empower our teams. Serve communities that deserve opportunity, dignity, and access to growth."
  },
  {
    title: "Be the Support System That Inspires ✨",
    description: "Your mentorship can turn uncertainty into confidence and potential into progress for those who need it most."
  }
];

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [loading, setLoading] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const router = useRouter();
  const { signIn, isLoaded } = useSignIn();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleGoogleLogin = async () => {
    if (!isLoaded) return;
    setLoading(true);
    try {
      await signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/",
      });
    } catch (err: any) {
      toast.error(err.message || "Failed to login");
      setLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Toaster position="top-center" />
      <Card className="overflow-hidden p-0 border-none shadow-2xl rounded-2xl bg-background">
        <CardContent className="grid p-0 md:grid-cols-2 min-h-[500px]">
          {/* Left Side: Auth Section */}
          <div className="p-8 md:p-12 lg:p-16 flex flex-col justify-center items-center text-center">

            {/* BRANDING */}
            <div className="flex flex-col items-center group cursor-default mb-10">
              <span className="text-3xl md:text-4xl font-black tracking-tight leading-none text-primary">
                Navgurukul
              </span>
              <span className="text-xs md:text-sm font-bold text-muted-foreground tracking-[0.2em] uppercase mt-2">
                Volunteer Connect
              </span>
            </div>

            <div className="w-full max-w-sm space-y-6">
              <div className="space-y-4">
                <div className="flex flex-col gap-2 mb-2">
                  <p className="text-center text-sm font-bold text-muted-foreground">
                    Use your Google account to continue
                  </p>
                </div>

                <Button
                  onClick={handleGoogleLogin}
                  type="button"
                  disabled={loading || !isLoaded}
                  size="lg"
                  variant="outline"
                  className="w-full h-14 rounded-xl text-base font-bold bg-white text-black hover:bg-slate-50 border border-slate-200 shadow-sm"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <div className="flex items-center justify-center gap-3">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                      </svg>
                      <span>Sign in with Google</span>
                    </div>
                  )}
                </Button>
              </div>

              <div className="pt-4 text-xs font-semibold text-center text-muted-foreground uppercase tracking-widest">
                New here?{" "}
                <Link
                  href="/register"
                  className="text-foreground font-black hover:text-primary transition-all border-b-2 border-primary/20 hover:border-primary pb-0.5 ml-1"
                >
                  Register Now!
                </Link>
              </div>
            </div>
          </div>

          {/* Right Side: Mission Slideshow */}
          <div className="relative hidden md:flex flex-col justify-center items-center text-center p-12 lg:p-16 bg-primary text-primary-foreground overflow-hidden">

            {/* Aesthetic Overlays */}
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg width=\\'20\\' height=\\'20\\' viewBox=\\'0 0 20 20\\' xmlns=\\'http://www.w3.org/2000/svg\\'%3E%3Cg fill=\\'%23ffffff\\' fill-opacity=\\'1\\' fill-rule=\\'evenodd\\'%3E%3Ccircle cx=\\'3\\' cy=\\'3\\' r=\\'3\\'/%3E%3Ccircle cx=\\'13\\' cy=\\'13\\' r=\\'3\\'/%3E%3C/g%3E%3C/svg%3E')", backgroundSize: "20px 20px" }}></div>
            <div className="absolute top-0 right-[-20%] w-[50%] h-full bg-gradient-to-l from-white/10 to-transparent skew-x-12 rotate-12 pointer-events-none"></div>

            {/* Slideshow Content */}
            <div key={currentSlide} className="relative z-10 space-y-6 min-h-[200px] flex flex-col items-center justify-center animate-in fade-in slide-in-from-right-8 duration-700">
              <h3 className="text-3xl lg:text-4xl font-black leading-tight text-balance">
                {slides[currentSlide].title}
              </h3>
              <p className="text-primary-foreground/80 text-lg font-medium leading-relaxed max-w-[420px] mx-auto">
                {slides[currentSlide].description}
              </p>
            </div>

            {/* Floating Pagination */}
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-10 flex gap-3">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`h-2 rounded-full transition-all duration-500 ${currentSlide === index ? "w-8 bg-white shadow-lg" : "w-2 bg-white/30"
                    }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-center text-xs text-muted-foreground px-6 mt-4">
        Navgurukul Volunteer Connect
      </div>
    </div >
  );
}

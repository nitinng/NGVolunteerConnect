"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  const [selectedEmail, setSelectedEmail] = useState("priyanka@navgurukul.org");
  const router = useRouter();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleMockLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate mock API
      toast.success("Logged in successfully");
      // mock logged in
      console.log("Logged in user:", selectedEmail);
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Failed to login");
    } finally {
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

            <form onSubmit={handleMockLogin} className="w-full max-w-sm space-y-6">
              <div className="space-y-4">
                <div className="flex flex-col gap-2 mb-2">
                  <label className="text-left text-sm font-bold text-foreground">
                    Select Mock User:
                  </label>
                  <Select
                    value={selectedEmail}
                    onValueChange={setSelectedEmail}
                  >
                    <SelectTrigger className="w-full h-12 bg-muted/50 border-border rounded-xl">
                      <SelectValue placeholder="Select a user" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="priyanka@navgurukul.org">Volunteer (Priyanka)</SelectItem>
                      <SelectItem value="test.verify@navgurukul.org">Program (Verification Test)</SelectItem>
                      <SelectItem value="nitin.s@navgurukul.org">Operations (Nitin S.)</SelectItem>
                      <SelectItem value="admin@navgurukul.org">Admin (Admin User)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  size="lg"
                  className="w-full h-14 rounded-xl text-base font-bold uppercase tracking-widest shadow-lg hover:shadow-xl transition-all"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin text-primary-foreground" />
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </div>

              <div className="pt-4 text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                New here?{" "}
                <Link
                  href="/regester"
                  className="text-foreground font-black hover:text-primary transition-all border-b-2 border-primary/20 hover:border-primary pb-0.5 ml-1"
                >
                  Register Now!
                </Link>
              </div>
            </form>
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
    </div>
  );
}

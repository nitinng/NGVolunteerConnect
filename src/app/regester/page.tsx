"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, CheckCircle2, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Toaster } from "@/components/ui/sonner";

export default function RegistrationPage() {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        fullName: "",
        city: "",
        state: "",
        country: "",
        description: "",
        experienceYears: "",
        startTime: "",
        source: "",
        sourceOther: "",
        volunteeringType: "",
        phone: "",
        linkedin: "",
        resumeUrl: "",
        inclusionAgreed: false,
    });

    const totalSteps = 7;
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const sections = [
        { label: "Identity", steps: [1] },
        { label: "Profile", steps: [2, 3] },
        { label: "Intent", steps: [4, 5, 6] },
        { label: "Verification", steps: [7] },
    ];

    const currentSectionIndex = sections.findIndex((s) => s.steps.includes(step));

    const handleMockRegistration = async () => {
        setLoading(true);
        try {
            await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate mock API
            toast.success("Registration complete!");
            // mock onComplete behavior
            console.log("Registered:", { ...formData, id: "mock-id", email: "volunteer@navgurukul.org" });
            router.push("/dashboard");
        } catch (err: any) {
            toast.error(`Registration Error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const isStepValid = () => {
        switch (step) {
            case 1:
                return formData.fullName && formData.city && formData.state && formData.country;
            case 2:
                return !!formData.description;
            case 3:
                return !!formData.experienceYears;
            case 4:
                return !!formData.startTime;
            case 5:
                if (formData.source === "Other") return !!formData.sourceOther;
                return !!formData.source;
            case 6:
                return !!formData.volunteeringType;
            case 7:
                return formData.inclusionAgreed;
            default:
                return false;
        }
    };

    const nextStep = () => {
        if (step < totalSteps) setStep(step + 1);
    };

    const prevStep = () => {
        if (step > 1) setStep(step - 1);
    };

    // Shared UI Classes translated slightly to shadcn + lucide styling
    const headerTitleClass = "text-xl font-bold tracking-tight mb-1";
    const headerDescClass = "text-sm text-muted-foreground mb-6";

    const verticalOptionClass = (isSelected: boolean) => `
        w-full p-4 mb-3 border rounded-xl text-left transition-all duration-200 group flex items-center justify-between
        ${isSelected
            ? "border-primary bg-primary/5 ring-1 ring-primary"
            : "border-border hover:border-primary/40 hover:bg-accent/50"
        }
    `;

    return (
        <div className="min-h-screen w-full bg-slate-50 dark:bg-zinc-950 flex flex-col items-center relative overflow-hidden font-sans selection:bg-primary/20 selection:text-primary">
            <Toaster position="top-center" />

            {/* Background Gradient */}
            <div className="absolute inset-0 pointer-events-none z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[80%] h-[80%] bg-gradient-to-br from-slate-200/40 dark:from-primary/10 to-transparent rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[80%] h-[80%] bg-gradient-to-tl from-indigo-200/40 dark:from-primary/10 to-transparent rounded-full blur-[120px]"></div>
            </div>

            {/* Top Navigation */}
            <div className="w-full max-w-7xl px-8 py-10 flex items-center justify-between z-10">
                {/* Brand & Back Button */}
                <div className="flex items-center gap-6">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={prevStep}
                        disabled={step === 1}
                        className="rounded-full shadow-sm disabled:opacity-0 transition-opacity"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </div>

                {/* Stepper */}
                <div className="hidden md:flex items-center gap-8">
                    {sections.map((section, idx) => {
                        const isCompleted = currentSectionIndex > idx;
                        const isCurrent = currentSectionIndex === idx;
                        return (
                            <React.Fragment key={section.label}>
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${isCompleted
                                            ? "bg-primary text-primary-foreground"
                                            : isCurrent
                                                ? "bg-primary/10 border-2 border-primary text-primary"
                                                : "bg-muted text-muted-foreground"
                                            }`}
                                    >
                                        {isCompleted ? <Check className="h-4 w-4" /> : idx + 1}
                                    </div>
                                    <span
                                        className={`text-sm font-bold transition-colors ${isCurrent ? "text-foreground" : "text-muted-foreground"
                                            }`}
                                    >
                                        {section.label}
                                    </span>
                                </div>
                                {idx < sections.length - 1 && (
                                    <div className="h-[1px] w-8 bg-border"></div>
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>

                {/* Right Action (Next Placeholder) */}
                <div className="w-10 h-10"></div>
            </div>

            {/* Main Content Card */}
            <div className="flex-1 w-full flex items-center justify-center p-4 z-10">
                <div className="w-full max-w-[480px] bg-card rounded-2xl shadow-xl border border-border p-6 md:p-8 transition-all duration-500">

                    {/* Form Step Headers */}
                    {step === 1 && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <h2 className={headerTitleClass}>Let's start with your identity</h2>
                            <p className={headerDescClass}>
                                This helps us route you to the right campus or team based on where you reside.
                            </p>

                            <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar space-y-4">
                                <div className="space-y-1.5">
                                    <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">
                                        Full Name
                                    </Label>
                                    <Input
                                        type="text"
                                        placeholder="Enter your name"
                                        value={formData.fullName}
                                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                        className="rounded-xl py-6"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">
                                            City
                                        </Label>
                                        <Input
                                            type="text"
                                            placeholder="City"
                                            value={formData.city}
                                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                            className="rounded-xl py-6"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">
                                            State
                                        </Label>
                                        <Input
                                            type="text"
                                            placeholder="State"
                                            value={formData.state}
                                            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                            className="rounded-xl py-6"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">
                                        Country
                                    </Label>
                                    <Input
                                        type="text"
                                        value={formData.country}
                                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                        className="rounded-xl py-6"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <h2 className={headerTitleClass}>What best describes you?</h2>
                            <p className={headerDescClass}>
                                Select the category that matches your current professional standing.
                            </p>
                            <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                {[
                                    { id: "Student", sub: "I am currently studying" },
                                    { id: "Working Professional", sub: "I have a full-time job" },
                                    { id: "Founder / Senior Leader", sub: "I lead a company or team" },
                                    { id: "Alumni of NavGurukul", sub: "I was a student at NG" },
                                    { id: "Corporate Partner", sub: "Volunteering via my company" },
                                    { id: "Career Break / Exploring", sub: "I am in between roles" },
                                ].map((opt) => (
                                    <button
                                        key={opt.id}
                                        onClick={() => setFormData({ ...formData, description: opt.id })}
                                        className={verticalOptionClass(formData.description === opt.id)}
                                    >
                                        <div className="flex flex-col">
                                            <span
                                                className={`text-sm font-bold ${formData.description === opt.id
                                                    ? "text-primary"
                                                    : "text-foreground"
                                                    }`}
                                            >
                                                {opt.id}
                                            </span>
                                            <span className="text-xs text-muted-foreground font-medium mt-0.5">
                                                {opt.sub}
                                            </span>
                                        </div>
                                        {formData.description === opt.id && (
                                            <CheckCircle2 className="h-5 w-5 text-primary" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <h2 className={headerTitleClass}>Levels of experience?</h2>
                            <p className={headerDescClass}>
                                Tell us how many years you've spent in your professional journey.
                            </p>
                            <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                {[
                                    { id: "0–1", label: "Beginner", desc: "Fresh graduate or starting out" },
                                    { id: "1–3", label: "Junior", desc: "Working on core skills" },
                                    { id: "3–7", label: "Intermediate", desc: "Can bridge complex domains" },
                                    { id: "7+", label: "Master", desc: "Expert/Architect level" },
                                ].map((opt) => (
                                    <button
                                        key={opt.id}
                                        onClick={() => setFormData({ ...formData, experienceYears: opt.id })}
                                        className={verticalOptionClass(formData.experienceYears === opt.id)}
                                    >
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className={`text-sm font-bold ${formData.experienceYears === opt.id
                                                        ? "text-primary"
                                                        : "text-foreground"
                                                        }`}
                                                >
                                                    {opt.label}
                                                </span>
                                                <span className="text-[10px] px-1.5 bg-secondary text-secondary-foreground rounded-md font-bold py-0.5">
                                                    {opt.id} yrs
                                                </span>
                                            </div>
                                            <span className="text-xs text-muted-foreground font-medium mt-0.5">
                                                {opt.desc}
                                            </span>
                                        </div>
                                        {formData.experienceYears === opt.id && (
                                            <CheckCircle2 className="h-5 w-5 text-primary" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <h2 className={headerTitleClass}>When can you start?</h2>
                            <p className={headerDescClass}>
                                We'll use this to coordinate with project leads for your onboarding.
                            </p>
                            <div className="min-h-[240px]">
                                {["Immediately", "Within a month", "Just exploring for now"].map((time) => (
                                    <button
                                        key={time}
                                        onClick={() => setFormData({ ...formData, startTime: time })}
                                        className={verticalOptionClass(formData.startTime === time)}
                                    >
                                        <span
                                            className={`text-sm font-bold ${formData.startTime === time ? "text-primary" : "text-foreground"
                                                }`}
                                        >
                                            {time}
                                        </span>
                                        {formData.startTime === time && (
                                            <CheckCircle2 className="h-5 w-5 text-primary" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 5 && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <h2 className={headerTitleClass}>How did you hear about NavGurukul?</h2>
                            <p className={headerDescClass}>
                                Source tracking helps us acknowledge our partners and communities.
                            </p>
                            <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                {[
                                    "LinkedIn",
                                    "Instagram",
                                    "Twitter / X",
                                    "NavGurukul Alumni",
                                    "Corporate Partner",
                                    "Event / Workshop",
                                    "Friend / Referral",
                                    "Google Search",
                                    "Other",
                                ].map((src) => (
                                    <div key={src} className="space-y-2">
                                        <button
                                            onClick={() => setFormData({ ...formData, source: src })}
                                            className={verticalOptionClass(formData.source === src)}
                                        >
                                            <span
                                                className={`text-sm font-bold ${formData.source === src ? "text-primary" : "text-foreground"
                                                    }`}
                                            >
                                                {src}
                                            </span>
                                            {formData.source === src && (
                                                <CheckCircle2 className="h-5 w-5 text-primary" />
                                            )}
                                        </button>

                                        {src === "Other" && formData.source === "Other" && (
                                            <div className="animate-in fade-in slide-in-from-top-2 px-1 pb-2">
                                                <Input
                                                    type="text"
                                                    placeholder="Please specify..."
                                                    value={formData.sourceOther}
                                                    onChange={(e) =>
                                                        setFormData({ ...formData, sourceOther: e.target.value })
                                                    }
                                                    autoFocus
                                                    className="rounded-xl py-6"
                                                />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 6 && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <h2 className={headerTitleClass}>Volunteering Type?</h2>
                            <p className={headerDescClass}>
                                This defines your engagement model with the foundation.
                            </p>
                            <div className="min-h-[240px]">
                                {[
                                    { id: "Individual", sub: "Personal contribution" },
                                    { id: "Corporate-sponsored", sub: "Through your employer CSR" },
                                    { id: "Alumni network", sub: "NavGurukul family" },
                                ].map((type) => (
                                    <button
                                        key={type.id}
                                        onClick={() => setFormData({ ...formData, volunteeringType: type.id })}
                                        className={verticalOptionClass(formData.volunteeringType === type.id)}
                                    >
                                        <div className="flex flex-col">
                                            <span
                                                className={`text-sm font-bold ${formData.volunteeringType === type.id
                                                    ? "text-primary"
                                                    : "text-foreground"
                                                    }`}
                                            >
                                                {type.id}
                                            </span>
                                            <span className="text-xs text-muted-foreground font-medium mt-0.5">
                                                {type.sub}
                                            </span>
                                        </div>
                                        {formData.volunteeringType === type.id && (
                                            <CheckCircle2 className="h-5 w-5 text-primary" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 7 && (
                        <div className="animate-in zoom-in-95 fade-in duration-500">
                            <h2 className={headerTitleClass}>Shared Values</h2>
                            <p className={headerDescClass}>
                                To join our network, we require a commitment to inclusive education.
                            </p>

                            <div
                                onClick={() =>
                                    setFormData({ ...formData, inclusionAgreed: !formData.inclusionAgreed })
                                }
                                className={`p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300 flex items-start gap-4 mb-8 ${formData.inclusionAgreed
                                    ? "bg-primary/5 border-primary/50"
                                    : "bg-muted/50 border-border"
                                    }`}
                            >
                                <div
                                    className={`mt-0.5 w-5 h-5 rounded-md flex-shrink-0 flex items-center justify-center border-2 transition-all ${formData.inclusionAgreed
                                        ? "bg-primary border-primary shadow-sm"
                                        : "border-muted-foreground/30 bg-background"
                                        }`}
                                >
                                    {formData.inclusionAgreed && <Check className="text-primary-foreground h-3 w-3" />}
                                </div>
                                <p className="text-xs font-bold leading-relaxed uppercase tracking-wider text-muted-foreground">
                                    I confirm I am comfortable working with students from underserved backgrounds in an
                                    inclusive environment.
                                </p>
                            </div>

                            <Button
                                onClick={handleMockRegistration}
                                disabled={!formData.inclusionAgreed || loading}
                                size="lg"
                                variant="outline"
                                className="w-full rounded-xl font-bold py-6 text-base bg-white text-black hover:bg-slate-50 dark:bg-white dark:text-black dark:hover:bg-gray-100"
                            >
                                {loading ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <div className="flex items-center justify-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5">
                                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                        </svg>
                                        <span>Sign up with Google</span>
                                    </div>
                                )}
                            </Button>
                        </div>
                    )}

                    {/* Footer Actions */}
                    <div className="mt-6 pt-6 border-t border-border flex items-center justify-between">
                        {/* Pagination Dots */}
                        <div className="flex gap-1.5">
                            {Array.from({ length: totalSteps }).map((_, i) => (
                                <div
                                    key={i}
                                    className={`h-1.5 rounded-full transition-all duration-300 ${step === i + 1 ? "w-4 bg-primary" : "w-1.5 bg-muted"
                                        }`}
                                ></div>
                            ))}
                        </div>

                        {/* Next Button */}
                        {step < totalSteps && (
                            <Button
                                onClick={nextStep}
                                disabled={!isStepValid()}
                                className="rounded-xl px-6"
                            >
                                Next
                                <ArrowRight className="h-4 w-4 ml-2 text-primary-foreground" />
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Support Info */}
            <div className="py-8 z-10">
                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.3em]">
                    Navgurukul Volunteer Connect
                </p>
            </div>
        </div>
    );
}

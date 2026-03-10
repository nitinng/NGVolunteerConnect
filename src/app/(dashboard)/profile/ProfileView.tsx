"use client";

import { useAuthActions } from "@/hooks/use-auth";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
    Loader2, Moon, User, Briefcase, GraduationCap,
    Heart, Calendar, LogOut, Check, MapPin, Phone,
    Linkedin, FileText, Target
} from "lucide-react";
import { updateProfile, getMyProfile } from "@/app/actions/profile-actions";
import { Profile, SkillCategory, SkillSubcategory } from "@/lib/supabase";
import {
    getSkillCategories,
    getSkillSubcategories
} from "@/app/actions/skills-actions";
import { calculateProfileCompletion } from "@/lib/profile-utils";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useTheme } from "next-themes";
import { useUserContext } from "@/contexts/user-context";

const INDUSTRY_VERTICALS = [
    "Software Engineering",
    "Product Management",
    "Design / UX",
    "Legal",
    "Finance / Accounting",
    "Marketing / Content",
    "HR / People Ops",
    "Data / ML / AI",
    "Teaching / Education",
    "General / Other",
];

export default function ProfileView() {
    const user = useUserContext();
    const { signOut } = useAuthActions();
    const { theme, setTheme } = useTheme();

    const [isSaving, setIsSaving] = useState(false);
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);
    const [profile, setProfile] = useState<Profile | null>(null);

    // Local form state — mirrors Supabase profile fields
    const [formData, setFormData] = useState({
        // Personal
        fullName: "",
        phone: "",
        whatsapp_option: "same",
        whatsapp_number: "",
        contact_mode: "",
        newsletter: false,
        pronouns: "",
        city: "",
        state: "",
        country: "",

        // Education
        education_degree: "",
        education_institution: "",
        education_year: "",

        // Professional
        linkedin_url: "",
        resume_url: "",
        years_of_experience: [0] as number[],
        months_of_experience: [0] as number[],
        job_title: "",
        employer: "",
        industry_vertical: "",
        experience_description: "",

        // Skills
        primary_skill_category: "",
        secondary_skill_category: "",

        // Commitment
        apply_project: "",
        commitment_type: "",
        hours_per_week: "",
        volunteer_mode: "",
        contact_mode_pref: "",
        acknowledgement: false,
    });

    const [selectedPrimarySubSkills, setSelectedPrimarySubSkills] = useState<string[]>([]);
    const [selectedSecondarySubSkills, setSelectedSecondarySubSkills] = useState<string[]>([]);
    const [dbCategories, setDbCategories] = useState<SkillCategory[]>([]);
    const [dbSubcategories, setDbSubcategories] = useState<SkillSubcategory[]>([]);

    // Load skills data and profile
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const [cats, subcats] = await Promise.all([
                    getSkillCategories(),
                    getSkillSubcategories()
                ]);
                setDbCategories(cats);
                setDbSubcategories(subcats as SkillSubcategory[]);
            } catch (err) {
                console.error("Failed to load skills data:", err);
            }
        };
        loadInitialData();
    }, []);

    // Load profile from Supabase on mount
    useEffect(() => {
        console.log("[ProfileView] useEffect triggered. User:", user?.id);

        // User is not logged in — stop loading immediately
        if (!user) {
            console.log("[ProfileView] No user found in context. Stopping load.");
            setIsLoadingProfile(false);
            return;
        }

        console.log("[ProfileView] Fetching profile for:", user.id);
        getMyProfile().then((p) => {
            console.log("[ProfileView] Profile fetch result:", p ? "Found" : "Not Found");
            if (p) {
                setProfile(p);
                setFormData({
                    fullName: user.fullName || p.full_name || "",
                    phone: p.phone ?? "",
                    whatsapp_option: p.whatsapp_option ?? "same",
                    whatsapp_number: p.whatsapp_number ?? "",
                    contact_mode: p.contact_mode ?? "",
                    newsletter: p.newsletter ?? false,
                    pronouns: p.pronouns ?? "",
                    city: p.city ?? "",
                    state: p.state ?? "",
                    country: p.country ?? "",
                    education_degree: p.education_degree ?? "",
                    education_institution: p.education_institution ?? "",
                    education_year: p.education_year ?? "",
                    linkedin_url: p.linkedin_url ?? "",
                    resume_url: p.resume_url ?? "",
                    years_of_experience: [p.years_of_experience ?? 0],
                    months_of_experience: [p.months_of_experience ?? 0],
                    job_title: p.job_title ?? "",
                    employer: p.employer ?? "",
                    industry_vertical: p.industry_vertical ?? "",
                    experience_description: p.experience_description ?? "",
                    primary_skill_category: p.primary_skill_category ?? "",
                    secondary_skill_category: p.secondary_skill_category ?? "",
                    apply_project: p.apply_project ?? "",
                    commitment_type: p.commitment_type ?? "",
                    hours_per_week: p.hours_per_week ?? "",
                    volunteer_mode: p.volunteer_mode ?? "",
                    contact_mode_pref: p.contact_mode ?? "",
                    acknowledgement: p.acknowledgement ?? false,
                });

                // Load sub-skills from profiles table
                setSelectedPrimarySubSkills(p.primary_skill_subcategories || []);
                setSelectedSecondarySubSkills(p.secondary_skill_subcategories || []);
            }
        }).catch((err) => {
            console.error("[ProfileView] Failed to load profile:", err);
            toast.error("Failed to load profile data.");
        }).finally(() => {
            console.log("[ProfileView] Load complete.");
            setIsLoadingProfile(false);
        });
    }, [user]);

    if (isLoadingProfile) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!user) return null;

    const handleSave = async () => {
        setIsSaving(true);
        try {
            if (user && formData.fullName !== user.fullName) {
                const parts = formData.fullName.trim().split(" ");
                const firstName = parts[0] || "";
                const lastName = parts.slice(1).join(" ") || "";
                const fullName = `${firstName} ${lastName}`.trim();

                // Manually update via Supabase since UserContext doesn't have an 'update' method
                const { createBrowserClient } = await import("@/lib/supabase");
                const supabase = createBrowserClient();
                await supabase.auth.updateUser({
                    data: { full_name: fullName }
                });
            }

            await updateProfile({
                phone: formData.phone || null,
                whatsapp_option: formData.whatsapp_option || null,
                whatsapp_number: formData.whatsapp_number || null,
                contact_mode: formData.contact_mode || null,
                newsletter: formData.newsletter,
                pronouns: formData.pronouns || null,
                city: formData.city || null,
                state: formData.state || null,
                country: formData.country || null,
                education_degree: formData.education_degree || null,
                education_institution: formData.education_institution || null,
                education_year: formData.education_year || null,
                linkedin_url: formData.linkedin_url || null,
                resume_url: formData.resume_url || null,
                years_of_experience: formData.years_of_experience[0],
                months_of_experience: formData.months_of_experience[0],
                job_title: formData.job_title || null,
                employer: formData.employer || null,
                industry_vertical: formData.industry_vertical || null,
                experience_description: formData.experience_description || null,
                primary_skill_category: formData.primary_skill_category || null,
                secondary_skill_category: formData.secondary_skill_category || null,
                primary_skill_subcategories: selectedPrimarySubSkills.length > 0 ? selectedPrimarySubSkills : null,
                secondary_skill_subcategories: selectedSecondarySubSkills.length > 0 ? selectedSecondarySubSkills : null,
                apply_project: formData.apply_project || null,
                commitment_type: formData.commitment_type || null,
                hours_per_week: formData.hours_per_week || null,
                volunteer_mode: formData.volunteer_mode || null,
                acknowledgement: formData.acknowledgement,
            });

            toast.success("Profile saved ✓");
        } catch (error: any) {
            toast.error(error.message || "Failed to save profile.");
        } finally {
            setIsSaving(false);
        }
    };

    const getGraduationYears = () => {
        const currentYear = new Date().getFullYear();
        const yearsSet = new Set(["2027 or later (Student)", "2026", "2025"]);
        for (let i = currentYear - 1; i >= 2010; i--) yearsSet.add(i.toString());
        yearsSet.add("Earlier");
        return Array.from(yearsSet);
    };

    const volunteerTypeBadge: Record<string, { label: string; color: string }> = {
        external_individual: { label: "Individual Contributor", color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300" },
        external_corporate: { label: "Corporate / CSR", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
        internal_alumni_ext: { label: "Alumni — External", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" },
        internal_alumni_staff: { label: "Alumni — Staff", color: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300" },
    };

    const typeBadge = profile?.volunteer_type ? volunteerTypeBadge[profile.volunteer_type] : null;

    const isProgramOrOps = ["Program", "Operations"].includes(user?.role as string);
    const isVolunteerEnabled = user?.volunteerEnabled === true;
    const showVolunteerTabs = !isProgramOrOps || isVolunteerEnabled;

    return (
        <div className="w-full max-w-4xl mx-auto space-y-6 pb-12 p-4 md:p-8">

            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                        <AvatarImage src={user.imageUrl} />
                        <AvatarFallback>{user.firstName?.charAt(0)}{user.lastName?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <h1 className="text-2xl font-bold tracking-tight">{user.fullName}</h1>
                            {typeBadge && (
                                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${typeBadge.color}`}>
                                    {typeBadge.label}
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        {profile?.description && (
                            <p className="text-xs text-muted-foreground mt-0.5">{profile.description}</p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
                        <Moon className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" onClick={() => signOut({ redirectUrl: "/login" })}>
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                    </Button>
                </div>
            </div>

            {/* ── Progress Bar ── */}
            <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                    <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">Profile Completion</span>
                    <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                        {calculateProfileCompletion(profile, user?.publicMetadata, dbCategories.map(c => c.key))}%
                    </span>
                </div>
                <Progress
                    value={calculateProfileCompletion(profile, user?.publicMetadata, dbCategories.map(c => c.key))}
                    className="h-2"
                    indicatorClassName="bg-emerald-500"
                />
            </div>

            {/* ── Tabs ── */}
            <Tabs defaultValue="personal" className="w-full">
                <TabsList className={`grid w-full mb-4 ${showVolunteerTabs ? 'grid-cols-2 md:grid-cols-5' : 'grid-cols-1 md:w-[200px]'}`}>
                    <TabsTrigger value="personal"><User className="w-4 h-4 mr-2" />Personal</TabsTrigger>
                    {showVolunteerTabs && (
                        <>
                            <TabsTrigger value="education"><GraduationCap className="w-4 h-4 mr-2" />Education</TabsTrigger>
                            <TabsTrigger value="professional"><Briefcase className="w-4 h-4 mr-2" />Professional</TabsTrigger>
                            <TabsTrigger value="skills"><Heart className="w-4 h-4 mr-2" />Skills</TabsTrigger>
                            <TabsTrigger value="availability"><Calendar className="w-4 h-4 mr-2" />Commitment</TabsTrigger>
                        </>
                    )}
                </TabsList>

                {/* ─── TAB: PERSONAL ─── */}
                <TabsContent value="personal">
                    <Card>
                        <CardHeader>
                            <CardTitle>Personal Information</CardTitle>
                            <CardDescription>Your contact details and location.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>Full Name</Label>
                                    <Input
                                        value={formData.fullName}
                                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                        placeholder="Your full name"
                                    />
                                    <p className="text-[10px] text-muted-foreground">Updates your profile name</p>
                                </div>
                                <div className="space-y-2">
                                    <Label>Email Address</Label>
                                    <Input disabled value={user.email || ""} className="text-muted-foreground" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Phone Number</Label>
                                    <Input
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="e.g. 9876543210"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Pronouns</Label>
                                    <Input
                                        value={formData.pronouns}
                                        onChange={(e) => setFormData({ ...formData, pronouns: e.target.value })}
                                        placeholder="e.g. he/him, she/her, they/them"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>WhatsApp</Label>
                                    <Select value={formData.whatsapp_option} onValueChange={(v) => setFormData({ ...formData, whatsapp_option: v })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="same">Same as Phone</SelectItem>
                                            <SelectItem value="different">Different Number</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                {formData.whatsapp_option === "different" && (
                                    <div className="space-y-2">
                                        <Label>WhatsApp Number</Label>
                                        <Input
                                            value={formData.whatsapp_number}
                                            onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })}
                                            placeholder="WhatsApp number"
                                        />
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <Label>City</Label>
                                    <Input value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>State</Label>
                                    <Input value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Country</Label>
                                    <Input value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value })} />
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                                <Checkbox
                                    id="newsletter"
                                    checked={formData.newsletter}
                                    onCheckedChange={(c) => setFormData({ ...formData, newsletter: !!c })}
                                />
                                <Label htmlFor="newsletter" className="text-sm cursor-pointer">
                                    Subscribe to NavGurukul monthly newsletter and community updates
                                </Label>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ─── TAB: EDUCATION ─── */}
                {showVolunteerTabs && (
                    <TabsContent value="education">
                        <Card>
                            <CardHeader>
                                <CardTitle>Educational Background</CardTitle>
                                <CardDescription>Your highest qualification and graduation details.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label>Highest Degree / Qualification</Label>
                                        <Input
                                            value={formData.education_degree}
                                            onChange={(e) => setFormData({ ...formData, education_degree: e.target.value })}
                                            placeholder="e.g. B.Tech Computer Science"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Institution / University</Label>
                                        <Input
                                            value={formData.education_institution}
                                            onChange={(e) => setFormData({ ...formData, education_institution: e.target.value })}
                                            placeholder="e.g. IIT Delhi"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Year of Graduation</Label>
                                        <Select value={formData.education_year} onValueChange={(v) => setFormData({ ...formData, education_year: v })}>
                                            <SelectTrigger><SelectValue placeholder="Select Year" /></SelectTrigger>
                                            <SelectContent>
                                                {getGraduationYears().map((year) => (
                                                    <SelectItem key={year} value={year}>{year}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                )}

                {/* ─── TAB: PROFESSIONAL ─── */}
                {showVolunteerTabs && (
                    <TabsContent value="professional">
                        <Card>
                            <CardHeader>
                                <CardTitle>Professional Details</CardTitle>
                                <CardDescription>Your experience helps match you to the right projects.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label>Current Job Title</Label>
                                        <Input
                                            value={formData.job_title}
                                            onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                                            placeholder="e.g. Senior Software Engineer"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Employer / Company</Label>
                                        <Input
                                            value={formData.employer}
                                            onChange={(e) => setFormData({ ...formData, employer: e.target.value })}
                                            placeholder="e.g. Google"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Industry Vertical</Label>
                                        <Select value={formData.industry_vertical} onValueChange={(v) => setFormData({ ...formData, industry_vertical: v })}>
                                            <SelectTrigger><SelectValue placeholder="Select industry" /></SelectTrigger>
                                            <SelectContent>
                                                {INDUSTRY_VERTICALS.map((v) => (
                                                    <SelectItem key={v} value={v}>{v}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>LinkedIn Profile</Label>
                                        <Input
                                            value={formData.linkedin_url}
                                            onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                                            placeholder="https://linkedin.com/in/username"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Resume / Portfolio URL</Label>
                                        <Input
                                            value={formData.resume_url}
                                            onChange={(e) => setFormData({ ...formData, resume_url: e.target.value })}
                                            placeholder="URL to Drive, Notion, or Portfolio"
                                        />
                                    </div>
                                </div>
                                <div className="grid sm:grid-cols-2 gap-8 pt-4 border-t">
                                    <div className="space-y-4">
                                        <div className="flex justify-between">
                                            <Label>Years of Experience</Label>
                                            <span className="text-sm text-muted-foreground font-mono">{formData.years_of_experience[0]} yrs</span>
                                        </div>
                                        <Slider
                                            value={formData.years_of_experience}
                                            onValueChange={(v) => setFormData({ ...formData, years_of_experience: v })}
                                            max={50} step={1}
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex justify-between">
                                            <Label>Additional Months</Label>
                                            <span className="text-sm text-muted-foreground font-mono">{formData.months_of_experience[0]} mo</span>
                                        </div>
                                        <Slider
                                            value={formData.months_of_experience}
                                            onValueChange={(v) => setFormData({ ...formData, months_of_experience: v })}
                                            max={11} step={1}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Describe your relevant experience</Label>
                                    <Textarea
                                        value={formData.experience_description}
                                        onChange={(e) => setFormData({ ...formData, experience_description: e.target.value })}
                                        rows={4}
                                        placeholder="I have 5 years of experience in React and TypeScript, primarily building..."
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                )}

                {/* ─── TAB: SKILLS ─── */}
                {showVolunteerTabs && (
                    <TabsContent value="skills">
                        <Card>
                            <CardHeader>
                                <CardTitle>Skill Categories</CardTitle>
                                <CardDescription>Your primary and secondary areas of expertise. Individual skill tags are managed on your dashboard.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label>Primary Skill Category <span className="text-rose-500">*</span></Label>
                                        <Select
                                            value={formData.primary_skill_category}
                                            onValueChange={(v) => {
                                                const updates: any = { primary_skill_category: v };
                                                if (v === formData.secondary_skill_category) updates.secondary_skill_category = "";
                                                setFormData({ ...formData, ...updates });
                                                // Clear selected roles when category changes
                                                setSelectedPrimarySubSkills([]);
                                            }}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select your Primary Skill" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {dbCategories.map((c) => (
                                                    <SelectItem key={c.id} value={c.title}>{c.title}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className={!formData.primary_skill_category ? "text-muted-foreground/50" : ""}>
                                            Secondary Skill Category
                                        </Label>
                                        <Select
                                            disabled={!formData.primary_skill_category}
                                            value={formData.secondary_skill_category || "none"}
                                            onValueChange={(v) => {
                                                setFormData({ ...formData, secondary_skill_category: v === "none" ? "" : v });
                                                setSelectedSecondarySubSkills([]);
                                            }}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="None" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">None</SelectItem>
                                                {dbCategories.filter((c) => c.title !== formData.primary_skill_category).map((c) => (
                                                    <SelectItem key={c.id} value={c.title}>{c.title}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {formData.primary_skill_category && (
                                    <div className="mt-8 space-y-4 pt-6 border-t">
                                        <div className="flex items-center gap-2">
                                            <Target className="w-5 h-5 text-indigo-500" />
                                            <h4 className="font-bold text-slate-900 dark:text-slate-100">Specify your roles in {formData.primary_skill_category}</h4>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            Select all that apply. This helps us assign the right onboarding tasks to you.
                                        </p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {dbSubcategories
                                                .filter(s => {
                                                    const parent = dbCategories.find(c => c.title === formData.primary_skill_category);
                                                    return s.category_id === parent?.id;
                                                })
                                                .map((role) => (
                                                    <div
                                                        key={role.id}
                                                        className={`flex items-center space-x-3 p-3 rounded-xl border transition-all cursor-pointer ${selectedPrimarySubSkills.includes(role.name) ? 'border-primary bg-primary/5' : 'bg-card hover:bg-accent/50'}`}
                                                        onClick={() => {
                                                            const exists = selectedPrimarySubSkills.includes(role.name);
                                                            if (exists) {
                                                                setSelectedPrimarySubSkills(selectedPrimarySubSkills.filter(s => s !== role.name));
                                                            } else {
                                                                setSelectedPrimarySubSkills([...selectedPrimarySubSkills, role.name]);
                                                            }
                                                        }}
                                                    >
                                                        <Checkbox
                                                            id={role.id}
                                                            checked={selectedPrimarySubSkills.includes(role.name)}
                                                            onCheckedChange={() => { }} // Handled by div onClick
                                                        />
                                                        <Label htmlFor={role.id} className="flex-1 cursor-pointer font-medium">
                                                            {role.name}
                                                        </Label>
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                )}

                                {formData.secondary_skill_category && (
                                    <div className="mt-8 space-y-4 pt-6 border-t">
                                        <div className="flex items-center gap-2">
                                            <Target className="w-5 h-5 text-indigo-500" />
                                            <h4 className="font-bold text-slate-900 dark:text-slate-100">Specify your roles in {formData.secondary_skill_category}</h4>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            Optional. Select all that apply for your secondary category.
                                        </p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {dbSubcategories
                                                .filter(s => {
                                                    const parent = dbCategories.find(c => c.title === formData.secondary_skill_category);
                                                    return s.category_id === parent?.id;
                                                })
                                                .map((role) => (
                                                    <div
                                                        key={role.id}
                                                        className={`flex items-center space-x-3 p-3 rounded-xl border transition-all cursor-pointer ${selectedSecondarySubSkills.includes(role.name) ? 'border-primary bg-primary/5' : 'bg-card hover:bg-accent/50'}`}
                                                        onClick={() => {
                                                            const exists = selectedSecondarySubSkills.includes(role.name);
                                                            if (exists) {
                                                                setSelectedSecondarySubSkills(selectedSecondarySubSkills.filter(s => s !== role.name));
                                                            } else {
                                                                setSelectedSecondarySubSkills([...selectedSecondarySubSkills, role.name]);
                                                            }
                                                        }}
                                                    >
                                                        <Checkbox
                                                            id={role.id}
                                                            checked={selectedSecondarySubSkills.includes(role.name)}
                                                            onCheckedChange={() => { }} // Handled by div onClick
                                                        />
                                                        <Label htmlFor={role.id} className="flex-1 cursor-pointer font-medium">
                                                            {role.name}
                                                        </Label>
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                )}

                {/* ─── TAB: COMMITMENT ─── */}
                {showVolunteerTabs && (
                    <TabsContent value="availability">
                        <Card>
                            <CardHeader>
                                <CardTitle>Availability & Commitment</CardTitle>
                                <CardDescription>Helps us suggest opportunities that fit your schedule.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-8">
                                <div className="space-y-2">
                                    <Label>Preferred Project (Optional)</Label>
                                    <Select value={formData.apply_project || "none"} onValueChange={(v) => setFormData({ ...formData, apply_project: v === "none" ? "" : v })}>
                                        <SelectTrigger><SelectValue placeholder="Select Project" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">None</SelectItem>
                                            <SelectItem value="SOSC">SOSC</SelectItem>
                                            <SelectItem value="Zuvy">Zuvy</SelectItem>
                                            <SelectItem value="Residential Programs">Residential Programs</SelectItem>
                                            <SelectItem value="Outreach and Communications">Outreach and Communications</SelectItem>
                                            <SelectItem value="General Volunteer">General Volunteer</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid md:grid-cols-2 gap-8 border-t pt-6">
                                    <div className="space-y-4">
                                        <Label className="text-base font-semibold">Commitment Type <span className="text-rose-500">*</span></Label>
                                        <RadioGroup value={formData.commitment_type} onValueChange={(v) => setFormData({ ...formData, commitment_type: v })} className="space-y-3">
                                            {["One-time session", "Short-term (1–3 months)", "Long term (3+ months)"].map((opt) => (
                                                <div key={opt} className="flex items-center space-x-3 p-3 rounded-md border bg-card hover:bg-accent/50 transition-colors">
                                                    <RadioGroupItem value={opt} id={`commit-${opt}`} />
                                                    <Label htmlFor={`commit-${opt}`} className="flex-1 cursor-pointer font-medium">{opt}</Label>
                                                </div>
                                            ))}
                                        </RadioGroup>
                                    </div>

                                    <div className="space-y-4">
                                        <Label className="text-base font-semibold">Hours per Week <span className="text-rose-500">*</span></Label>
                                        <RadioGroup value={formData.hours_per_week} onValueChange={(v) => setFormData({ ...formData, hours_per_week: v })} className="grid grid-cols-2 gap-3">
                                            {["1-2 hours", "2–4 hours", "5–8 hours", "8+ hours", "Flexible"].map((opt) => (
                                                <div key={opt} className="flex items-center space-x-3 p-3 rounded-md border bg-card hover:bg-accent/50 transition-colors">
                                                    <RadioGroupItem value={opt} id={`hours-${opt}`} />
                                                    <Label htmlFor={`hours-${opt}`} className="flex-1 cursor-pointer font-medium">{opt}</Label>
                                                </div>
                                            ))}
                                        </RadioGroup>
                                    </div>

                                    <div className="space-y-4 md:col-span-2">
                                        <Label className="text-base font-semibold">Volunteering Mode <span className="text-rose-500">*</span></Label>
                                        <RadioGroup value={formData.volunteer_mode} onValueChange={(v) => setFormData({ ...formData, volunteer_mode: v })} className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                            {["Remote", "In-person (Only Pune Campus)", "Hybrid"].map((opt) => (
                                                <div key={opt} className="flex items-center space-x-3 p-4 rounded-md border bg-card hover:bg-accent/50 transition-colors">
                                                    <RadioGroupItem value={opt} id={`mode-${opt}`} />
                                                    <Label htmlFor={`mode-${opt}`} className="flex-1 cursor-pointer font-semibold">{opt}</Label>
                                                </div>
                                            ))}
                                        </RadioGroup>
                                    </div>

                                    <div className="space-y-4 md:col-span-2">
                                        <Label className="text-base font-semibold">Preferred Contact Mode</Label>
                                        <RadioGroup value={formData.contact_mode} onValueChange={(v) => setFormData({ ...formData, contact_mode: v })} className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                            {["Mail", "SMS", "WhatsApp", "Call"].map((opt) => (
                                                <div key={opt} className="flex items-center space-x-3 p-3 rounded-md border bg-card hover:bg-accent/50 transition-colors">
                                                    <RadioGroupItem value={opt} id={`cmode-${opt}`} />
                                                    <Label htmlFor={`cmode-${opt}`} className="flex-1 cursor-pointer font-medium">{opt}</Label>
                                                </div>
                                            ))}
                                        </RadioGroup>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 p-4 bg-muted/40 rounded-lg border border-border/50">
                                    <Checkbox
                                        id="ack"
                                        checked={formData.acknowledgement}
                                        onCheckedChange={(c) => setFormData({ ...formData, acknowledgement: !!c })}
                                        className="mt-1"
                                    />
                                    <div>
                                        <Label htmlFor="ack" className="text-sm font-semibold cursor-pointer">Final Acknowledgement</Label>
                                        <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                                            I understand that volunteer opportunities at NavGurukul are need-based, and engagement depends on current organizational priorities and availability.
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                )}
            </Tabs>

            {/* ── Save Button ── */}
            <div className="flex justify-end pt-4">
                <Button onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto">
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                    Save
                </Button>
            </div>
        </div >
    );
}

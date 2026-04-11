"use client"

import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
    CheckCircle2, 
    AlertCircle, 
    Info, 
    TriangleAlert, 
    Loader2,
    Calendar,
    Bell,
    Trash2,
    UserPlus,
    UserCog,
    Key,
    ShieldCheck,
    Briefcase,
    Zap
} from "lucide-react"

export default function ToastGalleryPage() {
  return (
    <div className="flex flex-1 flex-col gap-8 p-4 md:p-8 max-w-7xl mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                    <Bell className="w-8 h-8 text-indigo-500" />
                    System Toast Registry
                </h1>
                <p className="text-muted-foreground mt-2">
                    A comprehensive gallery of all notification messages used across the NavGurukul Volunteer Connect application.
                </p>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest border px-3 py-1.5 rounded-full bg-slate-50 dark:bg-zinc-900">
                <ShieldCheck className="w-3 h-3" />
                Theme Persistent
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Standard Types (Kitchen Sink) */}
            <Card className="border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden lg:col-span-1">
                <CardHeader className="border-b bg-slate-50/50 dark:bg-zinc-900/50">
                    <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-500">Standard Variants</CardTitle>
                </CardHeader>
                <CardContent className="p-4 grid grid-cols-1 gap-2">
                    <Button variant="outline" className="justify-start gap-3 h-10 text-xs font-medium" onClick={() => toast.success("Success Toast Example")}>
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Success
                    </Button>
                    <Button variant="outline" className="justify-start gap-3 h-10 text-xs font-medium" onClick={() => toast.error("Error Toast Example")}>
                        <AlertCircle className="w-4 h-4 text-red-500" /> Error
                    </Button>
                    <Button variant="outline" className="justify-start gap-3 h-10 text-xs font-medium" onClick={() => toast.warning("Warning Toast Example")}>
                        <TriangleAlert className="w-4 h-4 text-amber-500" /> Warning
                    </Button>
                    <Button variant="outline" className="justify-start gap-3 h-10 text-xs font-medium" onClick={() => toast.info("Info Toast Example")}>
                        <Info className="w-4 h-4 text-blue-500" /> Info
                    </Button>
                </CardContent>
            </Card>

            {/* Profile & Auth */}
            <Card className="border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                <CardHeader className="border-b bg-indigo-50/30 dark:bg-indigo-900/10">
                    <CardTitle className="text-xs font-bold uppercase tracking-widest text-indigo-500">Profile & Auth</CardTitle>
                </CardHeader>
                <CardContent className="p-4 flex flex-col gap-2">
                    <Button variant="ghost" className="justify-start gap-3 text-xs" onClick={() => {
                        const p = new Promise(r => setTimeout(r, 2000));
                        toast.promise(p, { loading: "Saving changes...", success: "Profile Updated Successfully", error: "Error" });
                    }}>
                        <Loader2 className="w-4 h-4 animate-spin" /> Profile Update (Promise)
                    </Button>
                    <Button variant="ghost" className="justify-start gap-3 text-xs" onClick={() => toast.success("Password updated successfully!")}>
                        <Key className="w-4 h-4 text-emerald-500" /> Password Updated
                    </Button>
                    <Button variant="ghost" className="justify-start gap-3 text-xs" onClick={() => toast.info("User already exists. Redirecting to login...")}>
                        <Info className="w-4 h-4 text-blue-500" /> Redirecting...
                    </Button>
                    <Button variant="ghost" className="justify-start gap-3 text-xs text-red-600" onClick={() => toast.error("You can select a maximum of 3 primary roles.")}>
                        <AlertCircle className="w-4 h-4" /> Role Limit Validation
                    </Button>
                </CardContent>
            </Card>

            {/* User Management */}
            <Card className="border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                <CardHeader className="border-b bg-emerald-50/30 dark:bg-emerald-900/10">
                    <CardTitle className="text-xs font-bold uppercase tracking-widest text-emerald-600">User Management</CardTitle>
                </CardHeader>
                <CardContent className="p-4 flex flex-col gap-2">
                    <Button variant="ghost" className="justify-start gap-3 text-xs" onClick={() => toast.success("Invitation sent successfully!")}>
                        <UserPlus className="w-4 h-4 text-emerald-500" /> Invitation Sent
                    </Button>
                    <Button variant="ghost" className="justify-start gap-3 text-xs" onClick={() => toast.success("User role and departments updated successfully!")}>
                        <UserCog className="w-4 h-4 text-indigo-500" /> Membership Updated
                    </Button>
                    <Button variant="ghost" className="justify-start gap-3 text-xs" onClick={() => toast.success("Volunteer profile enabled!")}>
                        <ShieldCheck className="w-4 h-4 text-emerald-500" /> Profile Status Toggle
                    </Button>
                    <Button variant="ghost" className="justify-start gap-3 text-xs text-red-600" onClick={() => toast.error("At least one department is required for Program/Operations roles.")}>
                        <AlertCircle className="w-4 h-4" /> Role Validation Error
                    </Button>
                </CardContent>
            </Card>

            {/* Skills & CMS */}
            <Card className="border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                <CardHeader className="border-b bg-amber-50/30 dark:bg-amber-900/10">
                    <CardTitle className="text-xs font-bold uppercase tracking-widest text-amber-600">Skills & CMS</CardTitle>
                </CardHeader>
                <CardContent className="p-4 flex flex-col gap-2">
                    <Button variant="ghost" className="justify-start gap-3 text-xs" onClick={() => toast.success("Category updated")}>
                        <Zap className="w-4 h-4 text-amber-500" /> Skill Category Updated
                    </Button>
                    <Button variant="ghost" className="justify-start gap-3 text-xs" onClick={() => toast.success("Sub-category created")}>
                        <Briefcase className="w-4 h-4 text-indigo-500" /> Sub-category Created
                    </Button>
                    <Button variant="ghost" className="justify-start gap-3 text-xs text-red-600" onClick={() => toast.error("Title and Key are required")}>
                        <AlertCircle className="w-4 h-4" /> Validation: Missing Fields
                    </Button>
                </CardContent>
            </Card>

            {/* Critical Actions */}
            <Card className="border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden md:col-span-2 lg:col-span-1">
                <CardHeader className="border-b bg-red-50/30 dark:bg-red-900/10">
                    <CardTitle className="text-xs font-bold uppercase tracking-widest text-red-600">Confirmation Actions</CardTitle>
                </CardHeader>
                <CardContent className="p-4 flex flex-col gap-2">
                    <Button variant="ghost" className="justify-start gap-3 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20" onClick={() => {
                        toast("Are you sure you want to delete this user?", {
                            description: "This will permanently remove their profile data.",
                            action: {
                                label: "Delete",
                                onClick: () => toast.success("User deleted successfully!"),
                            },
                        })
                    }}>
                        <Trash2 className="w-4 h-4" /> User Deletion Flow
                    </Button>
                    <Button variant="ghost" className="justify-start gap-3 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20" onClick={() => {
                        toast("Delete category?", {
                            description: "All subcategories will also be removed.",
                            action: {
                                label: "Delete",
                                onClick: () => toast.success("Category deleted"),
                            },
                        })
                    }}>
                        <Trash2 className="w-4 h-4" /> Skill Category Deletion
                    </Button>
                </CardContent>
            </Card>

            {/* Guidelines */}
            <Card className="border-slate-200 dark:border-zinc-800 shadow-sm md:col-span-2 lg:col-span-3">
                <CardContent className="p-8">
                    <div className="grid md:grid-cols-2 gap-12">
                        <div>
                            <h3 className="text-lg font-bold">Standard Usage</h3>
                            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                                Always use a white background for toasts to maintain readability. Text should be semantically colored to indicate the nature of the message. 
                                <br/><br/>
                                <span className="font-bold text-slate-900 dark:text-white">NG Connect Standard:</span>
                                <ul className="list-disc ml-4 mt-2 space-y-1">
                                    <li>Success: Green Text (#059669)</li>
                                    <li>Error: Red Text (#dc2626)</li>
                                    <li>Warning: Amber Text (#d97706)</li>
                                </ul>
                            </p>
                        </div>
                        <div className="flex items-center justify-center bg-slate-50 dark:bg-zinc-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-zinc-800 p-8">
                           <div className="text-center space-y-4">
                                <div className="p-4 rounded-full bg-indigo-500/10 text-indigo-500 inline-block">
                                    <Bell className="w-8 h-8" />
                                </div>
                                <h4 className="font-bold">Testing a Toast</h4>
                                <p className="text-xs text-muted-foreground max-w-[240px]">
                                    Click any button above to trigger the actual system notification used in that specific workflow.
                                </p>
                           </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

        </div>
    </div>
  )
}

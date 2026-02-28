import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Account | Navgurukul Volunteer Connect",
    description: "Manage your account settings and preferences.",
}

export default function AccountPage() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Account</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                { /* Account content */}
                <div className="col-span-4 rounded-xl border bg-card text-card-foreground shadow">
                    <div className="flex flex-col space-y-1.5 p-6">
                        <h3 className="font-semibold leading-none tracking-tight">Profile Settings</h3>
                        <p className="text-sm text-muted-foreground">
                            Manage your profile information and preferences.
                        </p>
                    </div>
                    <div className="p-6 pt-0">
                        <p className="text-sm text-muted-foreground">
                            Account settings functionality coming soon...
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

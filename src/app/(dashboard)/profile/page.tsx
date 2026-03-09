import { Metadata } from "next"
import ProfileView from "./ProfileView"

export const metadata: Metadata = {
    title: "Profile | Navgurukul Volunteer Connect",
    description: "Manage your account settings and preferences.",
}

export default function ProfilePage() {
    return (
        <div className="flex-1 w-full p-4 md:p-8 pt-6">
            <ProfileView />
        </div>
    )
}

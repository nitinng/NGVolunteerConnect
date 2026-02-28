"use client"

import { useTransition, useState } from "react"
import { useRouter } from "next/navigation"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { setDevRoleOverride } from "@/app/actions/role-actions"
import { UserRole } from "@/lib/roles"

export function RoleSwitcher({
    isAdmin,
    activeRole
}: {
    isAdmin?: boolean
    activeRole?: string
}) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [activeTab, setActiveTab] = useState(activeRole === "System" ? "Admin" : (activeRole || "Admin"))

    if (!isAdmin) return null;

    const handleRoleChange = (value: string) => {
        setActiveTab(value)
        startTransition(async () => {
            await setDevRoleOverride(value as UserRole | "System")
            router.refresh()
        })
    }

    return (
        <Tabs value={activeTab} onValueChange={handleRoleChange} className="ml-auto flex items-center">
            <TabsList className="h-9">
                <TabsTrigger value="Admin" disabled={isPending}>Admin</TabsTrigger>
                <TabsTrigger value="Program" disabled={isPending}>Program</TabsTrigger>
                <TabsTrigger value="Operations" disabled={isPending}>Operations</TabsTrigger>
                <TabsTrigger value="Volunteer" disabled={isPending}>Volunteer</TabsTrigger>
            </TabsList>
        </Tabs>
    )
}

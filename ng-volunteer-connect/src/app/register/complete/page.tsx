"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { completeRegistration } from "@/app/actions/user-actions";
import { Loader2 } from "lucide-react";

export default function CompleteRegistration() {
    const router = useRouter();
    const [status, setStatus] = useState("Finalizing your account...");

    useEffect(() => {
        let mounted = true;

        async function syncData() {
            const dataStr = sessionStorage.getItem("pendingRegistrationData");
            if (dataStr) {
                try {
                    setStatus("Saving your preferences...");
                    const data = JSON.parse(dataStr);
                    await completeRegistration(data);

                    // Clear the session storage so we don't accidentally run it again
                    sessionStorage.removeItem("pendingRegistrationData");
                } catch (e) {
                    console.error("Failed to sync registration data:", e);
                }
            }
            if (mounted) {
                setStatus("Welcome aboard! Redirecting...");
                setTimeout(() => {
                    router.push("/");
                }, 1000);
            }
        }

        syncData();

        return () => {
            mounted = false;
        };
    }, [router]);

    return (
        <div className="flex h-screen items-center justify-center flex-col gap-4 bg-slate-50 dark:bg-zinc-950">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <h1 className="text-xl font-bold tracking-tight text-foreground">{status}</h1>
            <p className="text-sm text-muted-foreground">Please do not close this window.</p>
        </div>
    );
}

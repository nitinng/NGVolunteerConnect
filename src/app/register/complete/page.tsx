"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { completeRegistration } from "@/app/actions/user-actions";
import LoadingView from "@/components/loading-view";

export default function CompleteRegistration() {
    const router = useRouter();
    const [status, setStatus] = useState("Finalizing your account...");

    useEffect(() => {
        let mounted = true;

        async function syncData() {
            // Use localStorage (NOT sessionStorage) because OAuth causes a full-page navigation
            // that wipes out sessionStorage before we ever get here.
            const dataStr = localStorage.getItem("pendingRegistrationData");

            // No registration data means this user came via Sign In (not Register).
            // This happens when an unregistered Google account tries to sign in —
            // Supabase creates the auth user but we have no form data to save.
            // Send them back to /register with a warning.
            if (!dataStr) {
                if (mounted) {
                    router.replace("/register?reason=no_account");
                }
                return;
            }

            try {
                setStatus("Saving your preferences...");
                const data = JSON.parse(dataStr);
                await completeRegistration(data);
                localStorage.removeItem("pendingRegistrationData");
            } catch (e) {
                console.error("Failed to sync registration data:", e);
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
        <div className="relative min-h-[100dvh]">
            <LoadingView />
            <div className="absolute inset-0 z-[10000] flex flex-col items-center justify-center p-6 bg-transparent pointer-events-none">
                <div className="w-full max-w-sm flex flex-col items-center text-center space-y-4">
                    <div className="mt-[200px]">
                        <h1 className="text-xl font-bold tracking-tight text-foreground">{status}</h1>
                        <p className="text-sm text-muted-foreground mt-2">Please do not close this window.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}


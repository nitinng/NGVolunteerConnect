"use client";

import { AuthenticateWithRedirectCallback } from "@/hooks/use-auth";
import LoadingView from "@/components/loading-view";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function SSOCallbackPage() {
    const router = useRouter();
    const [timedOut, setTimedOut] = useState(false);

    // Safety net: if Clerk's callback hangs for >8 seconds,
    // it almost always means the Google account has no registered account.
    // Redirect to /register with a clear message.
    useEffect(() => {
        const timer = setTimeout(() => {
            setTimedOut(true);
            // Small delay to let the user read the message before redirecting
            setTimeout(() => {
                router.replace("/register?reason=no_account");
            }, 1500);
        }, 8000);

        return () => clearTimeout(timer);
    }, [router]);

    if (timedOut) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-slate-50 dark:bg-zinc-950 p-6">
                <div className="w-full max-w-sm flex flex-col items-center text-center space-y-4">
                    <i className="fa-solid fa-triangle-exclamation text-4xl text-amber-500 animate-pulse mx-auto" />
                    <h2 className="text-xl font-bold tracking-tight text-foreground">
                        No account found
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        That Google account isn&apos;t registered yet. Redirecting you to sign up...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative min-h-[100dvh]">
            <LoadingView />
            <div className="absolute inset-0 z-[10000] flex flex-col items-center justify-center p-6 bg-transparent pointer-events-none">
                <div className="w-full max-w-sm flex flex-col items-center text-center space-y-6">
                    <div className="mt-[200px]">
                        <h2 className="text-2xl font-bold tracking-tight text-foreground">
                            Signing you in...
                        </h2>
                        <p className="text-sm text-muted-foreground mt-2">
                            Just a moment while we verify your account.
                        </p>
                    </div>
                </div>
            </div>
            <div className="invisible">
                <AuthenticateWithRedirectCallback
                    signInForceRedirectUrl="/"
                    signUpForceRedirectUrl="/register/complete"
                />
            </div>
        </div>
    );
}

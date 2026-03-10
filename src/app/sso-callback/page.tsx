"use client";

import { AuthenticateWithRedirectCallback } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
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
                    <Loader2 className="w-10 h-10 text-amber-500 animate-spin mx-auto" />
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
        <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-slate-50 dark:bg-zinc-950 p-6">
            <div className="w-full max-w-sm flex flex-col items-center text-center space-y-6">
                <div>
                    <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">
                        Signing you in...
                    </h2>
                    <p className="text-sm text-muted-foreground mt-2">
                        Just a moment while we verify your account.
                    </p>
                </div>

                <div className="w-full flex flex-col items-center justify-center min-h-[100px] gap-4">
                    <AuthenticateWithRedirectCallback
                        signInForceRedirectUrl="/"
                        signUpForceRedirectUrl="/register/complete"
                    />

                </div>
            </div>
        </div>
    );
}

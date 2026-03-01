"use client";

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";

export default function SSOCallbackPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-slate-50 dark:bg-zinc-950 p-6">
            <div className="w-full max-w-sm flex flex-col items-center text-center space-y-6">
                <div>
                    <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">
                        Authenticating...
                    </h2>
                    <p className="text-sm text-muted-foreground mt-2">
                        Verifying your credentials...
                    </p>
                </div>

                {/* 
                  Clerk's component sometimes renders a visible Cloudflare Turnstile challenge.
                  We keep it prominently displayed in the center of the screen so it's not missed.
                */}
                <div className="w-full flex items-center justify-center min-h-[100px]">
                    <AuthenticateWithRedirectCallback
                        signInForceRedirectUrl="/"
                        signUpForceRedirectUrl="/register/complete"
                    />
                </div>
            </div>
        </div>
    );
}

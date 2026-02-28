import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";

export default function SSOCallbackPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-zinc-950">
            <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
            <h2 className="text-xl font-bold tracking-tight text-foreground">
                Authenticating...
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
                Please wait while we log you in.
            </p>
            {/* 
        This components handles the callback logic for Clerk OAuth. 
        Usually redirectUrlComplete is handled correctly by the caller hook.
      */}
            <AuthenticateWithRedirectCallback />
        </div>
    );
}

"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSignIn } from "@/hooks/use-auth";
import { createBrowserClient } from "@/lib/supabase";
import Input from "./Input";
import { MiniLoader } from "./mini-loader";


type AuthMode = 'login' | 'forgot' | 'reset';

export function LoginForm() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSocialLoading, setIsSocialLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { signIn, isLoaded } = useSignIn();
  const supabase = createBrowserClient();


  const handleGoogleLogin = async () => {
    if (!isLoaded) return;
    setIsSocialLoading(true);
    setError(null);
    try {
      await signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/",
      });
    } catch (err: any) {
      console.error("Google Auth Error:", err);
      setError(err.message || "Failed to connect to Google.");
      toast.error("Google login failed");
      setIsSocialLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/`,
        });
        if (error) throw error;
        toast.success("Password reset link sent to your email!");
        setMode('login');
      } else if (mode === 'reset') {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        toast.success("Password updated successfully!");
        setMode('login');
      }
    } catch (err: any) {
      console.error("Auth Error:", err);
      setError(err.message || "An error occurred");
      toast.error(err.message || "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <div className="flex items-center justify-center bg-transparent py-4 transition-all duration-500">
      <div className="w-full max-w-[360px] bg-white dark:bg-slate-900 rounded-lg shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-500">
        <Toaster />
        <div className="p-7 md:p-8">
          <header className="text-center mb-7">
            <MiniLoader />
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {mode === 'login' && 'Welcome Back'}
              {mode === 'forgot' && 'Reset Password'}
              {mode === 'reset' && 'Update Password'}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1.5 text-xs font-medium px-4">
              {mode === 'login' && 'Access NG Volunteer Connect with your Google account'}
              {mode === 'forgot' && 'Enter your email to receive a reset link'}
              {mode === 'reset' && 'Enter your new password below'}
            </p>
          </header>

          {error && (
            <div className="mb-5 p-3.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50 rounded-lg flex items-start gap-2.5 animate-in fade-in slide-in-from-top-2 duration-300">
              <i className="fa-solid fa-circle-exclamation text-rose-500 mt-0.5"></i>
              <p className="text-[11px] font-bold text-rose-700 dark:text-rose-400 leading-relaxed">{error}</p>
            </div>
          )}

          {/* Google Sign-In */}
          {mode === 'login' && (
            <div className="space-y-6">
              <button
                onClick={handleGoogleLogin}
                disabled={isSocialLoading || !isLoaded}
                className="w-full flex items-center justify-center gap-2.5 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 py-3 rounded-lg font-bold text-slate-700 dark:text-slate-200 hover:border-indigo-500 dark:hover:border-indigo-500 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all active:scale-[0.98] disabled:opacity-50 shadow-md hover:shadow-lg shadow-slate-200/50 dark:shadow-none"
              >
                {isSocialLoading ? (
                  <i className="fa-solid fa-spinner fa-spin"></i>
                ) : (
                  <div className="flex items-center gap-2.5">
                    <svg viewBox="0 0 24 24" width="18" height="18">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span className="text-sm">Continue with Google</span>
                  </div>
                )}
              </button>

              <div className="text-center pt-3.5">
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 capitalize tracking-wide">
                  New here?{" "}
                  <Link
                    href="/register"
                    className="text-indigo-600 dark:text-indigo-400 hover:underline ml-1"
                  >
                    Register Now!
                  </Link>
                </p>
              </div>
            </div>
          )}

          {/* Password recovery forms */}
          {(mode === 'forgot' || mode === 'reset') && (
            <form onSubmit={handleAuth} className="space-y-4">
              {mode === 'forgot' && (
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="name@navgurukul.org"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              )}
              {mode === 'reset' && (
                <Input
                  label="New Password"
                  type="password"
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              )}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white dark:text-slate-200 py-3.5 rounded-lg font-bold transition-all active:scale-[0.98] disabled:opacity-50 mt-3.5 flex items-center justify-center shadow-xl shadow-slate-900/20 dark:shadow-indigo-500/10"
              >
                {isLoading ? (
                  <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                ) : (
                  <i className={`fa-solid ${mode === 'forgot' ? 'fa-paper-plane' : 'fa-check'} mr-2`}></i>
                )}
                {mode === 'forgot' ? 'Send Reset Link' : 'Update Password'}
              </button>
              <div className="text-center mt-3.5">
                <button
                  type="button"
                  onClick={() => { setMode('login'); setError(null); }}
                  className="text-xs font-bold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-all flex items-center justify-center gap-2 mx-auto"
                >
                  <i className="fa-solid fa-arrow-left"></i>
                  <span>Back to Login</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}


"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Sparkles, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function LoginForm() {
  const searchParams = useSearchParams();
  const justRegistered = searchParams.get("registered") === "1";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forgotMsg, setForgotMsg] = useState(false);

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(null), 4000);
    return () => clearTimeout(t);
  }, [error]);

  useEffect(() => {
    if (!forgotMsg) return;
    const t = setTimeout(() => setForgotMsg(false), 2500);
    return () => clearTimeout(t);
  }, [forgotMsg]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    const res = await signIn("credentials", { email, password, redirect: false });

    if (!res || res.error) {
      setError("Invalid email or password");
      setLoading(false);
      return;
    }

    window.location.replace("/dashboard");
  }

  return (
    <div className="relative z-10 w-full max-w-md animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Floating toast for forgot password */}
      <div
        aria-live="polite"
        className={`fixed bottom-6 right-6 transition-all duration-300 ${
          forgotMsg ? "opacity-100 translate-y-0" : "pointer-events-none opacity-0 translate-y-4"
        }`}
      >
        {forgotMsg && (
          <div className="flex items-center gap-3 rounded-lg border border-violet-200 bg-white/95 px-4 py-3 text-sm text-violet-700 shadow-lg shadow-violet-900/20 backdrop-blur-xl ring-1 ring-white/50">
            <Sparkles className="h-4 w-4 shrink-0" />
            <div>
              <p className="font-medium">Password reset coming soon</p>
              <p className="text-xs text-violet-600">Contact support if you need help</p>
            </div>
          </div>
        )}
      </div>

      {/* Mobile-only logo */}
      <div className="mb-6 flex items-center justify-center gap-2 lg:hidden">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-600 shadow-sm">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <span className="text-base font-semibold tracking-tight text-slate-900">Navexa AI</span>
      </div>

      <div className="rounded-2xl bg-white/85 p-8 shadow-xl shadow-slate-900/[0.06] ring-1 ring-slate-200/70 backdrop-blur-xl">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Welcome back</h1>
          <p className="mt-1 text-sm text-slate-500">Log in to continue to your dashboard.</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {justRegistered && (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-700">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              Account created. Please log in.
            </div>
          )}

          <div
            aria-live="polite"
            className={`transition-all duration-300 ${
              error ? "max-h-20 opacity-100" : "pointer-events-none max-h-0 opacity-0"
            }`}
          >
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
                {error}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-sm font-medium text-slate-700">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              disabled={loading}
              placeholder="you@example.com"
              className="h-11 rounded-lg border-slate-200 bg-white/70 text-slate-900 placeholder:text-slate-400 focus-visible:border-violet-400 focus-visible:ring-2 focus-visible:ring-violet-200"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-sm font-medium text-slate-700">Password</Label>
              <button
                type="button"
                onClick={() => setForgotMsg(true)}
                className="text-xs font-medium text-violet-700 hover:text-violet-800 hover:underline underline-offset-4"
              >
                Forgot password?
              </button>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              required
              disabled={loading}
              placeholder="Enter your password"
              className="h-11 rounded-lg border-slate-200 bg-white/70 text-slate-900 placeholder:text-slate-400 focus-visible:border-violet-400 focus-visible:ring-2 focus-visible:ring-violet-200"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="mt-2 h-11 w-full rounded-lg bg-violet-600 font-medium text-white shadow-sm transition hover:bg-violet-700 disabled:opacity-80"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <Spinner /> Logging in…
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5">
                Log in <ArrowRight className="h-4 w-4" />
              </span>
            )}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-medium text-violet-700 hover:text-violet-800">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin text-white/90" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

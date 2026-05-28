"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type FieldErrors = Partial<Record<"name" | "email" | "password" | "confirmPassword", string[]>>;

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  useEffect(() => {
    if (!generalError) return;
    const t = setTimeout(() => setGeneralError(null), 4000);
    return () => clearTimeout(t);
  }, [generalError]);

  useEffect(() => {
    if (Object.keys(errors).length === 0) return;
    const t = setTimeout(() => setErrors({}), 5000);
    return () => clearTimeout(t);
  }, [errors]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setGeneralError(null);

    const formData = new FormData(e.currentTarget);
    const body = {
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      confirmPassword: String(formData.get("confirmPassword") ?? ""),
    };

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.details) setErrors(data.details);
        else setGeneralError(data.error ?? "Signup failed");
        setLoading(false);
        return;
      }

      router.push("/login?registered=1");
    } catch {
      setGeneralError("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="relative z-10 w-full max-w-md animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Mobile-only logo (brand panel hidden under lg) */}
      <div className="mb-6 flex items-center justify-center gap-2 lg:hidden">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-600 shadow-sm">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <span className="text-base font-semibold tracking-tight text-slate-900">Navexa AI</span>
      </div>

      <div className="rounded-2xl bg-white/85 p-8 shadow-xl shadow-slate-900/[0.06] ring-1 ring-slate-200/70 backdrop-blur-xl">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Create your account
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Build a resume, match it to JDs, land the role.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div
            aria-live="polite"
            className={`transition-all duration-300 ${
              generalError ? "max-h-20 opacity-100" : "pointer-events-none max-h-0 opacity-0"
            }`}
          >
            {generalError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
                {generalError}
              </div>
            )}
          </div>

          <Field id="name" label="Full name" type="text" placeholder="Your full name" error={errors.name?.[0]} disabled={loading} />
          <Field id="email" label="Email" type="email" placeholder="you@example.com" error={errors.email?.[0]} disabled={loading} />
          <Field
            id="password"
            label="Password"
            type="password"
            placeholder="Enter a strong password"
            error={errors.password?.[0]}
            hint="8+ characters · upper · lower · number · special"
            disabled={loading}
          />
          <Field id="confirmPassword" label="Confirm password" type="password" placeholder="Re-enter password" error={errors.confirmPassword?.[0]} disabled={loading} />

          <Button
            type="submit"
            disabled={loading}
            className="mt-2 h-11 w-full rounded-lg bg-violet-600 font-medium text-white shadow-sm transition hover:bg-violet-700 disabled:opacity-80"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <Spinner /> Creating account…
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5">
                Create account <ArrowRight className="h-4 w-4" />
              </span>
            )}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-violet-700 hover:text-violet-800">
            Log in
          </Link>
        </p>
      </div>

      <p className="mt-6 text-center text-xs text-slate-400">
        By signing up you agree to our terms & privacy.
      </p>
    </div>
  );
}

function Field({
  id,
  label,
  type,
  placeholder,
  error,
  hint,
  disabled,
}: {
  id: string;
  label: string;
  type: string;
  placeholder: string;
  error?: string;
  hint?: string;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-medium text-slate-700">
        {label}
      </Label>
      <Input
        id={id}
        name={id}
        type={type}
        required
        disabled={disabled}
        placeholder={placeholder}
        className="h-11 rounded-lg border-slate-200 bg-white/70 text-slate-900 placeholder:text-slate-400 focus-visible:border-violet-400 focus-visible:ring-2 focus-visible:ring-violet-200"
      />
      <div
        aria-live="polite"
        className={`transition-all duration-300 ${
          error ? "max-h-6 opacity-100" : "pointer-events-none max-h-0 opacity-0"
        }`}
      >
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
      {!error && hint && <p className="text-xs text-slate-400">{hint}</p>}
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

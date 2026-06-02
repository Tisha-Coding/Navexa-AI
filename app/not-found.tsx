import Link from "next/link";
import { Sparkles, Home, ArrowLeft } from "lucide-react";
import { AppBackground } from "@/components/app-background";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-slate-50">
      <AppBackground />

      <header className="relative z-10 border-b border-slate-200/70 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center px-6 py-3.5">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600 shadow-sm">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="text-base font-semibold tracking-tight text-slate-900">Navexa AI</span>
          </Link>
        </div>
      </header>

      <section className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-20 text-center">
        <div className="rounded-2xl bg-white/85 p-10 shadow-sm shadow-slate-900/[0.04] ring-1 ring-slate-200/70 backdrop-blur-xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-50 ring-1 ring-violet-100">
            <span className="text-2xl font-bold text-violet-600">404</span>
          </div>
          <h1 className="mt-5 text-2xl font-semibold tracking-tight text-slate-900">
            Page not found
          </h1>
          <p className="mt-2 max-w-sm text-sm text-slate-500">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href="/dashboard">
              <Button className="h-10 gap-2 rounded-lg bg-violet-600 px-5 font-medium text-white hover:bg-violet-700">
                <Home className="h-4 w-4" />
                Go to Dashboard
              </Button>
            </Link>
            <Link href="javascript:history.back()">
              <Button variant="outline" className="h-10 gap-2 rounded-lg border-slate-200 bg-white/70 px-5">
                <ArrowLeft className="h-4 w-4" />
                Go back
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

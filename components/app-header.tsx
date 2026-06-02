"use client";

import Link from "next/link";
import { Sparkles, LogOut, ArrowLeft } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function AppHeader({
  backHref,
  backLabel = "Dashboard",
  maxWidth = "max-w-6xl",
}: {
  backHref?: string;
  backLabel?: string;
  maxWidth?: string;
}) {
  const { data: session } = useSession();

  return (
    <header className="relative z-10 border-b border-slate-200/70 bg-white/70 backdrop-blur-xl">
      <div className={`mx-auto flex ${maxWidth} items-center justify-between px-6 py-3.5`}>
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600 shadow-sm">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="text-base font-semibold tracking-tight text-slate-900">Navexa AI</span>
          </Link>

          {backHref && (
            <>
              <span className="text-slate-300">/</span>
              <Link href={backHref}>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 rounded-lg border-slate-200 bg-white/70 text-xs"
                >
                  <ArrowLeft className="h-3 w-3" />
                  {backLabel}
                </Button>
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          {session?.user && (
            <div className="hidden text-right sm:block">
              <div className="text-sm font-medium text-slate-900">{session.user.name}</div>
              <div className="text-xs text-slate-500">{session.user.email}</div>
            </div>
          )}
          <Button
            onClick={() => signOut({ callbackUrl: "/login" })}
            variant="outline"
            size="sm"
            className="h-9 gap-1.5 rounded-lg border-slate-200 bg-white/70 hover:bg-white"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </div>
    </header>
  );
}

import { AppBackground } from "@/components/app-background";
import { AuthBrandPanel } from "@/components/auth-brand-panel";

// Shared layout for /login and /signup.
// The brand panel stays mounted across navigations between the two routes,
// so its floating/twinkling animations don't restart and the only thing
// that animates in/out is the form card (see animate-in classes on the pages).
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen">
      <AuthBrandPanel />
      <section className="relative flex flex-1 items-center justify-center overflow-hidden bg-slate-50 p-4">
        <AppBackground />
        {children}
      </section>
    </main>
  );
}

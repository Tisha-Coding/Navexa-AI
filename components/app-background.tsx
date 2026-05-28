import {
  FileText,
  Briefcase,
  Sparkles,
  BarChart3,
  Target,
  CheckCircle2,
  ScrollText,
  Award,
} from "lucide-react";

// Shared background for auth + dashboard pages.
// Combines a soft mesh gradient, a faint grid, and subtle floating
// resume/job-themed icons so the surface feels on-brand without distracting.
export function AppBackground() {
  return (
    <>
      {/* Soft mesh gradient */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(60% 50% at 20% 20%, #ddd6fe 0%, transparent 60%), radial-gradient(50% 50% at 80% 30%, #e0e7ff 0%, transparent 60%), radial-gradient(60% 50% at 60% 90%, #fae8ff 0%, transparent 60%)",
        }}
      />

      {/* Fine grid overlay for depth */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />

      {/* Floating resume/job-themed icons (hidden on mobile to avoid clutter) */}
      <FileText
        aria-hidden="true"
        className="pointer-events-none absolute left-[5%] top-[10%] hidden h-20 w-20 -rotate-12 text-violet-400/25 md:block"
      />
      <Briefcase
        aria-hidden="true"
        className="pointer-events-none absolute right-[7%] top-[14%] hidden h-16 w-16 rotate-12 text-indigo-400/25 md:block"
      />
      <Sparkles
        aria-hidden="true"
        className="pointer-events-none absolute left-[3%] top-[45%] hidden h-10 w-10 -rotate-6 text-fuchsia-400/30 md:block"
      />
      <BarChart3
        aria-hidden="true"
        className="pointer-events-none absolute bottom-[18%] right-[5%] hidden h-20 w-20 -rotate-6 text-indigo-400/25 md:block"
      />
      <Target
        aria-hidden="true"
        className="pointer-events-none absolute bottom-[12%] left-[8%] hidden h-14 w-14 rotate-12 text-violet-400/25 md:block"
      />
      <CheckCircle2
        aria-hidden="true"
        className="pointer-events-none absolute right-[10%] top-[55%] hidden h-10 w-10 -rotate-3 text-emerald-400/30 md:block"
      />
      <ScrollText
        aria-hidden="true"
        className="pointer-events-none absolute left-[40%] top-[6%] hidden h-12 w-12 rotate-6 text-violet-300/25 lg:block"
      />
      <Award
        aria-hidden="true"
        className="pointer-events-none absolute right-[35%] bottom-[8%] hidden h-12 w-12 -rotate-12 text-fuchsia-300/30 lg:block"
      />
    </>
  );
}

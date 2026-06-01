import Link from "next/link";
import { Sparkles, ExternalLink } from "lucide-react";

// App-wide footer — appears on every authenticated page.
// Keeps the "who built this" line visible without being loud.
export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative z-10 mt-16 border-t border-slate-200/70 bg-white/60 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-6 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-violet-600">
            <Sparkles className="h-3 w-3 text-white" />
          </div>
          <span className="font-medium text-slate-700">Navexa AI</span>
          <span className="text-slate-300">·</span>
          <span>© {year} Tisha</span>
        </div>

        <nav className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <FooterLink href="https://github.com/Tisha-Coding" external>
            GitHub
          </FooterLink>
          <FooterLink href="https://www.linkedin.com/in/tisha-3835a8319" external>
            LinkedIn
          </FooterLink>
          <FooterLink href="https://portfolio-six-rho-73.vercel.app" external>
            Portfolio
          </FooterLink>
          <FooterLink href="https://leetcode.com/u/Tisha_Leetcodeee" external>
            LeetCode
          </FooterLink>
        </nav>
      </div>
    </footer>
  );
}

function FooterLink({
  href,
  children,
  external,
}: {
  href: string;
  children: React.ReactNode;
  external?: boolean;
}) {
  const className =
    "inline-flex items-center gap-1 text-slate-500 transition hover:text-violet-700";
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
        <ExternalLink className="h-3 w-3 opacity-60" />
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

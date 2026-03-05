import Link from "next/link";
import { LegacyLoopLogo } from "@/components/brand/legacy-loop-logo";

export function AppHeader() {
  return (
    <header className="animate-header-enter border-b border-brand-200/90 bg-white/90 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-center px-4 py-1 md:px-6">
        <Link
          href="/start"
          aria-label="Go to Legacy Loop start"
          className="rounded-md leading-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-maize-500 focus-visible:ring-offset-2"
        >
          <LegacyLoopLogo size="sm" />
        </Link>
      </div>
    </header>
  );
}

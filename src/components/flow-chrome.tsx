"use client";

import { usePathname } from "next/navigation";
import { AppHeader } from "@/components/brand/app-header";
import { Stepper } from "@/components/stepper";

export function FlowChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showStepper = pathname !== "/start";

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-8">
        {showStepper ? <Stepper currentPath={pathname} /> : null}
        {children}
      </main>
    </div>
  );
}

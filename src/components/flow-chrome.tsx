"use client";

import { usePathname } from "next/navigation";
import { Stepper } from "@/components/stepper";

export function FlowChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showStepper = pathname !== "/start";

  return (
    <div className="min-h-screen">
      <main className="mx-auto max-w-6xl px-4 py-8 md:px-6">
        {showStepper ? <Stepper currentPath={pathname} /> : null}
        {children}
      </main>
    </div>
  );
}

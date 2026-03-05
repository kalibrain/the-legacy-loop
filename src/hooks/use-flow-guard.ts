"use client";

import { useEffect, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getFlowRedirect } from "@/lib/flow-guards";
import { useLegacyLoop } from "@/components/providers/legacy-loop-provider";

export function useFlowGuard() {
  const router = useRouter();
  const pathname = usePathname();
  const { state, isHydrated } = useLegacyLoop();

  const redirectPath = useMemo(() => {
    if (!isHydrated) return null;
    return getFlowRedirect(pathname, state);
  }, [isHydrated, pathname, state]);

  useEffect(() => {
    if (!redirectPath || redirectPath === pathname) return;
    router.replace(redirectPath);
  }, [pathname, redirectPath, router]);

  return { isHydrated, redirectPath };
}

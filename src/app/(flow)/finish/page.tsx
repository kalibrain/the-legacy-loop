"use client";

import { useRouter } from "next/navigation";
import { useLegacyLoop } from "@/components/providers/legacy-loop-provider";
import { useFlowGuard } from "@/hooks/use-flow-guard";

export default function FinishPage() {
  const router = useRouter();
  const { state, actions } = useLegacyLoop();
  const { isHydrated, redirectPath } = useFlowGuard();

  if (!isHydrated || redirectPath) {
    return (
      <div className="card-surface rounded-xl p-6 text-brand-500">
        Loading completion screen...
      </div>
    );
  }

  return (
    <section className="mx-auto max-w-3xl rounded-2xl border border-brand-200 bg-white/95 p-10 text-center shadow-soft">
      <h1 className="font-display text-3xl font-bold text-brand-900">Knowledge Capsule Created</h1>
      <p className="mt-3 text-brand-500">
        Thank you. Your responses and collected project context are now available for
        future team members through Legacy Loop.
      </p>

      <div className="mt-8 grid gap-4 text-left sm:grid-cols-2">
        <div className="rounded-lg border border-brand-100 bg-brand-50/60 p-4">
          <p className="text-xs uppercase tracking-wide text-brand-400">Questions Answered</p>
          <p className="mt-1 text-2xl font-bold text-brand-900">
            {state.interview.answeredCount}
          </p>
        </div>
        <div className="rounded-lg border border-brand-100 bg-brand-50/60 p-4">
          <p className="text-xs uppercase tracking-wide text-brand-400">Sources Included</p>
          <p className="mt-1 text-2xl font-bold text-brand-900">
            {state.selectedSources.length}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => {
          actions.resetDemo();
          router.push("/start");
        }}
        aria-label="Start a new legacy loop session"
        className="mt-9 rounded-lg bg-brand-600 px-6 py-3 text-sm font-semibold text-maize-50 transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-maize-400"
      >
        Start New Session
      </button>
    </section>
  );
}

"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useLegacyLoop } from "@/components/providers/legacy-loop-provider";
import { DATA_SOURCES } from "@/lib/constants";
import { getDemoTimingProfile } from "@/lib/demo-mode";
import { useFlowGuard } from "@/hooks/use-flow-guard";
import { collectFilesFromSourceDetails } from "@/lib/source-validation";

export default function CollectionCompletePage() {
  const router = useRouter();
  const { state, actions } = useLegacyLoop();
  const { isHydrated, redirectPath } = useFlowGuard();
  const demoAutoStartedRef = useRef(false);

  const selectedSourceNames = DATA_SOURCES.filter((source) =>
    state.selectedSources.includes(source.id),
  ).map((source) => source.name);
  const uploadedFileCount = collectFilesFromSourceDetails(state.sourceDetails).length;

  useEffect(() => {
    if (!state.demo.running || demoAutoStartedRef.current) return;
    if (!isHydrated || redirectPath) return;

    demoAutoStartedRef.current = true;
    const timing = getDemoTimingProfile(state.demo.profile);

    actions.setConsentAccepted(true);
    const timer = window.setTimeout(() => {
      router.push("/interview");
    }, timing.consentDelayMs);

    return () => window.clearTimeout(timer);
  }, [
    actions,
    isHydrated,
    redirectPath,
    router,
    state.demo.profile,
    state.demo.running,
  ]);

  if (!isHydrated || redirectPath) {
    return (
      <div className="card-surface rounded-xl p-6 text-brand-500">
        Loading collection summary...
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold text-brand-900">
          Data Collection Complete
        </h1>
        <p className="mt-2 text-brand-500">
          Collection completed successfully. Review what will drive interview
          generation.
        </p>
      </header>

      <div className="card-surface rounded-xl p-6">
        <h2 className="text-lg font-semibold text-brand-900">Collection Summary</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border border-brand-100 bg-brand-50/60 p-4">
            <p className="text-xs uppercase tracking-wide text-brand-400">Files Processed</p>
            <p className="mt-1 text-2xl font-bold text-brand-900">
              {state.collection.stats?.filesProcessed ?? 0}
            </p>
          </div>
          <div className="rounded-lg border border-brand-100 bg-brand-50/60 p-4">
            <p className="text-xs uppercase tracking-wide text-brand-400">Messages Indexed</p>
            <p className="mt-1 text-2xl font-bold text-brand-900">
              {state.collection.stats?.messagesIndexed ?? 0}
            </p>
          </div>
          <div className="rounded-lg border border-brand-100 bg-brand-50/60 p-4">
            <p className="text-xs uppercase tracking-wide text-brand-400">Tickets Indexed</p>
            <p className="mt-1 text-2xl font-bold text-brand-900">
              {state.collection.stats?.ticketsIndexed ?? 0}
            </p>
          </div>
        </div>
      </div>

      <div className="card-surface rounded-xl p-6">
        <h2 className="text-lg font-semibold text-brand-900">
          Review: Data Used for Question Generation
        </h2>
        <p className="mt-2 text-sm text-brand-500">
          Here&apos;s what we&apos;ll use to generate exit interview prompts.
        </p>

        <div className="mt-4 space-y-3 text-sm text-brand-700">
          <div>
            <p className="font-medium text-brand-900">Sources ({selectedSourceNames.length})</p>
            <p>{selectedSourceNames.join(", ")}</p>
          </div>
          <div>
            <p className="font-medium text-brand-900">Local Files ({uploadedFileCount})</p>
            <p>
              {uploadedFileCount === 0
                ? "No local files added."
                : `${uploadedFileCount} files included from source uploads.`}
            </p>
          </div>
        </div>

        <label className="mt-5 flex items-start gap-3 rounded-lg border border-brand-100 bg-brand-50/50 p-4">
          <input
            type="checkbox"
            checked={state.consentAccepted}
            onChange={(event) => actions.setConsentAccepted(event.target.checked)}
            aria-label="Consent to use selected data for generating interview questions"
            className="mt-1 h-4 w-4 rounded border-brand-300 text-brand-600 focus:ring-brand-500"
          />
          <span className="text-sm text-brand-700">
            I confirm this selected data can be used to generate AI-powered interview
            questions for the knowledge transfer capsule.
          </span>
        </label>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => router.push("/interview")}
          disabled={!state.consentAccepted}
          aria-label="Begin exit interview"
          className="rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-semibold text-maize-50 transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-maize-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Begin Exit Interview
        </button>
      </div>
    </section>
  );
}

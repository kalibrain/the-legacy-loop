"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLegacyLoop } from "@/components/providers/legacy-loop-provider";
import { useFlowGuard } from "@/hooks/use-flow-guard";
import { DATA_SOURCES, PRELOADED_INTERVIEW_DOCUMENTS } from "@/lib/constants";
import { getDemoTimingProfile } from "@/lib/demo-mode";
import { collectFilesFromSourceDetails } from "@/lib/source-validation";
import { CollectResponse, SourceConfig } from "@/types/legacy-loop";

const COLLECTION_STEPS = [
  "Validating configured sources",
  "Collecting project files and notes",
  "Indexing channels and repositories",
  "Preparing collection summary",
];

function describeSourceConfig(config?: SourceConfig): string {
  if (!config) return "Not configured";

  if (config.type === "google-drive") {
    return config.mode === "link"
      ? `Drive link: ${config.link}`
      : `Uploaded files: ${config.files.length}`;
  }

  if (config.type === "slack" || config.type === "microsoft-teams") {
    const selectedCount = config.channels.filter((channel) => channel.selected).length;
    return `Workspace connected, channels selected: ${selectedCount}`;
  }

  if (config.type === "github" || config.type === "gitlab" || config.type === "jira") {
    return `Project link: ${config.repoLink}`;
  }

  if (config.type === "other") {
    return `Uploaded files: ${config.files.length}`;
  }

  return "Configured";
}

export default function ReviewAndCollectPage() {
  const router = useRouter();
  const { state, actions } = useLegacyLoop();
  const { isHydrated, redirectPath } = useFlowGuard();

  const [collectionError, setCollectionError] = useState<string | null>(null);
  const [isCollecting, setIsCollecting] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const demoAutoStartedRef = useRef(false);
  const actionRowRef = useRef<HTMLDivElement | null>(null);

  const selectedSources = useMemo(
    () => DATA_SOURCES.filter((source) => state.selectedSources.includes(source.id)),
    [state.selectedSources],
  );
  const flattenedFiles = useMemo(
    () => collectFilesFromSourceDetails(state.sourceDetails),
    [state.sourceDetails],
  );

  const collectionStep = useMemo(() => {
    const idx = Math.min(
      COLLECTION_STEPS.length - 1,
      Math.floor(progressPercent / 26),
    );
    return COLLECTION_STEPS[idx];
  }, [progressPercent]);

  const startCollection = useCallback(async ({ isDemoAuto = false }: { isDemoAuto?: boolean } = {}) => {
    setCollectionError(null);
    setIsCollecting(true);
    setProgressPercent(4);
    actions.setCollectionInProgress(true);

    const demoTiming = state.demo.running
      ? getDemoTimingProfile(state.demo.profile)
      : null;
    const minDuration =
      demoTiming?.collectionDurationMs ?? (2000 + Math.floor(Math.random() * 2000));
    const startedAt = Date.now();
    const timer = setInterval(() => {
      setProgressPercent((prev) => Math.min(95, prev + 5 + Math.random() * 6));
    }, 180);

    try {
      const body = JSON.stringify({
        sources: state.selectedSources,
        sourceDetails: state.sourceDetails,
        files: flattenedFiles,
      });

      let payload: CollectResponse | null = null;
      let lastError: Error | null = null;
      const maxAttempts = isDemoAuto ? 2 : 1;

      for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        try {
          const response = await fetch("/api/mock/collect", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body,
          });

          if (!response.ok) {
            throw new Error("Collection endpoint returned an error.");
          }

          payload = (await response.json()) as CollectResponse;
          break;
        } catch (attemptError) {
          lastError =
            attemptError instanceof Error
              ? attemptError
              : new Error("Collection failed.");
        }
      }

      if (!payload) {
        throw (lastError ?? new Error("Collection failed. Please retry."));
      }

      const elapsed = Date.now() - startedAt;
      if (elapsed < minDuration) {
        await new Promise((resolve) => setTimeout(resolve, minDuration - elapsed));
      }

      setProgressPercent(100);
      await new Promise((resolve) => setTimeout(resolve, 260));
      actions.setCollectionComplete(payload.stats);
      router.push("/collect/complete");
    } catch (error) {
      actions.setCollectionInProgress(false);
      const message =
        error instanceof Error
          ? error.message
          : "Collection failed. Please retry.";
      setCollectionError(message);

      if (isDemoAuto) {
        actions.stopDemoRun(
          "Demo collection failed after one retry. Restart the demo manually.",
        );
      }
      setIsCollecting(false);
    } finally {
      clearInterval(timer);
      setIsCollecting(false);
    }
  }, [
    actions,
    flattenedFiles,
    router,
    state.demo.profile,
    state.demo.running,
    state.selectedSources,
    state.sourceDetails,
  ]);

  useEffect(() => {
    if (!state.demo.running || demoAutoStartedRef.current) return;
    if (!isHydrated || redirectPath || state.collection.completed || isCollecting) return;

    demoAutoStartedRef.current = true;
    const timing = getDemoTimingProfile(state.demo.profile);
    const timer = window.setTimeout(() => {
      void startCollection({ isDemoAuto: true });
    }, timing.uploadReviewDelayMs);

    return () => window.clearTimeout(timer);
  }, [
    isCollecting,
    isHydrated,
    redirectPath,
    startCollection,
    state.collection.completed,
    state.demo.profile,
    state.demo.running,
  ]);

  useEffect(() => {
    if (!isCollecting) return;
    actionRowRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [collectionStep, isCollecting]);

  if (!isHydrated || redirectPath) {
    return (
      <div className="card-surface rounded-xl p-6 text-brand-500">
        Loading source configuration...
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold text-brand-900">
          Review Inputs & Start Collection
        </h1>
        <p className="mt-2 text-brand-500">
          Confirm source settings before running project data collection.
        </p>
      </header>

      <div className="card-surface rounded-xl border-brand-200 bg-brand-50/80 p-5">
        <h2 className="text-lg font-semibold text-brand-900">
          Supervisor/HR Documents Already Included
        </h2>
        <p className="mt-2 text-sm text-brand-800">
          Question generation uses these preloaded materials plus the sources you
          configured in this session.
        </p>
        <ul className="mt-3 grid gap-2 text-sm text-brand-900 sm:grid-cols-2">
          {PRELOADED_INTERVIEW_DOCUMENTS.map((document) => (
            <li key={document} className="rounded-md border border-brand-200 bg-white px-3 py-2">
              {document}
            </li>
          ))}
        </ul>
      </div>

      <div className="card-surface rounded-xl p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-brand-900">Configured Sources</h2>
          <span className="rounded-full bg-maize-100 px-3 py-1 text-xs font-semibold text-brand-700">
            {selectedSources.length} selected
          </span>
        </div>
        <ul className="mt-4 space-y-3">
          {selectedSources.map((source) => (
            <li
              key={source.id}
              className="rounded-lg border border-brand-100 bg-brand-50/60 px-4 py-3"
            >
              <p className="text-sm font-semibold text-brand-900">{source.name}</p>
              <p className="mt-1 text-sm text-brand-500">
                {describeSourceConfig(state.sourceDetails[source.id])}
              </p>
            </li>
          ))}
        </ul>
      </div>

      <div className="card-surface rounded-xl p-5">
        <h2 className="text-lg font-semibold text-brand-900">Collection Input Totals</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-brand-100 bg-brand-50/60 p-4">
            <p className="text-xs uppercase tracking-wide text-brand-400">Sources</p>
            <p className="mt-1 text-2xl font-bold text-brand-900">{selectedSources.length}</p>
          </div>
          <div className="rounded-lg border border-brand-100 bg-brand-50/60 p-4">
            <p className="text-xs uppercase tracking-wide text-brand-400">Uploaded Files</p>
            <p className="mt-1 text-2xl font-bold text-brand-900">{flattenedFiles.length}</p>
          </div>
          <div className="rounded-lg border border-brand-100 bg-brand-50/60 p-4">
            <p className="text-xs uppercase tracking-wide text-brand-400">Chat Channels</p>
            <p className="mt-1 text-2xl font-bold text-brand-900">
              {Object.values(state.sourceDetails).reduce((count, config) => {
                if (!config) return count;
                if (config.type !== "slack" && config.type !== "microsoft-teams") {
                  return count;
                }
                return count + config.channels.filter((channel) => channel.selected).length;
              }, 0)}
            </p>
          </div>
        </div>
      </div>

      {isCollecting ? (
        <div className="card-surface rounded-xl p-5">
          <p className="text-sm font-semibold text-brand-800">{collectionStep}</p>
          <div className="mt-3 h-3 w-full rounded-full bg-brand-100">
            <div
              className="h-3 rounded-full bg-brand-600 transition-all duration-200"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="mt-2 text-sm text-brand-500">
            {Math.round(progressPercent)}% complete
          </p>
        </div>
      ) : null}

      {collectionError ? (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {collectionError}
        </div>
      ) : null}

      <div ref={actionRowRef} className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => {
            const lastConfigured = state.selectedSources[state.selectedSources.length - 1];
            router.push(lastConfigured ? `/collect/source/${lastConfigured}` : "/collect");
          }}
          className="rounded-lg border border-brand-200 px-4 py-2 text-sm font-semibold text-brand-700 transition hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-maize-300"
        >
          Back to Configuration
        </button>
        <button
          type="button"
          onClick={() => void startCollection()}
          disabled={isCollecting}
          aria-label="Start collection process"
          className="rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-semibold text-maize-50 transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-maize-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isCollecting ? "Collecting..." : "Start Collection"}
        </button>
      </div>
    </section>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLegacyLoop } from "@/components/providers/legacy-loop-provider";
import { ChatDetailsForm } from "@/components/source-details/chat-details-form";
import { DriveDetailsForm } from "@/components/source-details/drive-details-form";
import { RepoDetailsForm } from "@/components/source-details/repo-details-form";
import { UploadDetailsForm } from "@/components/source-details/upload-details-form";
import { useFlowGuard } from "@/hooks/use-flow-guard";
import { DATA_SOURCE_MAP } from "@/lib/constants";
import { getDemoSourceDetail, getDemoTimingProfile } from "@/lib/demo-mode";
import { getSourceConfigError } from "@/lib/source-validation";
import {
  DataSourceId,
  SourceConfig,
  ChatConfig,
  GoogleDriveConfig,
  RepoConfig,
  OtherUploadConfig,
} from "@/types/legacy-loop";

function SourceSummary({
  current,
  total,
}: {
  current: number;
  total: number;
}) {
  return (
    <div className="rounded-lg border border-brand-200 bg-maize-100/70 px-4 py-3 text-sm font-semibold text-brand-700">
      Source {current} of {total}
    </div>
  );
}

export default function SourceDetailsPage() {
  const params = useParams<{ sourceId: string }>();
  const sourceId = params.sourceId as DataSourceId;
  const router = useRouter();
  const { state, actions } = useLegacyLoop();
  const { isHydrated, redirectPath } = useFlowGuard();
  const [error, setError] = useState<string | null>(null);
  const autoConfiguredSourcesRef = useRef<Set<string>>(new Set());

  const source = DATA_SOURCE_MAP[sourceId];
  const selectedSources = state.selectedSources;
  const currentIndex = selectedSources.indexOf(sourceId);
  const currentDetail = source ? state.sourceDetails[source.id] : undefined;

  const previousSource = currentIndex > 0 ? selectedSources[currentIndex - 1] : null;
  const nextSource =
    currentIndex >= 0 && currentIndex < selectedSources.length - 1
      ? selectedSources[currentIndex + 1]
      : null;

  const setDetail = (nextDetail: SourceConfig) => {
    if (!source) return;
    setError(null);
    actions.setSourceDetail(source.id, nextDetail);
  };

  const detailTitle = useMemo(() => {
    if (!source) return "Source Details";
    return `Configure ${source.name}`;
  }, [source]);

  const handleNext = () => {
    if (!source) return;
    const validationError = getSourceConfigError(source.id, currentDetail);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (nextSource) {
      router.push(`/collect/source/${nextSource}`);
      return;
    }

    router.push("/collect/upload");
  };

  const handleBack = () => {
    if (previousSource) {
      router.push(`/collect/source/${previousSource}`);
      return;
    }
    router.push("/collect");
  };

  useEffect(() => {
    if (!state.demo.running || !isHydrated || redirectPath) return;
    if (!source || currentIndex === -1) return;
    if (autoConfiguredSourcesRef.current.has(source.id)) return;

    const timing = getDemoTimingProfile(state.demo.profile);
    const demoDetail = getDemoSourceDetail(source.id);
    if (!demoDetail) return;

    autoConfiguredSourcesRef.current.add(source.id);
    actions.setSourceDetail(source.id, demoDetail);

    const timer = window.setTimeout(() => {
      if (nextSource) {
        router.push(`/collect/source/${nextSource}`);
        return;
      }
      router.push("/collect/upload");
    }, timing.sourceConfigDelayMs);

    return () => window.clearTimeout(timer);
  }, [
    actions,
    currentIndex,
    isHydrated,
    nextSource,
    redirectPath,
    router,
    source,
    state.demo.profile,
    state.demo.running,
  ]);

  if (!isHydrated || redirectPath) {
    return (
      <div className="card-surface rounded-xl p-6 text-brand-500">
        Loading source details...
      </div>
    );
  }

  if (!source || currentIndex === -1) {
    return (
      <div className="card-surface rounded-xl p-6">
        <h1 className="font-display text-xl font-semibold text-brand-900">
          Source Not Available
        </h1>
        <p className="mt-2 text-brand-500">
          This source is not part of your current selection.
        </p>
        <button
          type="button"
          onClick={() => router.push("/collect")}
          className="mt-4 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-maize-50 transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-maize-400"
        >
          Back to Selection
        </button>
      </div>
    );
  }

  return (
    <section className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold text-brand-900">{detailTitle}</h1>
          <p className="mt-2 text-brand-500">
            Provide required connection details for this data source.
          </p>
        </div>
        <SourceSummary current={currentIndex + 1} total={selectedSources.length} />
      </header>

      {source.id === "google-drive" ? (
        <DriveDetailsForm
          value={
            currentDetail?.type === "google-drive"
              ? (currentDetail as GoogleDriveConfig)
              : undefined
          }
          onChange={(next) => setDetail(next)}
        />
      ) : null}

      {(source.id === "slack" || source.id === "microsoft-teams") ? (
        <ChatDetailsForm
          sourceId={source.id}
          value={
            currentDetail?.type === source.id
              ? (currentDetail as ChatConfig)
              : undefined
          }
          onChange={(next) => setDetail(next)}
        />
      ) : null}

      {(source.id === "github" ||
        source.id === "gitlab" ||
        source.id === "jira") ? (
        <RepoDetailsForm
          sourceId={source.id}
          value={
            currentDetail?.type === source.id
              ? (currentDetail as RepoConfig)
              : undefined
          }
          onChange={(next) => setDetail(next)}
        />
      ) : null}

      {source.id === "other" ? (
        <UploadDetailsForm
          value={
            currentDetail?.type === "other"
              ? (currentDetail as OtherUploadConfig)
              : undefined
          }
          onChange={(next) => setDetail(next)}
        />
      ) : null}

      {error ? (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handleBack}
          aria-label="Go to previous source"
          className="rounded-lg border border-brand-200 px-4 py-2 text-sm font-semibold text-brand-700 transition hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-maize-300"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleNext}
          aria-label="Continue to next source"
          className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-maize-50 transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-maize-400"
        >
          {nextSource ? "Next Source" : "Review & Start Collection"}
        </button>
      </div>
    </section>
  );
}

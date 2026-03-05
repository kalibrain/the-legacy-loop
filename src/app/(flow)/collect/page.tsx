"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { DataSourceCard } from "@/components/data-source-card";
import { useLegacyLoop } from "@/components/providers/legacy-loop-provider";
import { DATA_SOURCES } from "@/lib/constants";
import { DataSourceId } from "@/types/legacy-loop";

export default function CollectPage() {
  const router = useRouter();
  const { state, actions } = useLegacyLoop();

  const selectedSet = useMemo(() => new Set(state.selectedSources), [state.selectedSources]);

  const handleToggle = (id: DataSourceId) => {
    const source = DATA_SOURCES.find((item) => item.id === id);
    if (!source || !source.enabled) return;

    const nextSelection = selectedSet.has(id)
      ? state.selectedSources.filter((sourceId) => sourceId !== id)
      : [...state.selectedSources, id];

    actions.setSelectedSources(nextSelection);
  };

  const canContinue = state.selectedSources.length > 0;
  const firstSelected = state.selectedSources[0];

  return (
    <section>
      <header className="mb-6">
        <h1 className="font-display text-3xl font-bold text-brand-900">Select Data Resources</h1>
        <p className="mt-2 text-brand-500">
          Choose one or more sources, then configure connection details for each.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {DATA_SOURCES.map((source) => (
          <DataSourceCard
            key={source.id}
            source={source}
            selected={selectedSet.has(source.id)}
            onToggle={handleToggle}
          />
        ))}
      </div>

      <div className="mt-8 flex items-center justify-between gap-3">
        <p className="text-sm text-brand-500">
          Selected sources:{" "}
          <span className="font-semibold text-brand-900">{state.selectedSources.length}</span>
        </p>
        <button
          type="button"
          disabled={!canContinue}
          onClick={() =>
            router.push(
              firstSelected ? `/collect/source/${firstSelected}` : "/collect",
            )
          }
          aria-label="Continue to source configuration"
          className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-maize-50 transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-maize-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Continue
        </button>
      </div>
    </section>
  );
}

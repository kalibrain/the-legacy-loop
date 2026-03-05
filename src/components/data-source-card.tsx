import { DataSource, DataSourceId } from "@/types/legacy-loop";

type DataSourceCardProps = {
  source: DataSource;
  selected: boolean;
  onToggle: (id: DataSourceId) => void;
};

export function DataSourceCard({
  source,
  selected,
  onToggle,
}: DataSourceCardProps) {
  return (
    <button
      type="button"
      onClick={() => onToggle(source.id)}
      disabled={!source.enabled}
      aria-label={`Select ${source.name}`}
      aria-pressed={selected}
      className={[
        "card-surface w-full rounded-xl p-5 text-left transition",
        source.enabled
          ? "hover:border-brand-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
          : "cursor-not-allowed opacity-65",
        selected ? "border-brand-500 ring-2 ring-brand-200" : "",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{source.name}</h3>
          <p className="mt-1 text-sm text-slate-600">Use this source for knowledge ingestion.</p>
        </div>
        <span
          className={[
            "rounded-full px-2 py-1 text-xs font-semibold",
            source.enabled
              ? selected
                ? "bg-brand-100 text-brand-800"
                : "bg-slate-100 text-slate-700"
              : "bg-amber-100 text-amber-800",
          ].join(" ")}
        >
          {selected ? "Selected" : "Available"}
        </span>
      </div>

      <div className="mt-5 flex items-center justify-between">
        <span className="text-sm text-slate-600">
          {source.optional ? "Optional source" : "Recommended source"}
        </span>
        <span
          className={[
            "inline-flex h-6 w-11 items-center rounded-full transition",
            selected ? "bg-brand-600 justify-end" : "bg-slate-300 justify-start",
          ].join(" ")}
        >
          <span className="mx-1 h-4 w-4 rounded-full bg-white" />
        </span>
      </div>
    </button>
  );
}

import Image from "next/image";
import { DataSource, DataSourceId } from "@/types/legacy-loop";

type DataSourceCardProps = {
  source: DataSource;
  selected: boolean;
  onToggle: (id: DataSourceId) => void;
};

const DATA_SOURCE_LOGOS: Record<
  DataSourceId,
  { src: string; alt: string; iconClassName?: string }
> = {
  "google-drive": {
    src: "/branding/data-sources/googledrive.svg",
    alt: "Google Drive logo",
  },
  slack: {
    src: "/branding/data-sources/slack.svg",
    alt: "Slack logo",
  },
  "microsoft-teams": {
    src: "/branding/data-sources/microsoftteams.svg",
    alt: "Microsoft Teams logo",
    iconClassName: "scale-[0.88]",
  },
  github: {
    src: "/branding/data-sources/github.svg",
    alt: "GitHub logo",
  },
  gitlab: {
    src: "/branding/data-sources/gitlab.svg",
    alt: "GitLab logo",
  },
  jira: {
    src: "/branding/data-sources/jira.svg",
    alt: "Jira logo",
  },
  other: {
    src: "/branding/data-sources/other-source.svg",
    alt: "Document upload icon",
  },
};

export function DataSourceCard({
  source,
  selected,
  onToggle,
}: DataSourceCardProps) {
  const logo = DATA_SOURCE_LOGOS[source.id];

  return (
    <button
      type="button"
      onClick={() => onToggle(source.id)}
      disabled={!source.enabled}
      aria-label={`Select ${source.name}`}
      aria-pressed={selected}
      className={[
        "card-surface w-full rounded-xl p-4 text-left transition",
        source.enabled
          ? "hover:border-brand-400 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-maize-300"
          : "cursor-not-allowed opacity-65",
        selected ? "border-brand-500 bg-brand-50/60 ring-2 ring-maize-300" : "",
      ].join(" ")}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-brand-100 bg-white shadow-sm">
            <Image
              src={logo.src}
              alt={logo.alt}
              width={24}
              height={24}
              className={["h-6 w-6 object-contain", logo.iconClassName ?? ""].join(" ")}
            />
          </span>
          <div>
            <h3 className="text-base font-semibold text-brand-900">{source.name}</h3>
          </div>
        </div>
        <span
          className={[
            "inline-flex h-6 w-6 items-center justify-center rounded-full border text-sm font-bold transition",
            selected
              ? "border-brand-600 bg-brand-600 text-maize-100"
              : "border-brand-200 bg-white text-transparent",
          ].join(" ")}
          aria-hidden="true"
        >
          ✓
        </span>
      </div>
    </button>
  );
}

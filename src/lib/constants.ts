import { DataSource, DataSourceId } from "@/types/legacy-loop";

export type FlowStepId =
  | "start"
  | "collect"
  | "configure"
  | "review"
  | "interview"
  | "finish";

export const FLOW_STEPS: Array<{ id: FlowStepId; label: string; path: string }> = [
  { id: "start", label: "Start", path: "/start" },
  { id: "collect", label: "Select Sources", path: "/collect" },
  { id: "configure", label: "Configure Sources", path: "/collect/source" },
  { id: "review", label: "Review & Collect", path: "/collect/upload" },
  { id: "interview", label: "Interview", path: "/interview" },
  { id: "finish", label: "Finish", path: "/finish" },
];

export const DATA_SOURCES: DataSource[] = [
  { id: "google-drive", name: "Google Drive", kind: "drive", enabled: true },
  { id: "slack", name: "Slack", kind: "chat", enabled: true },
  {
    id: "microsoft-teams",
    name: "Microsoft Teams",
    kind: "chat",
    enabled: true,
    optional: true,
  },
  { id: "github", name: "GitHub", kind: "repo", enabled: true, optional: true },
  { id: "gitlab", name: "GitLab", kind: "repo", enabled: true, optional: true },
  { id: "jira", name: "Jira", kind: "repo", enabled: true, optional: true },
  { id: "other", name: "Other Source", kind: "upload", enabled: true, optional: true },
];

export const ALLOWED_FILE_EXTENSIONS = [".txt", ".md", ".json"];

export const PRELOADED_INTERVIEW_DOCUMENTS = [
  "HR offboarding packet",
  "Performance review history",
  "Annual review summaries",
  "Job description and role expectations",
];

export const DATA_SOURCE_MAP: Record<DataSourceId, DataSource> = DATA_SOURCES.reduce(
  (acc, source) => {
    acc[source.id] = source;
    return acc;
  },
  {} as Record<DataSourceId, DataSource>,
);

export const FLOW_STORAGE_KEY = "legacy-loop:flow:v2";

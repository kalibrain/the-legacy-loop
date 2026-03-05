import {
  ChatConfig,
  DataSourceId,
  GoogleDriveConfig,
  SourceConfig,
  UploadedFileMeta,
} from "@/types/legacy-loop";

export function isValidUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function isDriveConfigComplete(config?: SourceConfig): config is GoogleDriveConfig {
  if (!config || config.type !== "google-drive") return false;
  if (config.mode === "link") return isValidUrl(config.link);
  return config.files.length > 0;
}

function isChatConfigComplete(config?: SourceConfig): config is ChatConfig {
  if (!config || (config.type !== "slack" && config.type !== "microsoft-teams")) {
    return false;
  }

  return (
    isValidUrl(config.workspaceLink) &&
    config.channels.some((channel) => channel.selected)
  );
}

function isRepoConfigComplete(config?: SourceConfig): boolean {
  if (
    !config ||
    (config.type !== "github" && config.type !== "gitlab" && config.type !== "jira")
  ) {
    return false;
  }
  return isValidUrl(config.repoLink);
}

function isOtherConfigComplete(config?: SourceConfig): boolean {
  return Boolean(config && config.type === "other" && config.files.length > 0);
}

export function isSourceConfigComplete(
  sourceId: DataSourceId,
  config?: SourceConfig,
): boolean {
  switch (sourceId) {
    case "google-drive":
      return isDriveConfigComplete(config);
    case "slack":
    case "microsoft-teams":
      return isChatConfigComplete(config);
    case "github":
    case "gitlab":
    case "jira":
      return isRepoConfigComplete(config);
    case "other":
      return isOtherConfigComplete(config);
    default:
      return false;
  }
}

export function getSourceConfigError(
  sourceId: DataSourceId,
  config?: SourceConfig,
): string | null {
  if (isSourceConfigComplete(sourceId, config)) return null;

  switch (sourceId) {
    case "google-drive":
      return "Google Drive requires either a valid link or at least one uploaded file.";
    case "slack":
      return "Slack requires a valid workspace link and at least one selected channel.";
    case "microsoft-teams":
      return "Microsoft Teams requires a valid workspace link and at least one selected channel.";
    case "github":
      return "GitHub requires a valid repository link.";
    case "gitlab":
      return "GitLab requires a valid repository link.";
    case "jira":
      return "Jira requires a valid project or repository link.";
    case "other":
      return "Other source requires at least one uploaded file.";
    default:
      return "Configuration is incomplete.";
  }
}

export function getFirstUnconfiguredSource(
  selectedSources: DataSourceId[],
  sourceDetails: Partial<Record<DataSourceId, SourceConfig>>,
): DataSourceId | null {
  for (const sourceId of selectedSources) {
    if (!isSourceConfigComplete(sourceId, sourceDetails[sourceId])) {
      return sourceId;
    }
  }
  return null;
}

export function collectFilesFromSourceDetails(
  sourceDetails: Partial<Record<DataSourceId, SourceConfig>>,
): UploadedFileMeta[] {
  const files: UploadedFileMeta[] = [];

  const drive = sourceDetails["google-drive"];
  if (drive && drive.type === "google-drive" && drive.mode === "upload") {
    files.push(...drive.files);
  }

  const other = sourceDetails.other;
  if (other && other.type === "other") {
    files.push(...other.files);
  }

  return files;
}

export function selectedChannelCount(
  sourceDetails: Partial<Record<DataSourceId, SourceConfig>>,
): number {
  return Object.values(sourceDetails).reduce((acc, config) => {
    if (!config) return acc;
    if (config.type !== "slack" && config.type !== "microsoft-teams") return acc;
    return acc + config.channels.filter((channel) => channel.selected).length;
  }, 0);
}

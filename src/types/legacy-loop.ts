export type DataSourceId =
  | "google-drive"
  | "slack"
  | "microsoft-teams"
  | "github"
  | "gitlab"
  | "jira"
  | "other";

export type DataSourceKind = "drive" | "chat" | "repo" | "upload";

export type DemoProfile = "three-min" | "ten-min";

export type DataSource = {
  id: DataSourceId;
  name: string;
  kind: DataSourceKind;
  enabled: boolean;
  optional?: boolean;
};

export type UploadedFileMeta = { name: string; type: string };

export type ChannelSelection = { id: string; name: string; selected: boolean };

export type GoogleDriveConfig =
  | { type: "google-drive"; mode: "link"; link: string }
  | { type: "google-drive"; mode: "upload"; files: UploadedFileMeta[] };

export type ChatConfig = {
  type: "slack" | "microsoft-teams";
  workspaceLink: string;
  channels: ChannelSelection[];
};

export type RepoConfig = {
  type: "github" | "gitlab" | "jira";
  repoLink: string;
};

export type OtherUploadConfig = {
  type: "other";
  files: UploadedFileMeta[];
};

export type SourceConfig =
  | GoogleDriveConfig
  | ChatConfig
  | RepoConfig
  | OtherUploadConfig;

export type CollectionStats = {
  filesProcessed: number;
  messagesIndexed: number;
  ticketsIndexed: number;
};

export type InterviewQuestion = {
  id: string;
  text: string;
  depth: 0 | 1 | 2;
  parentQuestionId?: string;
};

export type InterviewCitation = {
  id: string;
  title: string;
  type: "preloaded-doc" | "source-link" | "uploaded-file" | "channel";
};

export type InterviewChatMessage = {
  id: string;
  role: "assistant" | "user";
  content: string;
  createdAt: string;
  questionId: string;
  questionNumber: number;
  reasoningSummary?: string;
  citations?: InterviewCitation[];
};

export type InterviewResourceContext = {
  preloadedDocs: string[];
  selectedSources: DataSourceId[];
  sourceDetails: Partial<Record<DataSourceId, SourceConfig>>;
};

export type InterviewDemoMode = {
  enabled: boolean;
  profile: DemoProfile;
};

export type InterviewChatSessionState = {
  sessionId: string;
  questions: Array<{ id: string; text: string }>;
  currentQuestionIndex: number;
  completedQuestionIds: string[];
  messages: InterviewChatMessage[];
  resourceContext: InterviewResourceContext;
  followUpCountByQuestion: Record<string, number>;
  done: boolean;
  demoMode?: InterviewDemoMode;
};

export type CollectRequest = {
  sources: DataSourceId[];
  sourceDetails: Partial<Record<DataSourceId, SourceConfig>>;
  files?: UploadedFileMeta[];
};

export type CollectResponse = {
  status: "ok";
  stats: CollectionStats;
};

export type InterviewStartRequest = {
  resourceContext: InterviewResourceContext;
  demoMode?: InterviewDemoMode;
};

export type InterviewStartResponse = {
  sessionId: string;
  messages: InterviewChatMessage[];
  currentQuestionId: string;
  currentQuestionNumber: number;
  totalQuestions: number;
  done: boolean;
};

export type InterviewChatRequest = {
  sessionId: string;
  message: string;
};

export type InterviewChatResponse = {
  messages: InterviewChatMessage[];
  currentQuestionId?: string;
  currentQuestionNumber?: number;
  completedCount: number;
  totalQuestions: number;
  done: boolean;
};

export type InterviewSessionSnapshotResponse = {
  sessionId: string;
  messages: InterviewChatMessage[];
  currentQuestionId?: string;
  currentQuestionNumber: number;
  completedCount: number;
  totalQuestions: number;
  done: boolean;
};

export type InterviewSummaryItem = {
  questionId: string;
  questionNumber: number;
  title: string;
  question: string;
  answers: string[];
};

export type FlowState = {
  demo: {
    enabled: boolean;
    profile: DemoProfile;
    running: boolean;
    error?: string;
  };
  selectedSources: DataSourceId[];
  sourceDetails: Partial<Record<DataSourceId, SourceConfig>>;
  collection: {
    inProgress: boolean;
    completed: boolean;
    stats?: CollectionStats;
  };
  consentAccepted: boolean;
  interview: {
    sessionId?: string;
    answeredCount: number;
    totalQuestions: number;
    done: boolean;
    summary: InterviewSummaryItem[];
  };
};

import demoScriptJson from "@/lib/demo-script.json";
import { DataSourceId, DemoProfile, SourceConfig } from "@/types/legacy-loop";

type DemoScriptFollowUp = {
  id: string;
  question: string;
  answer: string;
};

export type DemoScriptItem = {
  id: string;
  question: string;
  answer: string;
  follow_ups?: DemoScriptFollowUp[];
};

type DemoScriptTurn = {
  id: string;
  question: string;
  answer: string;
};

type DemoScriptDocument = {
  version: string;
  script_name: string;
  items: DemoScriptItem[];
};

export type DemoTimingProfile = {
  collectSelectionDelayMs: number;
  sourceConfigDelayMs: number;
  uploadReviewDelayMs: number;
  collectionDurationMs: number;
  consentDelayMs: number;
  routeTransitionDelayMs: number;
  interviewPreTypeDelayMs: number;
  interviewTypingDurationMs: number;
  interviewPostTypeDelayMs: number;
};

const demoScript = demoScriptJson as DemoScriptDocument;

const DEMO_SELECTED_SOURCES: DataSourceId[] = [
  "google-drive",
  "slack",
  "github",
  "other",
];

const DEMO_SOURCE_DETAILS: Partial<Record<DataSourceId, SourceConfig>> = {
  "google-drive": {
    type: "google-drive",
    mode: "link",
    link: "https://drive.google.com/drive/folders/legacy-loop-demo",
  },
  slack: {
    type: "slack",
    workspaceLink: "https://um-example.slack.com",
    channels: [
      { id: "slack-engineering-alerts", name: "engineering-alerts", selected: true },
      { id: "slack-release-triage", name: "release-triage", selected: true },
      { id: "slack-oncall-handoffs", name: "oncall-handoffs", selected: false },
    ],
  },
  github: {
    type: "github",
    repoLink: "https://github.com/umich/legacy-loop-demo",
  },
  other: {
    type: "other",
    files: [
      { name: "handoff-notes.md", type: "text/markdown" },
      { name: "legacy-config.json", type: "application/json" },
    ],
  },
};

const COMMON_STEP_TIMING = {
  collectSelectionDelayMs: 8000,
  sourceConfigDelayMs: 7000,
  uploadReviewDelayMs: 8000,
  collectionDurationMs: 30000,
  consentDelayMs: 7000,
  routeTransitionDelayMs: 2000,
};

const THREE_MIN_TIMING: DemoTimingProfile = {
  ...COMMON_STEP_TIMING,
  interviewPreTypeDelayMs: 15000,
  interviewTypingDurationMs: 4500,
  interviewPostTypeDelayMs: 700,
};

const TEN_MIN_TIMING: DemoTimingProfile = {
  ...COMMON_STEP_TIMING,
  interviewPreTypeDelayMs: 32000,
  interviewTypingDurationMs: 7000,
  interviewPostTypeDelayMs: 900,
};

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function getDemoQuestionCount(profile: DemoProfile): number {
  return profile === "three-min" ? 3 : 10;
}

export function getDemoScriptItems(profile: DemoProfile): DemoScriptItem[] {
  if (profile === "three-min") {
    return deepClone(demoScript.items.slice(0, 1));
  }
  return deepClone(demoScript.items.slice(0, getDemoQuestionCount(profile)));
}

function getDemoTurns(profile: DemoProfile): DemoScriptTurn[] {
  if (profile === "three-min") {
    const first = demoScript.items[0];
    if (!first) return [];

    const followUps = (first.follow_ups ?? []).map((followUp) => ({
      id: followUp.id,
      question: followUp.question,
      answer: followUp.answer,
    }));

    return [
      {
        id: first.id,
        question: first.question,
        answer: first.answer,
      },
      ...followUps,
    ];
  }

  return demoScript.items.slice(0, 10).map((item) => ({
    id: item.id,
    question: item.question,
    answer: item.answer,
  }));
}

export function getDemoQuestionTexts(profile: DemoProfile): string[] {
  return getDemoTurns(profile).map((item) => item.question);
}

export function getDemoAnswerSequence(profile: DemoProfile): string[] {
  return getDemoTurns(profile).map((item) => item.answer);
}

export function getDemoSelectedSources(): DataSourceId[] {
  return [...DEMO_SELECTED_SOURCES];
}

export function getDemoSourceDetail(sourceId: DataSourceId): SourceConfig | undefined {
  const detail = DEMO_SOURCE_DETAILS[sourceId];
  if (!detail) return undefined;
  return deepClone(detail);
}

export function getDemoTimingProfile(profile: DemoProfile): DemoTimingProfile {
  return profile === "three-min" ? THREE_MIN_TIMING : TEN_MIN_TIMING;
}

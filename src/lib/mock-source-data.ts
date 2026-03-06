import { ChannelSelection, DataSourceId } from "@/types/legacy-loop";

const SLACK_CHANNEL_SEEDS = [
  "engineering-alerts",
  "platform-ops",
  "release-triage",
  "customer-incidents",
  "oncall-handoffs",
  "data-pipeline",
  "vendor-monitoring",
];

const TEAMS_CHANNEL_SEEDS = [
  "Engineering Sync",
  "Platform Operations",
  "Release Coordination",
  "Incident Response",
  "Data Integrations",
  "Vendor Escalations",
  "Knowledge Retention",
];

function hashSeed(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function generateMockChannels(
  workspaceLink: string,
  sourceId: DataSourceId,
): ChannelSelection[] {
  const trimmed = workspaceLink.trim();
  const seed = hashSeed(`${sourceId}:${trimmed}`);
  const base =
    sourceId === "microsoft-teams" ? TEAMS_CHANNEL_SEEDS : SLACK_CHANNEL_SEEDS;
  const count = 4 + (seed % 3);
  const start = seed % base.length;

  return Array.from({ length: count }, (_, index) => {
    const name = base[(start + index) % base.length];
    const id = `${sourceId}-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
    return {
      id,
      name,
      selected: false,
    };
  });
}

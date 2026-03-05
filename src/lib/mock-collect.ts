import { CollectRequest, CollectResponse } from "@/types/legacy-loop";
import {
  collectFilesFromSourceDetails,
  selectedChannelCount,
} from "@/lib/source-validation";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function hashSeed(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export async function runMockCollection(input: CollectRequest): Promise<CollectResponse> {
  // TODO: Replace with real connector orchestration and ingestion pipeline jobs.
  const files = input.files?.length
    ? input.files
    : collectFilesFromSourceDetails(input.sourceDetails);
  const channels = selectedChannelCount(input.sourceDetails);
  const repoSourceCount = input.sources.filter((source) =>
    ["github", "gitlab", "jira"].includes(source),
  ).length;
  const jiraIncluded = input.sources.includes("jira");

  const seed = hashSeed(
    JSON.stringify({
      sources: input.sources,
      details: input.sourceDetails,
      files: files.map((file) => file.name),
    }),
  );

  await sleep(500 + (seed % 700));

  const sourceCount = input.sources.length;
  const filesProcessed = Math.max(
    20,
    sourceCount * 24 + files.length * 12 + channels * 2 + (seed % 19),
  );
  const messagesIndexed = sourceCount * 180 + channels * 85 + files.length * 11 + (seed % 250);
  const ticketsIndexed = repoSourceCount * 26 + (jiraIncluded ? 11 : 0) + (seed % 21);

  return {
    status: "ok",
    stats: {
      filesProcessed,
      messagesIndexed,
      ticketsIndexed,
    },
  };
}

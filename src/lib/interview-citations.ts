import {
  InterviewCitation,
  InterviewResourceContext,
} from "@/types/legacy-loop";

function dedupeCitations(citations: InterviewCitation[]): InterviewCitation[] {
  const seen = new Set<string>();
  const unique: InterviewCitation[] = [];

  for (const citation of citations) {
    const key = `${citation.type}:${citation.title}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(citation);
  }

  return unique;
}

function buildCitationPool(
  resourceContext: InterviewResourceContext,
): InterviewCitation[] {
  const pool: InterviewCitation[] = [];

  for (const [index, doc] of resourceContext.preloadedDocs.entries()) {
    pool.push({
      id: `preloaded-${index + 1}`,
      title: doc,
      type: "preloaded-doc",
    });
  }

  for (const sourceId of resourceContext.selectedSources) {
    const detail = resourceContext.sourceDetails[sourceId];
    if (!detail) continue;

    if (detail.type === "google-drive" && detail.mode === "link") {
      pool.push({
        id: `source-link-${sourceId}`,
        title: `Google Drive Link`,
        type: "source-link",
      });
    }

    if (detail.type === "google-drive" && detail.mode === "upload") {
      for (const file of detail.files) {
        pool.push({
          id: `uploaded-${sourceId}-${file.name}`,
          title: file.name,
          type: "uploaded-file",
        });
      }
    }

    if (detail.type === "slack" || detail.type === "microsoft-teams") {
      const selectedChannels = detail.channels.filter((channel) => channel.selected);
      for (const channel of selectedChannels) {
        pool.push({
          id: `channel-${detail.type}-${channel.id}`,
          title: `${detail.type === "slack" ? "Slack" : "Teams"}: ${channel.name}`,
          type: "channel",
        });
      }
    }

    if (detail.type === "github" || detail.type === "gitlab" || detail.type === "jira") {
      pool.push({
        id: `source-link-${detail.type}`,
        title: `${detail.type.toUpperCase()} Project Link`,
        type: "source-link",
      });
    }

    if (detail.type === "other") {
      for (const file of detail.files) {
        pool.push({
          id: `uploaded-other-${file.name}`,
          title: file.name,
          type: "uploaded-file",
        });
      }
    }
  }

  return dedupeCitations(pool);
}

function scoreCitation(
  citation: InterviewCitation,
  combinedText: string,
): number {
  const lower = combinedText.toLowerCase();
  let score = 0;

  if (lower.includes("vendor") || lower.includes("timeout") || lower.includes("api")) {
    if (citation.type === "channel") score += 5;
    if (citation.type === "source-link") score += 2;
  }

  if (lower.includes("manual") || lower.includes("workflow") || lower.includes("checklist")) {
    if (citation.type === "uploaded-file") score += 4;
    if (citation.type === "preloaded-doc") score += 2;
  }

  if (lower.includes("decision") || lower.includes("ownership") || lower.includes("role")) {
    if (citation.type === "preloaded-doc") score += 5;
  }

  if (citation.type === "preloaded-doc") score += 1;
  return score;
}

export function buildInterviewCitations(
  resourceContext: InterviewResourceContext,
  questionText: string,
  userMessage: string,
): InterviewCitation[] {
  const pool = buildCitationPool(resourceContext);
  if (pool.length === 0) return [];

  const combinedText = `${questionText} ${userMessage}`;
  return [...pool]
    .map((citation) => ({
      citation,
      score: scoreCitation(citation, combinedText),
    }))
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.citation)
    .slice(0, 3);
}
